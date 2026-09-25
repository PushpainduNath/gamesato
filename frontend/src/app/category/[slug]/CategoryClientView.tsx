'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronsRight, 
  Play, 
  Heart, 
  RotateCcw,
  Zap,
  Car,
  Trophy,
  Puzzle,
  Compass,
  Gamepad2,
  Dices,
  Brain,
  Hash,
  Wand2,
  Coffee,
  HelpCircle
} from 'lucide-react';
import NewHeader from '@/components/NewHomepage/NewHeader';
import NewSidebar from '@/components/NewHomepage/NewSidebar';
import NewFooter from '@/components/NewHomepage/NewFooter';
import AdBanner from '@/components/AdBanner';
import { formatCompactNumber, getImageUrl } from '@/lib/utils';
import { usePlayHistoryList } from '@/lib/usePlayHistory';
import styles from './page.module.css';

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
  featured_desktop_url?: string | null;
  featured_mobile_url?: string | null;
  is_featured?: boolean;
}

type CardSize = 'hero' | 'medium' | 'small';

interface GridDisplayItem {
  game: GameItem;
  size: CardSize;
}

interface CategoryClientViewProps {
  slug: string;
  categories: CategoryItem[];
  categoryData?: {
    id?: string;
    name?: string;
    slug?: string;
    icon?: string;
    content?: string;
    meta_title?: string;
    meta_description?: string;
    faq?: string | null;
  } | null;
  favoritesCount?: number;
  initialGames?: GameItem[];
  initialTotal?: number;
  allGamesPool?: GameItem[];
}

// Category theme styling & taglines
const categoryThemes: Record<string, { color: string; glow: string; tagline: string }> = {
  racing: {
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.38)',
    tagline: 'High-speed drift, street racing, and extreme driving simulators online.',
  },
  action: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.38)',
    tagline: 'Intense combat, fast-paced shooting, and action-packed platformers.',
  },
  sport: {
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.38)',
    tagline: 'Compete in soccer, basketball, tennis, and championship sports games.',
  },
  sports: {
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.38)',
    tagline: 'Compete in soccer, basketball, tennis, and championship sports games.',
  },
  puzzle: {
    color: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.38)',
    tagline: 'Brain-teasing match-3, physics puzzles, and logic challenges.',
  },
  adventure: {
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.38)',
    tagline: 'Explore mysterious realms, dungeon quests, and epic narrative adventures.',
  },
  arcade: {
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.38)',
    tagline: 'Classic coin-op favorites, retro pixel runners, and nostalgic hits.',
  },
  board: {
    color: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.38)',
    tagline: 'Strategy chess, checkers, ludo, dominoes, and classic tabletop fun.',
  },
  logic: {
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.38)',
    tagline: 'Sharpen your mind with memory, deductive logic, and IQ tests.',
  },
  number: {
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.38)',
    tagline: 'Math puzzles, 2048, sudoku, and addictive number matching.',
  },
  jaadoo: {
    color: '#d946ef',
    glow: 'rgba(217, 70, 239, 0.38)',
    tagline: 'Magical spellcraft, fantasy wizardry, and enchanting mystery games.',
  },
  casual: {
    color: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.38)',
    tagline: 'Relaxing, bite-sized mini games perfect for a quick break.',
  },
};

// Lucide icon helper
function renderCategoryLucideIcon(slug: string, name: string) {
  const lower = (slug || name).toLowerCase();
  if (lower.includes('action')) return <Zap size={26} color="#f59e0b" fill="#f59e0b" />;
  if (lower.includes('racing')) return <Car size={26} color="#ef4444" />;
  if (lower.includes('sport')) return <Trophy size={26} color="#eab308" fill="#eab308" />;
  if (lower.includes('puzzle')) return <Puzzle size={26} color="#84cc16" fill="#84cc16" />;
  if (lower.includes('adventure')) return <Compass size={26} color="#06b6d4" />;
  if (lower.includes('arcade')) return <Gamepad2 size={26} color="#a855f7" />;
  if (lower.includes('board')) return <Dices size={26} color="#818cf8" />;
  if (lower.includes('logic')) return <Brain size={26} color="#ec4899" />;
  if (lower.includes('number')) return <Hash size={26} color="#10b981" />;
  if (lower.includes('jaadoo')) return <Wand2 size={26} color="#d946ef" fill="#d946ef" />;
  if (lower.includes('casual')) return <Coffee size={26} color="#fb923c" />;
  return <Gamepad2 size={26} color="#a78bfa" />;
}

