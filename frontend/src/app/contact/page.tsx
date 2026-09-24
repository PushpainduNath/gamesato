import React from 'react';
import { Metadata } from 'next';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import StaticPageClientView, { CategoryItem } from '@/components/StaticPageClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Contact Us | Gamesato Support & Inquiries',
  description:
    'Get in touch with the Gamesato team for support, developer publishing inquiries, or general questions.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us | Gamesato',
    description: 'Get in touch with the Gamesato team for support and inquiries.',
    url: 'https://gamesato.com/contact',
    siteName: 'Gamesato',
    type: 'website',
  },
};

export default async function ContactPage() {
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
    console.error('Error fetching categories for contact page:', err);
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
  let pageTitle = 'Contact Us';
  let pageContent = '';
  let lastUpdated = '2026';

  try {
    const pageRes = await query(
      "SELECT title, content, updated_at, created_at FROM static_pages WHERE slug = 'contact' AND status = 'published' LIMIT 1"
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
    console.error('Error fetching contact page content:', err);
  }

  return (
    <StaticPageClientView
      slug="contact"
      pageTitle={pageTitle}
      pageSubtitle="Have a question, feedback, or developer submission? Our team is here to assist you."
      badgeText="CUSTOMER SUPPORT & INQUIRIES"
      iconType="contact"
      lastUpdated={lastUpdated}
      highlightText="Fast response guarantee: Our player support and developer relations team typically responds within 24–48 business hours."
      contentHtml={pageContent && pageContent.length > 250 ? pageContent : null}
      categories={categories}
      featuredGames={featuredGames}
      favoritesCount={favoritesCount}
    >
      <div>
        <p>
          We are always happy to hear from players, creators, and business partners. Whether you encountered a glitch, want to submit a new HTML5 game, or have business inquiries, reach out using the dedicated channels below.
        </p>
      </div>

      <div>
        <h2>Contact Departments</h2>
        <ul>
          <li>
            <strong>Player Support & Bug Reports:</strong>{' '}
            <a href="mailto:support@gamesato.com">support@gamesato.com</a>
            <br />
            <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)' }}>
              For technical gameplay issues, please include the game name, URL, and your device/browser model.
            </span>
          </li>
          <li>
            <strong>Developer Relations & Publishing:</strong>{' '}
            <a href="mailto:developers@gamesato.com">developers@gamesato.com</a>
            <br />
            <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)' }}>
              For HTML5 / WebGL game submissions, revenue sharing inquiries, and SDK integrations.
            </span>
          </li>
          <li>
            <strong>Privacy & Legal Compliance:</strong>{' '}
            <a href="mailto:privacy@gamesato.com">privacy@gamesato.com</a>
            <br />
            <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)' }}>
              For data access, GDPR/CCPA requests, or copyright and DMCA matters.
            </span>
          </li>
        </ul>
      </div>
    </StaticPageClientView>
  );
}
