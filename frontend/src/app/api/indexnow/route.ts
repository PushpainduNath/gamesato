import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const INDEXNOW_KEY = '3a5e8c1b9f7d42e0a2b09c61d74ea28b';
const HOST = 'gamesato.com';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

async function submitToIndexNow(urls: string[]) {
  if (!urls || urls.length === 0) {
    return { success: false, message: 'No URLs provided' };
  }

  // IndexNow limits to 10,000 URLs per batch
  const batch = urls.slice(0, 10000);

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: batch,
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const isSuccess = res.status === 200 || res.status === 202;
    return {
      success: isSuccess,
      status: res.status,
      statusText: res.statusText,
      count: batch.length,
    };
  } catch (err: any) {
    console.error('Error pinging IndexNow API:', err);
    return {
      success: false,
      error: err?.message || 'Network error pinging IndexNow',
    };
  }
}

// GET /api/indexnow?url=https://gamesato.com/game/... or /api/indexnow (triggers site-wide ping)
export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');

  if (urlParam) {
    const result = await submitToIndexNow([urlParam]);
    return NextResponse.json(result);
  }

  // If no specific url, collect all site URLs and submit
  try {
    const staticUrls = [
      `https://${HOST}`,
      `https://${HOST}/blog`,
      `https://${HOST}/about`,
      `https://${HOST}/contact`,
      `https://${HOST}/privacy`,
      `https://${HOST}/terms`,
    ];

    // Games
    const gamesRes = await query(
      "SELECT slug FROM games WHERE status = 'published' ORDER BY play_count DESC"
    );
    const gameUrls = (gamesRes.rows || []).map(
      (g: { slug: string }) => `https://${HOST}/games/${g.slug}`
    );

    // Categories
    const catRes = await query('SELECT slug FROM categories');
    const catUrls = (catRes.rows || []).map(
      (c: { slug: string }) => `https://${HOST}/category/${c.slug}`
    );

    // Blogs
    const blogRes = await query(
      "SELECT slug FROM blogs WHERE status = 'published'"
    );
    const blogUrls = (blogRes.rows || []).map(
      (b: { slug: string }) => `https://${HOST}/blog/${b.slug}`
    );

    const allUrls = Array.from(
      new Set([...staticUrls, ...gameUrls, ...catUrls, ...blogUrls])
    );

    const submissionResult = await submitToIndexNow(allUrls);

    return NextResponse.json({
      message: 'Full-site IndexNow submission completed',
      totalUrlsFound: allUrls.length,
      ...submissionResult,
    });
  } catch (err: any) {
    console.error('IndexNow full crawl error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/indexnow { urls: ["https://gamesato.com/...", ...] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const urls: string[] = Array.isArray(body?.urls) ? body.urls : [];

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'Invalid body: "urls" must be a non-empty array of strings' },
        { status: 400 }
      );
    }

    const result = await submitToIndexNow(urls);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error processing request' },
      { status: 500 }
    );
  }
}
