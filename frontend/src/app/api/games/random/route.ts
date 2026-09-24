import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query(
      `SELECT slug FROM games WHERE status = 'published' ORDER BY RANDOM() LIMIT 1`
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'No games found' }, { status: 404 });
    }
    return NextResponse.json({ slug: res.rows[0].slug });
  } catch (err) {
    console.error('Failed to get random game:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
