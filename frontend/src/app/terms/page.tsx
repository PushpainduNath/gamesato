import React from 'react';
import { Metadata } from 'next';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import StaticPageClientView, { CategoryItem } from '@/components/StaticPageClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  let title = 'Terms of Service | Gamesato';
  let description =
    'Review the official Terms of Service and user agreement for playing free instant web games on Gamesato.';

  try {
    const res = await query(
      "SELECT meta_title, meta_description, meta_tags FROM static_pages WHERE slug = 'terms' AND status = 'published' LIMIT 1"
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      if (row.meta_title) title = row.meta_title;
      if (row.meta_description) description = row.meta_description;
    }
  } catch (err) {
    console.error('Error fetching terms metadata:', err);
  }

  return {
    title,
    description,
    alternates: {
      canonical: '/terms',
    },
    openGraph: {
      title,
      description,
      url: 'https://gamesato.com/terms',
      siteName: 'Gamesato',
      type: 'website',
    },
  };
}

export default async function TermsPage() {
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
    console.error('Error fetching categories for terms page:', err);
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
  let pageTitle = 'Terms of Service';
  let pageContent = '';
  let lastUpdated = '2026';

  try {
    const pageRes = await query(
      "SELECT title, content, updated_at, created_at FROM static_pages WHERE slug = 'terms' AND status = 'published' LIMIT 1"
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
    console.error('Error fetching terms page content:', err);
  }

  return (
    <StaticPageClientView
      slug="terms"
      pageTitle={pageTitle}
      pageSubtitle="Please read these terms and conditions carefully before accessing or using the Gamesato instant gaming platform."
      badgeText="USER AGREEMENT"
      iconType="terms"
      lastUpdated={lastUpdated}
      highlightText="Fair Play & Community Guidelines: By accessing Gamesato, you agree to use our website responsibly for personal, non-commercial entertainment, and to respect intellectual property and platform integrity."
      contentHtml={pageContent && pageContent.length > 300 ? pageContent : null}
      categories={categories}
      featuredGames={featuredGames}
      favoritesCount={favoritesCount}
    >
      <div>
        <p>
          Welcome to <strong>Gamesato</strong>. By accessing, browsing, or playing games on <a href="https://gamesato.com">https://gamesato.com</a> (the &quot;Website&quot; or &quot;Platform&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (the &quot;Terms&quot;), together with our <a href="/privacy">Privacy Policy</a>.
        </p>
        <p>
          If you do not agree with any part of these Terms, you must discontinue use of the Website immediately.
        </p>
      </div>

      <div>
        <h2>1. Eligibility & Age Requirements</h2>
        <p>
          The Platform is intended for general audiences. By using Gamesato, you represent and warrant that you are at least 13 years of age (or the minimum legal age of digital consent in your jurisdiction), or that you are accessing the Platform under the direct supervision of a parent or legal guardian who agrees to be bound by these Terms.
        </p>
      </div>

      <div>
        <h2>2. Permitted Use of the Platform</h2>
        <p>
          Gamesato grants you a limited, revocable, non-exclusive, non-transferable license to access and play web games solely for your personal, non-commercial entertainment purposes.
        </p>
        <p>
          You agree not to reproduce, duplicate, distribute, sell, or exploit any portion of the Website, its underlying codebase, game packages, or branding without prior express written permission from Gamesato.
        </p>
      </div>

      <div>
        <h2>3. Prohibited Activities</h2>
        <p>When using Gamesato, you strictly agree NOT to:</p>
        <ul>
          <li>Use automated scripts, bots, spiders, or scrapers to extract games, assets, or data from the Platform.</li>
          <li>Circumvent, disable, or tamper with security features, anti-cheat mechanisms, or content distribution networks.</li>
          <li>Attempt to gain unauthorized access to our database, user accounts, servers, or networks.</li>
          <li>Engage in denial-of-service (DoS) attacks or any activity that imposes an unreasonable burden on our infrastructure.</li>
          <li>Upload or transmit malicious code, viruses, or disruptive malware.</li>
        </ul>
      </div>

      <div>
        <h2>4. Intellectual Property Rights</h2>
        <p>
          All trademarks, logos, UI designs, icons, graphics, animations, and proprietary software comprising Gamesato are the exclusive property of Gamesato.
        </p>
        <p>
          Individual HTML5 and WebGL games featured on the Platform are protected by copyright and intellectual property laws and belong to their respective developers, publishers, or licensors. Gamesato distributes these games under valid publishing, syndication, or open-distribution licenses.
        </p>
      </div>

      <div>
        <h2>5. User Accounts & Passwords</h2>
        <p>
          If you register an account on Gamesato, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately at <a href="mailto:support@gamesato.com">support@gamesato.com</a> if you suspect any unauthorized access to your account.
        </p>
        <p>
          Gamesato reserves the right to suspend or terminate accounts that violate these Terms or engage in abusive behavior.
        </p>
      </div>

      <div>
        <h2>6. Disclaimer of Warranties & Limitation of Liability</h2>
        <p>
          Gamesato and all games, features, and content are provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis without warranties of any kind, either express or implied.
        </p>
        <p>
          To the fullest extent permitted by applicable law, Gamesato and its affiliates shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use or inability to use the Platform, including loss of gameplay progress, data loss, or service interruptions.
        </p>
      </div>

      <div>
        <h2>7. Changes to These Terms</h2>
        <p>
          We may update or modify these Terms from time to time to reflect changes in our legal obligations, platform features, or operational practices. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision. Your continued use of the Platform after changes are posted constitutes your acceptance of the updated Terms.
        </p>
      </div>
    </StaticPageClientView>
  );
}
