import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { password, provider } = body;

    // Fetch user details
    const userRes = await query('SELECT password_hash, provider FROM users WHERE id = $1', [session.user.id]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userRes.rows[0];

    // If manual registration (credentials)
    if (user.provider === 'credentials' || user.password_hash) {
      if (!password) {
        return NextResponse.json({ error: 'Password confirmation is required' }, { status: 400 });
      }
      const match = bcrypt.compareSync(password, user.password_hash);
      if (!match) {
        return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 400 });
      }
    } else {
      // Social provider verification
      if (!provider || provider !== user.provider) {
        return NextResponse.json({ 
          error: `Verification failed. Please confirm deactivation via your ${user.provider || 'social'} account.` 
        }, { status: 400 });
      }
    }

    // 1. Delete user likes/favorites to satisfy foreign key constraints
    await query('DELETE FROM likes WHERE "userId" = $1', [session.user.id]);

    // 2. Delete main user profile record
    await query('DELETE FROM users WHERE id = $1', [session.user.id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete user account:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
