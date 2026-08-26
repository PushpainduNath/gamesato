'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Play, Heart, ChevronsRight } from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import Translate from '@/components/Translate';
import SortDropdown from '@/components/SortDropdown';
import { getImageUrl } from '@/lib/utils';
import styles from './page.module.css';

interface Game {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_url: string;
  play_count: number;
  likes_count: number;
}

const categoryMap: Record<string, { name: string; key: string; icon: string }> = {
  new: { name: 'New', key: 'newGames', icon: '/new.webp' },
  popular: { name: 'Popular', key: 'popularGames', icon: '/popular.webp' },
  racing: { name: 'Racing', key: 'racingGames', icon: '/racing.webp' },
  action: { name: 'Action', key: 'actionGames', icon: '/action.webp' },
  sport: { name: 'Sport', key: 'sportsGames', icon: '/sports.webp' },
  sports: { name: 'Sport', key: 'sportsGames', icon: '/sports.webp' },
  arcade: { name: 'Arcade', key: 'arcadeGames', icon: '/arcade.webp' },
  logic: { name: 'Logic', key: 'logicGames', icon: '/logic.webp' },
  number: { name: 'Number', key: 'numberGames', icon: '/number.webp' },
  adventure: { name: 'Adventure', key: 'adventureGames', icon: '/adventure.webp' },
  puzzle: { name: 'Puzzle', key: 'puzzleGames', icon: '/puzzle.webp' },
  board: { name: 'Board', key: 'boardGames', icon: '/board.webp' },
};

function formatCompactNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export default function CategoryClientView({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<any>(null);
  const [faqList, setFaqList] = useState<any[]>([]);
  
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const limit = 21;

  const categoryInfo = useMemo(() => {
    return categoryMap[slug] || {
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      key: slug,
      icon: '/arcade.webp',
    };
  }, [slug]);

  const categoryIconUrl = useMemo(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
    if (categoryData?.icon) {
      if (categoryData.icon.startsWith('/uploads/')) {
        return `${backendUrl}${categoryData.icon}`;
      }
      return categoryData.icon;
    }
    return categoryInfo.icon;
  }, [categoryData, categoryInfo]);

  useEffect(() => {
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    const categoryName = categoryInfo.name;
    const fetchUrl = `/api/games?category=${encodeURIComponent(categoryName)}&sort=${sort}&page=${page}&limit=${limit}`;

    fetch(fetchUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.games) {
          setGames(data.games);
          setTotalGames(data.total);
        }
      })
      .catch((err) => console.error('Failed to load games for category:', err))
      .finally(() => setLoading(false));
  }, [categoryInfo.name, sort, page]);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
    fetch(`${backendUrl}/api/categories`)
      .then((res) => res.json())
      .then((data: any[]) => {
        const found = data.find(c => c.slug.toLowerCase() === slug);
        if (found) {
          setCategoryData(found);
        }
      })
      .catch((err) => {
        console.error('Failed to load category details:', err);
      });
  }, [slug]);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
    fetch(`${backendUrl}/api/admin/content/pages/public/faq`)
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (!data) return;
        try {
          const parsed = JSON.parse(data.content || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFaqList(parsed);
          }
        } catch (e) {}
      })
      .catch(err => console.error('Failed to load FAQ list in category page:', err));
  }, []);

  const totalPages = Math.ceil(totalGames / limit);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPaginationButtons = () => {
    if (totalPages <= 1) return null;
    const buttons = [];

    buttons.push(
      <button 
        key="prev" 
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className={`${styles.pageBtn} ${styles.navArrowBtn}`}
        aria-label="Previous Page"
      >
        <ChevronLeft size={16} color="white" />
      </button>
    );

    buttons.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        className={`${styles.pageBtn} ${page === 1 ? styles.pageActive : ''}`}
      >
        1
      </button>
    );

    if (totalPages > 5) {
      if (page > 3) {
        buttons.push(<span key="dots-left" className={styles.dots}>...</span>);
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          buttons.push(
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`${styles.pageBtn} ${page === i ? styles.pageActive : ''}`}
            >
              {i}
            </button>
          );
        }
      }

      if (page < totalPages - 2) {
        buttons.push(<span key="dots-right" className={styles.dots}>...</span>);
      }
    } else {
      for (let i = 2; i < totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`${styles.pageBtn} ${page === i ? styles.pageActive : ''}`}
          >
            {i}
          </button>
        );
      }
    }

    buttons.push(
      <button
        key={totalPages}
        onClick={() => handlePageChange(totalPages)}
        className={`${styles.pageBtn} ${page === totalPages ? styles.pageActive : ''}`}
      >
        {totalPages}
      </button>
    );

    buttons.push(
      <button 
        key="next" 
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className={`${styles.pageBtn} ${styles.navArrowBtn}`}
        aria-label="Next Page"
      >
        <ChevronRight size={16} color="white" />
      </button>
    );

    return buttons;
  };

  const translatedCategory = t(categoryInfo.key as any) || categoryInfo.name;
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className={styles.contentArea}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/" className={styles.breadcrumbLink}>
            {t('home') || 'Home'}
          </Link>
          <ChevronsRight size={18} className={styles.breadcrumbDivider} />
          <span className={styles.breadcrumbCurrent}>{translatedCategory}</span>
        </nav>

        <div className={styles.categoryHeader}>
          <div className={styles.titleRow}>
            <div className={styles.categoryIconWrapper}>
              <img 
                src={categoryIconUrl} 
                alt={`${categoryInfo.name} Icon`} 
                className={styles.categoryIcon}
                onError={(e) => {
                  e.currentTarget.src = '/arcade.svg';
                }}
              />
            </div>
            <h2 className={styles.categoryTitle}>{translatedCategory}</h2>
          </div>

          <div className={styles.filterRow}>
            <SortDropdown 
              value={sort} 
              onChange={(newSort) => {
                setSort(newSort);
                setPage(1);
              }} 
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner} />
          </div>
        ) : games.length > 0 ? (
          <>
            <div className={styles.gamesGrid}>
              {games.map((game) => (
                <Link href={`/games/${game.slug}`} key={game.id} className={styles.gameCard}>
                  <div className={styles.thumbnailWrapper}>
                    <img 
                      src={getImageUrl(game.thumbnail_url)} 
                      alt={game.title} 
                      className={styles.thumbnailImg}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className={styles.cardOverlay}>
                      <h4 className={styles.overlayTitle}>
                        <Translate textKey={`game_${game.slug}_title`} fallback={game.title} />
                      </h4>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <span className={styles.cardCatLabel}>{game.category}</span>
                    <h3 className={styles.cardTitle}>
                      <Translate textKey={`game_${game.slug}_title`} fallback={game.title} />
                    </h3>
                    <div className={styles.cardStats}>
                      <span className={styles.statItem}>
                        <Play size={10} fill="currentColor" /> {formatCompactNumber(game.play_count)}
                      </span>
                      <span className={styles.statItem}>
                        <Heart size={10} fill="currentColor" /> {formatCompactNumber(game.likes_count)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                {renderPaginationButtons()}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <h3><Translate textKey="noGamesAvailable" fallback="No games available in this category" /></h3>
            <p><Translate textKey="checkBackLater" fallback="Try switching filter options or check back later!" /></p>
          </div>
        )}

        {categoryData?.content && (
          <div className={styles.bottomSectionWrapper}>
            <div className={styles.bottomSectionContainer}>
              <section className={`${styles.seoSection} glass`}>
                <div dangerouslySetInnerHTML={{ __html: categoryData.content }} />
              </section>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
