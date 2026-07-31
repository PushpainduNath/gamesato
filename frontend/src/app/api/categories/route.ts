import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(
      'SELECT id, name, slug, icon, created_at FROM categories ORDER BY created_at ASC'
    );
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('Failed to fetch categories via Next.js API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
