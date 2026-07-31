import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await query(
      `SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.play_count,
              (SELECT COUNT(*)::int FROM likes WHERE "gameId" = g.id) as likes_count
       FROM games g
       JOIN likes l ON g.id = l."gameId"
       WHERE l."userId" = $1 AND g.status = 'published'
       ORDER BY l.created_at DESC`,
      [session.user.id]
    );
    return NextResponse.json({ favorites: res.rows });
  } catch (err) {
    console.error('Failed to query user favorites via API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
