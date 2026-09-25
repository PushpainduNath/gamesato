'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Heart, 
  RotateCcw, 
  ChevronsRight, 
  Home, 
  Sparkles, 
  Gamepad2, 
  CheckCircle2, 
  Zap, 
  Flame,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import NewHeader from '@/components/NewHomepage/NewHeader';
import NewSidebar from '@/components/NewHomepage/NewSidebar';
import NewFooter from '@/components/NewHomepage/NewFooter';
import GamePlayerCard from '@/components/GamePlayerCard';
import MobileGameDetails from '@/components/MobileGameDetails';
import CategorySectionGrid, { CategoryWithGames } from '@/components/NewHomepage/CategorySectionGrid';
import AdBanner from '@/components/AdBanner';
import { formatCompactNumber, getImageUrl } from '@/lib/utils';
import { usePlayHistoryList } from '@/lib/usePlayHistory';
import Translate from '@/components/Translate';
import styles from './page.module.css';

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  count?: number;
  icon?: string;
}

export interface GameDetailData {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnail_url: string;
  game_url: string;
  play_count: number;
  created_at: string;
  game_page_both_url?: string | null;
  featured_desktop_url?: string | null;
  featured_mobile_url?: string | null;
  how_to_play?: string | null;
  orientation?: string | null;
}

export interface GridGameItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_url: string;
  play_count?: number;
  likes_count?: number;
  featured_desktop_url?: string | null;
  featured_mobile_url?: string | null;
}

type CardSize = 'hero' | 'medium' | 'small';

interface GridDisplayItem {
  game: GridGameItem;
  size: CardSize;
}

interface GameDetailClientViewProps {
  game: GameDetailData;
  likesCount: number;
  sidebarGames: GridGameItem[];
  bentoGames: GridGameItem[];
  categories: CategoryItem[];
  favoritesCount: number;
  allGamesPool: GridGameItem[];
  categorySections?: CategoryWithGames[];
  categoryData?: {
    id: string;
    name: string;
    slug: string;
    content?: string;
    faq?: string;
  } | null;
  relatedBlogs?: {
    title: string;
    slug: string;
    excerpt: string;
    cover_image?: string;
    category?: string;
  }[];
}

