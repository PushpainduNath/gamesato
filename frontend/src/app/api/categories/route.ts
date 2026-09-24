import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT c.id, c.name, c.slug, c.icon, c.created_at, COUNT(g.id)::int as count
      FROM categories c
      INNER JOIN games g ON (LOWER(g.category) = LOWER(c.name) OR LOWER(g.category) = LOWER(c.slug)) AND g.status = 'published'
      GROUP BY c.id, c.name, c.slug, c.icon, c.created_at
      HAVING COUNT(g.id) > 0
      ORDER BY count DESC
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('Failed to fetch categories via Next.js API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
