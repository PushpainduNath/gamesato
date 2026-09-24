import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { query } from '@/lib/db';

async function resolveUserId(session: any): Promise<string | null> {
  if (!session?.user) return null;
  let userId = (session.user as any)?.id;
  if (userId) {
    const uRes = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (uRes.rows.length > 0) return userId;
  }
  if (session.user?.email) {
    const emailRes = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
    if (emailRes.rows.length > 0) return emailRes.rows[0].id;
  }
  return null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = await resolveUserId(session);

  const { searchParams } = new URL(request.url);
  const localIdsParam = searchParams.get('localIds');
  const localIds = localIdsParam ? localIdsParam.split(',').filter(Boolean) : [];

  try {
    let favorites: any[] = [];

    if (userId) {
      // 1. Fetch user's likes from database
      const res = await query(
        `SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.play_count,
                (SELECT COUNT(*)::int FROM likes WHERE "gameId" = g.id) as likes_count
         FROM games g
         JOIN likes l ON g.id = l."gameId"
         WHERE l."userId" = $1 AND g.status = 'published'
         ORDER BY l.created_at DESC`,
        [userId]
      );
      favorites = res.rows;
    }

    // 2. If there are localIds not yet in the results, fetch them as well
    if (localIds.length > 0) {
      const existingIds = new Set(favorites.map((f) => f.id));
      const missingIds = localIds.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        const localRes = await query(
          `SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.play_count,
                  (SELECT COUNT(*)::int FROM likes WHERE "gameId" = g.id) as likes_count
           FROM games g
           WHERE (g.id::text = ANY($1::text[]) OR g.slug = ANY($1::text[])) AND g.status = 'published'`,
          [missingIds]
        );
        favorites = [...favorites, ...localRes.rows];
      }
    }

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error('Failed to query user favorites via API:', err);
    return NextResponse.json({ error: 'Internal Server Error', favorites: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = await resolveUserId(session);

  let localLikedIds: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.localLikedIds)) {
      localLikedIds = body.localLikedIds.filter(Boolean);
    }
  } catch {
    // Empty body is acceptable
  }

  try {
    // If authenticated and client has local likes, sync them into the database
    if (userId && localLikedIds.length > 0) {
      await query(
        `INSERT INTO likes ("userId", "gameId")
         SELECT $1, g.id
         FROM games g
         WHERE (g.id::text = ANY($2::text[]) OR g.slug = ANY($2::text[])) AND g.status = 'published'
         ON CONFLICT DO NOTHING`,
        [userId, localLikedIds]
      );
    }

    // Query user favorites
    let favorites: any[] = [];
    if (userId) {
      const res = await query(
        `SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.play_count,
                (SELECT COUNT(*)::int FROM likes WHERE "gameId" = g.id) as likes_count
         FROM games g
         JOIN likes l ON g.id = l."gameId"
         WHERE l."userId" = $1 AND g.status = 'published'
         ORDER BY l.created_at DESC`,
        [userId]
      );
      favorites = res.rows;
    } else if (localLikedIds.length > 0) {
      // Guest with local likes
      const res = await query(
        `SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.play_count,
                (SELECT COUNT(*)::int FROM likes WHERE "gameId" = g.id) as likes_count
         FROM games g
         WHERE (g.id::text = ANY($1::text[]) OR g.slug = ANY($1::text[])) AND g.status = 'published'`,
        [localLikedIds]
      );
      favorites = res.rows;
    }

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error('Failed to sync/fetch user favorites:', err);
    return NextResponse.json({ error: 'Internal Server Error', favorites: [] }, { status: 500 });
  }
}
