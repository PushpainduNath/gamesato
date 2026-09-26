import React from 'react';
import { Metadata } from 'next';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import BlogIndexClientView, { BlogItem, CategoryItem } from './BlogIndexClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Gamesato Gaming Blog | Strategy Guides, News & Updates',
  description:
    'Explore the official Gamesato gaming blog. Get expert tips, browser game strategy guides, game development insights, and platform announcements.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Gamesato Gaming Blog | Strategy Guides & News',
    description:
      'Explore expert tips, browser game walkthroughs, H5 gaming insights, and platform announcements on Gamesato.',
    url: 'https://gamesato.com/blog',
    siteName: 'Gamesato',
    type: 'website',
    images: [
      {
        url: 'https://gamesato.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gamesato Gaming Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gamesato Gaming Blog | Strategy Guides & News',
    description:
      'Explore expert tips, browser game walkthroughs, H5 gaming insights, and platform announcements on Gamesato.',
    images: ['https://gamesato.com/og-image.png'],
  },
};

async function getBlogs(): Promise<BlogItem[]> {
  try {
    const res = await query(`
      SELECT id, title, slug, excerpt, content, cover_image, category, author, published_at
      FROM blogs
      WHERE status = 'published'
      ORDER BY published_at DESC
    `);
    if (res.rows && res.rows.length > 0) {
      return res.rows;
    }
  } catch (err) {
    console.error('Failed to query blogs from DB:', err);
  }

  // Fallback to backend API
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';
  try {
    const res = await fetch(`${backendUrl}/api/blogs`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.blogs || [];
    }
  } catch (err) {
    console.error('Failed to fetch blogs from API fallback:', err);
  }

  return [];
}

export default async function BlogIndexPage() {
  const session = await getServerSession(authOptions);

  // 1. Fetch published blogs
  const blogs = await getBlogs();

  // 2. Fetch categories for sidebar
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
    console.error('Error fetching categories for blog page:', err);
  }

  // 3. Fetch featured games for search dropdown
  let featuredGames: any[] = [];
  try {
    const gamesRes = await query(`
      SELECT id, title, slug, thumbnail_url, category, play_count, likes_count
      FROM games
      WHERE status = 'published'
      ORDER BY play_count DESC
      LIMIT 20
    `);
    featuredGames = gamesRes.rows;
  } catch (err) {
    console.error('Error fetching featured games:', err);
  }

  // 4. Fetch user favorites count
  let favoritesCount = 0;
  if (session?.user?.id) {
    try {
      const favRes = await query(
        `SELECT COUNT(*)::int as count FROM likes l
         JOIN games g ON l."gameId" = g.id
         WHERE l."userId" = $1 AND g.status = 'published'`,
        [session.user.id]
      );
      favoritesCount = favRes.rows[0]?.count || 0;
    } catch (_) {}
  }

  // JSON-LD Schemas: BreadcrumbList + Blog Collection
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://gamesato.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://gamesato.com/blog',
      },
    ],
  };

  const blogCollectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Gamesato Gaming Blog',
    description:
      'Explore expert tips, browser game walkthroughs, H5 gaming insights, and platform announcements on Gamesato.',
    url: 'https://gamesato.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Gamesato',
      url: 'https://gamesato.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://gamesato.com/logo.png',
      },
    },
    blogPost: blogs.map((b) => ({
      '@type': 'BlogPosting',
      headline: b.title,
      description: b.excerpt,
      url: `https://gamesato.com/blog/${b.slug}`,
      datePublished: b.published_at,
      image: b.cover_image
        ? (b.cover_image.startsWith('http') ? b.cover_image : `https://gamesato.com${b.cover_image}`)
        : 'https://gamesato.com/og-image.png',
      author: {
        '@type': 'Person',
        name: b.author || 'Gamesato Editorial Team',
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogCollectionSchema) }}
      />
      <BlogIndexClientView
        blogs={blogs}
        categories={categories}
        featuredGames={featuredGames}
        favoritesCount={favoritesCount}
      />
    </>
  );
}
