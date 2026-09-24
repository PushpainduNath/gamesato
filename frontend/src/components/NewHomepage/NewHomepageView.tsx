'use client';

import React, { useState } from 'react';
import NewSidebar from './NewSidebar';
import NewHeader from './NewHeader';
import NewHero from './NewHero';
import PokiSquareGrid, { GameItem } from './PokiSquareGrid';
import NewFooter from './NewFooter';
import SeoFaqSection from './SeoFaqSection';
import CategorySectionGrid, { CategoryWithGames } from './CategorySectionGrid';
import { usePlayHistoryList } from '@/lib/usePlayHistory';
import styles from './NewHomepageView.module.css';

interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
}

interface NewHomepageViewProps {
  featuredGames: GameItem[];
  allGames: GameItem[];
  categories: CategoryItem[];
  categorySections?: CategoryWithGames[];
  favoritesCount?: number;
  totalGamesCount: number;
  faqList?: { question: string; answer: string }[];
  homeContent?: string;
  isMobileServer?: boolean;
}

export default function NewHomepageView({
  featuredGames = [],
  allGames = [],
  categories = [],
  categorySections = [],
  favoritesCount = 0,
  totalGamesCount = 0,
  faqList = [],
  homeContent = '',
  isMobileServer = false
}: NewHomepageViewProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinnedDesktop, setIsSidebarPinnedDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileServer || false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(isMobileServer || false);
  const { likedIds } = usePlayHistoryList();

  // Detect mobile & tablet screen for responsive header and device-optimized grids
  React.useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Restore saved desktop pinned state from localStorage
  React.useEffect(() => {
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

  const handleSelectFilter = (filter: string) => {
    setActiveFilter(filter);
    setIsMobileMenuOpen(false);
    // Smooth scroll slightly down to the grid if filter changed
    if (typeof window !== 'undefined' && window.scrollY > 150) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const memoizedMainContent = React.useMemo(() => (
    <main className={styles.mainContent}>
      {/* Micro Hero with Filter Pills */}
      <NewHero
        totalGamesCount={totalGamesCount}
        categories={categories}
        activeFilter={activeFilter}
        onSelectFilter={handleSelectFilter}
      />

      {/* Poki Bento Grid (Strictly 1:1 Squares) */}
      <PokiSquareGrid
        featuredGames={featuredGames}
        allGames={allGames}
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        categories={categories}
        isMobileOrTablet={isMobileOrTablet}
      />

      {/* Top 4 Category Sections (3 rows of games each, with 3 box sizes + View all link) */}
      {activeFilter === 'All' && !searchQuery.trim() && categorySections && categorySections.length > 0 && (
        <div className={styles.categorySectionsWrapper}>
          {categorySections.map((cat, idx) => (
            <CategorySectionGrid key={cat.id} category={cat} sectionIndex={idx} isMobile={isMobile} />
          ))}
        </div>
      )}

      {/* SEO & Interactive FAQ Section (Full-Width End-to-End) */}
      <SeoFaqSection
        faqList={faqList}
        homeContent={homeContent}
      />

      {/* Footer */}
      <NewFooter />
    </main>
  ), [
    totalGamesCount,
    categories,
    activeFilter,
    featuredGames,
    allGames,
    searchQuery,
    categorySections,
    faqList,
    homeContent,
    isMobileOrTablet,
    isMobile
  ]);

  return (
    <div className={styles.pageContainer}>
      {/* 1. Full-Width Sticky Header */}
      <NewHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMenu={handleToggleMenu}
        onToggleMobileMenu={handleToggleMenu}
        isSidebarPinnedDesktop={isSidebarPinnedDesktop}
        isMenuOpen={isMenuOpen}
        featuredGames={featuredGames}
      />

      {/* 2. Main Content Body Area with Left Sidebar Rail / Mobile Drawer */}
      <div className={styles.bodyWrapper}>
        <NewSidebar
          categories={categories}
          activeFilter={activeFilter}
          onSelectFilter={handleSelectFilter}
          favoritesCount={effectiveFavoritesCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isPinnedDesktop={isSidebarPinnedDesktop}
        />

        {/* 3. Main Content Feed */}
        {memoizedMainContent}
      </div>
    </div>
  );
}
