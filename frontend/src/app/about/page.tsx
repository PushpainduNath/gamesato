import React from 'react';
import { Metadata } from 'next';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import StaticPageClientView, { CategoryItem } from '@/components/StaticPageClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  let title = 'About Us | Gamesato - Play Free Online Web Games';
  let description =
    'Learn about Gamesato, our mission, and our next-generation web gaming platform delivering instant, free HTML5 games across all devices.';

  try {
    const res = await query(
      "SELECT meta_title, meta_description, meta_tags FROM static_pages WHERE slug = 'about' AND status = 'published' LIMIT 1"
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      if (row.meta_title) title = row.meta_title;
      if (row.meta_description) description = row.meta_description;
    }
  } catch (err) {
    console.error('Error fetching about metadata:', err);
  }

  return {
    title,
    description,
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title,
      description,
      url: 'https://gamesato.com/about',
      siteName: 'Gamesato',
      type: 'website',
      images: [
        {
          url: 'https://gamesato.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'About Gamesato',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://gamesato.com/og-image.png'],
    },
  };
}

export default async function AboutPage() {
  const session = await getServerSession(authOptions);

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
    console.error('Error fetching categories for about page:', err);
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

  // 4. Fetch page content from static_pages table
  let pageTitle = 'About Gamesato';
  let pageContent = '';
  let lastUpdated = '2026';

  try {
    const pageRes = await query(
      "SELECT title, content, updated_at, created_at FROM static_pages WHERE slug = 'about' AND status = 'published' LIMIT 1"
    );
    if (pageRes.rows.length > 0) {
      const row = pageRes.rows[0];
      if (row.title) pageTitle = row.title;
      pageContent = row.content || '';
      const dateObj = new Date(row.updated_at || row.created_at || Date.now());
      lastUpdated = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } catch (err) {
    console.error('Error fetching about page content:', err);
  }

  // JSON-LD Schemas: BreadcrumbList + AboutPage
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
        name: 'About Us',
        item: 'https://gamesato.com/about',
      },
    ],
  };

  const aboutPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Gamesato',
    description:
      'Learn about Gamesato, our mission, and our next-generation web gaming platform delivering instant, free HTML5 games across all devices.',
    url: 'https://gamesato.com/about',
    mainEntity: {
      '@type': 'Organization',
      name: 'Gamesato',
      url: 'https://gamesato.com',
      logo: 'https://gamesato.com/logo.png',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <StaticPageClientView
      slug="about"
      pageTitle={pageTitle}
      pageSubtitle="The next generation of instant web gaming — play thousands of free online games instantly without downloads, installs, or delays."
      badgeText="ABOUT GAMESATO"
      iconType="about"
      lastUpdated={lastUpdated}
      highlightText="Zero-friction web gaming: Gamesato runs on optimized cloud delivery pipelines, bringing console-grade HTML5 and WebGL gaming directly into your browser across mobile, tablet, and desktop."
      contentHtml={pageContent && pageContent.length > 300 ? pageContent : null}
      categories={categories}
      featuredGames={featuredGames}
      favoritesCount={favoritesCount}
    >
      <div>
        <p>
          Welcome to <strong>Gamesato</strong>, your premier destination for high-performance, instant-play web games. Founded by passionate gamers and web engineers, our goal is to eliminate all barriers between discovering a game and actually playing it.
        </p>
      </div>

      <div>
        <h2>Our Core Vision & Mission</h2>
        <p>
          We believe that great games shouldn't be locked behind heavy app stores, lengthy downloads, or proprietary hardware. By leveraging cutting-edge HTML5, WebGL 2.0, and WebAssembly technologies, Gamesato delivers responsive 60 FPS gaming experiences right in your browser with zero friction.
        </p>
        <p>
          Whether you have five minutes to spare on a subway commute with your smartphone or want to immerse yourself in an adventure game on a desktop computer, Gamesato provides immediate entertainment without storage footprint.
        </p>
      </div>

      <div>
        <h2>What Makes Gamesato Different?</h2>
        <ul>
          <li>
            <strong>100% Free & Instant:</strong> No subscriptions, no hidden paywalls, and no download requirements. Simply click any title and play immediately.
          </li>
          <li>
            <strong>Universal Cross-Platform Play:</strong> Our game engine and interface automatically optimize for touch controls on mobile devices (iOS & Android) and keyboard/mouse precision on desktop PCs.
          </li>
          <li>
            <strong>Curated Quality:</strong> We review and test games across dozens of categories—Action, Racing, Sports, Puzzle, Arcade, and Logic—to ensure smooth performance and engaging gameplay.
          </li>
          <li>
            <strong>Safe & Family-Friendly:</strong> All games run within isolated, secure browser sandboxes with no invasive software installations.
          </li>
          <li>
            <strong>Cloud Progress & Favorites:</strong> Save your favorite titles, track your play history, and pick up right where you left off across sessions.
          </li>
        </ul>
      </div>

      <div>
        <h2>For Game Developers & Publishers</h2>
        <p>
          Gamesato is also a thriving launchpad for independent creators and international game studios. We offer game developers a high-traffic distribution network, seamless game integration pipelines, real-time telemetry metrics, and transparent monetization models.
        </p>
        <p>
          If you are interested in publishing your HTML5 or WebGL game on Gamesato, please reach out to our developer relations team through our <a href="/contact">Contact Portal</a>.
        </p>
      </div>
    </StaticPageClientView>
    </>
  );
}
