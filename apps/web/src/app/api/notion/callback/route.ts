import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { dbClient, user, encrypt } from '@temar/db-client';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Notion OAuth error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/topics?error=notion_denied', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/topics?error=no_code', request.url)
    );
  }

  // Verify user is logged in
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
  const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Missing Notion OAuth env vars');
    return NextResponse.redirect(
      new URL('/dashboard/topics?error=config', request.url)
    );
  }

  // Exchange code for tokens
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  );

  const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${encoded}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    console.error('Notion token exchange failed:', tokenResponse.status, body);
    return NextResponse.redirect(
      new URL('/dashboard/topics?error=token_exchange', request.url)
    );
  }

  const tokenData = await tokenResponse.json();
  const {
    access_token,
    refresh_token,
    bot_id,
    workspace_id,
    duplicated_template_id,
  } = tokenData;

  if (!access_token) {
    console.error('No access_token in Notion response:', tokenData);
    return NextResponse.redirect(
      new URL('/dashboard/topics?error=no_token', request.url)
    );
  }

  // Encrypt tokens before storing
  const encryptedAccessToken = encrypt(access_token);
  const encryptedRefreshToken = refresh_token
    ? encrypt(refresh_token)
    : null;

  // Store tokens and master page ID
  await dbClient
    .update(user)
    .set({
      notionPageId: duplicated_template_id || null,
      notionAccessToken: encryptedAccessToken,
      notionRefreshToken: encryptedRefreshToken,
      notionBotId: bot_id || null,
      notionWorkspaceId: workspace_id || null,
      notionTokenExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours default
    })
    .where(eq(user.id, session.user.id));

  return NextResponse.redirect(
    new URL('/dashboard/topics', request.url)
  );
}
