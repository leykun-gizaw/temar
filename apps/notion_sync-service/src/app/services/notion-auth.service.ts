import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { dbClient, user, decrypt, encrypt } from '@temar/db-client';
import { eq } from 'drizzle-orm';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class NotionAuthService {
  private readonly logger = new Logger(NotionAuthService.name);

  async resolveClient(userId: string): Promise<Client> {
    const tokenRow = await this.fetchTokenRow(userId);
    const accessToken = await this.resolveAccessToken(userId, tokenRow);
    return new Client({ auth: accessToken });
  }

  private async fetchTokenRow(userId: string): Promise<{
    notionAccessToken: string;
    notionRefreshToken: string | null;
    notionTokenExpiresAt: Date | null;
  }> {
    const [row] = await dbClient
      .select({
        notionAccessToken: user.notionAccessToken,
        notionRefreshToken: user.notionRefreshToken,
        notionTokenExpiresAt: user.notionTokenExpiresAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!row?.notionAccessToken) {
      throw new Error(`User ${userId} has no Notion access token`);
    }

    return row as {
      notionAccessToken: string;
      notionRefreshToken: string | null;
      notionTokenExpiresAt: Date | null;
    };
  }

  private async resolveAccessToken(
    userId: string,
    tokenRow: {
      notionAccessToken: string;
      notionRefreshToken: string | null;
      notionTokenExpiresAt: Date | null;
    }
  ): Promise<string> {
    if (!this.isTokenExpired(tokenRow.notionTokenExpiresAt)) {
      return decrypt(tokenRow.notionAccessToken);
    }

    if (!tokenRow.notionRefreshToken) {
      throw new Error(`User ${userId} token expired and no refresh token`);
    }

    return this.refreshExpiredToken(userId, tokenRow.notionRefreshToken);
  }

  private isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return expiresAt.getTime() - TOKEN_EXPIRY_BUFFER_MS < Date.now();
  }

  private async refreshExpiredToken(
    userId: string,
    encryptedRefreshToken: string
  ): Promise<string> {
    const { clientId, clientSecret } = this.loadOAuthCredentials();
    const refreshToken = decrypt(encryptedRefreshToken);

    const tokenResponse = await this.requestNewToken(
      clientId,
      clientSecret,
      refreshToken
    );
    await this.persistRefreshedTokens(userId, tokenResponse);

    this.logger.log(`Refreshed Notion token for user ${userId}`);
    return tokenResponse.accessToken;
  }

  private loadOAuthCredentials() {
    const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing NOTION_OAUTH_CLIENT_ID or NOTION_OAUTH_CLIENT_SECRET'
      );
    }

    return { clientId, clientSecret };
  }

  private async requestNewToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ) {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    );

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${encoded}`,
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Token refresh failed: ${body}`);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  private async persistRefreshedTokens(
    userId: string,
    tokens: { accessToken: string; refreshToken?: string }
  ) {
    await dbClient
      .update(user)
      .set({
        notionAccessToken: encrypt(tokens.accessToken),
        ...(tokens.refreshToken
          ? { notionRefreshToken: encrypt(tokens.refreshToken) }
          : {}),
        notionTokenExpiresAt: new Date(Date.now() + DEFAULT_TOKEN_LIFETIME_MS),
      })
      .where(eq(user.id, userId));
  }
}
