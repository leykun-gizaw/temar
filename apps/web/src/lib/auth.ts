import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { dbClient } from '@temar/db-client';
import { session, user, verification, account } from '@temar/db-client';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL as string,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(
    ','
  ) as string[],
  database: drizzleAdapter(dbClient, {
    provider: 'pg',
    schema: { session, user, verification, account },
  }),
  user: {
    additionalFields: {
      notionPageId: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  advanced: {
    database: { generateId: 'uuid' },
  },
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectURI: process.env.GOOGLE_OAUTH_REDIRECT_URI as string,
    },
    github: {
      clientId: process.env.GH_CLIENT_ID as string,
      clientSecret: process.env.GH_CLIENT_SECRET as string,
    },
  },
});