function getBalancedGrid(
  allAvailableGames: GridGameItem[],
  columnCount: number,
  fallbackPool: GridGameItem[] = [],
  isMobile = false
): GridDisplayItem[] {
  if (!allAvailableGames || allAvailableGames.length === 0) return [];

  const effectiveCols = columnCount > 0 ? columnCount : (isMobile ? 3 : 12);
  const items: GridDisplayItem[] = [];
  const usedIds = new Set<string>();

  if (isMobile) {
    // Mobile: Strictly 2x2 and 1x1 (NO 3x3)
    for (let idx = 0; idx < allAvailableGames.length; idx++) {
      const game = allAvailableGames[idx];
      usedIds.add(game.id);
      const remaining = allAvailableGames.length - idx - 1;

      let size: CardSize = 'small';
      if ((idx === 0 || idx === 3 || idx === 7 || idx === 11 || (idx > 11 && idx % 4 === 0)) && remaining >= 5) {
        size = 'medium';
      }
      items.push({ game, size });
    }

    let totalUnits = 0;
    for (const it of items) totalUnits += it.size === 'medium' ? 4 : 1;
    const remainder = totalUnits % 3;
    if (remainder !== 0) {
      const needed = 3 - remainder;
      for (const g of fallbackPool) {
        if (!usedIds.has(g.id)) {
          usedIds.add(g.id);
          items.push({ game: g, size: 'small' });
          if (++totalUnits % 3 === 0) break;
        }
      }
      while (items.length > 0 && totalUnits % 3 !== 0) {
        if (items[items.length - 1].size === 'small') {
          items.pop();
          totalUnits--;
        } else break;
      }
    }
    return items;
  }

  // DESKTOP POKI BENTO GRID:
  // Strict rule for a 100% FLAT and LEVEL bottom:
  // All 3x3 Hero and 2x2 Medium cards are placed in the upper portion (first 12 items).
  // ALL items after index 11 are STRICTLY 1x1 small cards!
  // This guarantees that any large card is completed long before the bottom,
  // and the bottom 25+ cards are entirely 1x1 small cards.
  for (let idx = 0; idx < allAvailableGames.length; idx++) {
    const game = allAvailableGames[idx];
    usedIds.add(game.id);
    const remaining = allAvailableGames.length - idx - 1;

    let size: CardSize = 'small';

    // Hero (3x3): Strictly at index 2 (only if at least 26 cards remain)
    if (idx === 2 && remaining >= 26) {
      size = 'hero';
    }
    // Medium (2x2): Strictly at indices 0, 6, 11 (only if at least 20 cards remain)
    else if ((idx === 0 || idx === 6 || idx === 11) && remaining >= 20) {
      size = 'medium';
    }

    items.push({ game, size });
  }

  // Calculate total units
  let totalUnits = 0;
  for (const it of items) {
    if (it.size === 'hero') totalUnits += 9;
    else if (it.size === 'medium') totalUnits += 4;
    else totalUnits += 1;
  }

  // Ensure totalUnits % effectiveCols === 0 by padding small 1x1 cards to the tail
  const remainder = totalUnits % effectiveCols;
  if (remainder !== 0) {
    const needed = effectiveCols - remainder;
    let added = 0;

    // 1. Take unique games from fallbackPool
    if (fallbackPool && fallbackPool.length > 0) {
      for (const g of fallbackPool) {
        if (!usedIds.has(g.id)) {
          usedIds.add(g.id);
          items.push({ game: g, size: 'small' });
          added++;
          if (added >= needed) break;
        }
      }
    }

    // 2. Take unused games from allAvailableGames
    if (added < needed) {
      for (const g of allAvailableGames) {
        if (!usedIds.has(g.id)) {
          usedIds.add(g.id);
          items.push({ game: g, size: 'small' });
          added++;
          if (added >= needed) break;
        }
      }
    }

    // 3. If pool is exhausted, loop from the top of the items as 1x1 cards
    if (added < needed && items.length > 0) {
      for (let i = 0; added < needed; i++) {
        const g = items[i % items.length].game;
        items.push({ game: g, size: 'small' });
        added++;
      }
    }
  }

  return items;
}

