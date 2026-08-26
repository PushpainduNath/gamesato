import { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  let gamePages: MetadataRoute.Sitemap = [];
  try {
    const res = await query(
      "SELECT slug, updated_at, created_at FROM games WHERE status = 'published' ORDER BY created_at DESC"
    );
    if (res.rows && res.rows.length > 0) {
      gamePages = res.rows.map((game: any) => ({
        url: `${baseUrl}/games/${game.slug}`,
        lastModified: game.updated_at ? new Date(game.updated_at) : new Date(game.created_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.error('Failed to query games for sitemap:', err);
  }

  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const res = await query("SELECT slug FROM categories");
    if (res.rows && res.rows.length > 0) {
      categoryPages = res.rows.map((cat: any) => ({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error('Failed to query categories for sitemap:', err);
  }

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res = await query("SELECT slug, updated_at, created_at FROM blogs WHERE status = 'published' ORDER BY created_at DESC");
    if (res.rows && res.rows.length > 0) {
      blogPages = res.rows.map((blog: any) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(blog.created_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('Failed to query blogs for sitemap:', err);
  }

  return [...staticPages, ...categoryPages, ...gamePages, ...blogPages];
}
