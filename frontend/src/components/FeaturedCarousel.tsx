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
  const [activeDotIndex, setActiveDotIndex] = useState(0);

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
        const res = await fetch(`/api/games?featured=true&limit=8&t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.games && isMounted) {
            const freshGames: Game[] = (data.games || []).filter((g: any): g is Game => Boolean(g));
            if (freshGames.length > 0) {
              setFeaturedSlots(freshGames);
            }
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

  // Create 5 sets of slides for seamless 100% infinite scrolling without ever hitting container boundaries
  const slides = featuredSlots.length > 1
    ? [...featuredSlots, ...featuredSlots, ...featuredSlots, ...featuredSlots, ...featuredSlots]
    : featuredSlots;

  const N = featuredSlots.length;

  // Mount effect to scroll to the middle set (index 2 * N)
  useEffect(() => {
    const container = containerRef.current;
    if (container && N > 1) {
      const cards = container.children;
      if (cards.length >= 2 * N) {
        const targetCard = cards[2 * N] as HTMLElement;
        if (targetCard) {
          container.scrollLeft = targetCard.offsetLeft - container.offsetLeft - 16;
        }
      }
    }
  }, [N]);

  // Automatic slide transitions
  useEffect(() => {
    if (isPaused || N <= 1) return;

    const interval = setInterval(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        const firstCard = container.children[0] as HTMLElement;
        const scrollDistance = firstCard ? (firstCard.offsetWidth + 16) : (container.clientWidth / 3);
        
        container.scrollBy({
          left: scrollDistance,
          behavior: 'smooth',
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, N]);

  // Handle manual scroll and seamless infinite loop boundary jumping
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || N <= 1) return;

    const cards = container.children;
    if (cards.length < 5 * N) return;

    const firstCard = cards[0] as HTMLElement;
    const cardStep = firstCard ? (firstCard.offsetWidth + 16) : 300;

    const currentScroll = container.scrollLeft;
    const minScrollThreshold = (1 * N) * cardStep - 8;
    const maxScrollThreshold = (3 * N) * cardStep - 8;

    // Boundary jump check - triggered far before hitting container edges
    if (currentScroll >= maxScrollThreshold) {
      container.scrollLeft -= N * cardStep;
    } else if (currentScroll <= minScrollThreshold) {
      container.scrollLeft += N * cardStep;
    }

    // Active dot index calculation
    const currentMiddleScroll = container.scrollLeft;
    const rawIndex = Math.round((currentMiddleScroll - 16) / cardStep);
    const normalizedDot = ((rawIndex % N) + N) % N;
    setActiveDotIndex(normalizedDot);
  };

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const container = containerRef.current;
      const firstCard = container.children[0] as HTMLElement;
      const scrollDistance = firstCard ? (firstCard.offsetWidth + 16) : (container.clientWidth / 3);
      
      container.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth',
      });
    }
  };

  const scrollToDot = (dotIndex: number) => {
    if (!containerRef.current || N <= 1) return;
    const container = containerRef.current;
    const cards = container.children;
    const targetCardIndex = 2 * N + dotIndex;
    const targetCard = cards[targetCardIndex] as HTMLElement;
    if (targetCard) {
      container.scrollTo({
        left: targetCard.offsetLeft - container.offsetLeft - 16,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={styles.featuredCarouselWrapper}>
      <div className={styles.carouselCardsTrack}>
        {N > 1 && (
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
                    fetchPriority={index < 3 ? 'high' : 'low'}
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding={index < 3 ? 'sync' : 'async'}
                  />
                  <img 
                    src={mobileImgUrl} 
                    alt={game.title} 
                    className={`${styles.featuredThumbnail} ${styles.mobileOnlyThumbnail}`} 
                    fetchPriority={index < 3 ? 'high' : 'low'}
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding={index < 3 ? 'sync' : 'async'}
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
      </div>

      {N > 1 && (
        <div className={styles.carouselDots}>
          {featuredSlots.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToDot(index)}
              className={`${styles.carouselDot} ${index === activeDotIndex ? styles.carouselDotActive : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
