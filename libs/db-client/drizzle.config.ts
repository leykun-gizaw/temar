import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: __dirname + '/.env' });

export default defineConfig({
  dialect: 'postgresql',
  schema: 'libs/db-client/src/schema/*',
  out: './src/drizzle',
  dbCredentials: {
    host: process.env.DATABASE_HOST as string,
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER as string,
    password: process.env.DATABASE_PASSWORD as string,
    database: process.env.DATABASE_NAME as string,
    ssl: false,
  },
});
