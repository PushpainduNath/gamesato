import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

// Ensure table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_play_history (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      game_id VARCHAR(255) NOT NULL,
      play_time_seconds INT DEFAULT 0,
      play_count INT DEFAULT 1,
      last_played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_user_game UNIQUE (user_id, game_id)
    );
  `);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ history: [] });
  }

  const userId = (session.user as any).id || session.user.email;

  try {
    await ensureTable();
    const res = await query(
      `SELECT h.game_id as id, g.slug, g.title, g.thumbnail_url, g.category,
              h.play_time_seconds as "playTimeSeconds",
              h.play_count as "playCount",
              EXTRACT(EPOCH FROM h.last_played_at) * 1000 as "lastPlayedAt"
       FROM user_play_history h
       JOIN games g ON h.game_id = g.id
       WHERE h.user_id = $1
       ORDER BY h.last_played_at DESC
       LIMIT 30`,
      [userId]
    );

    return NextResponse.json({ history: res.rows });
  } catch (err) {
    console.error('Failed to fetch user play history:', err);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: true, guest: true });
  }

  const userId = (session.user as any).id || session.user.email;

  try {
    const body = await req.json();
    const { gameId, action, seconds = 0 } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    await ensureTable();

    if (action === 'start') {
      await query(
        `INSERT INTO user_play_history (user_id, game_id, play_time_seconds, play_count, last_played_at)
         VALUES ($1, $2, 0, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, game_id)
         DO UPDATE SET 
           play_count = user_play_history.play_count + 1,
           last_played_at = CURRENT_TIMESTAMP`,
        [userId, gameId]
      );
    } else {
      // heartbeat
      await query(
        `INSERT INTO user_play_history (user_id, game_id, play_time_seconds, play_count, last_played_at)
         VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, game_id)
         DO UPDATE SET 
           play_time_seconds = user_play_history.play_time_seconds + $3,
           last_played_at = CURRENT_TIMESTAMP`,
        [userId, gameId, seconds]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update play history:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
