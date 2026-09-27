import React from 'react';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { query } from '@/lib/db';
import NotFoundClientView, { CategoryItem, GameItem } from '@/components/NotFound/NotFoundClientView';

export const metadata: Metadata = {
  title: 'Page Not Found (404) | Gamesato',
  description: 'The game or page you are looking for could not be found. Explore our latest new games and top-rated free online HTML5 games on Gamesato.',
  robots: {
    index: false,
    follow: true,
  },
};

const FALLBACK_CATEGORIES: CategoryItem[] = [
  { name: 'Action', slug: 'action' },
  { name: 'Racing', slug: 'racing' },
  { name: 'Puzzle', slug: 'puzzle' },
  { name: 'Sport', slug: 'sport' },
  { name: 'Arcade', slug: 'arcade' },
  { name: 'Adventure', slug: 'adventure' },
];

const FALLBACK_NEW_GAMES: GameItem[] = [
  {
    id: 'fallback-subway',
    title: 'Subway Surfers',
    slug: 'subway-surfers',
    category: 'Action',
    thumbnail_url: '/uploads/thumbnails/subway-surfers.webp',
    play_count: 45000,
  },
  {
    id: 'e439535e-9f7c-43f0-9602-2474873d14ec',
    title: 'Stick War',
    slug: 'stick-war',
    category: 'Action',
    thumbnail_url: '/uploads/thumbnails/stick-war-1785642065096.webp',
    play_count: 820,
  },
  {
    id: 'e3f1fd80-46a6-4312-9261-71350be1de09',
    title: 'Head Soccer 2026',
    slug: 'head-soccer-2026',
    category: 'Sport',
    thumbnail_url: '/uploads/thumbnails/head-soccer-2026-1781976396600.webp',
    play_count: 1752,
  },
  {
    id: '75137fff-1987-4b84-ad89-13c87df5d102',
    title: 'Cut The Candy',
    slug: 'cut-the-candy',
    category: 'Puzzle',
    thumbnail_url: '/uploads/thumbnails/cut-the-candy-1781974319709.webp',
    play_count: 1052,
  },
  {
    id: 'a1be4d91-a8d0-400b-abd1-c66cfbbb35f6',
    title: 'Subway Riders',
    slug: 'subway-riders',
    category: 'Racing',
    thumbnail_url: '/uploads/thumbnails/subway-riders-1785075422915.webp',
    play_count: 952,
  },
  {
    id: 'fallback-bounce',
    title: 'Bounce Tales',
    slug: 'bounce-tales',
    category: 'Adventure',
    thumbnail_url: '/uploads/thumbnails/bounce-tales.webp',
    play_count: 12000,
  },
  {
    id: 'fallback-bouncemasters',
    title: 'Bouncemasters',
    slug: 'bouncemasters',
    category: 'Arcade',
    thumbnail_url: '/uploads/thumbnails/bouncemasters.webp',
    play_count: 8900,
  }
];

export default async function NotFound() {
  // 1. Categories
  let categories: CategoryItem[] = [];
  try {
    const catRes = await query(`
      SELECT c.id, c.name, c.slug, COUNT(g.id)::int as count
      FROM categories c
      INNER JOIN games g ON (LOWER(g.category) = LOWER(c.name) OR LOWER(g.category) = LOWER(c.slug)) AND g.status = 'published'
      GROUP BY c.id, c.name, c.slug
      HAVING COUNT(g.id) > 0
      ORDER BY count DESC
    `);
    if (catRes.rows.length > 0) {
      categories = catRes.rows;
    }
  } catch (err) {
    console.error('Error fetching categories for 404 page:', err);
  }
  if (categories.length === 0) categories = FALLBACK_CATEGORIES;

  // 2. Featured Games (for Header search dropdown & Surprise Me)
  let featuredGames: GameItem[] = [];
  try {
    const featRes = await query(
      `SELECT id, title, slug, category, thumbnail_url, play_count
       FROM games
       WHERE status = 'published' AND is_featured = TRUE
       ORDER BY play_count DESC
       LIMIT 20`
    );
    if (featRes.rows.length > 0) {
      featuredGames = featRes.rows;
    }
  } catch (err) {
    console.error('Error fetching featured games for 404 page:', err);
  }

  // 3. New Games ("Try These New Games" section - ordered by created_at DESC)
  let newGames: GameItem[] = [];
  try {
    const newRes = await query(
      `SELECT id, title, slug, category, thumbnail_url, play_count, created_at
       FROM games
       WHERE status = 'published'
       ORDER BY created_at DESC
       LIMIT 16`
    );
    if (newRes.rows.length > 0) {
      newGames = newRes.rows;
    }
  } catch (err) {
    console.error('Error fetching new games for 404 page:', err);
  }
  if (newGames.length === 0) newGames = FALLBACK_NEW_GAMES;

  // 4. All / Top Games ("All Games" section - ordered by play_count DESC)
  let allGames: GameItem[] = [];
  try {
    const allRes = await query(
      `SELECT id, title, slug, category, thumbnail_url, play_count, likes_count
       FROM games
       WHERE status = 'published'
       ORDER BY play_count DESC, created_at DESC
       LIMIT 60`
    );
    if (allRes.rows.length > 0) {
      allGames = allRes.rows;
    }
  } catch (err) {
    console.error('Error fetching all games for 404 page:', err);
  }
  if (allGames.length === 0) allGames = FALLBACK_NEW_GAMES;

  // 5. User Favorites count
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
  } catch (_) {}

  return (
    <NotFoundClientView
      categories={categories}
      featuredGames={featuredGames}
      newGames={newGames}
      allGames={allGames}
      favoritesCount={favoritesCount}
    />
  );
}
