import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const gameId = params.id;
  const session = await getServerSession(authOptions);

  let bodyLiked: boolean | undefined = undefined;
  try {
    const body = await request.json();
    if (typeof body?.liked === 'boolean') {
      bodyLiked = body.liked;
    }
  } catch {
    // No JSON body provided, default to toggle / like
  }

  try {
    // Ensure targetGameId is a valid UUID, resolve from slug if necessary
    let targetGameId = gameId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gameId);
    if (!isUuid) {
      const gRes = await query('SELECT id FROM games WHERE slug = $1', [gameId]);
      if (gRes.rows.length > 0) {
        targetGameId = gRes.rows[0].id;
      } else {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }
    }

    // If guest user, directly increment or decrement games.likes_count in DB
    if (!session?.user) {
      const isLiking = bodyLiked !== undefined ? bodyLiked : true;
      const delta = isLiking ? 1 : -1;
      const updateRes = await query(
        `UPDATE games
         SET likes_count = GREATEST(0, COALESCE(likes_count, 0) + $1)
         WHERE id = $2
         RETURNING likes_count`,
        [delta, targetGameId]
      );
      const updatedLikesCount = updateRes.rows[0]?.likes_count ?? 0;
      return NextResponse.json({
        liked: isLiking,
        guest: true,
        likesCount: updatedLikesCount,
      });
    }

    let userId = (session.user as any).id;
    let validUser = false;
    if (userId) {
      const uRes = await query('SELECT id FROM users WHERE id = $1', [userId]);
      if (uRes.rows.length > 0) {
        validUser = true;
      }
    }

    if (!validUser && session.user.email) {
      const emailRes = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
      if (emailRes.rows.length > 0) {
        userId = emailRes.rows[0].id;
        validUser = true;
      }
    }

    // If session user is not found in DB, still count their like in games.likes_count
    if (!validUser) {
      const isLiking = bodyLiked !== undefined ? bodyLiked : true;
      const delta = isLiking ? 1 : -1;
      const updateRes = await query(
        `UPDATE games
         SET likes_count = GREATEST(0, COALESCE(likes_count, 0) + $1)
         WHERE id = $2
         RETURNING likes_count`,
        [delta, targetGameId]
      );
      return NextResponse.json({
        liked: isLiking,
        guest: true,
        likesCount: updateRes.rows[0]?.likes_count ?? 0,
      });
    }

    const likeCheck = await query(
      'SELECT 1 FROM likes WHERE "userId" = $1 AND "gameId" = $2',
      [userId, targetGameId]
    );

    const shouldLike = bodyLiked !== undefined ? bodyLiked : likeCheck.rows.length === 0;

    if (!shouldLike) {
      // Unlike
      if (likeCheck.rows.length > 0) {
        await query(
          'DELETE FROM likes WHERE "userId" = $1 AND "gameId" = $2',
          [userId, targetGameId]
        );
      }
      const updateRes = await query(
        `UPDATE games
         SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
         WHERE id = $1
         RETURNING likes_count`,
        [targetGameId]
      );
      return NextResponse.json({
        liked: false,
        likesCount: updateRes.rows[0]?.likes_count ?? 0,
      });
    } else {
      // Like
      if (likeCheck.rows.length === 0) {
        await query(
          'INSERT INTO likes ("userId", "gameId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, targetGameId]
        );
      }
      const updateRes = await query(
        `UPDATE games
         SET likes_count = GREATEST(0, COALESCE(likes_count, 0) + 1)
         WHERE id = $1
         RETURNING likes_count`,
        [targetGameId]
      );
      return NextResponse.json({
        liked: true,
        likesCount: updateRes.rows[0]?.likes_count ?? 0,
      });
    }
  } catch (err) {
    console.error('Error toggling game like:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
