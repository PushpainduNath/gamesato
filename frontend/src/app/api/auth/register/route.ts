import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields (Name, Email, Password) are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const checkUser = await query('SELECT id, provider FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      const existingUser = checkUser.rows[0];
      if (existingUser.provider && existingUser.provider !== 'credentials') {
        return NextResponse.json(
          { error: `This email is already registered using ${existingUser.provider} login. Please log in with that provider.` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in instead.' },
        { status: 400 }
      );
    }

    // 2. Hash password securely
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    // 3. Pick a random avatar from memo_1.png to memo_20.png
    const randomAvatarNum = Math.floor(Math.random() * 20) + 1;
    const randomAvatarUrl = `/avatars/memo_${randomAvatarNum}.png`;

    // 4. Create the user in database with the assigned random avatar
    await query(
      'INSERT INTO users (name, email, password_hash, provider, image) VALUES ($1, $2, $3, $4, $5)',
      [name, email, passwordHash, 'credentials', randomAvatarUrl]
    );

    return NextResponse.json(
      { success: true, message: 'User registered successfully!' },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
