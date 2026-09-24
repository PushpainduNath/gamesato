import React from 'react';
import { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getImageUrl } from '@/lib/utils';
import BlogClientView, { BlogDetail, CategoryItem } from './BlogClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;

  let blog: any = null;

  try {
    const res = await query(
      'SELECT title, excerpt, cover_image, meta_title, meta_description FROM blogs WHERE slug = $1 AND status = $2 LIMIT 1',
      [slug, 'published']
    );
    if (res.rows && res.rows.length > 0) {
      blog = res.rows[0];
    }
  } catch (err) {
    console.error('Error querying blog for metadata:', err);
  }

  // Fallback to backend API
  if (!blog) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';
    try {
      const res = await fetch(`${backendUrl}/api/blogs/${slug}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        blog = data.blog;
      }
    } catch (_) {}
  }

  if (!blog) {
    return { title: 'Blog Post Not Found | Gamesato' };
  }

  const title = blog.meta_title || `${blog.title} | Gamesato Blog`;
  const description = blog.meta_description || blog.excerpt;
  const image = getImageUrl(blog.cover_image) || '/logo.png';

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://gamesato.com/blog/${slug}`,
      siteName: 'Gamesato',
      type: 'article',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

async function getBlogData(slug: string): Promise<{ blog: BlogDetail | null; relatedBlogs: BlogDetail[] }> {
  let blog: BlogDetail | null = null;
  let relatedBlogs: BlogDetail[] = [];

  try {
    const res = await query(
      'SELECT id, title, slug, excerpt, content, cover_image, category, author, published_at FROM blogs WHERE slug = $1 AND status = $2 LIMIT 1',
      [slug, 'published']
    );
    if (res.rows && res.rows.length > 0) {
      blog = res.rows[0];
    }
  } catch (err) {
    console.error('Error fetching blog post by slug from DB:', err);
  }

  // Fetch related blogs from DB
  if (blog) {
    try {
      const relatedRes = await query(
        'SELECT id, title, slug, excerpt, cover_image, category, author, published_at FROM blogs WHERE slug != $1 AND status = $2 ORDER BY published_at DESC LIMIT 3',
        [slug, 'published']
      );
      relatedBlogs = relatedRes.rows || [];
    } catch (e) {
      console.error('Error fetching related blogs from DB:', e);
    }
  }

  // Fallback to backend API if DB query returned nothing
  if (!blog) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';
    try {
      const res = await fetch(`${backendUrl}/api/blogs/${slug}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        blog = data.blog || null;
      }
      const listRes = await fetch(`${backendUrl}/api/blogs`, { cache: 'no-store' });
      if (listRes.ok) {
        const listData = await listRes.json();
        const allBlogs: BlogDetail[] = listData.blogs || [];
        relatedBlogs = allBlogs.filter((b) => b.slug !== slug).slice(0, 3);
      }
    } catch (err) {
      console.error('Error fetching blog data from backend API:', err);
    }
  }

  return { blog, relatedBlogs };
}

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { slug } = params;
  const session = await getServerSession(authOptions);

  const { blog, relatedBlogs } = await getBlogData(slug);

  if (!blog) {
    notFound();
  }

  // 1. Fetch categories for sidebar
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
    console.error('Error fetching categories for blog detail page:', err);
  }

  // 2. Fetch featured games for search dropdown
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

  // 3. Fetch user favorites count
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt,
    image: getImageUrl(blog.cover_image) || `${siteUrl}/logo.png`,
    url: `${siteUrl}/blog/${blog.slug}`,
    datePublished: blog.published_at,
    dateModified: blog.published_at,
    author: {
      '@type': 'Organization',
      name: blog.author || 'Gamesato Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Gamesato',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${blog.slug}`,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
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
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: `${siteUrl}/blog/${blog.slug}`,
      },
    ],
  };

  return (
    <>
      <Script
        id="blog-posting-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <Script
        id="blog-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <BlogClientView
        blog={blog}
        relatedBlogs={relatedBlogs}
        categories={categories}
        featuredGames={featuredGames}
        favoritesCount={favoritesCount}
        siteUrl={siteUrl}
      />
    </>
  );
}
