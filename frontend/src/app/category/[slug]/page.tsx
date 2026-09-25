import React from 'react';
import { Metadata } from 'next';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CategoryClientView, { CategoryItem, GameItem } from './CategoryClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug.toLowerCase();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';
  let catName = slug.charAt(0).toUpperCase() + slug.slice(1);
  let metaTitle = `${catName} Games - Play Free Online HTML5 Games on Gamesato`;
  let metaDescription = `Play the best free online ${catName} games on Gamesato. Instant HTML5 ${catName.toLowerCase()} browser games on mobile and desktop with no downloads required.`;
  let metaKeywords = [
    `free ${catName.toLowerCase()} games`,
    `online ${catName.toLowerCase()} games`,
    `play ${catName.toLowerCase()} games unblocked`,
    'HTML5 browser games',
    'Gamesato',
  ];

  try {
    const catRes = await query(
      `SELECT name, meta_title, meta_description, meta_tags FROM categories WHERE LOWER(slug) = LOWER($1) OR LOWER(name) = LOWER($1) LIMIT 1`,
      [slug]
    );
    if (catRes.rows.length > 0) {
      const row = catRes.rows[0];
      catName = row.name;
      if (row.meta_title) metaTitle = row.meta_title;
      if (row.meta_description) metaDescription = row.meta_description;
      if (row.meta_tags) {
        metaKeywords = row.meta_tags.split(',').map((k: string) => k.trim()).filter(Boolean);
      }
    }
  } catch (err) {
    console.error('Error generating category metadata:', err);
  }

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: `${siteUrl}/category/${slug}`,
      siteName: 'Gamesato',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/logo.png`,
          width: 1200,
          height: 630,
          alt: `${catName} Games on Gamesato`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [`${siteUrl}/logo.png`],
    },
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const slug = params.slug.toLowerCase();

  // 1. Fetch categories with game counts for sidebar
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

  // 2. Fetch current category details & admin-configured FAQ
  let categoryData: any = null;
  try {
    const detailRes = await query(
      `SELECT id, name, slug, icon, content, meta_title, meta_description, meta_tags, faq
       FROM categories
       WHERE LOWER(slug) = LOWER($1) OR LOWER(name) = LOWER($1)
       LIMIT 1`,
      [slug]
    );
    categoryData = detailRes.rows[0] || null;
  } catch (err) {
    console.error('Failed to fetch category details:', err);
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

  // 4. Category Games (ordered by featured, play_count, and created_at)
  let categoryGames: GameItem[] = [];
  let totalCategoryGames = 0;
  const resolvedCategoryName = categoryData?.name || categories.find((c) => c.slug === slug)?.name || slug;

  try {
    const countRes = await query(
      `SELECT COUNT(*)::int as total
       FROM games g
       WHERE g.status = 'published' AND (LOWER(g.category) = LOWER($1) OR LOWER(g.category) = LOWER($2))`,
      [resolvedCategoryName, slug]
    );
    totalCategoryGames = countRes.rows[0]?.total || 0;

    const gamesRes = await query(
      `SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count,
              g.featured_desktop_url, g.featured_mobile_url,
              GREATEST(COALESCE(g.likes_count, 0), COUNT(l."userId")::int) as likes_count
       FROM games g
       LEFT JOIN likes l ON g.id = l."gameId"
       WHERE g.status = 'published' AND (LOWER(g.category) = LOWER($1) OR LOWER(g.category) = LOWER($2))
       GROUP BY g.id
       ORDER BY g.is_featured DESC, g.play_count DESC, g.created_at DESC
       LIMIT 300`,
      [resolvedCategoryName, slug]
    );
    categoryGames = gamesRes.rows;
  } catch (err) {
    console.error('Failed to fetch category games:', err);
  }

  // 5. All Games Pool (Catalog-wide handpicked games for "More Games" section)
  let allGamesPool: GameItem[] = [];
  try {
    const allRes = await query(
      `SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count,
              g.featured_desktop_url, g.featured_mobile_url,
              GREATEST(COALESCE(g.likes_count, 0), COUNT(l."userId")::int) as likes_count
       FROM games g
       LEFT JOIN likes l ON g.id = l."gameId"
       WHERE g.status = 'published'
       GROUP BY g.id
       ORDER BY g.is_featured DESC, g.play_count DESC, g.created_at DESC
       LIMIT 200`
    );
    allGamesPool = allRes.rows;
  } catch (err) {
    console.error('Failed to fetch all games pool:', err);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';
  const categorySchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `${resolvedCategoryName} Games - Play Free Online on Gamesato`,
        url: `${siteUrl}/category/${slug}`,
        description: `Play the best free online ${resolvedCategoryName} HTML5 games on Gamesato with no download required.`,
        mainEntity: {
          '@type': 'ItemList',
          name: `Top ${resolvedCategoryName} Games`,
          itemListElement: categoryGames.slice(0, 20).map((g, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: g.title,
            url: `${siteUrl}/games/${g.slug}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${resolvedCategoryName} Games`,
            item: `${siteUrl}/category/${slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        id="category-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
      />
      <CategoryClientView
        slug={slug}
        categories={categories}
        categoryData={categoryData}
        favoritesCount={favoritesCount}
        initialGames={categoryGames}
        initialTotal={totalCategoryGames}
        allGamesPool={allGamesPool}
      />
    </>
  );
}
