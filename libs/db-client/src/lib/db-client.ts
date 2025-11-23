import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

console.log(process.env.DATABASE_PASSWORD);
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

export const dbClient = drizzle({ client: pool });
