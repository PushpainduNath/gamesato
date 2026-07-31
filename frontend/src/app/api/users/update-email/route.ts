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
    const { email, password } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Fetch user details from database
    const userRes = await query('SELECT password_hash, provider FROM users WHERE id = $1', [session.user.id]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // If manual signup (credentials provider), we must verify password
    if (user.provider === 'credentials' || user.password_hash) {
      if (!password) {
        return NextResponse.json({ error: 'Password confirmation is required' }, { status: 400 });
      }
      const passwordMatch = bcrypt.compareSync(password, user.password_hash);
      if (!passwordMatch) {
        return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 400 });
      }
    }

    // Check if email already exists for another user
    const checkRes = await query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, session.user.id]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    await query('UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [email, session.user.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update email address:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
