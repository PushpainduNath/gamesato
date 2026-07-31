'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCompactNumber, getImageUrl } from '@/lib/utils';
import { useTranslation } from '@/store/useLanguageStore';
import styles from '../app/page.module.css';

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
}

interface FeaturedCarouselProps {
  featuredSlots: (Game | null)[];
}

export default function FeaturedCarousel({ featuredSlots: initialFeaturedSlots }: FeaturedCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [isPaused, setIsPaused] = useState(false);
  
  const validInitialSlots = (initialFeaturedSlots || []).filter((g): g is Game => Boolean(g));
  const [featuredSlots, setFeaturedSlots] = useState<Game[]>(validInitialSlots);
  
  const isProgrammaticScroll = useRef(false);
  const isResetting = useRef(false);

  // Sync state if props change from parent
  useEffect(() => {
    const valid = (initialFeaturedSlots || []).filter((g): g is Game => Boolean(g));
    setFeaturedSlots(valid);
  }, [initialFeaturedSlots]);

  // On mount / landing on home page, fetch latest featured list directly to bypass stale client cache
  useEffect(() => {
    let isMounted = true;
    const fetchLatestFeaturedOnLand = async () => {
      try {
        const res = await fetch(`/api/games?featured=true&limit=5&t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.games && isMounted) {
            const freshGames: Game[] = (data.games || []).filter((g: any): g is Game => Boolean(g));
            setFeaturedSlots(freshGames);
          }
        }
      } catch (err) {
        console.error('Failed to fetch updated featured list on landing:', err);
      }
    };

    fetchLatestFeaturedOnLand();
    return () => {
      isMounted = false;
    };
  }, []);

  if (featuredSlots.length === 0) {
    return null;
  }

  // Clone first and last items for infinite scroll transitions
  const slides = featuredSlots.length > 1
    ? [featuredSlots[featuredSlots.length - 1], ...featuredSlots, featuredSlots[0]]
    : featuredSlots;

  const [activeDOMIndex, setActiveDOMIndex] = useState(featuredSlots.length > 1 ? 1 : 0);

  // Mount effect to silently scroll to the first real slide (index 1) initially
  useEffect(() => {
    const container = containerRef.current;
    if (container && featuredSlots.length > 1) {
      isResetting.current = true;
      const cards = container.children;
      if (cards.length > 1) {
        const targetCard = cards[1] as HTMLElement;
        container.scrollLeft = targetCard.offsetLeft - container.offsetLeft - 16;
      }
    }
  }, [featuredSlots.length]);

  // Automatic slide transitions
  useEffect(() => {
    if (isPaused || featuredSlots.length <= 1) return;

    const interval = setInterval(() => {
      if (containerRef.current) {
        const scrollAmount = containerRef.current.clientWidth;
        containerRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, featuredSlots.length]);

  // Programmatic scroll effect to activeDOMIndex
  useEffect(() => {
    const container = containerRef.current;
    if (!container || featuredSlots.length <= 1) return;

    const cards = container.children;
    if (cards.length > activeDOMIndex) {
      const targetCard = cards[activeDOMIndex] as HTMLElement;
      if (targetCard) {
        isProgrammaticScroll.current = true;
        
        container.scrollTo({
          left: targetCard.offsetLeft - container.offsetLeft,
          behavior: isResetting.current ? 'auto' : 'smooth',
        });

        if (isResetting.current) {
          isResetting.current = false;
          isProgrammaticScroll.current = false;
        } else {
          // Wait for smooth scroll completion, then check boundaries and jump silently if needed
          const timer = setTimeout(() => {
            isProgrammaticScroll.current = false;
            
            const N = featuredSlots.length;
            if (activeDOMIndex === N + 1) {
              isResetting.current = true;
              setActiveDOMIndex(1);
            } else if (activeDOMIndex === 0) {
              isResetting.current = true;
              setActiveDOMIndex(N);
            }
          }, 600);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [activeDOMIndex, featuredSlots.length]);

  // Handle manual scrolls/swipes
  const handleScroll = () => {
    if (!containerRef.current || featuredSlots.length <= 1) return;

    if (isProgrammaticScroll.current) return;

    if (isResetting.current) {
      isResetting.current = false;
      return;
    }

    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const cards = container.children;

    let closestIndex = activeDOMIndex;
    let minDistance = Infinity;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const distance = Math.abs(card.offsetLeft - container.offsetLeft - 16 - scrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    if (closestIndex !== activeDOMIndex) {
      setActiveDOMIndex(closestIndex);
    }

    if (closestIndex === 0) {
      isProgrammaticScroll.current = true;
      const realLastCard = cards[featuredSlots.length] as HTMLElement;
      container.scrollLeft = realLastCard.offsetLeft - container.offsetLeft - 16;
      setActiveDOMIndex(featuredSlots.length);
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50);
    } else if (closestIndex === featuredSlots.length + 1) {
      isProgrammaticScroll.current = true;
      const realFirstCard = cards[1] as HTMLElement;
      container.scrollLeft = realFirstCard.offsetLeft - container.offsetLeft - 16;
      setActiveDOMIndex(1);
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50);
    }
  };

  // Logical pagination indicator index calculation
  let currentIndex = activeDOMIndex - 1;
  if (featuredSlots.length > 1) {
    if (activeDOMIndex === 0) {
      currentIndex = featuredSlots.length - 1;
    } else if (activeDOMIndex === featuredSlots.length + 1) {
      currentIndex = 0;
    }
  }

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={styles.featuredCarouselWrapper}>
      {featuredSlots.length > 1 && (
        <>
          <div className={`${styles.navOverlay} ${styles.navOverlayLeft}`}>
            <button 
              className={`${styles.navBtn} ${styles.navBtnLeft}`} 
              onClick={() => scrollFeatured('left')}
              aria-label="Previous Featured Game"
            >
              <ChevronLeft size={34} strokeWidth={2.5} />
            </button>
          </div>
          <div className={`${styles.navOverlay} ${styles.navOverlayRight}`}>
            <button 
              className={`${styles.navBtn} ${styles.navBtnRight}`} 
              onClick={() => scrollFeatured('right')}
              aria-label="Next Featured Game"
            >
              <ChevronRight size={34} strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}
      <div 
        className={styles.featuredCarousel}
        ref={containerRef}
        onScroll={handleScroll}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {slides.map((game, index) => {
          if (!game) return null;

          const thumbUrl = getImageUrl(game.thumbnail_url);
          const desktopImgUrl = getImageUrl(game.featured_desktop_url || game.thumbnail_url);
          const mobileImgUrl = getImageUrl(game.featured_mobile_url || game.new_game_both_url || game.thumbnail_url);

          return (
            <Link 
              key={`${game.id}-${index}`} 
              href={`/games/${game.slug}`} 
              className={`${styles.featuredCard} glass glass-interactive`}
            >
              <div className={styles.featuredThumbnailWrapper}>
                <img 
                  src={desktopImgUrl} 
                  alt={game.title} 
                  className={`${styles.featuredThumbnail} ${styles.desktopOnlyThumbnail}`} 
                  fetchPriority={index === 1 ? 'high' : 'low'}
                  loading={index === 1 ? 'eager' : 'lazy'}
                  decoding={index === 1 ? 'sync' : 'async'}
                />
                <img 
                  src={mobileImgUrl} 
                  alt={game.title} 
                  className={`${styles.featuredThumbnail} ${styles.mobileOnlyThumbnail}`} 
                  fetchPriority={index === 1 ? 'high' : 'low'}
                  loading={index === 1 ? 'eager' : 'lazy'}
                  decoding={index === 1 ? 'sync' : 'async'}
                />
                <div className={styles.featuredOverlay}>
                  <div className={styles.featuredOverlayBottom}>
                    <div className={styles.featuredTextContent}>
                      <span className={styles.featuredCategory}>{game.category}</span>
                      <h3 className={styles.featuredTitle}>
                        {t(`game_${game.slug}_title` as any) || game.title}
                      </h3>
                    </div>
                    <div className={styles.featuredStats}>
                      <span className={styles.featuredPlayCount}>
                        <Play size={10} fill="currentColor" /> {formatCompactNumber(game.play_count)}
                      </span>
                      <span className={styles.featuredLikesCount}>
                        <Heart size={10} fill="currentColor" /> {formatCompactNumber(game.likes_count)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {featuredSlots.length > 1 && (
        <div className={styles.carouselDots}>
          {featuredSlots.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveDOMIndex(index + 1)}
              className={`${styles.carouselDot} ${index === currentIndex ? styles.carouselDotActive : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
