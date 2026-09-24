'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Heart, ArrowRight, RotateCcw } from 'lucide-react';
import { formatCompactNumber, getImageUrl } from '@/lib/utils';
import { usePlayHistoryList } from '@/lib/usePlayHistory';
import styles from './PokiSquareGrid.module.css';

export interface GameItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  thumbnail_url: string;
  game_url?: string;
  play_count?: number;
  likes_count?: number;
  featured_desktop_url?: string | null;
  featured_mobile_url?: string | null;
  is_featured?: boolean;
  target_device?: string;
}

interface PokiSquareGridProps {
  featuredGames: GameItem[];
  allGames: GameItem[];
  activeFilter: string;
  searchQuery: string;
  categories?: { id?: string; name: string; slug: string }[];
  isMobileOrTablet?: boolean;
}

type CardSize = 'hero' | 'medium' | 'small';

interface GridDisplayItem {
  game: GameItem;
  size: CardSize;
}

export default function PokiSquareGrid({
  featuredGames = [],
  allGames = [],
  activeFilter = 'All',
  searchQuery = '',
  categories = [],
  isMobileOrTablet: isMobileOrTabletProp = false
}: PokiSquareGridProps) {
  // Subscribe to live client-side play history and guest likes
  const { history, likedIds } = usePlayHistoryList();

  // Responsive device viewport check (mobile & tablet <= 1024px)
  const [isMobileViewport, setIsMobileViewport] = React.useState(isMobileOrTabletProp);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileViewport(window.innerWidth <= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isMobileOrTablet = isMobileViewport || isMobileOrTabletProp;

  // Container ref to query cards & measure grid columns
  const gridContainerRef = React.useRef<HTMLDivElement>(null);

  // Measure dynamic grid columns on window resize and mount
  const [columnCount, setColumnCount] = React.useState(3);

  React.useEffect(() => {
    const updateColumns = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      if (w <= 640) {
        setColumnCount(3);
      } else if (w <= 1024) {
        setColumnCount(6);
      } else {
        const container = gridContainerRef.current;
        if (container) {
          const gridEl = container.querySelector(`.${styles.grid}`) as HTMLElement;
          if (gridEl) {
            const computed = window.getComputedStyle(gridEl);
            const colsStr = computed.getPropertyValue('grid-template-columns');
            if (colsStr) {
              const count = colsStr.trim().split(/\s+/).length;
              if (count > 0) {
                setColumnCount(count);
                return;
              }
            }
          }
          const width = container.clientWidth;
          setColumnCount(Math.max(3, Math.floor((width + 10) / 106)));
        } else {
          setColumnCount(12);
        }
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Create fast lookup map for played games
  const playedMap = React.useMemo(() => {
    const map = new Map<string, { playTimeSeconds: number; playCount: number; lastPlayedAt: number }>();
    for (const h of history) {
      if (h.id) map.set(h.id, h);
      if (h.slug) map.set(h.slug, h);
    }
    return map;
  }, [history]);

  // 1. Filter games according to active filter and search query
  const filteredRegularGames = React.useMemo(() => {
    let result = [...allGames];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }

    // Category / Tab filter
    if (activeFilter !== 'All') {
      if (activeFilter === 'Popular') {
        result.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
      } else if (activeFilter === 'New') {
        // Already sorted by created_at DESC from DB
      } else if (activeFilter === 'Favorites') {
        const likedSet = new Set(likedIds);
        result = result.filter((g) => likedSet.has(g.id) || ((g.likes_count || 0) > 0 && likedSet.size === 0));
      } else {
        result = result.filter(
          (g) => g.category.toLowerCase() === activeFilter.toLowerCase()
        );
      }
    } else if (!searchQuery.trim()) {
      // Default view: sort dynamically based on device view priority
      result.sort((a, b) => {
        const devA = (a.target_device || 'ALL').toUpperCase();
        const devB = (b.target_device || 'ALL').toUpperCase();
        if (isMobileOrTablet) {
          // Mobile view: MOBILE first (1), ALL second (2), DESKTOP last (3)
          const weightA = devA === 'MOBILE' ? 1 : (devA === 'ALL' ? 2 : 3);
          const weightB = devB === 'MOBILE' ? 1 : (devB === 'ALL' ? 2 : 3);
          return weightA - weightB;
        } else {
          // Desktop view: DESKTOP first (1), ALL second (2), MOBILE last (3)
          const weightA = devA === 'DESKTOP' ? 1 : (devA === 'ALL' ? 2 : 3);
          const weightB = devB === 'DESKTOP' ? 1 : (devB === 'ALL' ? 2 : 3);
          return weightA - weightB;
        }
      });

      // On mobile and tablets, strictly keep only mobile-friendly games (exclude DESKTOP-only)
      if (isMobileOrTablet) {
        result = result.filter((g) => (g.target_device || 'ALL').toUpperCase() !== 'DESKTOP');
      }
    }

    return result;
  }, [allGames, activeFilter, searchQuery, likedIds, isMobileOrTablet]);

  const isDefaultView = activeFilter === 'All' && !searchQuery.trim();

  // 2. Interleaved Catchy Poki Mosaic Sizing Algorithm
  // Rhythmical pattern:
  // [Small, Small, 3x3 HERO, 2x2 MEDIUM, Small, Small, Small, 2x2 MEDIUM, Small, Small, Small, Small, 3x3 HERO (in middle), Small, 2x2 MEDIUM, ...]
  const gridItems = React.useMemo(() => {
    if (filteredRegularGames.length === 0) {
      return [];
    }

    const items: GridDisplayItem[] = [];
    const usedIds = new Set<string>();

    // Helper: find unused game matching predicate or fallback
    const findUnused = (pool: GameItem[]) => {
      for (const g of pool) {
        if (!usedIds.has(g.id)) {
          if (isMobileOrTablet && (g.target_device || 'ALL').toUpperCase() === 'DESKTOP') {
            continue;
          }
          return g;
        }
      }
      return null;
    };

    // Pool A: Played games from history
    const playedPool: GameItem[] = [];
    for (const h of history) {
      const match = allGames.find((g) => g.id === h.id || g.slug === h.slug);
      if (match && !playedPool.some((p) => p.id === match.id)) {
        playedPool.push(match);
      }
    }

    // Pool B: Featured games
    const featPool = [...featuredGames];

    // Pool C: Regular filtered games
    const regularPool = [...filteredRegularGames];

    // Source picker: picks next candidate from played, then featured, then regular
    const getNextCandidate = (preferPlayed = false): GameItem | null => {
      if (preferPlayed && playedPool.length > 0) {
        const g = findUnused(playedPool);
        if (g) return g;
      }
      const feat = findUnused(featPool);
      if (feat) return feat;
      return findUnused(regularPool);
    };

    if (!isDefaultView) {
      // For Category / Search view:
      // Hero top, then medium, then rest with rhythmic 2x2 every 10 items
      const total = regularPool.length;
      regularPool.forEach((game, idx) => {
        const remaining = total - idx - 1;
        if (idx === 0) {
          items.push({ game, size: 'hero' });
        } else if ((idx === 3 || idx === 8 || (idx > 10 && idx % 12 === 0)) && remaining >= 16) {
          items.push({ game, size: 'medium' });
        } else {
          items.push({ game, size: 'small' });
        }
      });
      return items;
    }

    // Default Homepage View: Highly catchy interwoven rhythm!
    // 1. Two small cards (top-left corner flank)
    for (let i = 0; i < 2; i++) {
      const g = findUnused(regularPool);
      if (g) {
        items.push({ game: g, size: 'small' });
        usedIds.add(g.id);
      }
    }

    // 2. #1 Hero 3x3 (Top played game or top featured)
    const hero1 = getNextCandidate(true);
    if (hero1) {
      items.push({ game: hero1, size: 'hero' });
      usedIds.add(hero1.id);
    }

    // 3. Medium 2x2 card
    const med1 = getNextCandidate(true);
    if (med1) {
      items.push({ game: med1, size: 'medium' });
      usedIds.add(med1.id);
    }

    // 4. Three small cards
    for (let i = 0; i < 3; i++) {
      const g = findUnused(regularPool);
      if (g) {
        items.push({ game: g, size: 'small' });
        usedIds.add(g.id);
      }
    }

    // 5. Another Medium 2x2 card
    const med2 = getNextCandidate(true);
    if (med2) {
      items.push({ game: med2, size: 'medium' });
      usedIds.add(med2.id);
    }

    // 6. Four small cards
    for (let i = 0; i < 4; i++) {
      const g = findUnused(regularPool);
      if (g) {
        items.push({ game: g, size: 'small' });
        usedIds.add(g.id);
      }
    }

    // 7. Another Medium 2x2 card
    const med3 = getNextCandidate(true);
    if (med3) {
      items.push({ game: med3, size: 'medium' });
      usedIds.add(med3.id);
    }

    // 8. Three small cards
    for (let i = 0; i < 3; i++) {
      const g = findUnused(regularPool);
      if (g) {
        items.push({ game: g, size: 'small' });
        usedIds.add(g.id);
      }
    }

    // 9. #2 Hero 3x3 IN THE MIDDLE! (User request: beech me 3rd size!)
    const hero2 = getNextCandidate(true) || findUnused(regularPool);
    if (hero2) {
      items.push({ game: hero2, size: 'hero' });
      usedIds.add(hero2.id);
    }

    // 10. Three small cards
    for (let i = 0; i < 3; i++) {
      const g = findUnused(regularPool);
      if (g) {
        items.push({ game: g, size: 'small' });
        usedIds.add(g.id);
      }
    }

    // 11. Another Medium 2x2 card
    const med4 = getNextCandidate(true);
    if (med4) {
      items.push({ game: med4, size: 'medium' });
      usedIds.add(med4.id);
    }

    // 12. Rest of the games catalog:
    // Flow remaining games with a Medium (2x2) card interspersed every ~14 items,
    // BUT strictly NEVER in the last 16 items so the bottom edge is always 100% flush, straight, and even!
    // On mobile and tablets in default view, target 50-60 games (base 52 + balancing cards)!
    const isMobileView = isMobileOrTablet && isDefaultView;
    const TARGET_LIMIT = isMobileView ? 52 : Infinity;
    let countSinceLastMedium = 0;

    while (items.length < TARGET_LIMIT) {
      const g = findUnused(regularPool);
      if (!g) break;

      usedIds.add(g.id);

      // Count how many unused games remain until target limit or pool exhaustion
      const remainingCount = TARGET_LIMIT === Infinity
        ? (regularPool.length - usedIds.size)
        : (TARGET_LIMIT - items.length);

      countSinceLastMedium++;

      // Strict Rule: NEVER assign medium if fewer than 16 games remain before the target limit.
      // This ensures 2-3 full rows of 1x1 small cards at the bottom,
      // completely burying any previous 2x2 cards and preventing uneven hanging blocks!
      if (countSinceLastMedium >= 14 && remainingCount >= 16) {
        items.push({ game: g, size: 'medium' });
        countSinceLastMedium = 0;
      } else {
        items.push({ game: g, size: 'small' });
      }
    }

    // 13. Grid Balancer: Calculate total cells and ensure the bottom row is 100% full!
    // Eliminates any single/lonely hanging box like in the screenshot!
    const effectiveCols = columnCount > 0 ? columnCount : (isMobileView ? 3 : 12);
    let totalUnits = 0;
    for (const it of items) {
      if (isMobileOrTablet) {
        // On mobile, hero & medium cards both span 2 cols x 2 rows = 4 cells. Small cards = 1 cell.
        totalUnits += (it.size === 'hero' || it.size === 'medium') ? 4 : 1;
      } else {
        // On desktop, hero = 9 cells, medium = 4 cells, small = 1 cell.
        totalUnits += it.size === 'hero' ? 9 : (it.size === 'medium' ? 4 : 1);
      }
    }

    const remainder = totalUnits % effectiveCols;
    if (remainder !== 0) {
      const needed = effectiveCols - remainder;
      for (let k = 0; k < needed; k++) {
        const g = findUnused(regularPool);
        if (g) {
          usedIds.add(g.id);
          items.push({ game: g, size: 'small' });
        }
      }
    }

    return items;
  }, [filteredRegularGames, allGames, featuredGames, history, isDefaultView, isMobileOrTablet, columnCount]);

  // Find category slug if activeFilter is a specific category
  const activeCategoryObj = React.useMemo(() => {
    if (activeFilter === 'All' || ['Popular', 'New', 'Favorites'].includes(activeFilter)) {
      return null;
    }
    return categories.find(
      (c) => c.name.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [activeFilter, categories]);

  // Flip 1 random card currently visible in viewport without layout reflows (IntersectionObserver + 0 forced reflows)
  React.useEffect(() => {
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

  // Tasteful badge renderer
  const getBadge = (game: GameItem, isHero: boolean, isMedium: boolean, index: number) => {
    const isPlayed = playedMap.has(game.id) || playedMap.has(game.slug);

    if (isHero) {
      return isPlayed ? (
        <span className={`${styles.badge} ${styles.badgeHot}`}>★ MOST PLAYED</span>
      ) : (
        <span className={`${styles.badge} ${styles.badgeFan}`}>★ FEATURED</span>
      );
    }
    if (isMedium && isPlayed) {
      return <span className={`${styles.badge} ${styles.badgeHot}`}>CONTINUE</span>;
    }
    if (index === 0) {
      return <span className={`${styles.badge} ${styles.badgeHot}`}>HOT</span>;
    }
    if (index === 1) {
      return <span className={`${styles.badge} ${styles.badgeNew}`}>NEW</span>;
    }
    if (isMedium && game.category.toLowerCase().includes('racing')) {
      return <span className={`${styles.badge} ${styles.badgeThrottle}`}>FULL THROTTLE</span>;
    }
    return null;
  };

  if (gridItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        {activeFilter === 'Favorites' ? (
          <>
            <Heart size={44} style={{ color: '#f43f5e', marginBottom: '12px' }} fill="#f43f5e" />
            <h3 className={styles.emptyStateTitle}>No Favorite Games Yet</h3>
            <p>Click 👍 Like on any game while playing to save it here instantly!</p>
          </>
        ) : (
          <>
            <h3 className={styles.emptyStateTitle}>No Games Found</h3>
            <p>Try searching for something else or browse different categories.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <section className={styles.gridContainer}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.sectionTitle}>
            🔥 {activeCategoryObj ? `${activeFilter} Games` : 'The good stuff'}
          </h2>
          <span className={styles.sectionSubtitle}>
            {activeCategoryObj 
              ? `Showing top free ${activeFilter.toLowerCase()} games` 
              : 'Handpicked for your next break'}
          </span>
        </div>

        <div className={styles.headerRight}>
          {activeCategoryObj && (
            <Link
              href={`/category/${activeCategoryObj.slug}`}
              className={styles.viewCategoryLink}
              title={`Explore all ${activeCategoryObj.name} games`}
            >
              <span>Explore all {activeCategoryObj.name} games</span>
              <ArrowRight size={13} />
            </Link>
          )}
          <div className={styles.statusIndicator}>
            <span className={styles.liveDot} />
            <span>ALL GAMES, ALL FREE</span>
          </div>
        </div>
      </div>

      {/* Poki Modular Catchy Interleaved Dense Grid */}
      <div className={styles.grid} ref={gridContainerRef}>
        {gridItems.map((item, idx) => {
          const { game, size } = item;
          const isPlayed = playedMap.has(game.id) || playedMap.has(game.slug);

          let sizeClass = '';
          if (size === 'hero') sizeClass = styles.heroCard;
          else if (size === 'medium') sizeClass = styles.mediumCard;

          return (
            <Link
              key={`${game.id}-${idx}`}
              href={`/games/${game.slug}`}
              className={`${styles.card} ${sizeClass}`}
              title={`Play ${game.title}`}
              data-poki-card="true"
            >
              <div className={styles.cardInner}>
                {/* Front Face: Game Cover & Details */}
                <div className={styles.cardFront}>
                  {/* Resume Badge for Played Games */}
                  {isPlayed && (
                    <div className={styles.resumeBadge} title="Resume / Recently Played">
                      <RotateCcw size={12} strokeWidth={2.6} />
                    </div>
                  )}

                  {/* Image */}
                  <div className={styles.cardImageWrapper}>
                    <Image
                      src={getImageUrl(
                        size !== 'small' && (game.featured_desktop_url || game.featured_mobile_url)
                          ? (game.featured_desktop_url || game.featured_mobile_url)!
                          : game.thumbnail_url
                      )}
                      alt={game.title}
                      fill
                      unoptimized
                      sizes={size === 'hero' ? '400px' : size === 'medium' ? '250px' : '150px'}
                      className={styles.cardImage}
                      priority={idx < 6}
                    />
                  </div>

                  {/* Gradient Overlay */}
                  <div className={styles.gradientOverlay} />

                  {/* Badge */}
                  <div className={styles.badgeContainer}>
                    {getBadge(game, size === 'hero', size === 'medium', idx)}
                  </div>

                  {/* Center Play Button Overlay for Hero and Medium Cards */}
                  {size !== 'small' && (
                    <div className={styles.playOverlay}>
                      <Play size={size === 'hero' ? 26 : 20} fill="#ffffff" />
                    </div>
                  )}

                  {/* Card Bottom Meta */}
                  <div className={styles.cardContent}>
                    <h3 className={styles.gameTitle}>{game.title}</h3>
                    <div className={styles.cardMeta}>
                      {size !== 'small' && (
                        <span className={styles.categoryLabel}>{game.category}</span>
                      )}
                      <div className={styles.statsWrapper}>
                        {size !== 'small' && (game.likes_count ?? 0) > 0 && (
                          <span className={styles.statItem} title="Likes">
                            <Heart size={12} className={styles.statHeart} fill="#f43f5e" />
                            <span>{formatCompactNumber(game.likes_count || 0)}</span>
                          </span>
                        )}
                        <span className={styles.playBadge} title="Total Plays">
                          <Play size={9} className={styles.statPlay} fill="#a78bfa" />
                          <span>{formatCompactNumber(game.play_count || 0)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Face: 3D Flip Revealed Gamesato Play Card */}
                <div className={styles.cardBack} aria-hidden="true">
                  <div className={styles.cardBackContent}>
                    <h4 className={styles.cardBackTitle}>{game.title}</h4>
                    <div className={styles.cardBackIcon}>
                      <Play size={size === 'hero' ? 28 : size === 'medium' ? 22 : 16} fill="#ffffff" />
                    </div>
                    <div className={styles.cardBackFooter}>
                      <span className={styles.cardBackCategory}>{game.category}</span>
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
  );
}
