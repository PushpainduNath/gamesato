'use client';

import React from 'react';
import { 
  Sparkles, 
  Zap, 
  Car, 
  Trophy, 
  Puzzle, 
  Compass, 
  Gamepad2, 
  Dices, 
  Brain,
  Coffee,
  Hash,
  Wand2
} from 'lucide-react';
import styles from './NewHero.module.css';

interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
}

interface NewHeroProps {
  totalGamesCount: number;
  categories: CategoryItem[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export default function NewHero({
  totalGamesCount,
  categories,
  activeFilter,
  onSelectFilter
}: NewHeroProps) {

  const getPillIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower === 'all') return <Sparkles size={14} color="#38bdf8" fill="#38bdf8" />;
    if (lower.includes('action')) return <Zap size={14} color="#f59e0b" fill="#f59e0b" />;
    if (lower.includes('racing')) return <Car size={14} color="#ef4444" />;
    if (lower.includes('sport')) return <Trophy size={14} color="#eab308" fill="#eab308" />;
    if (lower.includes('puzzle')) return <Puzzle size={14} color="#84cc16" fill="#84cc16" />;
    if (lower.includes('adventure')) return <Compass size={14} color="#06b6d4" />;
    if (lower.includes('arcade')) return <Gamepad2 size={14} color="#a855f7" />;
    if (lower.includes('board')) return <Dices size={14} color="#818cf8" />;
    if (lower.includes('logic')) return <Brain size={14} color="#ec4899" />;
    if (lower.includes('number')) return <Hash size={14} color="#10b981" />;
    if (lower.includes('jaadoo')) return <Wand2 size={14} color="#d946ef" fill="#d946ef" />;
    if (lower.includes('casual')) return <Coffee size={14} color="#fb923c" />;
    return <Gamepad2 size={14} color="#a78bfa" />;
  };

  return (
    <section className={styles.hero}>
      {/* Main title & game count */}
      <div className={styles.headingRow}>
        <div className={styles.titleWrapper}>
          <div className={styles.topBadge}>
            <span className={styles.badgeDot} />
            <span>Good times start here</span>
          </div>
          <h1 className={styles.title}>
            Less scrolling. <span className={styles.titleSubtitle}>More playing.</span>
          </h1>
        </div>

        {totalGamesCount > 0 && (
          <div className={styles.gameCountBadge}>
            <span className={styles.gameCountNumber}>
              {totalGamesCount.toLocaleString()} games.
            </span> Endless possibilities.
          </div>
        )}
      </div>

      {/* Category Pills Horizontal Scroll */}
      <div className={styles.filterScrollWrapper}>
        <button
          type="button"
          onClick={() => onSelectFilter('All')}
          className={`${styles.pill} ${activeFilter === 'All' ? styles.pillActive : ''}`}
        >
          {getPillIcon('all')}
          <span>All games</span>
        </button>

        {categories.map((cat) => {
          const isActive = activeFilter.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.slug || cat.name}
              type="button"
              onClick={() => onSelectFilter(cat.name)}
              className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
            >
              {getPillIcon(cat.name)}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
