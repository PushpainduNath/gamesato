import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import { Play, Heart, ChevronDown } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import CategoryBar from '@/components/CategoryBar';
import CategoryCarousel from '@/components/CategoryCarousel';
import { formatCompactNumber } from '@/lib/utils';
import Translate from '@/components/Translate';
import styles from './page.module.css';

// Type definitions
interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnail_url: string;
  game_url: string;
  play_count: number;
  likes_count: number;
  featured_desktop_url?: string | null;
  featured_mobile_url?: string | null;
  new_game_both_url?: string | null;
  game_page_both_url?: string | null;
}

// Categories list
const CATEGORIES = [
  'All',
  'New',
  'Popular',
  'Racing',
  'Action',
  'Sport',
  'Arcade',
  'Logic',
  'Number',
  'Adventure',
];

export const dynamic = 'force-dynamic'; // Ensure Server-Side Rendering (SSR) on every request
export const revalidate = 0; // Disable caching on homepage

export default async function HomePage(props: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const activeCategory = searchParams.category || 'All';
  const searchQuery = searchParams.search || '';

  // Fetch home content and FAQ content from DB directly
  const homeContentRes = await query("SELECT content FROM static_pages WHERE slug = 'home' AND status = 'published'");
  const homeContent = homeContentRes.rows[0]?.content || '';

  const faqContentRes = await query("SELECT content FROM static_pages WHERE slug = 'faq' AND status = 'published'");
  const faqContentRaw = faqContentRes.rows[0]?.content || '[]';
  let faqList = [];
  try {
    faqList = JSON.parse(faqContentRaw);
  } catch (e) {
    faqList = [];
  }

  // Fetch session to retrieve user's liked games for the Favorites section
  const session = await getServerSession(authOptions);
  let favoriteGames: Game[] = [];

  if (session?.user?.id) {
    try {
      const favRes = await query(
        `SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.play_count,
                (SELECT COUNT(*)::int FROM likes WHERE "gameId" = g.id) as likes_count
         FROM games g
         JOIN likes l ON g.id = l."gameId"
         WHERE l."userId" = $1 AND g.status = 'published'
         ORDER BY l.created_at DESC`,
        [session.user.id]
      );
      favoriteGames = favRes.rows;
    } catch (err) {
      console.error('Failed to query user favorites in homepage:', err);
    }
  }

  // 1. Fetch Games from PostgreSQL based on search query (without activeCategory filtering in SQL)
  let gamesQuery = `
    SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count, g.new_game_both_url,
           COUNT(l."userId")::int as likes_count
    FROM games g
    LEFT JOIN likes l ON g.id = l."gameId"
    WHERE g.status = 'published'
  `;
  const queryParams: any[] = [];

  if (searchQuery) {
    gamesQuery += ` AND (g.title ILIKE $${queryParams.length + 1} OR g.description ILIKE $${queryParams.length + 1})`;
    queryParams.push(`%${searchQuery}%`);
  }

  gamesQuery += ' GROUP BY g.id ORDER BY g.created_at DESC';

  let games: Game[] = [];
  try {
    const res = await query(gamesQuery, queryParams);
    games = res.rows;
  } catch (err) {
    console.error('Failed to query games from database:', err);
  }

  // Fetch Category slug mappings for VIEW ALL links redirection
  let categorySlugs: Record<string, string> = {
    new: 'new',
    popular: 'popular'
  };
  try {
    const catRes = await query('SELECT name, slug FROM categories');
    catRes.rows.forEach((row: { name: string; slug: string }) => {
      categorySlugs[row.name.toLowerCase()] = row.slug;
    });
  } catch (err) {
    console.error('Failed to fetch categories for slug mapping:', err);
  }

  // 1.2 Group games by category and filter empty categories
  const gamesByCategory: { [key: string]: Game[] } = {};
  const dbCategoriesSet = new Set<string>();

  games.forEach((game) => {
    dbCategoriesSet.add(game.category);
    if (!gamesByCategory[game.category]) {
      gamesByCategory[game.category] = [];
    }
    gamesByCategory[game.category].push(game);
  });

  // Create virtual "New" category using the latest 10 games based on created_at (creation time)
  const newGames = games.slice(0, 10);
  if (newGames.length > 0) {
    gamesByCategory['New'] = newGames;
  }

  // Create virtual "Popular" category using top 10 games by play_count
  const popularGames = [...games].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 10);
  if (popularGames.length > 0) {
    gamesByCategory['Popular'] = popularGames;
  }

  // Create virtual "Favorites" category if the user has liked games
  if (favoriteGames.length > 0) {
    gamesByCategory['Favorites'] = favoriteGames;
  }

  const dbCategories = Array.from(dbCategoriesSet);

  // Filter category switcher buttons: show 'All', 'New', 'Popular', 'Favorites', and other categories
  const activeCategoriesWithGames = ['All'];

  if (gamesByCategory['New'] && gamesByCategory['New'].length > 0) {
    activeCategoriesWithGames.push('New');
  }

  if (gamesByCategory['Popular'] && gamesByCategory['Popular'].length > 0) {
    activeCategoriesWithGames.push('Popular');
  }

  if (gamesByCategory['Favorites'] && gamesByCategory['Favorites'].length > 0) {
    activeCategoriesWithGames.push('Favorites');
  }

  CATEGORIES.forEach((cat) => {
    if (cat !== 'All' && cat !== 'New' && cat !== 'Popular' && cat !== 'Favorites' && gamesByCategory[cat] && gamesByCategory[cat].length > 0) {
      activeCategoriesWithGames.push(cat);
    }
  });

  dbCategories.forEach((cat) => {
    if (!CATEGORIES.includes(cat) && cat !== 'New' && cat !== 'Popular' && cat !== 'Favorites' && gamesByCategory[cat] && gamesByCategory[cat].length > 0) {
      activeCategoriesWithGames.push(cat);
    }
  });

  // Always render all non-empty category sections on the homepage to support scroll navigation
  const categoriesToRender = activeCategoriesWithGames.filter(cat => cat !== 'All');

  const hasGamesToRender = categoriesToRender.some(cat => gamesByCategory[cat] && gamesByCategory[cat].length > 0);

  // 1.5 Fetch 5 Featured Games
  let featuredGames: Game[] = [];
  try {
    const featuredRes = await query(
      `SELECT g.id, g.title, g.slug, g.description, g.category, g.thumbnail_url, g.game_url, g.play_count,
              g.featured_desktop_url, g.featured_mobile_url, g.new_game_both_url, g.game_page_both_url,
              COUNT(l."userId")::int as likes_count
       FROM games g
       LEFT JOIN likes l ON g.id = l."gameId"
       WHERE g.status = 'published' AND g.is_featured = TRUE
       GROUP BY g.id
       ORDER BY g.updated_at DESC
       LIMIT 5`
    );
    featuredGames = featuredRes.rows;
  } catch (err) {
    console.error('Failed to query featured games from database:', err);
  }
  return (
    <div className="pageWrapper">
      <div className={styles.container}>
        {/* Featured Games Section */}
      {featuredGames.length > 0 && (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Translate textKey="featuredGames" fallback="Featured Games" />
            </h2>
          </div>
          
          <FeaturedCarousel featuredSlots={featuredGames} />
        </section>
      )}

      {/* Category Navigation */}
      <section id="explore" className={styles.gamesSection}>
        <div className={`${styles.sectionHeader} ${styles.exploreHeader}`}>
          <h2 className={styles.sectionTitle}>
            <Translate textKey="exploreGames" fallback="Explore Games" />
          </h2>
        </div>

        <CategoryBar categories={activeCategoriesWithGames} />

        {/* Category Sections */}
        {hasGamesToRender ? (
          categoriesToRender.map((catName) => {
            const catGames = (gamesByCategory[catName] || []).slice(0, 8);
            return (
              <CategoryCarousel
                key={catName}
                catName={catName}
                catGames={catGames}
                categorySlugs={categorySlugs}
                backendUrl={process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022'}
              />
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyStateTitle}>No Games Found</h3>
            <p>Check back later or explore other gaming categories above!</p>
          </div>
        )}
      </section> {/* Close gamesSection (explore) */}
    </div> {/* Close container */}

      {/* Bottom Content Wrapper (with blue background) */}
      <div className={styles.bottomSectionWrapper}>
        <div className={styles.bottomSectionContainer}>
          {/* SEO Section */}
          {/* SEO Section */}
          {homeContent ? (
            <section className={`${styles.seoSection} glass`}>
              <div dangerouslySetInnerHTML={{ __html: homeContent }} />
            </section>
          ) : (
            <section className={`${styles.seoSection} glass`}>
              <h2 className={styles.seoTitle}>
                <Translate textKey="seoTitle" fallback="Game Bite: Your Instant Gaming Hub" />
              </h2>
              <p className={styles.seoText}>
                <Translate textKey="seoText1" fallback="Experience the next generation of web-based gaming with GameBite. We provide a curated selection of high-quality, free-to-play games run directly in your browser without any downloads or installations. Our platform is designed for clarity, allowing you to jump straight into the action across various genres." />
              </p>
              
              <h3 className={styles.seoSubTitle}>
                <Translate textKey="seoWhyChooseTitle" fallback="Why Choose Game Bite?" />
              </h3>
              <ul className={styles.seoList}>
                <li><Translate textKey="seoWhyChoose1" fallback="✓ Instant access to 1000+ premium games" /></li>
                <li><Translate textKey="seoWhyChoose2" fallback="✓ No installation or downloads required" /></li>
                <li><Translate textKey="seoWhyChoose3" fallback="✓ Safe, ad-free feeling environment" /></li>
              </ul>

              <h3 className={styles.seoSubTitle}>
                <Translate textKey="seoMultiPlatformTitle" fallback="Multi-Platform Play" />
              </h3>
              <p className={styles.seoText}>
                <Translate textKey="seoMultiPlatformText" fallback="Our games are optimized for all modern web browsers, ensuring seamless cross-device synchronization of your progress when you create a free account." />
              </p>
            </section>
          )}

          {/* FAQ Section */}
          <section className={styles.faqSection}>
            <h2 className={styles.faqTitle}>
              <Translate textKey="faqTitle" fallback="Frequently Asked Questions" />
            </h2>
            <div className={styles.faqList}>
              {faqList && faqList.length > 0 ? (
                faqList.map((faq: any, idx: number) => (
                  <details key={idx} className={styles.faqItem} open={idx === 0}>
                    <summary className={styles.faqQuestion}>
                      {faq.q}
                      <ChevronDown className={styles.chevronIcon} size={16} />
                    </summary>
                    <div className={styles.faqAnswer}>
                      {faq.a}
                    </div>
                  </details>
                ))
              ) : (
                <>
                  <details className={styles.faqItem} open>
                    <summary className={styles.faqQuestion}>
                      <Translate textKey="faq1Q" fallback="What are the best free games on GameBite?" />
                      <ChevronDown className={styles.chevronIcon} size={16} />
                    </summary>
                    <div className={styles.faqAnswer}>
                      <Translate textKey="faq1A" fallback="We recommend starting with our Featured section, which currently highlights &quot;Super Cricket 2024&quot; and &quot;Nitro Velocity&quot;. Our community ratings also highly recommend &quot;Dream Artist&quot; for puzzle enthusiasts." />
                    </div>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      <Translate textKey="faq2Q" fallback="Can I play free games without installing anything?" />
                      <ChevronDown className={styles.chevronIcon} size={16} />
                    </summary>
                    <div className={styles.faqAnswer}>
                      <Translate textKey="faq2A" fallback="Yes, all games on GameBite are instant-play HTML5 games. They run directly in your web browser without requiring any downloads, installation, or configuration." />
                    </div>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      <Translate textKey="faq3Q" fallback="Do I need to register to play?" />
                      <ChevronDown className={styles.chevronIcon} size={16} />
                    </summary>
                    <div className={styles.faqAnswer}>
                      <Translate textKey="faq3A" fallback="No, registration is completely optional. You can play all games as a guest. However, creating a free account allows you to save your favorites, track play history, and customize your experience." />
                    </div>
                  </details>
                </>
              )}
            </div>
          </section>

          {/* Explicit App Purpose & Data Transparency Section for Google OAuth & SEO Compliance */}
          <section className={styles.seoIntroSection} style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary, #ffffff)' }}>
              Gamebite - Free Online H5 Web Games Portal
            </h1>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '0.75rem', color: 'var(--text-secondary, #9ca3af)' }}>
              Welcome to <strong>Gamebite</strong>, your premier destination for instant browser-based HTML5 web games. Enjoy hundreds of action, racing, puzzle, sports, and arcade games directly in your browser with zero downloads required.
            </p>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-secondary, #9ca3af)' }}>
              <strong>Data Transparency &amp; Authentication:</strong> When you sign in to Gamebite using Google or social account providers, we request access only to your basic public profile (name and email address). This information is strictly used to authenticate your session, maintain your saved favorite games, and synchronize your gameplay history across devices. We do not sell or share your personal data with third parties. For complete details, please review our <Link href="/privacy" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Privacy Policy</Link> and <Link href="/terms" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Terms of Service</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  try {
    const result = await query("SELECT meta_title, meta_description, meta_tags FROM static_pages WHERE slug = 'home' AND status = 'published'");
    if (result.rows && result.rows.length > 0) {
      const page = result.rows[0];
      return {
        title: page.meta_title || 'Gamebite - Play Free Online HTML5 Games',
        description: page.meta_description || 'Play the best free online HTML5 games on Gamebite.',
        keywords: page.meta_tags || 'free online games, play html5 games'
      };
    }
  } catch (err) {
    console.error('Error generating metadata for home:', err);
  }
  return {
    title: 'Gamebite - Play Free Online HTML5 Games',
    description: 'Play the best free online HTML5 games on Gamebite.'
  };
}
