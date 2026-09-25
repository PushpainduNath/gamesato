import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';
import { getImageUrl } from '@/lib/utils';
import GameDetailClientView, { GameDetailData, GridGameItem, CategoryItem } from './GameDetailClientView';
import { CategoryWithGames } from '@/components/NewHomepage/CategorySectionGrid';

// Dynamic routes pre-generation
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const res = await query(
      "SELECT slug FROM games WHERE status = 'published' ORDER BY created_at DESC LIMIT 50"
    );
    return res.rows.map((row: { slug: string }) => ({
      slug: row.slug,
    }));
  } catch (err) {
    console.error('Error generating static parameters for ISR:', err);
    return [];
  }
}

// Dynamic SEO metadata generation
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { slug } = params;
  
  try {
    const res = await query(
      'SELECT title, description, thumbnail_url, category FROM games WHERE slug = $1',
      [slug]
    );

    if (res.rows.length === 0) {
      return {
        title: 'Game Not Found | Gamesato',
      };
    }

    const game = res.rows[0];
    return {
      title: `${game.title} - Play Free Online HTML5 Game on Gamesato`,
      description: game.description || `Play ${game.title} instantly in your web browser. A high-performance free web game on Gamesato with no download required.`,
      alternates: {
        canonical: `/games/${slug}`,
      },
      openGraph: {
        title: `${game.title} | Gamesato`,
        description: game.description,
        images: [getImageUrl(game.thumbnail_url)],
      },
    };
  } catch (err) {
    console.error('Error generating metadata for game page:', err);
    return {
      title: 'Gamesato Portal',
      alternates: {
        canonical: `/games/${slug}`,
      },
    };
  }
}

export default async function GameDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { slug } = params;

  // 1. Fetch game details directly from database
  let game: GameDetailData | null = null;
  let likesCount = 0;
  
  try {
    const gameRes = await query(
      "SELECT * FROM games WHERE slug = $1 AND status = 'published' LIMIT 1",
      [slug]
    );
    if (gameRes.rows.length > 0) {
      const activeGame = gameRes.rows[0];
      game = activeGame;
      
      const likesRes = await query('SELECT COUNT(*)::int as count FROM likes WHERE "gameId" = $1', [activeGame.id]);
      likesCount = Math.max(Number(activeGame.likes_count || 0), likesRes.rows[0]?.count || 0);
    }
  } catch (err) {
    console.error('Failed to query game details:', err);
  }

  if (!game) {
    notFound();
  }

  // 2. Fetch categories with game counts for NewSidebar
  let categories: CategoryItem[] = [];
  try {
    const catRes = await query(`
      SELECT c.id, c.name, c.slug, c.icon, COUNT(g.id)::int as count
      FROM categories c
      INNER JOIN games g ON (LOWER(g.category) = LOWER(c.name) OR LOWER(g.category) = LOWER(c.slug)) AND g.status = 'published'
      GROUP BY c.id, c.name, c.slug, c.icon
      HAVING COUNT(g.id) > 0
      ORDER BY count DESC
    `);
    categories = catRes.rows;
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }

  // 3. User favorites count
  let favoritesCount = 0;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const favRes = await query(
        `SELECT COUNT(*)::int as count FROM likes l
         JOIN games g ON l."gameId" = g.id
         WHERE l."userId" = $1 AND g.status = 'published'`,
        [session.user.id]
      );
      favoritesCount = favRes.rows[0]?.count || 0;
    }
  } catch (err) {
    console.error('Failed to fetch favorites count:', err);
  }

  // 4. Fetch 18 games for the right sidebar (related category games first, then popular)
  let sidebarGames: GridGameItem[] = [];
  try {
    const sideRes = await query(
      `SELECT id, title, slug, thumbnail_url, category, play_count, COALESCE(likes_count, 0) as likes_count
       FROM games
       WHERE status = 'published' AND id != $1
       ORDER BY CASE WHEN LOWER(category) = LOWER($2) THEN 0 ELSE 1 END, play_count DESC, created_at DESC
       LIMIT 18`,
      [game.id, game.category]
    );
    sidebarGames = sideRes.rows;
  } catch (err) {
    console.error('Failed to fetch sidebar games:', err);
  }

  // 5. Fetch pool of 60 games for the bottom Poki Bento Grid and Header instant search
  let bentoGames: GridGameItem[] = [];
  try {
    const bentoRes = await query(
      `SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.play_count,
              g.featured_desktop_url, g.featured_mobile_url,
              GREATEST(COALESCE(g.likes_count, 0), COUNT(l."userId")::int) as likes_count
       FROM games g
       LEFT JOIN likes l ON l."gameId" = g.id
       WHERE g.status = 'published' AND g.id != $1
       GROUP BY g.id
       ORDER BY CASE WHEN LOWER(g.category) = LOWER($2) THEN 0 ELSE 1 END, g.play_count DESC, g.created_at DESC
       LIMIT 60`,
      [game.id, game.category]
    );
    bentoGames = bentoRes.rows;
  } catch (err) {
    console.error('Failed to fetch bento games:', err);
  }

  // 6. Fetch top 4 category sections with their games (identical to homepage)
  let topCategorySections: CategoryWithGames[] = [];
  try {
    const top4 = categories.slice(0, 4);
    const top4Ids = top4.map((c) => c.id).filter(Boolean);

    if (top4Ids.length > 0) {
      const topCatGamesRes = await query(`
        WITH RankedGames AS (
          SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count,
                 c.id as category_id, c.name as category_name, c.slug as category_slug,
                 GREATEST(COALESCE(g.likes_count, 0), COUNT(l."userId")::int) as likes_count,
                 ROW_NUMBER() OVER (
                   PARTITION BY c.id 
                   ORDER BY g.is_featured DESC, g.play_count DESC, g.created_at DESC
                 ) as row_num
          FROM categories c
          JOIN games g ON (LOWER(g.category) = LOWER(c.name) OR LOWER(g.category) = LOWER(c.slug)) AND g.status = 'published'
          LEFT JOIN likes l ON g.id = l."gameId"
          WHERE c.id = ANY($1::uuid[])
          GROUP BY g.id, c.id, c.name, c.slug
        )
        SELECT * FROM RankedGames WHERE row_num <= 24 ORDER BY category_id, row_num
      `, [top4Ids]);

      topCategorySections = top4.map((cat) => ({
        id: cat.id!,
        name: cat.name,
        slug: cat.slug,
        count: cat.count || 0,
        games: topCatGamesRes.rows.filter((g: any) => g.category_id === cat.id),
      }));
    }
  } catch (err) {
    console.error('Failed to query top category sections:', err);
  }

  // 7. Fetch category SEO content and FAQ for this game's category
  let categoryData: { id: string; name: string; slug: string; content?: string; faq?: string } | null = null;
  try {
    const catDataRes = await query(
      `SELECT id, name, slug, content, faq FROM categories WHERE LOWER(name) = LOWER($1) OR LOWER(slug) = LOWER($1) LIMIT 1`,
      [game.category]
    );
    if (catDataRes.rows.length > 0) {
      categoryData = catDataRes.rows[0];
    }
  } catch (err) {
    console.error('Failed to fetch category data for game:', err);
  }

  return (
    <GameDetailClientView
      game={game}
      likesCount={likesCount}
      sidebarGames={sidebarGames}
      bentoGames={bentoGames}
      categories={categories}
      favoritesCount={favoritesCount}
      allGamesPool={bentoGames}
      categorySections={topCategorySections}
      categoryData={categoryData}
    />
  );
}
