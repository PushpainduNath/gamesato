'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Home,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Flame,
  Dices,
  Compass,
  ArrowUp,
} from 'lucide-react';
import NewHeader from '@/components/NewHomepage/NewHeader';
import NewSidebar from '@/components/NewHomepage/NewSidebar';
import NewFooter from '@/components/NewHomepage/NewFooter';
import { getImageUrl, formatCompactNumber } from '@/lib/utils';
import styles from './NotFoundClientView.module.css';

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  count?: number;
  icon?: string;
}

export interface GameItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_url: string;
  game_url?: string;
  description?: string;
  play_count?: number;
  likes_count?: number;
  created_at?: string;
  is_featured?: boolean;
}

interface NotFoundClientViewProps {
  categories?: CategoryItem[];
  featuredGames?: GameItem[];
  newGames?: GameItem[];
  allGames?: GameItem[];
  favoritesCount?: number;
}

export default function NotFoundClientView({
  categories = [],
  featuredGames = [],
  newGames = [],
  allGames = [],
  favoritesCount = 0,
}: NotFoundClientViewProps) {
  const router = useRouter();

  // Header & Sidebar state
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinnedDesktop, setIsSidebarPinnedDesktop] = useState(false);

  // Pagination for All Games grid
  const INITIAL_BATCH_SIZE = 18;
  const [visibleAllGamesCount, setVisibleAllGamesCount] = useState(INITIAL_BATCH_SIZE);

  // Carousel scroll ref
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Restore saved desktop pinned sidebar state from localStorage
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

  // Automatically scroll to "Try These New Games" section after 4 seconds
  useEffect(() => {
    let userHasInteracted = false;

    const onUserInteraction = () => {
      userHasInteracted = true;
    };

    window.addEventListener('wheel', onUserInteraction, { passive: true });
    window.addEventListener('touchmove', onUserInteraction, { passive: true });

    const timer = setTimeout(() => {
      if (!userHasInteracted && window.scrollY < 120) {
        const target =
          document.getElementById('new-games-section') ||
          document.getElementById('all-games-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('wheel', onUserInteraction);
      window.removeEventListener('touchmove', onUserInteraction);
    };
  }, []);

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
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

  // Carousel scrolling functions
  const checkScrollPosition = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -380, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 380, behavior: 'smooth' });
    }
  };

  // Surprise Me handler: pick a random game from allGames or featuredGames
  const handleSurpriseMe = () => {
    const pool = allGames.length > 0 ? allGames : featuredGames;
    if (pool.length > 0) {
      const randomGame = pool[Math.floor(Math.random() * pool.length)];
      router.push(`/games/${randomGame.slug}`);
    } else {
      router.push('/');
    }
  };

  // Scroll to New Games section
  const handleScrollToNewGames = () => {
    const el =
      document.getElementById('new-games-section') ||
      document.getElementById('all-games-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const visibleAllGames = allGames.slice(0, visibleAllGamesCount);
  const hasMoreAllGames = visibleAllGamesCount < allGames.length;

  const handleLoadMore = () => {
    setVisibleAllGamesCount((prev) => Math.min(prev + 12, allGames.length));
  };

  return (
    <div className={styles.pageContainer}>
      {/* 1. Header with search, mobile menu, surprise me */}
      <NewHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMenu={handleToggleMenu}
        onToggleMobileMenu={handleToggleMenu}
        isSidebarPinnedDesktop={isSidebarPinnedDesktop}
        isMenuOpen={isSidebarPinnedDesktop}
        featuredGames={featuredGames}
      />

      {/* 2. Main Body with Sidebar & Content */}
      <div className={styles.bodyWrapper}>
        <NewSidebar
          categories={categories}
          activeFilter=""
          onSelectFilter={handleSelectSidebarFilter}
          favoritesCount={favoritesCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isPinnedDesktop={isSidebarPinnedDesktop}
        />

        {/* 3. Main 404 Feed */}
        <main className={styles.mainContent}>
          <div className={styles.contentArea}>
            {/* 3.1 Creative Animated 404 Hero Banner */}
            <section className={styles.heroCard} aria-labelledby="not-found-heading">
              <div className={styles.glowBlobLeft} />
              <div className={styles.glowBlobRight} />

              <div className={styles.visualWrapper}>
                <div className={styles.bigNumbers}>404</div>
                <div className={styles.controllerIconBadge}>
                  <Gamepad2 size={34} strokeWidth={2.4} />
                </div>
              </div>

              <div className={styles.statusBadge}>
                <span>✦ ERROR 404 • LEVEL NOT FOUND</span>
              </div>

              <h1 id="not-found-heading" className={styles.heroTitle}>
                Oops! Looks Like This Level Is Missing!
              </h1>

              <p className={styles.heroSubtitle}>
                The game or link you were trying to access might have drifted into another dimension or been updated.
                Don&apos;t worry — we&apos;ve curated our best new releases and top player favorites below!
              </p>

              <div className={styles.heroActions}>
                <Link href="/" className={styles.btnPrimary} title="Return to Gamesato Home">
                  <Home size={18} />
                  <span>Back to Home</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className={styles.btnSurprise}
                  title="Play a random top-rated game"
                >
                  <Dices size={18} />
                  <span>Surprise Me!</span>
                </button>

                <button
                  type="button"
                  onClick={handleScrollToNewGames}
                  className={styles.btnSecondary}
                  title="Explore newly added games"
                >
                  <Sparkles size={17} color="#fbbf24" />
                  <span>Discover New Games</span>
                </button>
              </div>
            </section>

            {/* 3.2 "Try These New Games" Horizontal Carousel */}
            {newGames.length > 0 && (
              <section id="new-games-section" className={styles.carouselContainer} aria-label="New Games Section">
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <span className={styles.sectionBadge}>
                      <Sparkles size={13} />
                      <span>FRESH RELEASES</span>
                    </span>
                    <h2 className={styles.sectionTitle}>
                      ✨ Try These New Games
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Discover the latest additions to our instant HTML5 browser collection
                    </p>
                  </div>

                  <div className={styles.scrollControls}>
                    <button
                      type="button"
                      onClick={handleScrollLeft}
                      disabled={!canScrollLeft}
                      className={styles.scrollBtn}
                      aria-label="Scroll left"
                      title="Scroll left"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleScrollRight}
                      disabled={!canScrollRight}
                      className={styles.scrollBtn}
                      aria-label="Scroll right"
                      title="Scroll right"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div
                  ref={carouselRef}
                  onScroll={checkScrollPosition}
                  className={styles.carouselTrack}
                >
                  {newGames.map((game, index) => (
                    <Link
                      key={game.id || game.slug || index}
                      href={`/games/${game.slug}`}
                      className={styles.newGameCard}
                      title={`Play ${game.title}`}
                    >
                      <div className={styles.thumbWrap}>
                        <span className={styles.cardBadgeNew}>✨ NEW</span>
                        <Image
                          src={getImageUrl(game.thumbnail_url)}
                          alt={game.title}
                          width={180}
                          height={180}
                          className={styles.thumbImage}
                          loading="lazy"
                          unoptimized
                        />
                        <div className={styles.playOverlay}>
                          <div className={styles.playCircle}>
                            <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
                          </div>
                        </div>
                      </div>
                      <div className={styles.cardInfo}>
                        <h3 className={styles.cardTitle}>{game.title}</h3>
                        <p className={styles.cardCategory}>{game.category || 'Casual'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Subtle Divider */}
            <div className={styles.divider} />

            {/* 3.3 "All Games" Responsive Grid */}
            {allGames.length > 0 && (
              <section
                id="all-games-section"
                className={styles.allGamesSection}
                aria-label="All Games Collection"
              >
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <h2 className={styles.sectionTitle}>
                      <Gamepad2 size={24} color="#38bdf8" />
                      <span>All Games</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Explore our complete collection of free online games with zero installs
                    </p>
                  </div>

                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                    Showing {Math.min(visibleAllGamesCount, allGames.length)} of {allGames.length} games
                  </span>
                </div>

                <div className={styles.gamesGrid}>
                  {visibleAllGames.map((game, index) => (
                    <Link
                      key={game.id || game.slug || index}
                      href={`/games/${game.slug}`}
                      className={styles.gridCard}
                      title={`Play ${game.title}`}
                    >
                      <div className={styles.thumbWrap}>
                        {index < 2 ? (
                          <span className={styles.cardBadgeHot}>🔥 HOT</span>
                        ) : null}
                        <Image
                          src={getImageUrl(game.thumbnail_url)}
                          alt={game.title}
                          width={200}
                          height={200}
                          className={styles.thumbImage}
                          loading="lazy"
                          unoptimized
                        />
                        <div className={styles.playOverlay}>
                          <div className={styles.playCircle}>
                            <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
                          </div>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.cardFooterTop}>
                          <h3 className={styles.cardTitle}>{game.title}</h3>
                        </div>
                        <div className={styles.cardFooterTop}>
                          <span className={styles.cardCategory}>{game.category || 'Arcade'}</span>
                          {game.play_count ? (
                            <span className={styles.cardStats}>
                              🔥 {formatCompactNumber(game.play_count)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View More Button */}
                <div className={styles.viewMoreWrapper}>
                  {hasMoreAllGames ? (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className={styles.viewMoreBtn}
                    >
                      <span>View More Games ({allGames.length - visibleAllGamesCount} remaining)</span>
                      <ChevronDown size={18} />
                    </button>
                  ) : (
                    <div className={styles.allLoadedText}>
                      <span>🚀 You&apos;ve reached the end of the collection!</span>
                      <Link href="/" style={{ color: '#c084fc', textDecoration: 'underline' }}>
                        Browse full library
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* 4. Unified Modern Footer */}
          <NewFooter />
        </main>
      </div>
    </div>
  );
}
