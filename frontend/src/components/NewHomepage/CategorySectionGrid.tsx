'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Play, 
  Heart,
  ArrowRight, 
  Puzzle, 
  Gamepad2, 
  Zap, 
  Compass, 
  Car, 
  Trophy, 
  Dices, 
  Brain, 
  Hash 
} from 'lucide-react';
import { formatCompactNumber, getImageUrl } from '@/lib/utils';
import { GameItem } from './PokiSquareGrid';
import styles from './CategorySectionGrid.module.css';

export interface CategoryWithGames {
  id: string;
  name: string;
  slug: string;
  count: number;
  games: GameItem[];
}

interface CategorySectionGridProps {
  category: CategoryWithGames;
  sectionIndex?: number;
  isMobile?: boolean;
}

type CardSize = 'hero' | 'medium' | 'small';

interface CategoryDisplayItem {
  game: GameItem;
  size: CardSize;
}

export default function CategorySectionGrid({ 
  category, 
  sectionIndex = 0,
  isMobile: isMobileProp = false 
}: CategorySectionGridProps) {
  // Category Icon mapper
  const renderCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('puzzle')) return <Puzzle size={18} color="#84cc16" fill="#84cc16" />;
    if (lower.includes('arcade')) return <Gamepad2 size={18} color="#a855f7" />;
    if (lower.includes('action')) return <Zap size={18} color="#f59e0b" fill="#f59e0b" />;
    if (lower.includes('adventure')) return <Compass size={18} color="#06b6d4" />;
    if (lower.includes('racing')) return <Car size={18} color="#ef4444" />;
    if (lower.includes('sport')) return <Trophy size={18} color="#eab308" fill="#eab308" />;
    if (lower.includes('board')) return <Dices size={18} color="#818cf8" />;
    if (lower.includes('logic')) return <Brain size={18} color="#ec4899" />;
    if (lower.includes('number')) return <Hash size={18} color="#10b981" />;
    return <Gamepad2 size={18} color="#a78bfa" />;
  };

  // Responsive device viewport check
  const [isMobileViewport, setIsMobileViewport] = React.useState(isMobileProp);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileViewport(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isMobile = isMobileViewport || isMobileProp;

  // Dynamically arrange items:
  // - On DESKTOP: Full Poki Bento with 3x3 Hero, 2x2 Medium, and 1x1 Small
  // - On MOBILE: Strictly 2nd size (Medium 2x2) and 3rd size (Small 1x1) - NO 3x3 Hero!
  const displayItems = React.useMemo<CategoryDisplayItem[]>(() => {
    const games = category.games || [];
    if (games.length === 0) return [];

    const pattern = Math.abs((sectionIndex ?? 0) + (category.name.charCodeAt(0) || 0)) % 4;
    const items: CategoryDisplayItem[] = [];

    if (!isMobile) {
      // Desktop: 3x3 Hero cards + 2x2 Medium + 1x1 Small
      if (pattern === 0) {
        games.forEach((game, idx) => {
          if (idx === 0) items.push({ game, size: 'hero' });
          else if (idx === 1 || idx === 8) items.push({ game, size: 'medium' });
          else items.push({ game, size: 'small' });
        });
      } else if (pattern === 1) {
        games.forEach((game, idx) => {
          if (idx === 3) items.push({ game, size: 'hero' });
          else if (idx === 0 || idx === 9) items.push({ game, size: 'medium' });
          else items.push({ game, size: 'small' });
        });
      } else if (pattern === 2) {
        games.forEach((game, idx) => {
          if (idx === 6) items.push({ game, size: 'hero' });
          else if (idx === 3 || idx === 10) items.push({ game, size: 'medium' });
          else items.push({ game, size: 'small' });
        });
      } else {
        games.forEach((game, idx) => {
          if (idx === 6) items.push({ game, size: 'hero' });
          else if (idx === 0 || idx === 3) items.push({ game, size: 'medium' });
          else items.push({ game, size: 'small' });
        });
      }
      return items;
    }

    // Mobile / Tablet: Strictly 2nd size (Medium 2x2) and 3rd size (Small 1x1)
    if (pattern === 0) {
      games.forEach((game, idx) => {
        if (idx === 0 || idx === 7 || idx === 14) items.push({ game, size: 'medium' });
        else items.push({ game, size: 'small' });
      });
    } else if (pattern === 1) {
      games.forEach((game, idx) => {
        if (idx === 2 || idx === 9 || idx === 16) items.push({ game, size: 'medium' });
        else items.push({ game, size: 'small' });
      });
    } else if (pattern === 2) {
      games.forEach((game, idx) => {
        if (idx === 1 || idx === 8 || idx === 15) items.push({ game, size: 'medium' });
        else items.push({ game, size: 'small' });
      });
    } else {
      games.forEach((game, idx) => {
        if (idx === 3 || idx === 10 || idx === 17) items.push({ game, size: 'medium' });
        else items.push({ game, size: 'small' });
      });
    }

    return items;
  }, [category.games, category.name, sectionIndex, isMobile]);

  // Section container ref
  const sectionRef = React.useRef<HTMLElement>(null);

  // When section is in focus (in viewport), flip 1 card every 2 seconds (pure DOM, 0 React re-renders!)
  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let isSectionInView = false;
    let observer: IntersectionObserver | null = null;

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          isSectionInView = entry.isIntersecting;
        },
        { threshold: 0.2 }
      );
      observer.observe(section);
    } else {
      isSectionInView = true;
    }

    // Stagger start slightly per category section so multiple visible sections don't flip in lockstep
    const initialDelay = 1000 + (sectionIndex % 4) * 450;
    let interval: NodeJS.Timeout | null = null;

    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (!isSectionInView) return;

        const secEl = sectionRef.current;
        if (!secEl) return;

        const cardEls = secEl.querySelectorAll<HTMLElement>('[data-category-card="true"]');
        if (!cardEls.length) return;

        // Take from visible first 6 cards in the horizontal strip (0 DOM reflows!)
        const maxVisible = Math.min(cardEls.length, 6);
        const candidates: HTMLElement[] = [];
        for (let i = 0; i < maxVisible; i++) {
          if (!cardEls[i].matches(':hover')) {
            candidates.push(cardEls[i]);
          }
        }

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
      }, 4200);
    }, initialDelay);

    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
      if (observer) observer.disconnect();
    };
  }, [sectionIndex]);

  // Theme mapper for distinct semi-transparent card layers
  const getThemeClass = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('puzzle')) return styles.themePuzzle;
    if (lower.includes('arcade')) return styles.themeArcade;
    if (lower.includes('action')) return styles.themeAction;
    if (lower.includes('adventure')) return styles.themeAdventure;
    if (lower.includes('racing')) return styles.themeRacing;
    if (lower.includes('sport')) return styles.themeSport;
    return styles.themeDefault;
  };

  if (displayItems.length === 0) {
    return null;
  }

  const themeClass = getThemeClass(category.name);

  return (
    <section ref={sectionRef} className={`${styles.container} ${themeClass}`}>
      {/* Ambient subtle color aura */}
      <div className={styles.ambientGlow} />

      {/* Category Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.categoryIconWrap}>
            {renderCategoryIcon(category.name)}
          </div>
          <div className={styles.titleWrap}>
            <h2 className={styles.sectionTitle}>{category.name} Games</h2>
            <span className={styles.gameCountBadge}>
              <span className={styles.countNum}>{category.count}+</span>
              <span className={styles.countWord}> Games</span>
            </span>
          </div>
        </div>

        {/* Subtle, minute View all link */}
        <Link 
          href={`/category/${category.slug}`} 
          className={styles.viewAllLink}
          title={`View all ${category.name} games`}
        >
          <span>View all</span>
          <ArrowRight size={13} className={styles.viewAllArrow} />
        </Link>
      </div>

      {/* 3-Row Modular Horizontal Bento Grid */}
      <div className={styles.grid}>
        {displayItems.map((item, idx) => {
          const { game, size } = item;

          let sizeClass = '';
          if (size === 'hero') sizeClass = styles.heroCard;
          else if (size === 'medium') sizeClass = styles.mediumCard;

          return (
            <Link
              key={`${category.id}-${game.id}-${idx}`}
              href={`/games/${game.slug}`}
              className={`${styles.card} ${sizeClass}`}
              title={`Play ${game.title}`}
              data-category-card="true"
            >
              <div className={styles.cardInner}>
                {/* Front Face: Game Cover & Details */}
                <div className={styles.cardFront}>
                  {/* Thumbnail Image */}
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
                      sizes={size === 'hero' ? '320px' : size === 'medium' ? '220px' : '110px'}
                      className={styles.cardImage}
                      priority={idx < 4}
                    />
                  </div>

                  {/* Gradient Overlay */}
                  <div className={styles.gradientOverlay} />

                  {/* Center Play Button Overlay for Hero and Medium Cards */}
                  {size !== 'small' && (
                    <div className={styles.playOverlay}>
                      <Play size={size === 'hero' ? 24 : 18} fill="#ffffff" />
                    </div>
                  )}

                  {/* Bottom Meta Content with Hover Game Title Reveal */}
                  <div className={styles.cardContent}>
                    <h3 className={styles.gameTitle}>{game.title}</h3>
                    <div className={styles.cardMeta} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {(size !== 'small' || (game.likes_count ?? 0) > 0) && (
                        <span className={styles.playBadge} title="Likes" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Heart size={8} fill="#f43f5e" color="#f43f5e" />
                          <span>{formatCompactNumber(game.likes_count || 0)}</span>
                        </span>
                      )}
                      <span className={styles.playBadge} title="Total Plays">
                        <Play size={8} className={styles.statPlay} fill="#a78bfa" />
                        <span>{formatCompactNumber(game.play_count || 0)}</span>
                      </span>
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
