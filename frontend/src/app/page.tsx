import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import NewHomepageView from '@/components/NewHomepage/NewHomepageView';
import { GameItem } from '@/components/NewHomepage/PokiSquareGrid';
import { CategoryWithGames } from '@/components/NewHomepage/CategorySectionGrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the best free games on Gamesato?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We recommend starting with our Featured section. All games on Gamesato are free to play with no downloads required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I play free games without installing anything?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all games on Gamesato are instant-play HTML5 games. They run directly in your web browser.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Gamesato free to play on mobile and desktop?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Gamesato is fully optimized for mobile devices, tablets, and desktop computers.',
      },
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await query("SELECT meta_title, meta_description, meta_tags FROM static_pages WHERE slug = 'home'");
    const page = res.rows[0];
    if (page) {
      return {
        title: page.meta_title || 'Gamesato - Play Free Online HTML5 Games',
        description: page.meta_description || 'Play the best free online HTML5 games on Gamesato.',
        keywords: page.meta_tags || 'free online games, play html5 games',
        alternates: {
          canonical: '/',
        },
      };
    }
  } catch (err) {
    console.error('Error generating metadata for home:', err);
  }
  return {
    title: 'Gamesato - Play Free Online HTML5 Games',
    description: 'Play the best free online HTML5 games on Gamesato.',
    alternates: {
      canonical: '/',
    },
  };
}

export default async function HomePage() {
  // 0. Detect Client Device Type via User-Agent (Mobile / Tablet)
  let isMobileServer = false;
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    isMobileServer = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop|tablet|ipad/i.test(userAgent);
  } catch {
    // Fallback to default
  }

  // 1. Fetch static SEO home content & FAQ content
  let homeContent = '';
  let faqList: { question: string; answer: string }[] = [];
  try {
    const homeContentRes = await query("SELECT content FROM static_pages WHERE slug = 'home' AND status = 'published'");
    homeContent = homeContentRes.rows[0]?.content || '';

    const faqContentRes = await query("SELECT content FROM static_pages WHERE slug = 'faq' AND status = 'published'");
    const faqContentRaw = faqContentRes.rows[0]?.content || '[]';
    const parsedFaq = JSON.parse(faqContentRaw);
    if (Array.isArray(parsedFaq)) {
      faqList = parsedFaq.map((item: any) => ({
        question: item.question || item.q || '',
        answer: item.answer || item.a || '',
      })).filter((item: any) => item.question && item.answer);
    }
  } catch (err) {
    console.error('Failed to query static pages:', err);
  }

  // 2. Fetch User Favorites if logged in
  const session = await getServerSession(authOptions);
  let favoritesCount = 0;
  let userId = (session?.user as any)?.id;
  if (!userId && session?.user?.email) {
    try {
      const uRes = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
      if (uRes.rows.length > 0) userId = uRes.rows[0].id;
    } catch (_) {}
  }

  if (userId) {
    try {
      const favRes = await query(
        `SELECT COUNT(*)::int as count FROM likes l
         JOIN games g ON l."gameId" = g.id
         WHERE l."userId" = $1 AND g.status = 'published'`,
        [userId]
      );
      favoritesCount = favRes.rows[0]?.count || 0;
    } catch (err) {
      console.error('Failed to query favorites count:', err);
    }
  }

  // 3. Fetch Total Games Count
  let totalGamesCount = 0;
  try {
    const countRes = await query(`SELECT COUNT(*)::int as count FROM games WHERE status = 'published'`);
    totalGamesCount = countRes.rows[0]?.count || 0;
  } catch (err) {
    console.error('Failed to query total games count:', err);
  }

  // 4. Fetch Active Categories list (only categories with >0 published games)
  let categories: { id?: string; name: string; slug: string; count?: number }[] = [];
  let topCategorySections: CategoryWithGames[] = [];
  try {
    const catRes = await query(`
      SELECT c.id, c.name, c.slug, COUNT(g.id)::int as count
      FROM categories c
      INNER JOIN games g ON (LOWER(g.category) = LOWER(c.name) OR LOWER(g.category) = LOWER(c.slug)) AND g.status = 'published'
      GROUP BY c.id, c.name, c.slug
      HAVING COUNT(g.id) > 0
      ORDER BY count DESC
    `);
    categories = catRes.rows;

    // Top 4 categories with the most published games
    const top4 = categories.slice(0, 4);
    const top4Ids = top4.map((c) => c.id);

    if (top4Ids.length > 0) {
      const topCatGamesRes = await query(`
        WITH RankedGames AS (
          SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count,
                 c.id as category_id, c.name as category_name, c.slug as category_slug,
                 COUNT(l."userId")::int as likes_count,
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
    console.error('Failed to query categories and top category sections:', err);
  }

  // 5. Fetch Featured Games (is_featured = TRUE, for first 2 rows & big card)
  let featuredGames: GameItem[] = [];
  try {
    const featRes = await query(
      `SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count,
              g.featured_desktop_url, g.featured_mobile_url,
              COUNT(l."userId")::int as likes_count
       FROM games g
       LEFT JOIN likes l ON g.id = l."gameId"
       WHERE g.status = 'published' AND g.is_featured = TRUE
       GROUP BY g.id
       ORDER BY g.updated_at DESC
       LIMIT 15`
    );
    featuredGames = featRes.rows;
  } catch (err) {
    console.error('Failed to query featured games:', err);
  }

  // 6. Fetch All published games for feed
  let allGames: GameItem[] = [];
  try {
    const allRes = await query(
      `SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count,
              g.target_device,
              COUNT(l."userId")::int as likes_count
       FROM games g
       LEFT JOIN likes l ON g.id = l."gameId"
       WHERE g.status = 'published'
       GROUP BY g.id
       ORDER BY 
         (CASE 
            WHEN $1::boolean = TRUE THEN 
              (CASE WHEN g.target_device = 'MOBILE' THEN 1 WHEN g.target_device = 'ALL' THEN 2 ELSE 3 END)
            ELSE 
              (CASE WHEN g.target_device = 'DESKTOP' THEN 1 WHEN g.target_device = 'ALL' THEN 2 ELSE 3 END)
          END),
         g.created_at DESC
       LIMIT 200`,
      [isMobileServer]
    );
    allGames = allRes.rows;
  } catch (err) {
    console.error('Failed to query all games:', err);
  }

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <NewHomepageView
        featuredGames={featuredGames}
        allGames={allGames}
        categories={categories}
        categorySections={topCategorySections}
        favoritesCount={favoritesCount}
        totalGamesCount={totalGamesCount}
        faqList={faqList}
        homeContent={homeContent}
        isMobileServer={isMobileServer}
      />
    </>
  );
}
