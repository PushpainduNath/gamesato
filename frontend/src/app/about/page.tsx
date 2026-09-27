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
          Welcome to <strong>Gamesato</strong> (<a href="https://gamesato.com">https://gamesato.com</a>), your premier global destination for high-quality, instant-play browser games. Founded by passionate gamers and web engineers, our mission is to deliver fast, responsive, and captivating gaming experiences right inside your web browser — completely free, with no downloads, installations, or hardware barriers.
        </p>
      </div>

      <div>
        <h2>Your Ultimate Web Gaming Destination</h2>
        <p>
          We believe that gaming should be universally accessible to everyone, everywhere. Whether you have five minutes to unwind on your daily commute or want to dive into deep multiplayer sessions on a desktop computer, Gamesato delivers seamless 60 FPS gameplay powered by modern HTML5, WebGL 2.0, and WebAssembly technologies.
        </p>
      </div>

      <div>
        <h2>Our Diverse Game Library</h2>
        <p>
          Gamesato curates thousands of handpicked games spanning every popular genre and play style:
        </p>
        <ul>
          <li><strong>Action &amp; Adventure:</strong> Fast-paced hero shooters, dungeon crawlers, obstacle runs, and epic survival adventures.</li>
          <li><strong>Puzzle &amp; Strategy:</strong> Physics-based puzzles, Match-3 classics, 2048 variations, block matching, and tactical challenges.</li>
          <li><strong>Arcade &amp; Classics:</strong> Retro pixel action, bubble shooters, pinball mechanics, and nostalgic arcade remakes.</li>
          <li><strong>Sports &amp; Racing:</strong> High-octane highway drifting, off-road rallying, football shootout tournaments, and basketball duels.</li>
          <li><strong>2-Player &amp; Co-op:</strong> Head-to-head split-screen battles and collaborative puzzles to enjoy with friends on the same device.</li>
          <li><strong>Casual &amp; Brain Games:</strong> Relaxing solitaire, tower-stacking, word puzzles, and cognitive brain teasers.</li>
        </ul>
        <p>
          Our editorial team rigorously tests every title to ensure clean graphics, intuitive controls, and balanced difficulty before publishing.
        </p>
      </div>

      <div>
        <h2>Key Platform Features</h2>
        <ul>
          <li>✓ <strong>Instant Browser Play:</strong> No app store downloads, APK installations, or storage bloat. Click and play in milliseconds.</li>
          <li>✓ <strong>Universal Cross-Device Compatibility:</strong> Seamlessly optimized for touchscreens on iOS and Android phones/tablets, and keyboard/mouse precision on desktop PCs.</li>
          <li>✓ <strong>Cloud Favorites &amp; Play History:</strong> Bookmark favorite games, track recent play sessions, and pick up right where you left off.</li>
          <li>✓ <strong>Guest Mode by Default:</strong> Enjoy instant access to the entire game catalog without mandatory account registration.</li>
          <li>✓ <strong>Safe &amp; Family-Friendly:</strong> All games execute in isolated browser sandboxes with zero invasive software requirements and strict ad standards.</li>
          <li>✓ <strong>Continuous Updates:</strong> Fresh trending games and indie releases added on a regular weekly basis.</li>
        </ul>
      </div>

      <div>
        <h2>Our Story &amp; Vision</h2>
        <p>
          Gamesato was born from a simple belief: the web is the ultimate open gaming platform. High-speed fiber and mobile 5G have transformed browsers into powerful gaming environments capable of rendering console-grade 3D graphics without heavy client downloads.
        </p>
        <p>
          Our engineering team focuses on extreme performance optimization, ultra-low latency assets, and lightweight user interfaces. We are dedicated to providing a joyful, safe, and engaging sanctuary for players of all ages across the globe.
        </p>
      </div>

      <div>
        <h2>For Game Developers &amp; Studios</h2>
        <p>
          Gamesato is also a vibrant launchpad for independent developers and game development studios worldwide. We provide creators with developer-centric tools to upload ZIP game packages, monitor analytics, evaluate real-time play counts, and monetize games transparently.
        </p>
        <p>
          If you are an indie game developer or studio looking to reach millions of active players, please submit your game through our <a href="/contact">Developer Portal</a> or email us at <a href="mailto:support@gamesato.com">support@gamesato.com</a>.
        </p>
      </div>
    </StaticPageClientView>
    </>
  );
}
