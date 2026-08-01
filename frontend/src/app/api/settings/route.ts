import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
    const res = await fetch(`${backendUrl}/api/admin/settings`, {
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({
      social_twitter: 'https://twitter.com',
      social_facebook: 'https://facebook.com',
      social_youtube: 'https://youtube.com',
      social_instagram: 'https://instagram.com',
      support_email: 'support@gamesato.com'
    });
  } catch (err) {
    return NextResponse.json({
      social_twitter: 'https://twitter.com',
      social_facebook: 'https://facebook.com',
      social_youtube: 'https://youtube.com',
      social_instagram: 'https://instagram.com',
      support_email: 'support@gamesato.com'
    });
  }
}
