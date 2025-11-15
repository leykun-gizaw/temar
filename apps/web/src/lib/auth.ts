import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { dbClient } from '@temar/db-client';
import { user, session, account, verification } from '@temar/db-client';

export const auth = betterAuth({
  database: drizzleAdapter(dbClient, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
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
  trustedOrigins: [process.env.BETTER_AUTH_URL as string],
});
