import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const params = await props.params;
  const slug = params.slug;

  try {
    const gameRes = await query('SELECT * FROM games WHERE slug = $1', [slug]);
    if (gameRes.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = gameRes.rows[0];

    const likesCountResult = await query(
      'SELECT COUNT(*)::int as count FROM likes WHERE "gameId" = $1',
      [game.id]
    );

    let isLiked = false;
    if (userId) {
      const userLikeResult = await query(
        'SELECT 1 FROM likes WHERE "userId" = $1 AND "gameId" = $2',
        [userId, game.id]
      );
      isLiked = userLikeResult.rows.length > 0;
    }

    return NextResponse.json({
      ...game,
      likesCount: likesCountResult.rows[0]?.count || 0,
      isLiked,
    });
  } catch (err) {
    console.error('Error fetching game details by slug:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