// Poki Bento Mosaic Sizing Function
function generatePokiGridItems(games: GameItem[]): GridDisplayItem[] {
  if (games.length === 0) return [];
  if (games.length < 18) {
    return games.map((g) => ({ game: g, size: 'small' }));
  }

  const items: GridDisplayItem[] = [];
  const usedIds = new Set<string>();

  const findUnused = (): GameItem | null => {
    for (const g of games) {
      if (!usedIds.has(g.id)) return g;
    }
    return null;
  };

  // 1. Two small cards (top-left flank)
  for (let i = 0; i < 2; i++) {
    const g = findUnused();
    if (g) {
      items.push({ game: g, size: 'small' });
      usedIds.add(g.id);
    }
  }

  // 2. #1 Hero 3x3 Card (Only if >= 30 games in this slice, so rows around it are filled!)
  if (games.length >= 30) {
    const hero1 = findUnused();
    if (hero1) {
      items.push({ game: hero1, size: 'hero' });
      usedIds.add(hero1.id);
    }
  }

  // 3. Medium 2x2 Card
  const med1 = findUnused();
  if (med1) {
    items.push({ game: med1, size: 'medium' });
    usedIds.add(med1.id);
  }

  // 4. Three small cards
  for (let i = 0; i < 3; i++) {
    const g = findUnused();
    if (g) {
      items.push({ game: g, size: 'small' });
      usedIds.add(g.id);
    }
  }

  // 5. Interweave Medium (2x2) cards rhythmically every ~14 items,
  // BUT STRICTLY NEVER within the last 24 items of the slice!
  // This guarantees that the bottom rows are 100% small 1x1 cards!
  let countSinceLastMedium = 0;
  while (true) {
    const g = findUnused();
    if (!g) break;

    usedIds.add(g.id);
    const remaining = games.length - items.length;
    countSinceLastMedium++;

    if (countSinceLastMedium >= 14 && remaining >= 24) {
      items.push({ game: g, size: 'medium' });
      countSinceLastMedium = 0;
    } else {
      items.push({ game: g, size: 'small' });
    }
  }

  return items;
}

// Bottom Row Even Balancer:
// Slices target games, formats with Poki bento, and dynamically pads with small cards
// so that the total cells are an EXACT multiple of columnCount!
function getBalancedGrid(
  allAvailableGames: GameItem[],
  targetLimit: number,
  columnCount: number,
  fallbackPool: GameItem[] = []
): GridDisplayItem[] {
  if (allAvailableGames.length === 0) return [];
  if (columnCount <= 0) columnCount = 12;

  // 1. Take games for this slice
  const baseGames = allAvailableGames.slice(0, targetLimit);
  const bentoItems = generatePokiGridItems(baseGames);

  // 2. Calculate total units (cells)
  let totalUnits = 0;
  for (const item of bentoItems) {
    totalUnits += item.size === 'hero' ? 9 : item.size === 'medium' ? 4 : 1;
  }

  const remainder = totalUnits % columnCount;
  if (remainder === 0) {
    return bentoItems;
  }

  const needed = columnCount - remainder;
  const existingIds = new Set(bentoItems.map((it) => it.game.id));
  const newItems = [...bentoItems];

  let added = 0;
  // 3. Try to take extra games from remaining available games in the list
  for (let i = targetLimit; i < allAvailableGames.length && added < needed; i++) {
    const g = allAvailableGames[i];
    if (!existingIds.has(g.id)) {
      newItems.push({ game: g, size: 'small' });
      existingIds.add(g.id);
      added++;
    }
  }

  // 4. Try fallback pool if more needed
  if (added < needed) {
    for (const g of fallbackPool) {
      if (!existingIds.has(g.id)) {
        newItems.push({ game: g, size: 'small' });
        existingIds.add(g.id);
        added++;
        if (added >= needed) break;
      }
    }
  }

  // 5. If pool didn't have enough, reuse items from the top of the grid as 1x1 cards
  if (added < needed && bentoItems.length > 0) {
    for (let i = 0; added < needed; i++) {
      const g = bentoItems[i % bentoItems.length].game;
      newItems.push({ game: g, size: 'small' });
      added++;
    }
  }

  return newItems;
}

