'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/store/useLanguageStore';
import styles from '../app/page.module.css';

interface CategoryBarProps {
  categories: string[];
}

export default function CategoryBar({ categories }: CategoryBarProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const activeCategoryRef = useRef('All');
  const { t } = useTranslation();

  const getCatTranslation = (catName: string) => {
    if (catName === 'All') return t('home');
    let key = catName;
    if (key === 'New') key = 'newGames';
    if (key === 'Popular') key = 'popularGames';
    if (key === 'Racing') key = 'racingGames';
    if (key === 'Action') key = 'actionGames';
    if (key === 'Sport') key = 'sportsGames';
    if (key === 'Arcade') key = 'arcadeGames';
    if (key === 'Logic') key = 'logicGames';
    if (key === 'Number') key = 'numberGames';
    if (key === 'Adventure') key = 'adventureGames';
    if (key === 'Puzzle') key = 'puzzleGames';
    if (key === 'Board') key = 'boardGames';
    if (key === 'Favorites') key = 'favoriteGames';
    // @ts-ignore
    return t(key) || catName;
  };

  const updateActiveCategory = (cat: string, isClick = false) => {
    if (activeCategoryRef.current !== cat) {
      activeCategoryRef.current = cat;
      setActiveCategory(cat);
      
      if (isClick) {
        if (cat === 'All') {
          window.history.pushState(null, '', window.location.pathname + window.location.search);
        } else {
          window.history.pushState(null, '', `#category-${cat}`);
        }
        window.dispatchEvent(new Event('hashchange'));
      } else {
        // Live URL update on scroll without history pollution or re-render jerk
        if (cat === 'All') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
          window.history.replaceState(null, '', `#category-${cat}`);
        }
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const cat = decodeURIComponent(hash.replace('#category-', ''));
        if (categories.includes(cat)) {
          if (activeCategoryRef.current !== cat) {
            activeCategoryRef.current = cat;
            setActiveCategory(cat);
          }
          return;
        }
      }
      if (activeCategoryRef.current !== 'All') {
        activeCategoryRef.current = 'All';
        setActiveCategory('All');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [categories]);

  // Set up IntersectionObserver to update active category button smoothly as user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const cat = id.replace('category-', '');
            updateActiveCategory(cat, false);
          }
        });
      },
      {
        rootMargin: '-15% 0px -60% 0px',
      }
    );

    categories.forEach((cat) => {
      if (cat === 'All') return;
      const el = document.getElementById(`category-${cat}`);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [categories]);

  const handleCategoryClick = (cat: string) => {
    updateActiveCategory(cat, true);
    if (cat === 'All') {
      const el = document.getElementById('explore');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const el = document.getElementById(`category-${cat}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={styles.categoryBar}>
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`${styles.categoryBtn} ${isActive ? styles.activeCategoryBtn : ''}`}
          >
            {getCatTranslation(cat)}
          </button>
        );
      })}
    </div>
  );
}
