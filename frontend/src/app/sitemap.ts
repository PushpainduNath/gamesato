import { MetadataRoute } from 'next';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';

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
    const res = await fetch(`${backendUrl}/api/games`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const games = data.games || [];
      gamePages = games.map((game: any) => ({
        url: `${baseUrl}/games/${game.slug}`,
        lastModified: game.updated_at ? new Date(game.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.error('Failed to fetch games for sitemap:', err);
  }

  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${backendUrl}/api/categories`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const categories = Array.isArray(data) ? data : data.categories || [];
      categoryPages = categories.map((cat: any) => ({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error('Failed to fetch categories for sitemap:', err);
  }

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${backendUrl}/api/blogs`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const blogs = data.blogs || [];
      blogPages = blogs.map((blog: any) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('Failed to fetch blogs for sitemap:', err);
  }

  return [...staticPages, ...categoryPages, ...gamePages, ...blogPages];
}