export default function CategoryClientView({
  slug,
  categories = [],
  categoryData = null,
  favoritesCount = 0,
  initialGames = [],
  initialTotal = 0,
  allGamesPool = [],
}: CategoryClientViewProps) {
  const router = useRouter();
  const { history, likedIds } = usePlayHistoryList();

  const [games, setGames] = useState<GameItem[]>(initialGames);
  const [totalGames, setTotalGames] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Slicing state: starts at 50 games, increments by 50 on "View More"
  const [categoryLimit, setCategoryLimit] = useState(50);
  const [moreGamesLimit, setMoreGamesLimit] = useState(50);

  // Dynamic Grid Column Count detection
  const [columnCount, setColumnCount] = useState(12);

  // Sidebar & Navigation states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinnedDesktop, setIsSidebarPinnedDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // FAQ open/close state
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0, 1]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Measure dynamic grid columns on window resize and mount
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        setColumnCount(3);
        return;
      }
      setIsMobile(false);

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
        const w = container.clientWidth;
        const count = Math.max(3, Math.floor((w + 10) / 106));
        setColumnCount(count);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && gridContainerRef.current) {
      ro = new ResizeObserver(() => {
        updateColumns();
      });
      ro.observe(gridContainerRef.current);
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

  const isMenuOpen = isMobile ? isMobileMenuOpen : isSidebarPinnedDesktop;
  const effectiveFavoritesCount = Math.max(favoritesCount, likedIds.length);

  // Category info resolution
  const categoryInfo = useMemo(() => {
    const matched = categories.find(
      (c) => c.slug.toLowerCase() === slug || c.name.toLowerCase() === slug
    );
    const resolvedName = matched?.name || categoryData?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
    const theme = categoryThemes[slug] || {
      color: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.35)',
      tagline: `Play the best free online ${resolvedName.toLowerCase()} games with no downloads.`,
    };

    return {
      name: resolvedName,
      slug,
      theme,
    };
  }, [slug, categories, categoryData]);

  // Fast lookup set for played games
  const playedSet = useMemo(() => {
    const set = new Set<string>();
    for (const h of history) {
      if (h.id) set.add(h.id);
      if (h.slug) set.add(h.slug);
    }
    return set;
  }, [history]);

  // Reset limits and sync games when slug or initialGames changes
  useEffect(() => {
    setGames(initialGames);
    setTotalGames(initialTotal);
    setCategoryLimit(50);
    setMoreGamesLimit(50);
    setSearchQuery('');
  }, [slug, initialGames, initialTotal]);

  // Priority Ordering:
  // 1. User recently played in this category
  // 2. Most played / created_at (preserved from API/DB)
  const prioritizedCategoryGames = useMemo(() => {
    let list = [...games];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }

    const playedInCat: GameItem[] = [];
    const restInCat: GameItem[] = [];

    for (const g of list) {
      if (playedSet.has(g.id) || playedSet.has(g.slug)) {
        playedInCat.push(g);
      } else {
        restInCat.push(g);
      }
    }

    return [...playedInCat, ...restInCat];
  }, [games, playedSet, searchQuery]);

  // Sliced & Balanced Category Items (100% Even Bottom Row guaranteed)
  const slicedCategoryItems = useMemo(() => {
    return getBalancedGrid(
      prioritizedCategoryGames,
      categoryLimit,
      columnCount,
      allGamesPool
    );
  }, [prioritizedCategoryGames, categoryLimit, columnCount, allGamesPool]);

  // Sliced & Balanced More Games Items (100% Even Bottom Row guaranteed)
  const slicedMoreItems = useMemo(() => {
    return getBalancedGrid(
      allGamesPool,
      moreGamesLimit,
      columnCount,
      prioritizedCategoryGames
    );
  }, [allGamesPool, moreGamesLimit, columnCount, prioritizedCategoryGames]);

  // Can show "View More" button checks:
  const canViewMoreCategory = prioritizedCategoryGames.length > categoryLimit;
  const canViewMoreMoreGames = allGamesPool.length > moreGamesLimit;

  // 3D Flip Animation Cycle (IntersectionObserver + 0 forced reflows)
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

  // Structured Questions & Answers (FAQ) for Category Page
  const resolvedFaqs = useMemo(() => {
    if (categoryData?.faq) {
      try {
        const parsed = JSON.parse(categoryData.faq);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            question: item.question || item.q || '',
            answer: item.answer || item.a || ''
          })).filter((item: any) => item.question && item.answer);
        }
      } catch (e) {}
    }

    const catName = categoryInfo.name;
    return [
      {
        question: `What are the best free ${catName} games on Gamesato?`,
        answer: `Our top recommended ${catName.toLowerCase()} games are featured right here at the top of this category. All titles are hand-picked, free to play, and run instantly in your web browser with zero downloads required.`
      },
      {
        question: `Can I play ${catName} games on mobile phones and tablets?`,
        answer: `Yes, 100%! All our ${catName.toLowerCase()} games are built with responsive HTML5 & WebGL technology, adapting automatically to touchscreens on iPhones, iPads, and Android devices, as well as desktop PCs.`
      },
      {
        question: `Do I need to download or install anything to play ${catName} games?`,
        answer: `No downloads, installations, or plugins are ever needed. Simply click any game card and start playing directly in modern browsers such as Google Chrome, Apple Safari, Microsoft Edge, and Firefox.`
      },
      {
        question: `Are these ${catName} games unblocked for school or office breaks?`,
        answer: `Yes! Gamesato runs over fast, lightweight HTTPS web protocols designed for instant access with minimal bandwidth, making it ideal for quick study sessions and leisure breaks.`
      },
      {
        question: `How often are new ${catName} games added?`,
        answer: `Our curation team updates the ${catName.toLowerCase()} games library every week with trending releases, player favorites, and acclaimed indie titles.`
      }
    ];
  }, [categoryData, categoryInfo]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';

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
        name: categoryInfo.name,
        item: `${siteUrl}/category/${slug}`,
      },
    ],
  };

  const faqSchema = {
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
  };

  // Card renderer helper
  const renderCard = (item: GridDisplayItem, idx: number, keyPrefix: string) => {
    const { game, size } = item;
    const isPlayed = playedSet.has(game.id) || playedSet.has(game.slug);

    let sizeClass = styles.card;
    if (size === 'hero') sizeClass = `${styles.card} ${styles.heroCard}`;
    else if (size === 'medium') sizeClass = `${styles.card} ${styles.mediumCard}`;

    return (
      <Link
        href={`/games/${game.slug}`}
        key={`${keyPrefix}_${game.id}_${idx}`}
        className={sizeClass}
        title={`Play ${game.title}`}
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
                  size !== 'small' && (game.featured_desktop_url || game.featured_mobile_url)
                    ? (game.featured_desktop_url || game.featured_mobile_url)!
                    : game.thumbnail_url
                )}
                alt={game.title}
                fill
                unoptimized
                sizes={size === 'hero' ? '400px' : size === 'medium' ? '250px' : '150px'}
                className={styles.cardImage}
                loading={idx < 12 ? 'eager' : 'lazy'}
                priority={idx < 4}
              />
            </div>

            <div className={styles.gradientOverlay} />

            <div className={styles.badgeContainer}>
              {size === 'hero' ? (
                <span className={`${styles.badge} ${styles.badgeFan}`}>★ FEATURED</span>
              ) : idx === 0 ? (
                <span className={`${styles.badge} ${styles.badgeHot}`}>HOT</span>
              ) : idx === 1 ? (
                <span className={`${styles.badge} ${styles.badgeNew}`}>NEW</span>
              ) : null}
            </div>

            <div className={styles.playOverlay}>
              <Play size={size === 'hero' ? 26 : size === 'medium' ? 20 : 16} fill="#ffffff" />
            </div>

            <div className={styles.cardContent}>
              <h3 className={styles.gameTitle}>{game.title}</h3>
              <div className={styles.cardMeta}>
                {size !== 'small' && (
                  <span className={styles.categoryLabel}>{game.category}</span>
                )}
                <div className={styles.statsWrapper}>
                  {size !== 'small' && (game.likes_count ?? 0) > 0 && (
                    <span className={styles.statItem} title="Likes">
                      <Heart size={11} className={styles.statHeart} fill="#f43f5e" />
                      <span>{formatCompactNumber(game.likes_count || 0)}</span>
                    </span>
                  )}
                  <span className={styles.statItem} title="Total Plays">
                    <Play size={8} className={styles.statPlay} fill="#a78bfa" />
                    <span>{formatCompactNumber(game.play_count || 0)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BACK FACE */}
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
  };

  return (
    <div className={styles.pageContainer}>
      <Script
        id="category-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="category-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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
          activeFilter={categoryInfo.name}
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
                Home
              </Link>
              <ChevronsRight size={15} className={styles.breadcrumbDivider} />
              <span className={styles.breadcrumbCurrent}>{categoryInfo.name}</span>
            </nav>

            {/* Category Hero Banner with Dynamic Glow */}
            <div className={styles.categoryHero}>
              <div 
                className={styles.ambientGlow}
                style={{
                  background: `radial-gradient(circle, ${categoryInfo.theme.glow} 0%, rgba(139, 92, 246, 0) 70%)`
                }}
              />

              <div className={styles.heroLeft}>
                <div 
                  className={styles.iconBox}
                  style={{
                    borderColor: categoryInfo.theme.color,
                    boxShadow: `0 0 24px ${categoryInfo.theme.glow}`
                  }}
                >
                  {renderCategoryLucideIcon(slug, categoryInfo.name)}
                </div>

                <div className={styles.heroMeta}>
                  <div className={styles.titleLine}>
                    <h1 className={styles.categoryTitle}>{categoryInfo.name} Games</h1>
                    <span 
                      className={styles.countBadge}
                      style={{
                        borderColor: categoryInfo.theme.color,
                        color: '#ffffff'
                      }}
                    >
                      {totalGames} GAMES
                    </span>
                  </div>
                  <p className={styles.categoryTagline}>
                    {categoryData?.meta_description || categoryInfo.theme.tagline}
                  </p>
                </div>
              </div>

              {/* Compact Meta right inside Banner */}
              <div className={styles.heroRight}>
                <span className={styles.showingPill}>
                  Showing {slicedCategoryItems.length} games
                </span>
                <div className={styles.statusIndicator}>
                  <span className={styles.liveDot} />
                  <span>INSTANT PLAY</span>
                </div>
              </div>
            </div>

            {/* Category Games Grid (Homepage Poki Bento Grid - 100% Even Bottom Row) */}
            {loading ? (
              <div className={styles.loadingWrapper}>
                <div className={styles.spinner} />
              </div>
            ) : slicedCategoryItems.length > 0 ? (
              <>
                <div className={styles.grid}>
                  {slicedCategoryItems.map((item, idx) => renderCard(item, idx, 'cat'))}
                </div>

                {/* View More Button for Category Games */}
                {canViewMoreCategory && (
                  <div className={styles.viewMoreWrapper}>
                    <button
                      type="button"
                      className={styles.viewMoreBtn}
                      onClick={() => setCategoryLimit((prev) => prev + 50)}
                    >
                      <span>View More {categoryInfo.name} Games</span>
                      <ChevronDown size={18} />
                    </button>
                  </div>
                )}

                {/* In-Grid Category Responsive Horizontal Ad */}
                <AdBanner type="horizontal" />
              </>
            ) : (
              <div className={styles.emptyState}>
                <h3 className={styles.emptyStateTitle}>No {categoryInfo.name} games found</h3>
                <p>Try switching filter options or explore our other games below.</p>
              </div>
            )}

            {/* SECTION: MORE GAMES TO PLAY (100% Even Bottom Row) */}
            {slicedMoreItems.length > 0 && (
              <section className={styles.allGamesSection} aria-label="More Games">
                <div className={styles.sectionHeader}>
                  <div className={styles.headerLeft}>
                    <h2 className={styles.sectionTitle}>
                      🎮 More Games to Play
                    </h2>
                    <span className={styles.sectionSubtitle}>
                      Top free online games across all categories
                    </span>
                  </div>
                  <div className={styles.statusIndicator}>
                    <span className={styles.liveDot} />
                    <span>ALL GAMES, ALL FREE</span>
                  </div>
                </div>

                <div className={styles.grid}>
                  {slicedMoreItems.map((item, idx) => renderCard(item, idx, 'more'))}
                </div>

                {/* View More Button for More Games */}
                {canViewMoreMoreGames && (
                  <div className={styles.viewMoreWrapper}>
                    <button
                      type="button"
                      className={styles.viewMoreBtn}
                      onClick={() => setMoreGamesLimit((prev) => prev + 50)}
                    >
                      <span>View More Games</span>
                      <ChevronDown size={18} />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Pre-FAQ In-Feed Horizontal Ad */}
            <AdBanner type="horizontal" />

            {/* SECTION: CATEGORY SEO CONTENT & FAQ ACCORDION */}
            <div className={styles.bottomSectionWrapper}>
              <div className={styles.categoryMiddleLayout}>
                <div className={styles.containerCard}>
                {/* 1. Category Description / Article Section */}
                <section className={styles.seoArticleSection} aria-label="About Category">
                  {categoryData?.content ? (
                    <div dangerouslySetInnerHTML={{ __html: categoryData.content }} />
                  ) : (
                    <div>
                      <h2>Play Free Online {categoryInfo.name} Games on Gamesato</h2>
                      <p>
                        Welcome to Gamesato&apos;s ultimate collection of free online <strong>{categoryInfo.name} games</strong>! 
                        Whether you are a casual player looking for a quick break or a gaming enthusiast seeking high-stakes challenges, 
                        our {categoryInfo.name.toLowerCase()} catalog offers hours of fun without needing to download or install anything.
                      </p>
                      <p>
                        All games on Gamesato run natively in modern web browsers with high-performance HTML5 and WebGL graphics. 
                        Enjoy seamless controls on smartphones, tablets, Chromebooks, and PCs wherever you are.
                      </p>
                    </div>
                  )}
                </section>

                {/* 2. Category FAQ Accordion Section */}
                {resolvedFaqs.length > 0 && (
                  <section className={styles.faqSection} aria-label="Frequently Asked Questions">
                    <div className={styles.faqHeader}>
                      <HelpCircle size={22} className={styles.faqHeaderIcon} />
                      <div>
                        <h3 className={styles.faqHeaderTitle}>Frequently Asked Questions</h3>
                        <span className={styles.faqHeaderSubtitle}>Everything you need to know about {categoryInfo.name} games</span>
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

              {/* Right Skyscraper Ad Column */}
              <aside className={styles.categoryAdCol}>
                <AdBanner type="skyscraper" />
              </aside>
            </div>
          </div>
          </div>

          {/* Footer */}
          <NewFooter />
        </main>
      </div>
    </div>
  );
}
