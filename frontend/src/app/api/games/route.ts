import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get('category') || 'All';
  const sortParam = searchParams.get('sort') || 'new'; // 'new', 'popular', 'likes', 'plays'
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const limitParam = parseInt(searchParams.get('limit') || '12', 10);

  const featuredParam = searchParams.get('featured') === 'true';
  const offset = (pageParam - 1) * limitParam;

  try {
    let whereClause = "WHERE g.status = 'published'";
    const queryParams: any[] = [];

    const searchQueryParam = searchParams.get('search');
    if (searchQueryParam) {
      whereClause += ` AND (LOWER(g.title) LIKE LOWER($${queryParams.length + 1}) OR LOWER(g.category) LIKE LOWER($${queryParams.length + 1}))`;
      queryParams.push(`%${searchQueryParam}%`);
    } else if (featuredParam) {
      whereClause += " AND g.is_featured = TRUE";
    } else if (categoryParam !== 'All' && categoryParam !== 'New' && categoryParam !== 'Popular' && categoryParam !== 'Favorites') {
      whereClause += " AND LOWER(g.category) = LOWER($1)";
      queryParams.push(categoryParam);
    }

    // Determine count query
    const countRes = await query(
      `SELECT COUNT(*)::int as total FROM games g ${whereClause}`,
      queryParams
    );
    const total = countRes.rows[0]?.total || 0;

    // Build main games query
    let gamesQuery = `
      SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count,
             g.featured_desktop_url, g.featured_mobile_url, g.new_game_both_url, g.game_page_both_url,
             COUNT(l."userId")::int as likes_count
      FROM games g
      LEFT JOIN likes l ON g.id = l."gameId"
      ${whereClause}
      GROUP BY g.id
    `;

    // Apply sorting
    if (featuredParam) {
      gamesQuery += ` ORDER BY g.updated_at DESC`;
    } else if (sortParam === 'popular' || sortParam === 'plays') {
      gamesQuery += ` ORDER BY g.play_count DESC, g.created_at DESC`;
    } else if (sortParam === 'likes') {
      gamesQuery += ` ORDER BY likes_count DESC, g.created_at DESC`;
    } else {
      // Default: New
      gamesQuery += ` ORDER BY g.created_at DESC`;
    }

    // Apply pagination limit/offset
    gamesQuery += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limitParam, offset);

    const gamesRes = await query(gamesQuery, queryParams);

    return NextResponse.json({
      games: gamesRes.rows,
      total,
      page: pageParam,
      limit: limitParam,
    });
  } catch (err) {
    console.error('Failed to fetch category games via API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
