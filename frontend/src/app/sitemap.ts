import { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let gameUrls: MetadataRoute.Sitemap = [];
  try {
    const res = await query(
      "SELECT slug, updated_at FROM games WHERE status = 'published' ORDER BY updated_at DESC"
    );
    gameUrls = res.rows.map((game) => ({
      url: `${baseUrl}/games/${game.slug}`,
      lastModified: new Date(game.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (err) {
    console.error('Failed to generate sitemap games entries:', err);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...gameUrls,
  ];
}
