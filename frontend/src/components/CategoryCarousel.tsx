'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Translate from '@/components/Translate';
import { getImageUrl } from '@/lib/utils';
import styles from '../app/page.module.css';

interface Game {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_url: string;
  new_game_both_url?: string | null;
  play_count?: number;
  likes_count?: number;
}

interface CategoryCarouselProps {
  catName: string;
  catGames: Game[];
  categorySlugs: Record<string, string>;
  backendUrl?: string;
}

export default function CategoryCarousel({
  catName,
  catGames,
  categorySlugs,
}: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [catGames]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!catGames || catGames.length === 0) return null;

  const categorySlug = categorySlugs[catName.toLowerCase()] || catName.toLowerCase();
  const isVirtualCategory = catName === 'New' || catName === 'Popular' || catName === 'Favorites';
  const categoryLink = isVirtualCategory ? `/#category-${catName}` : `/category/${categorySlug}`;

  return (
    <div className={styles.categorySection} id={`category-${catName}`}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.categorySectionTitle}>
          <Translate textKey={`${catName.toLowerCase()}Games`} fallback={`${catName} Games`} />
        </h3>
        <Link href={categoryLink} className={styles.viewAllLink}>
          <Translate textKey="viewAll" fallback="VIEW ALL" />
        </Link>
      </div>

      <div className={styles.carouselOuterWrapper}>
        {canScrollLeft && (
          <div className={`${styles.navOverlay} ${styles.navOverlayLeft}`}>
            <button 
              className={`${styles.navBtn} ${styles.navBtnLeft}`} 
              onClick={() => scroll('left')}
              aria-label="Scroll Left"
            >
              <ChevronLeft size={34} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <div 
          className={styles.categoryCarousel} 
          ref={scrollRef}
          onScroll={checkScroll}
        >
          {catGames.map((game) => (
            <Link 
              key={game.id} 
              href={`/games/${game.slug}`} 
              className={`${styles.gameCard} ${catName === 'New' ? styles.verticalCard : styles.squareCard} glass glass-interactive`}
            >
              <div className={styles.thumbnailWrapper}>
                <img 
                  src={getImageUrl((catName === 'New' && game.new_game_both_url) ? game.new_game_both_url : game.thumbnail_url)} 
                  alt={game.title} 
                  className={styles.thumbnail}
                  loading="lazy"
                  decoding="async"
                />
                <div className={styles.mobileCardOverlay}>
                  <h4 className={styles.mobileCardTitle}>{game.title}</h4>
                </div>
              </div>
              <div className={styles.cardContent}>
                <h4 className={styles.gameTitle}>{game.title}</h4>
                <p className={styles.gameCategory}>{game.category}</p>
              </div>
            </Link>
          ))}
        </div>

        {canScrollRight && (
          <div className={`${styles.navOverlay} ${styles.navOverlayRight}`}>
            <button 
              className={`${styles.navBtn} ${styles.navBtnRight}`} 
              onClick={() => scroll('right')}
              aria-label="Scroll Right"
            >
              <ChevronRight size={34} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
