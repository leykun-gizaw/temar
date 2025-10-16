import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: __dirname + '/.env' });

console.log(
  'Database URL:',
  `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`
);
export default defineConfig({
  dialect: 'postgresql',
  schema: './schema/*',
  out: './drizzle',
  dbCredentials: {
    // host: process.env.DATABASE_HOST as string,
    host: 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER as string,
    password: process.env.DATABASE_PASSWORD as string,
    database: process.env.DATABASE_NAME as string,
    ssl: false,
  },
});
