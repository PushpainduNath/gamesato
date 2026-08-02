import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  const gameId = params.id;
  let userId = (session.user as any).id;

  try {
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

    if (!validUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 401 });
    }

    const likeCheck = await query(
      'SELECT 1 FROM likes WHERE "userId" = $1 AND "gameId" = $2',
      [userId, gameId]
    );

    if (likeCheck.rows.length > 0) {
      // Unlike
      await query(
        'DELETE FROM likes WHERE "userId" = $1 AND "gameId" = $2',
        [userId, gameId]
      );
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await query(
        'INSERT INTO likes ("userId", "gameId") VALUES ($1, $2)',
        [userId, gameId]
      );
      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    console.error('Error toggling game like:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
