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
      images: [
        {
          url: 'https://gamesato.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Gamesato Terms of Service',
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
        name: 'Terms of Service',
        item: 'https://gamesato.com/terms',
      },
    ],
  };

  const termsPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Gamesato Terms of Service',
    description:
      'Review the official Terms of Service and user agreement for playing free instant web games on Gamesato.',
    url: 'https://gamesato.com/terms',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsPageSchema) }}
      />
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
          Welcome to <strong>Gamesato</strong>. By accessing, browsing, or playing games on{' '}
          <a href="https://gamesato.com">https://gamesato.com</a> (the &quot;Website&quot;, &quot;Platform&quot;, &quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (the &quot;Terms&quot;), together with our <a href="/privacy">Privacy Policy</a>.
        </p>
        <p>
          Gamesato reserves the right to update and modify these Terms at any time without prior notice. Continued use of the Service following any modifications signifies your binding acceptance of the updated terms. If you do not agree with any part of these Terms, you must immediately discontinue use of the Website.
        </p>
      </div>

      <div>
        <h2>1. Eligibility &amp; Age Requirements</h2>
        <p>
          You warrant that you are at least 18 years of age or legally capable of entering into binding contracts. If you are under 18 years of age (and at least 13 years old), you warrant that you have obtained verifiable consent from a parent or legal guardian who agrees to be bound by these Terms on your behalf. Children under the age of 13 may not create registered user accounts.
        </p>
      </div>

      <div>
        <h2>2. Permitted Use &amp; Fair Play License</h2>
        <p>
          Gamesato grants you a limited, non-exclusive, revocable, and non-transferable license to access, view, and play free online games strictly for personal, non-commercial entertainment purposes. You may not duplicate, copy, reverse engineer, redistribute, resell, or exploit any portion of the Website, game packages, assets, or software code.
        </p>
      </div>

      <div>
        <h2>3. Prohibited Conduct &amp; Google Publisher Policy Compliance</h2>
        <p>
          To maintain a safe, legal, and family-friendly gaming ecosystem aligned with Google AdSense Publisher Policies and international digital standards, all users and content contributors must strictly adhere to the following prohibitions:
        </p>

        <h3>A. Illegal Content Violation</h3>
        <p>
          We strictly prohibit content or actions that are unlawful, promote illegal conduct, or infringe on the legal rights of others. This includes selling or distributing counterfeit goods, using infringing trademarks or logos, or attempting to pass off unauthorized materials as genuine brand products.
        </p>

        <h3>B. Dangerous or Derogatory Content Violation</h3>
        <p>
          We strictly forbid any content that incites hatred against, promotes discrimination of, or disparages individuals or groups based on race, ethnic origin, religion, disability, age, nationality, sexual orientation, gender, or gender identity. Furthermore, harassment, intimidation, bullying, extortion, threats of physical or mental harm, or circulating medical and health misinformation are strictly banned.
        </p>

        <h3>C. Enabling Dishonest Behaviour Violation</h3>
        <p>
          Users may not promote or engage in hacking, cracking, reverse-engineering, game tampering, exploiting cheat engines, or unauthorized access to servers, accounts, or databases. The use of spyware, surreptitious surveillance tools, scrapers, automated click-bots, or illegal tracking utilities is strictly prohibited.
        </p>

        <h3>D. Misrepresentative &amp; Deceptive Content Violation</h3>
        <p>
          The Platform prohibits content that misrepresents, conceals, or misleads users regarding its primary nature or purpose. Phishing, deceptive claims, manipulated media, spoofing affiliations, or falsely implying partnerships or endorsements by Gamesato or third-party entities is strictly forbidden.
        </p>

        <h3>E. Malicious or Unwanted Software Violation</h3>
        <p>
          Uploading, embedding, or transmitting any malicious software, viruses, trojans, worms, keyloggers, adware, or destructive scripts designed to compromise devices, networks, or user data will lead to immediate permanent ban and potential legal prosecution.
        </p>

        <h3>F. Sexually Explicit &amp; Child Safety Violation</h3>
        <p>
          Gamesato enforces a strict ZERO-TOLERANCE policy against sexually explicit text, images, video, audio, adult themes, or sexual compensation schemes. Content that endangers, sexually exploits, or abuses children in any form will be immediately reported to law enforcement agencies and national authorities.
        </p>
      </div>

      <div>
        <h2>4. Intellectual Property Rights &amp; DMCA Takedown Notice</h2>
        <p>
          All proprietary source code, algorithms, visual design elements, trademarks, logos, illustrations, audio, and graphics comprising Gamesato are the exclusive intellectual property of Gamesato and protected under copyright laws.
        </p>
        <p>
          Individual games showcased on Gamesato remain the intellectual property of their respective creators, indie developers, or licensed gaming syndication partners. Gamesato distributes these titles under valid developer agreements or authorized open distribution syndication.
        </p>
        <p>
          <strong>Copyright Infringement &amp; DMCA:</strong> If you are a copyright owner or authorized agent and believe that any content hosted on Gamesato infringes your rights, please submit a formal DMCA notification to <a href="mailto:support@gamesato.com">support@gamesato.com</a> including:
        </p>
        <ul>
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>The exact URL of the allegedly infringing game or asset on Gamesato.</li>
          <li>Your contact information (name, address, email, and telephone number).</li>
          <li>A statement of good faith belief and statement made under penalty of perjury that the information is accurate.</li>
        </ul>
        <p>We investigate and process all verified copyright claims within 24 to 48 hours.</p>
      </div>

      <div>
        <h2>5. Third-Party Advertisements &amp; Cookie Guidelines</h2>
        <p>
          Gamesato permits certified third-party advertising partners, including Google AdSense, to display advertisements across our pages. These advertising vendors may use cookies, web beacons, and device identifiers to measure ad campaign effectiveness and serve contextually relevant ads.
        </p>
        <p>
          Please refer to the following official Google guidelines for complete policy transparency:
        </p>
        <ul>
          <li>
            <a href="https://support.google.com/adsense/answer/48182" target="_blank" rel="noopener noreferrer">
              Google AdSense Program &amp; Publisher Policies
            </a>
          </li>
          <li>
            <a href="https://support.google.com/adsense/answer/10502938" target="_blank" rel="noopener noreferrer">
              Google Webmaster Quality Guidelines &amp; Policies
            </a>
          </li>
        </ul>
        <p>
          If you encounter an inappropriate or broken advertisement on Gamesato, please notify our team at <a href="mailto:support@gamesato.com">support@gamesato.com</a>.
        </p>
      </div>

      <div>
        <h2>6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Gamesato excludes all warranties, whether statutory, express, or implied. Gamesato and its operators shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your use of or inability to access the Platform, loss of data, unauthorized server intrusion, or third-party service interruptions.
        </p>
      </div>

      <div>
        <h2>7. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless Gamesato, its directors, officers, employees, and licensors against any claims, liabilities, damages, losses, or legal costs arising out of your access to the Service, breach of these Terms, or violation of any third-party rights.
        </p>
      </div>

      <div>
        <h2>8. Governing Law &amp; Jurisdiction</h2>
        <p>
          These Terms and Conditions shall be governed by and construed in accordance with the laws of New Delhi, India. You agree that any legal dispute or proceeding arising out of or related to Gamesato shall be subject to the exclusive jurisdiction of the competent courts located in New Delhi, India.
        </p>
      </div>
    </StaticPageClientView>
    </>
  );
}
