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
  created_at?: string;
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

export interface GridBadge {
  text: string;
  type: 'hot' | 'new' | 'featured' | 'liked' | 'recent' | 'fan';
}

interface GridDisplayItem {
  game: GameItem;
  size: CardSize;
  badge?: GridBadge;
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
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMobileViewport(w <= 1024 || h <= 550);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isMobileOrTablet = isMobileViewport || isMobileOrTabletProp;

  // Container and grid refs to measure grid columns
  const gridContainerRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);

  // Measure dynamic grid columns on window resize and mount
  const [columnCount, setColumnCount] = React.useState(12);

  React.useEffect(() => {
    const updateColumns = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobileScreen = w <= 640 || (w <= 1024 && h <= 550);
      if (isMobileScreen) {
        setColumnCount(Math.max(3, Math.floor((w + 8) / 104)));
        return;
      }
      if (w <= 1024) {
        setColumnCount(6);
        return;
      }

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
        const width = gridEl.clientWidth;
        if (width > 0) {
          setColumnCount(Math.max(3, Math.floor((width + 10) / 106)));
          return;
        }
      }
      setColumnCount(12);
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
    if (allGames.length === 0) {
      return [];
    }

    const items: GridDisplayItem[] = [];

    // --- Search / Category / Filtered View ---
    if (!isDefaultView) {
      if (filteredRegularGames.length === 0) return [];
      const total = filteredRegularGames.length;
      filteredRegularGames.forEach((game, idx) => {
        const remaining = total - idx - 1;
        if (idx === 0) {
          // On mobile/tablet strictly 2x2 medium, never 3x3 hero
          items.push({ game, size: isMobileOrTablet ? 'medium' : 'hero' });
        } else if ((idx === 3 || idx === 8 || (idx > 10 && idx % 12 === 0)) && remaining >= 16) {
          items.push({ game, size: 'medium' });
        } else {
          items.push({ game, size: 'small' });
        }
      });

      // Bottom Row Balancer for Category / Search view
      const effectiveCols = columnCount > 0 ? columnCount : (isMobileOrTablet ? 3 : 12);
      let totalUnits = 0;
      for (const it of items) {
        if (isMobileOrTablet) {
          totalUnits += (it.size === 'hero' || it.size === 'medium') ? 4 : 1;
        } else {
          totalUnits += it.size === 'hero' ? 9 : (it.size === 'medium' ? 4 : 1);
        }
      }
      const remainder = totalUnits % effectiveCols;
      if (remainder !== 0) {
        const needed = effectiveCols - remainder;
        for (let k = 0; k < needed; k++) {
          const g = items[k % items.length]?.game;
          if (g) {
            items.push({ game: g, size: 'small' });
          }
        }
      }
      return items;
    }

    // --- Default Homepage View: Exact Curated Hierarchy ---
    // User Specification:
    // 1. 2 Most Played Games: #1 in 3x3 (on desktop) / 2x2 (on mobile), #2 in 2x2
    // 2. 2 Most Recently Played Games (from history)
    // 3. 2 Favorite Games (from likedIds)
    // 4. 2 Most Liked Games (from likes_count)
    // 5. 2 New Games (from created_at)
    // 6. 2 Featured Games (from is_featured / featuredGames)
    // 7. Remaining Top Games: filled randomly in 1x1 small tiles
    // 8. Grid Balancer: 100% flat and level bottom row across all columns

    // Filter games suitable for the current device
    const deviceFiltered = allGames.filter((g) => {
      if (isMobileOrTablet) {
        return (g.target_device || 'ALL').toUpperCase() !== 'DESKTOP';
      }
      return true;
    });

    const usedIds = new Set<string>();

    // 1. Most Played Pool (sorted by play_count DESC)
    const mostPlayedPool = [...deviceFiltered].sort(
      (a, b) => (b.play_count || 0) - (a.play_count || 0)
    );

    // 2. Recent Pool (from user history)
    const recentPool: GameItem[] = [];
    for (const h of history) {
      const match = deviceFiltered.find((g) => g.id === h.id || g.slug === h.slug);
      if (match && !recentPool.some((p) => p.id === match.id)) {
        recentPool.push(match);
      }
    }

    // 3. Favorite Pool (from user likedIds)
    const favoritePool: GameItem[] = [];
    for (const id of likedIds) {
      const match = deviceFiltered.find((g) => g.id === id);
      if (match && !favoritePool.some((p) => p.id === match.id)) {
        favoritePool.push(match);
      }
    }

    // 4. Most Liked Pool (sorted by likes_count DESC)
    const mostLikedPool = [...deviceFiltered].sort(
      (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
    );

    // 5. New Games Pool (sorted by created_at DESC)
    const newPool = [...deviceFiltered].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    // 6. Featured Games Pool (from featuredGames or is_featured)
    const featuredPool: GameItem[] = [];
    for (const fg of featuredGames) {
      if (isMobileOrTablet && (fg.target_device || 'ALL').toUpperCase() === 'DESKTOP') continue;
      if (!featuredPool.some((p) => p.id === fg.id)) {
        featuredPool.push(fg);
      }
    }
    for (const g of deviceFiltered) {
      if (g.is_featured && !featuredPool.some((p) => p.id === g.id)) {
        featuredPool.push(g);
      }
    }

    // Helper: Pick unused unique game across pools in priority order
    const pickUnique = (...pools: GameItem[][]): GameItem | null => {
      for (const pool of pools) {
        for (const g of pool) {
          if (!usedIds.has(g.id)) {
            usedIds.add(g.id);
            return g;
          }
        }
      }
      return null;
    };

    // Pick Curated Games
    const mp1 = pickUnique(mostPlayedPool);
    const mp2 = pickUnique(mostPlayedPool);
    const rec1 = pickUnique(recentPool, mostPlayedPool);
    const rec2 = pickUnique(recentPool, mostPlayedPool);
    const fav1 = pickUnique(favoritePool, mostLikedPool, mostPlayedPool);
    const fav2 = pickUnique(favoritePool, mostLikedPool, mostPlayedPool);
    const liked1 = pickUnique(mostLikedPool, mostPlayedPool);
    const liked2 = pickUnique(mostLikedPool, mostPlayedPool);
    const new1 = pickUnique(newPool, mostPlayedPool);
    const new2 = pickUnique(newPool, mostPlayedPool);
    const feat1 = pickUnique(featuredPool, mostPlayedPool);
    const feat2 = pickUnique(featuredPool, mostPlayedPool);

    const addItem = (
      game: GameItem | null,
      size: CardSize,
      badge?: GridBadge
    ) => {
      if (!game) return;
      items.push({ game, size, badge });
    };

    if (isMobileOrTablet) {
      // MOBILE & TABLET (Strictly 2x2 and 1x1, ZERO 3x3):
      // Row 1-2 (6 units = 2 full rows on 3-col): #1 Most Played (2x2) + 2 Recent (1x1 each)
      addItem(mp1, 'medium', { text: '🔥 MOST PLAYED', type: 'hot' });
      addItem(
        rec1,
        'small',
        rec1 && (playedMap.has(rec1.id) || playedMap.has(rec1.slug))
          ? { text: 'CONTINUE', type: 'recent' }
          : { text: 'POPULAR', type: 'hot' }
      );
      addItem(
        rec2,
        'small',
        rec2 && (playedMap.has(rec2.id) || playedMap.has(rec2.slug))
          ? { text: 'CONTINUE', type: 'recent' }
          : { text: 'POPULAR', type: 'hot' }
      );

      // Row 3-4 (6 units = 2 full rows on 3-col): 2 Favorites (1x1 each) + #2 Most Played (2x2)
      addItem(
        fav1,
        'small',
        fav1 && likedIds.includes(fav1.id)
          ? { text: '❤️ FAVORITE', type: 'liked' }
          : { text: 'TOP RATED', type: 'fan' }
      );
      addItem(
        fav2,
        'small',
        fav2 && likedIds.includes(fav2.id)
          ? { text: '❤️ FAVORITE', type: 'liked' }
          : { text: 'TOP RATED', type: 'fan' }
      );
      addItem(mp2, 'medium', { text: '🔥 TOP PLAYED', type: 'hot' });

      // Row 5-6 (6 units = 2 full rows on 3-col): #1 Featured (2x2) + 2 Most Liked (1x1 each)
      addItem(feat1, 'medium', { text: '★ FEATURED', type: 'featured' });
      addItem(liked1, 'small', { text: '❤️ MOST LIKED', type: 'liked' });
      addItem(liked2, 'small', { text: '❤️ MOST LIKED', type: 'liked' });

      // Row 7 (3 units = 1 full row on 3-col): 2 New (1x1) + #2 Featured (1x1)
      addItem(new1, 'small', { text: '✨ NEW', type: 'new' });
      addItem(new2, 'small', { text: '✨ NEW', type: 'new' });
      addItem(feat2, 'small', { text: '★ FEATURED', type: 'featured' });
    } else {
      // DESKTOP GRID:
      // Flank top-left with 2 small cards
      addItem(
        rec1,
        'small',
        rec1 && (playedMap.has(rec1.id) || playedMap.has(rec1.slug))
          ? { text: 'CONTINUE', type: 'recent' }
          : { text: 'POPULAR', type: 'hot' }
      );
      addItem(
        rec2,
        'small',
        rec2 && (playedMap.has(rec2.id) || playedMap.has(rec2.slug))
          ? { text: 'CONTINUE', type: 'recent' }
          : { text: 'POPULAR', type: 'hot' }
      );

      // #1 Most Played Game in 3x3 Hero Card!
      addItem(mp1, 'hero', { text: '🔥 MOST PLAYED', type: 'hot' });

      // #2 Most Played Game in 2x2 Medium Card!
      addItem(mp2, 'medium', { text: '🔥 TOP PLAYED', type: 'hot' });

      // 2 Favorites
      addItem(
        fav1,
        'small',
        fav1 && likedIds.includes(fav1.id)
          ? { text: '❤️ FAVORITE', type: 'liked' }
          : { text: 'TOP RATED', type: 'fan' }
      );
      addItem(
        fav2,
        'small',
        fav2 && likedIds.includes(fav2.id)
          ? { text: '❤️ FAVORITE', type: 'liked' }
          : { text: 'TOP RATED', type: 'fan' }
      );

      // #1 Featured in 2x2 Medium Card
      addItem(feat1, 'medium', { text: '★ FEATURED', type: 'featured' });

      // 2 Most Liked Games
      addItem(liked1, 'small', { text: '❤️ MOST LIKED', type: 'liked' });
      addItem(liked2, 'small', { text: '❤️ MOST LIKED', type: 'liked' });

      // 2 New Games
      addItem(new1, 'small', { text: '✨ NEW', type: 'new' });
      addItem(new2, 'small', { text: '✨ NEW', type: 'new' });

      // #2 Featured Game
      addItem(feat2, 'small', { text: '★ FEATURED', type: 'featured' });
    }

    // 7. Remaining Top Games: filled randomly in 1x1 small tiles
    const remainingTopGames = mostPlayedPool.filter((g) => !usedIds.has(g.id));

    // Stable pseudo-random hash for variety in smaller tiles without SSR hydration mismatch
    const getGameHash = (g: GameItem) => {
      const str = g.id || g.slug || g.title;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const shuffledRemaining = [...remainingTopGames].sort((a, b) => {
      return (getGameHash(a) % 1000) - (getGameHash(b) % 1000);
    });

    const isMobileView = isMobileOrTablet && isDefaultView;
    const TARGET_LIMIT = isMobileView ? 54 : 180;

    for (const g of shuffledRemaining) {
      if (items.length >= TARGET_LIMIT) break;
      usedIds.add(g.id);
      items.push({
        game: g,
        size: 'small',
        badge: g.is_featured ? { text: '★ FEATURED', type: 'featured' } : undefined
      });
    }

    // 8. Grid Balancer: Ensure the bottom row is 100% full, even, and level!
    const effectiveCols = columnCount > 0 ? columnCount : (isMobileView ? 3 : 12);
    let totalUnits = 0;
    for (const it of items) {
      if (isMobileOrTablet) {
        totalUnits += (it.size === 'hero' || it.size === 'medium') ? 4 : 1;
      } else {
        totalUnits += it.size === 'hero' ? 9 : (it.size === 'medium' ? 4 : 1);
      }
    }

    const remainder = totalUnits % effectiveCols;
    if (remainder !== 0) {
      const needed = effectiveCols - remainder;
      let padAdded = 0;
      for (const g of shuffledRemaining) {
        if (!usedIds.has(g.id)) {
          usedIds.add(g.id);
          items.push({ game: g, size: 'small' });
          padAdded++;
          if (padAdded >= needed) break;
        }
      }
      if (padAdded < needed && items.length > 0) {
        for (let k = 0; padAdded < needed; k++) {
          const g = items[k % items.length]?.game;
          if (g) {
            items.push({ game: g, size: 'small' });
            padAdded++;
          }
        }
      }
    }

    return items;
  }, [allGames, featuredGames, history, likedIds, isDefaultView, isMobileOrTablet, columnCount, filteredRegularGames]);

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
    <section className={styles.gridContainer} ref={gridContainerRef}>
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
      <div className={styles.grid} ref={gridRef}>
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
                      alt={`${game.title} - Play Free Online ${game.category || 'HTML5'} Game on Gamesato`}
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
                  {item.badge ? (
                    <div className={styles.badgeContainer}>
                      <span className={`${styles.badge} ${
                        item.badge.type === 'hot' ? styles.badgeHot :
                        item.badge.type === 'new' ? styles.badgeNew :
                        item.badge.type === 'liked' ? styles.badgeLiked :
                        item.badge.type === 'recent' ? styles.badgeRecent :
                        item.badge.type === 'featured' ? styles.badgeFeatured :
                        styles.badgeFan
                      }`}>
                        {item.badge.text}
                      </span>
                    </div>
                  ) : getBadge(game, size === 'hero', size === 'medium', idx) ? (
                    <div className={styles.badgeContainer}>
                      {getBadge(game, size === 'hero', size === 'medium', idx)}
                    </div>
                  ) : null}

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
                        {(size !== 'small' || (game.likes_count ?? 0) > 0) && (
                          <span className={styles.statItem} title="Likes">
                            <Heart size={size === 'small' ? 10 : 12} className={styles.statHeart} fill="#f43f5e" />
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
