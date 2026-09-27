import React from 'react';
import { Metadata } from 'next';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import StaticPageClientView, { CategoryItem } from '@/components/StaticPageClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  let title = 'Privacy Policy | Gamesato';
  let description =
    'Read Gamesato’s official Privacy Policy. Understand how we collect, safeguard, and respect your personal information while you enjoy free web games.';

  try {
    const res = await query(
      "SELECT meta_title, meta_description, meta_tags FROM static_pages WHERE slug = 'privacy' AND status = 'published' LIMIT 1"
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      if (row.meta_title) title = row.meta_title;
      if (row.meta_description) description = row.meta_description;
    }
  } catch (err) {
    console.error('Error fetching privacy metadata:', err);
  }

  return {
    title,
    description,
    alternates: {
      canonical: '/privacy',
    },
    openGraph: {
      title,
      description,
      url: 'https://gamesato.com/privacy',
      siteName: 'Gamesato',
      type: 'website',
      images: [
        {
          url: 'https://gamesato.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Gamesato Privacy Policy',
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

export default async function PrivacyPage() {
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
    console.error('Error fetching categories for privacy page:', err);
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
  let pageTitle = 'Privacy Policy';
  let pageContent = '';
  let lastUpdated = '2026';

  try {
    const pageRes = await query(
      "SELECT title, content, updated_at, created_at FROM static_pages WHERE slug = 'privacy' AND status = 'published' LIMIT 1"
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
    console.error('Error fetching privacy page content:', err);
  }

  // JSON-LD Schemas: BreadcrumbList + WebPage
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
        name: 'Privacy Policy',
        item: 'https://gamesato.com/privacy',
      },
    ],
  };

  const privacyPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Gamesato Privacy Policy',
    description:
      'Understand how Gamesato collects, safeguards, and respects your personal information while you enjoy free web games.',
    url: 'https://gamesato.com/privacy',
    publisher: {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyPageSchema) }}
      />
      <StaticPageClientView
      slug="privacy"
      pageTitle={pageTitle}
      pageSubtitle="Transparent, secure, and privacy-first. Learn how Gamesato protects your personal data, browser privacy, and online security."
      badgeText="PRIVACY & DATA PROTECTION"
      iconType="privacy"
      lastUpdated={lastUpdated}
      highlightText="Your privacy is non-negotiable: Gamesato never sells, leases, or trades your personal information to third parties. All account passwords use industry-standard bcrypt hashing, and guest gameplay requires zero personal details."
      contentHtml={pageContent && pageContent.length > 300 ? pageContent : null}
      categories={categories}
      featuredGames={featuredGames}
      favoritesCount={favoritesCount}
    >
      <div>
        <p>
          At <strong>Gamesato</strong> (accessible from <a href="https://gamesato.com">https://gamesato.com</a>, operated by <strong><a href="https://zhoop.in/" target="_blank" rel="noopener noreferrer">Zhoop InfoTech</a></strong>), one of our main priorities is the privacy of our visitors. This Privacy Policy document describes the types of information that is collected and recorded by Gamesato and how we use it.
        </p>
        <p>
          By using our website, you hereby consent to our Privacy Policy and agree to its terms.
        </p>
      </div>

      <div>
        <h2>1. Information We Collect</h2>
        <p>
          We design our platform so you can play thousands of games without ever creating an account or sharing personal identity details:
        </p>
        <ul>
          <li>
            <strong>Guest Gameplay (No Account):</strong> If you play as a guest, we do not ask for your name, email, or telephone number. We store game favorites and playtime history locally inside your browser’s LocalStorage.
          </li>
          <li>
            <strong>Registered Accounts:</strong> If you choose to register an account, we securely collect your email address and chosen username to synchronize your saved favorites and game achievements across multiple devices.
          </li>
          <li>
            <strong>Technical Log Data:</strong> Like most modern web platforms, our servers automatically log non-identifying technical metadata (browser type, operating system, timestamp, and referring URL) for security monitoring, error diagnostics, and bandwidth optimization.
          </li>
        </ul>
      </div>

      <div>
        <h2>2. How We Use Your Information</h2>
        <p>We use the minimal information we collect exclusively to:</p>
        <ul>
          <li>Deliver, operate, and maintain the Gamesato web platform.</li>
          <li>Improve website responsiveness, load speeds, and game performance.</li>
          <li>Synchronize your favorited games, ratings, and play history across your sessions.</li>
          <li>Detect and prevent fraudulent activities, automated bot abuse, and security vulnerabilities.</li>
          <li>Communicate essential account updates or support responses when requested by you.</li>
        </ul>
      </div>

      <div>
        <h2>3. Cookies, Log Files &amp; Advertising Technologies</h2>
        <p>
          Gamesato uses standard browser cookies, web beacons, and lightweight LocalStorage to optimize platform security, remember your gameplay preferences, and provide personalized services.
        </p>

        <h3>Types of Cookies We Use</h3>
        <ul>
          <li>
            <strong>Session Cookies:</strong> Temporary cookies that remain active only while your browser tab is open. Once you close your browser or navigate away, session cookies are automatically destroyed. These help track session state, transient UI interactions, and security tokens.
          </li>
          <li>
            <strong>Permanent / Persistent Cookies:</strong> Stored on your device with an expiration timestamp. These cookies recognize your browser when you return, automatically preserving your Dark/Light theme, audio preferences, and saved game progress.
          </li>
        </ul>

        <h3>Server Log Files &amp; IP Addresses</h3>
        <p>
          Like all standard web servers, Gamesato maintains non-identifying server log files. These record browser types, operating systems (Windows, macOS, Android, iOS), Internet Service Providers (ISPs), date/time stamps, referring/exit pages, and click paths. This diagnostic data is utilized strictly for system administration, threat mitigation, DDOS prevention, and bandwidth optimization. IP addresses are never linked to personally identifiable information.
        </p>

        <h3>Google AdSense &amp; DoubleClick DART Cookies</h3>
        <p>
          Google is a certified third-party advertising vendor on Gamesato. Google uses cookies, including the <strong>DoubleClick DART cookie</strong>, to serve advertisements to users based on their prior visits to Gamesato and other websites across the Internet.
        </p>
        <ul>
          <li>
            Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to Gamesato and/or other sites on the Internet.
          </li>
          <li>
            Users may opt out of personalized advertising by visiting Google&apos;s Ads Settings at{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
              https://adssettings.google.com
            </a>.
          </li>
          <li>
            Alternatively, users can opt out of third-party vendor cookies for personalized advertising by visiting the Network Advertising Initiative or{' '}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
              www.aboutads.info
            </a>.
          </li>
          <li>
            For more details on cookie management across different browsers, you can visit{' '}
            <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">
              www.allaboutcookies.org
            </a>.
          </li>
        </ul>

        <h3>Third-Party Advertising Standards &amp; Inappropriate Ad Reporting</h3>
        <p>
          Gamesato strictly complies with digital advertising guidelines. All third-party advertising networks are programmatically instructed NOT to serve violent, sexually explicit, fraudulent, gambling, or malicious ads on our platform.
        </p>
        <p>
          If you encounter an intrusive, misleading, or inappropriate advertisement on Gamesato, please report it immediately to{' '}
          <a href="mailto:support@gamesato.com">support@gamesato.com</a> with a screenshot or destination URL, and our ad operations team will review and block it within 24 hours.
        </p>
      </div>

      <div>
        <h2>4. Data Protection & Security</h2>
        <p>
          We employ robust technical safeguards to protect your personal data against unauthorized access, alteration, or disclosure. All user passwords are encrypted using one-way bcrypt cryptographic algorithms with salted hashes. All communication between your device and Gamesato takes place over secure, encrypted HTTPS protocols.
        </p>
      </div>

      <div>
        <h2>5. Children’s Privacy (COPPA & Family Safety)</h2>
        <p>
          Protecting the safety of children online is especially important to us. Gamesato does not knowingly collect personally identifiable information from children under the age of 13. If a parent or guardian believes that a child has provided us with personal information, please contact us immediately at <a href="mailto:support@gamesato.com">support@gamesato.com</a>, and we will promptly remove such information from our records.
        </p>
      </div>

      <div>
        <h2>6. GDPR & CCPA Privacy Rights</h2>
        <p>
          Depending on your jurisdiction (such as the European Economic Area or California), you have specific legal rights regarding your personal information, including:
        </p>
        <ul>
          <li><strong>Right to Access:</strong> You may request copies of any personal data we hold about you.</li>
          <li><strong>Right to Rectification:</strong> You may request correction of any inaccurate or incomplete information.</li>
          <li><strong>Right to Erasure:</strong> You can request that we permanently delete your account and associated personal data at any time via your Profile Settings.</li>
          <li><strong>Right to Non-Discrimination:</strong> We will never discriminate against you for exercising any of your privacy rights.</li>
        </ul>
      </div>
    </StaticPageClientView>
    </>
  );
}
