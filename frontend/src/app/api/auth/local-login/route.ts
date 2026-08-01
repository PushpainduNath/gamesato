import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Query user details from DB
    const userRes = await query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { error: `User email "${email}" not found in database.` },
        { status: 404 }
      );
    }

    const user = userRes.rows[0];
    const isUserAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    // Password validation for standard login (when password is provided)
    if (password !== undefined) {
      const allowedPassword = process.env.ADMIN_PASSWORD || 'gamesatoadminpassword123';
      if (password !== allowedPassword) {
        return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
      }
    } else {
      // If no password is provided, it is a direct dev-bypass login. 
      // We restrict direct bypass in production for safety.
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Bypass login is disabled in production. Please enter credentials.' }, { status: 400 });
      }
    }

    // Generate a random session token
    const sessionToken = crypto.randomUUID();
    // Expiration date (30 days from now)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    // Insert session into PostgreSQL sessions table
    await query(
      'INSERT INTO sessions ("sessionToken", "userId", expires) VALUES ($1, $2, $3)',
      [sessionToken, user.id, expires]
    );

    // Set the next-auth.session-token cookie
    const cookieStore = await cookies();
    cookieStore.set('next-auth.session-token', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error('Local login error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