export default function GameDetailClientView({
  game,
  likesCount,
  sidebarGames = [],
  bentoGames = [],
  categories = [],
  favoritesCount = 0,
  allGamesPool = [],
  categorySections = [],
  categoryData = null,
  relatedBlogs = [],
}: GameDetailClientViewProps) {
  const router = useRouter();
  const { history, likedIds } = usePlayHistoryList();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinnedDesktop, setIsSidebarPinnedDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [columnCount, setColumnCount] = useState(12);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0, 1]);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Screen check & dynamic grid column measurement
  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobileScreen = w <= 768 || (w <= 1024 && h <= 550);
      if (isMobileScreen) {
        setIsMobile(true);
        setColumnCount(3);
        return;
      }
      setIsMobile(false);

      const gridEl = gridRef.current || (gridContainerRef.current?.querySelector(`.${styles.grid}`) as HTMLElement | null);
      if (gridEl) {
        const computed = window.getComputedStyle(gridEl);
        const colsStr = computed.getPropertyValue('grid-template-columns');
        if (colsStr && colsStr !== 'none') {
          const count = colsStr.trim().split(/\s+/).length;
          if (count > 0) {
            setColumnCount(count);
            return;
          }
        }
        const gridW = gridEl.clientWidth;
        if (gridW > 0) {
          const count = Math.max(3, Math.floor((gridW + 10) / 106));
          setColumnCount(count);
          return;
        }
      }

      if (w > 1200) {
        setColumnCount(12);
      } else {
        const count = Math.max(3, Math.floor((w - 120) / 106));
        setColumnCount(count);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateColumns());
      if (gridRef.current) ro.observe(gridRef.current);
      if (gridContainerRef.current) ro.observe(gridContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateColumns);
      if (ro) ro.disconnect();
    };
  }, []);

  // Restore saved desktop pinned sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gamesato_sidebar_pinned');
        if (saved === 'true') {
          setIsSidebarPinnedDesktop(true);
        }
      } catch (_) {}
    }
  }, []);

  // Periodic 3D flip of random card visible in viewport (IntersectionObserver + 0 forced reflows)
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const visibleCards = new Set<HTMLElement>();
    let observer: IntersectionObserver | null = null;

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              visibleCards.add(target);
            } else {
              visibleCards.delete(target);
            }
          });
        },
        { rootMargin: '-60px 0px -20px 0px', threshold: 0.15 }
      );

      const cardEls = container.querySelectorAll<HTMLElement>('[data-poki-card="true"]');
      cardEls.forEach((el) => observer!.observe(el));
    }

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (visibleCards.size === 0) return;

      const candidates: HTMLElement[] = [];
      visibleCards.forEach((el) => {
        if (!el.matches(':hover')) {
          candidates.push(el);
        }
      });

      if (candidates.length === 0) return;

      const randomIdx = Math.floor(Math.random() * candidates.length);
      const chosenEl = candidates[randomIdx];
      const inner = chosenEl.querySelector<HTMLElement>(`.${styles.cardInner}`);
      if (!inner) return;

      inner.classList.add(styles.cardFlipping);
      const onEnd = () => {
        inner.classList.remove(styles.cardFlipping);
        inner.removeEventListener('animationend', onEnd);
      };
      inner.addEventListener('animationend', onEnd, { once: true });
      setTimeout(() => {
        inner.classList.remove(styles.cardFlipping);
      }, 3150);
    }, 4500);

    return () => {
      clearInterval(interval);
      if (observer) observer.disconnect();
    };
  }, []);

  const handleToggleMenu = () => {
    const isMobileScreen = typeof window !== 'undefined' && (window.innerWidth <= 768 || (window.innerWidth <= 1024 && window.innerHeight <= 550));
    if (isMobileScreen) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsSidebarPinnedDesktop((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('gamesato_sidebar_pinned', String(next));
        } catch (_) {}
        return next;
      });
    }
  };

  const handleSelectSidebarFilter = (filter: string) => {
    setIsMobileMenuOpen(false);
    if (filter === 'All') {
      router.push('/');
    } else if (['Popular', 'New', 'Favorites'].includes(filter)) {
      router.push(`/?filter=${encodeURIComponent(filter)}`);
    } else {
      const match = categories.find(
        (c) => c.name.toLowerCase() === filter.toLowerCase()
      );
      if (match) {
        router.push(`/category/${match.slug}`);
      }
    }
  };

  const isMenuOpen = isMobile ? isMobileMenuOpen : isSidebarPinnedDesktop;
  const effectiveFavoritesCount = Math.max(favoritesCount, likedIds.length);

  const playedSet = useMemo(() => {
    const set = new Set<string>();
    for (const h of history) {
      if (h.id) set.add(h.id);
      if (h.slug) set.add(h.slug);
    }
    return set;
  }, [history]);

  const balancedBentoItems = useMemo(() => {
    return getBalancedGrid(bentoGames, columnCount, allGamesPool, isMobile);
  }, [bentoGames, columnCount, allGamesPool, isMobile]);

  const gameImageUrl = getImageUrl(
    game.game_page_both_url ||
    game.featured_mobile_url ||
    game.featured_desktop_url ||
    game.thumbnail_url
  );

  const categorySlug = (game.category || 'all').toLowerCase().replace(/\s+/g, '-');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';

  const ratingCount = Math.max(
    18,
    (likesCount || 0) + Math.floor((game.play_count || 30) * 0.28)
  );

  const videoGameSchema = {
    '@context': 'https://schema.org',
    '@type': ['VideoGame', 'SoftwareApplication'],
    name: game.title,
    description:
      game.description ||
      `Play ${game.title} online for free on Gamesato! Instant HTML5 browser game with no download required.`,
    image: getImageUrl(game.thumbnail_url),
    url: `${siteUrl}/games/${game.slug}`,
    genre: game.category || 'Arcade',
    playMode: 'SinglePlayer',
    applicationCategory: 'GameApplication',
    gamePlatform: ['Web Browser', 'Mobile Web Browser', 'Desktop Browser'],
    operatingSystem: 'Windows, macOS, Android, iOS, ChromeOS',
    author: {
      '@type': 'Organization',
      name: 'Gamesato',
      url: siteUrl,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      worstRating: '1',
      ratingCount: String(ratingCount),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${game.category || 'Online'} Games`,
        item: `${siteUrl}/category/${categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: game.title,
        item: `${siteUrl}/games/${game.slug}`,
      },
    ],
  };

  const resolvedFaqs = useMemo(() => {
    if (categoryData?.faq) {
      try {
        const parsed = JSON.parse(categoryData.faq);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .map((item: any) => ({
              question: item.question || item.q || '',
              answer: item.answer || item.a || '',
            }))
            .filter((item: any) => item.question && item.answer);
        }
      } catch (e) {}
    }

    const catName = categoryData?.name || game.category || 'Online';
    return [
      {
        question: `What are the best free ${catName} games on Gamesato?`,
        answer: `Our top recommended ${catName.toLowerCase()} games include ${game.title} and other trending titles featured on this page. All games are 100% free to play and run instantly in your web browser with zero downloads required.`
      },
      {
        question: `Can I play ${catName} games like ${game.title} on mobile phones and tablets?`,
        answer: `Yes, absolutely! All our ${catName.toLowerCase()} games are built with responsive HTML5 & WebGL technology, adapting automatically to touchscreens on iPhones, iPads, and Android devices, as well as desktop PCs.`
      },
      {
        question: `Do I need to download or install anything to play ${game.title}?`,
        answer: `No downloads, installations, or app store accounts are ever needed. Simply click the play button and start enjoying ${game.title} directly in modern web browsers like Chrome, Safari, Edge, and Firefox.`
      },
      {
        question: `Are these ${catName} games unblocked for school or office breaks?`,
        answer: `Yes! Gamesato runs over high-speed, secure HTTPS protocols engineered for rapid loading and instant unblocked access, making it ideal for quick play sessions during study breaks or downtime.`
      },
      {
        question: `How often are new ${catName} games added to Gamesato?`,
        answer: `We update our ${catName.toLowerCase()} games catalog weekly with new releases, verified indie favorites, and viral web games from around the world.`
      }
    ];
  }, [categoryData, game.category, game.title]);

  return (
    <div className={styles.pageContainer}>
      <script
        id="video-game-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameSchema) }}
      />
      <script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {resolvedFaqs.length > 0 && (
        <script
          id="category-faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: resolvedFaqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}

      {/* 1. Header (Sticky) */}
      <NewHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMenu={handleToggleMenu}
        onToggleMobileMenu={handleToggleMenu}
        isSidebarPinnedDesktop={isSidebarPinnedDesktop}
        isMenuOpen={isMenuOpen}
        featuredGames={allGamesPool}
      />

      {/* 2. Main Body with Sidebar Rail */}
      <div className={styles.bodyWrapper}>
        <NewSidebar
          categories={categories}
          activeFilter={game.category}
          onSelectFilter={handleSelectSidebarFilter}
          favoritesCount={effectiveFavoritesCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isPinnedDesktop={isSidebarPinnedDesktop}
        />

        {/* 3. Main Content Feed */}
        <main className={styles.mainContent}>
          <div ref={gridContainerRef} className={styles.contentArea}>
            {/* Breadcrumbs */}
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href="/" className={styles.breadcrumbLink}>
                <Home size={13} />
                <span>Home</span>
              </Link>
              <ChevronsRight size={14} className={styles.breadcrumbDivider} />
              <Link href={`/category/${categorySlug}`} className={styles.breadcrumbLink}>
                {game.category}
              </Link>
              <ChevronsRight size={14} className={styles.breadcrumbDivider} />
              <span className={styles.breadcrumbCurrent}>{game.title}</span>
            </nav>

            {/* ----------------- MOBILE LAYOUT ----------------- */}
            <div className={styles.mobileLayout}>
              <MobileGameDetails
                gameId={game.id}
                gameSlug={game.slug}
                gameTitle={game.title}
                gameCategory={game.category}
                gameDescription={game.description}
                gameHowToPlay={game.how_to_play}
                gameImageUrl={gameImageUrl}
                gameUrl={game.game_url}
                orientation={game.orientation || 'AUTO'}
                initialLikes={likesCount}
                moreGames={bentoGames as any}
              />
            </div>

            {/* ----------------- DESKTOP LAYOUT ----------------- */}
            <div className={styles.desktopLayout}>
              <div className={styles.gameHeroLayout}>
                {/* Left Skyscraper Ad */}
                <aside className={styles.heroAdSide}>
                  <AdBanner type="skyscraper" />
                </aside>

                {/* Center: 16:9 Game Player */}
                <div className={styles.centerPlayerColumn}>
                  <GamePlayerCard
                    gameId={game.id}
                    gameSlug={game.slug}
                    gameTitle={game.title}
                    imageUrl={gameImageUrl}
                    gameUrl={game.game_url}
                    initialLikes={likesCount}
                    orientation={game.orientation || 'AUTO'}
                    category={game.category}
                  />
                </div>

                {/* Right Skyscraper Ad */}
                <aside className={styles.heroAdSide}>
                  <AdBanner type="skyscraper" />
                </aside>
              </div>

              {/* Game Info Details Card */}
              <div className={styles.detailsCard}>
                <div className={styles.detailsHeader}>
                  <h1 className={styles.detailsTitle}>
                    <Translate textKey={`game_${game.slug}_title`} fallback={game.title} />
                  </h1>
                  <div className={styles.pillsRow}>
                    <Link href={`/category/${categorySlug}`} className={styles.categoryPill}>
                      <Gamepad2 size={13} />
                      <span>{game.category}</span>
                    </Link>
                    <span className={styles.instantPlayPill}>
                      <Zap size={13} />
                      <span>Instant Play • Free</span>
                    </span>
                    <span className={styles.verifiedPill}>
                      <CheckCircle2 size={13} />
                      <span>Verified Safe</span>
                    </span>
                    {(game.play_count || 0) > 0 && (
                      <span className={styles.statPill}>
                        <Play size={10} fill="currentColor" />
                        <span>{formatCompactNumber(game.play_count)} Plays</span>
                      </span>
                    )}
                    {likesCount > 0 && (
                      <span className={styles.statPill}>
                        <Heart size={12} fill="#f43f5e" stroke="#f43f5e" />
                        <span>{formatCompactNumber(likesCount)} Likes</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.detailsContent}>
                  <Translate
                    textKey={`game_${game.slug}_desc`}
                    fallback={game.description || 'Play this free online game instantly on Gamesato with no download required.'}
                  />
                </div>
              </div>

              {/* How to Play Card */}
              {game.how_to_play && (
                <div className={styles.howToPlayCard}>
                  <div className={styles.howToPlayHeader}>
                    <Gamepad2 size={18} color="#a78bfa" />
                    <h2 className={styles.howToPlayTitle}>
                      How to Play {game.title}
                    </h2>
                  </div>
                  <ul className={styles.howToPlayList}>
                    {game.how_to_play
                      .split('\n')
                      .map((item) => item.trim())
                      .filter((item) => item.length > 0)
                      .map((bullet, index) => (
                        <li key={index} className={styles.howToPlayItem}>
                          <span className={styles.stepNumber}>{index + 1}</span>
                          <span>{bullet.replace(/^[\s•*-]+/, '')}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Horizontal Leaderboard Ad */}
              <AdBanner type="horizontal" />

              {/* Poki Bento Grid: Explore More Games */}
              {balancedBentoItems.length > 0 && (
                <section className={styles.bentoSection}>
                  <div className={styles.bentoHeader}>
                    <div className={styles.bentoTitleGroup}>
                      <Flame size={22} className={styles.bentoIcon} />
                      <h2 className={styles.bentoTitle}>Explore More Games</h2>
                    </div>
                    <Link href={`/category/${categorySlug}`} className={styles.viewAllLink}>
                      <span>View All in {game.category}</span>
                      <ChevronsRight size={15} />
                    </Link>
                  </div>

                  <div ref={gridRef} className={styles.grid}>
                    {balancedBentoItems.map((item, idx) => {
                      const { game: bGame, size } = item;
                      const isPlayed = playedSet.has(bGame.id) || playedSet.has(bGame.slug);

                      let sizeClass = styles.card;
                      if (size === 'hero') sizeClass = `${styles.card} ${styles.heroCard}`;
                      else if (size === 'medium') sizeClass = `${styles.card} ${styles.mediumCard}`;

                      return (
                        <Link
                          href={`/games/${bGame.slug}`}
                          key={`bento_${bGame.id}_${idx}`}
                          className={sizeClass}
                          title={`Play ${bGame.title}`}
                          data-poki-card="true"
                        >
                          <div className={styles.cardInner}>
                            {/* FRONT FACE */}
                            <div className={styles.cardFront}>
                              {isPlayed && (
                                <div className={styles.resumeBadge} title="Resume / Played">
                                  <RotateCcw size={12} strokeWidth={2.6} />
                                </div>
                              )}

                              <div className={styles.cardImageWrapper}>
                                <Image
                                  src={getImageUrl(
                                    size !== 'small' && (bGame.featured_desktop_url || bGame.featured_mobile_url)
                                      ? (bGame.featured_desktop_url || bGame.featured_mobile_url)!
                                      : bGame.thumbnail_url
                                  )}
                                  alt={bGame.title}
                                  fill
                                  unoptimized
                                  sizes={size === 'hero' ? '400px' : size === 'medium' ? '250px' : '150px'}
                                  className={styles.cardImage}
                                  loading={idx < 12 ? 'eager' : 'lazy'}
                                />
                              </div>

                              <div className={styles.gradientOverlay} />

                              <div className={styles.badgeContainer}>
                                {size === 'hero' ? (
                                  <span className={`${styles.badge} ${styles.badgeFan}`}>★ FEATURED</span>
                                ) : idx === 1 ? (
                                  <span className={`${styles.badge} ${styles.badgeHot}`}>HOT</span>
                                ) : idx === 2 ? (
                                  <span className={`${styles.badge} ${styles.badgeNew}`}>NEW</span>
                                ) : null}
                              </div>

                              <div className={styles.playOverlay}>
                                <Play size={size === 'hero' ? 26 : size === 'medium' ? 20 : 16} fill="#ffffff" />
                              </div>

                              <div className={styles.cardContent}>
                                <h3 className={styles.gameTitle}>{bGame.title}</h3>
                                <div className={styles.cardMeta}>
                                  {size !== 'small' && (
                                    <span className={styles.categoryLabel}>{bGame.category}</span>
                                  )}
                                  <div className={styles.statsWrapper}>
                                    {size !== 'small' && (bGame.likes_count ?? 0) > 0 && (
                                      <span className={styles.statItem} title="Likes">
                                        <Heart size={11} fill="#f43f5e" />
                                        <span>{formatCompactNumber(bGame.likes_count || 0)}</span>
                                      </span>
                                    )}
                                    <span className={styles.statItem} title="Total Plays">
                                      <Play size={8} fill="#a78bfa" />
                                      <span>{formatCompactNumber(bGame.play_count || 0)}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* BACK FACE */}
                            <div className={styles.cardBack} aria-hidden="true">
                              <div className={styles.cardBackContent}>
                                <h4 className={styles.cardBackTitle}>{bGame.title}</h4>
                                <div className={styles.cardBackIcon}>
                                  <Play size={size === 'hero' ? 28 : size === 'medium' ? 22 : 16} fill="#ffffff" />
                                </div>
                                <div className={styles.cardBackFooter}>
                                  <span className={styles.cardBackCategory}>{bGame.category}</span>
                                  <span className={styles.cardBackPlayPill}>PLAY NOW</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* In-Feed Responsive Horizontal Ad */}
            <AdBanner type="horizontal" />

            {/* Top Category Sections from Homepage (Visible on BOTH Desktop & Mobile) */}
            {categorySections && categorySections.length > 0 && (
              <div className={styles.categorySectionsWrapper}>
                {categorySections.map((cat, idx) => (
                  <CategorySectionGrid
                    key={cat.id}
                    category={cat}
                    sectionIndex={idx}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            )}

            {/* Related Gaming Guides & Articles (Blog <-> Game Internal SEO Cross-Linking) */}
            {relatedBlogs && relatedBlogs.length > 0 && (
              <div className={styles.bottomSectionWrapper} style={{ marginBottom: '20px' }}>
                <div className={styles.containerCard}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      📚 Gaming Guides &amp; Strategy Tips
                    </h2>
                    <Link href="/blog" style={{ fontSize: '0.85rem', color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
                      View All Guides &rarr;
                    </Link>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    {relatedBlogs.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/blog/${b.slug}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '14px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          textDecoration: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: 700 }}>
                            {b.category || 'Gaming Guide'}
                          </span>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: '6px 0 8px', lineHeight: 1.35 }}>
                            {b.title}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {b.excerpt}
                          </p>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600, marginTop: '10px' }}>
                          Read Strategy Guide &rarr;
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Category SEO Content & FAQ Section (Visible on BOTH Desktop & Mobile) */}
            <div className={styles.bottomSectionWrapper}>
              <div className={styles.containerCard}>
                {/* Category Description / Article */}
                <section className={styles.seoArticleSection} aria-label={`About ${categoryData?.name || game.category}`}>
                  {categoryData?.content ? (
                    <div dangerouslySetInnerHTML={{ __html: categoryData.content }} />
                  ) : (
                    <div>
                      <h2>Play Free Online {categoryData?.name || game.category} Games on Gamesato</h2>
                      <p>
                        Welcome to Gamesato&apos;s ultimate collection of free online <strong>{categoryData?.name || game.category} games</strong>, 
                        including popular hits like <em>{game.title}</em>! 
                        Whether you are a casual player looking for a quick break or a gaming enthusiast seeking high-stakes challenges, 
                        our {(categoryData?.name || game.category).toLowerCase()} catalog offers hours of fun without needing to download or install anything.
                      </p>
                      <p>
                        All games on Gamesato run natively in modern web browsers with high-performance HTML5 and WebGL graphics. 
                        Enjoy seamless controls on smartphones, tablets, Chromebooks, and PCs wherever you are.
                      </p>
                    </div>
                  )}
                </section>

                {/* Category FAQ Accordion */}
                {resolvedFaqs.length > 0 && (
                  <section className={styles.faqSection} aria-label="Frequently Asked Questions">
                    <div className={styles.faqHeader}>
                      <HelpCircle size={22} className={styles.faqHeaderIcon} />
                      <div>
                        <h3 className={styles.faqHeaderTitle}>Frequently Asked Questions</h3>
                        <span className={styles.faqHeaderSubtitle}>Everything you need to know about {categoryData?.name || game.category} games</span>
                      </div>
                    </div>

                    <div className={styles.faqList}>
                      {resolvedFaqs.map((faq, index) => {
                        const isOpen = openFaqIndices.includes(index);
                        return (
                          <div
                            key={index}
                            className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                          >
                            <button
                              type="button"
                              className={styles.faqQuestionBtn}
                              onClick={() => toggleFaq(index)}
                              aria-expanded={isOpen}
                            >
                              <span className={styles.faqQuestionText}>{faq.question}</span>
                              <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronRotated : ''}`}>
                                  <ChevronDown size={18} />
                              </span>
                            </button>
                            {isOpen && (
                              <div className={styles.faqAnswerWrapper}>
                                <p className={styles.faqAnswerText}>{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>

          {/* 4. Modern Footer */}
          <NewFooter />
        </main>
      </div>
    </div>
  );
}
