import { Pool } from 'pg';

const globalForDb = global as unknown as { db: Pool };

export const db = globalForDb.db || new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export async function query(text: string, params?: any[]) {
  return db.query(text, params);
}
