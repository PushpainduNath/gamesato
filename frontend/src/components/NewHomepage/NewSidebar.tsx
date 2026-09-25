'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Flame, 
  Sparkles, 
  Heart, 
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
  X,
  Info,
  BookOpen,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useUiStore } from '@/store/useUiStore';
import styles from './NewSidebar.module.css';

interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  icon?: string;
}

interface NewSidebarProps {
  categories: CategoryItem[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  favoritesCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isPinnedDesktop?: boolean;
}

export default function NewSidebar({
  categories = [],
  activeFilter,
  onSelectFilter,
  favoritesCount = 0,
  isOpenMobile = false,
  onCloseMobile,
  isPinnedDesktop = false
}: NewSidebarProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (isPinnedDesktop) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // Snappy, responsive hover response (60ms micro-debounce prevents accidental cursor swipes)
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 60);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
  };

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Lock body scroll on mobile when drawer is open
  React.useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  // Category Icon mapper with vibrant colorful palette
  const renderCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('action')) return <Zap size={18} color="#f59e0b" fill="#f59e0b" />;
    if (lower.includes('racing')) return <Car size={18} color="#ef4444" />;
    if (lower.includes('sport')) return <Trophy size={18} color="#10b981" />;
    if (lower.includes('puzzle')) return <Puzzle size={18} color="#8b5cf6" />;
    if (lower.includes('adventure')) return <Compass size={18} color="#06b6d4" />;
    if (lower.includes('arcade')) return <Gamepad2 size={18} color="#ec4899" />;
    if (lower.includes('board')) return <Dices size={18} color="#f97316" />;
    if (lower.includes('logic')) return <Brain size={18} color="#a855f7" />;
    if (lower.includes('number')) return <Hash size={18} color="#3b82f6" />;
    if (lower.includes('new')) return <Sparkles size={18} color="#14b8a6" />;
    if (lower.includes('popular')) return <Flame size={18} color="#f43f5e" />;
    return <Wand2 size={18} color="#94a3b8" />;
  };

  const handleItemClick = (action: () => void) => {
    action();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isExpandedDesktop = isHovered || isPinnedDesktop;

  return (
    <>
      {/* Mobile Drawer Dark Backdrop */}
      {isOpenMobile && (
        <div 
          className={styles.backdrop} 
          onClick={onCloseMobile} 
          aria-hidden="true" 
        />
      )}

      {/* Outer Wrapper: ONLY widens when explicitly pinned. On hover, stays 68px so main content (iframe, grid) NEVER resizes! */}
      <div className={`
        ${styles.sidebarWrapper} 
        ${isPinnedDesktop ? styles.sidebarWrapperPinned : ''}
        ${isOpenMobile ? styles.sidebarWrapperMobileOpen : ''}
      `}>
        <aside 
          className={`
            ${styles.sidebar} 
            ${isExpandedDesktop ? styles.sidebarExpanded : ''}
            ${isHovered && !isPinnedDesktop ? styles.sidebarFloatingHover : ''}
            ${isOpenMobile ? styles.sidebarMobileOpen : ''}
          `}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Mobile Drawer Top Header with Logo & Close Button */}
          <div className={styles.mobileDrawerHeader}>
            <Link 
              href="/" 
              onClick={() => onCloseMobile && onCloseMobile()} 
              className={styles.mobileDrawerLogoLink}
            >
              <Image 
                src="/logo-full.png" 
                alt="Gamesato" 
                width={132} 
                height={40} 
                className={styles.mobileDrawerLogoImg}
                priority
              />
            </Link>
            <button 
              type="button" 
              onClick={onCloseMobile} 
              className={styles.mobileDrawerCloseBtn}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Nav Area */}
          <div className={styles.sidebarScroll}>
            {/* Top Navigation */}
            <div className={styles.navGroup}>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleItemClick(() => onSelectFilter('All'));
                }}
                className={`${styles.navItem} ${activeFilter === 'All' ? styles.navItemActive : ''}`}
                title="Home - Play Free Online Games"
                style={{ textDecoration: 'none' }}
              >
                <div className={styles.navIconWrapper}>
                  <Home size={18} color="#a78bfa" />
                </div>
                <span className={styles.navLabel}>Home</span>
              </a>

              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectFilter('Popular'))}
                className={`${styles.navItem} ${activeFilter === 'Popular' ? styles.navItemActive : ''}`}
                title="Popular games"
              >
                <div className={styles.navIconWrapper}>
                  <Flame size={18} color="#f97316" fill="#f97316" />
                </div>
                <span className={styles.navLabel}>Popular games</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectFilter('New'))}
                className={`${styles.navItem} ${activeFilter === 'New' ? styles.navItemActive : ''}`}
                title="New arrivals"
              >
                <div className={styles.navIconWrapper}>
                  <Sparkles size={18} color="#38bdf8" fill="#38bdf8" />
                </div>
                <span className={styles.navLabel}>New arrivals</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectFilter('Favorites'))}
                className={`${styles.navItem} ${activeFilter === 'Favorites' ? styles.navItemActive : ''}`}
                title="Favorites"
              >
                <div className={styles.navIconWrapper}>
                  <Heart size={18} color="#f43f5e" fill="#f43f5e" />
                </div>
                <span className={styles.navLabel}>Favorites</span>
                {favoritesCount > 0 && (
                  <span className={styles.navBadge}>{favoritesCount}</span>
                )}
              </button>
            </div>

            <div className={styles.divider} />

            {/* CATEGORIES Section */}
            <div className={styles.navGroup}>
              {categories.map((cat) => {
                const isActive = activeFilter.toLowerCase() === cat.name.toLowerCase();
                return (
                  <Link
                    key={cat.slug || cat.name}
                    href={`/category/${cat.slug}`}
                    onClick={() => onCloseMobile && onCloseMobile()}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    title={cat.name}
                  >
                    <div className={styles.navIconWrapper}>
                      {renderCategoryIcon(cat.name)}
                    </div>
                    <span className={styles.navLabel}>{cat.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className={styles.divider} />

            {/* MORE / COMPANY Section */}
            <div className={styles.navGroup}>
              <Link
                href="/about"
                onClick={() => onCloseMobile && onCloseMobile()}
                className={`${styles.navItem} ${pathname === '/about' ? styles.navItemActive : ''}`}
                title="About Us"
              >
                <div className={styles.navIconWrapper}>
                  <Info size={18} color="#06b6d4" />
                </div>
                <span className={styles.navLabel}>About Us</span>
              </Link>

              <Link
                href="/blog"
                onClick={() => onCloseMobile && onCloseMobile()}
                className={`${styles.navItem} ${pathname.startsWith('/blog') ? styles.navItemActive : ''}`}
                title="Blog"
              >
                <div className={styles.navIconWrapper}>
                  <BookOpen size={18} color="#ec4899" />
                </div>
                <span className={styles.navLabel}>Blog</span>
              </Link>

              <Link
                href="/terms"
                onClick={() => onCloseMobile && onCloseMobile()}
                className={`${styles.navItem} ${pathname === '/terms' ? styles.navItemActive : ''}`}
                title="Terms & Conditions"
              >
                <div className={styles.navIconWrapper}>
                  <FileText size={18} color="#f59e0b" />
                </div>
                <span className={styles.navLabel}>Terms</span>
              </Link>

              <Link
                href="/privacy"
                onClick={() => onCloseMobile && onCloseMobile()}
                className={`${styles.navItem} ${pathname === '/privacy' ? styles.navItemActive : ''}`}
                title="Privacy Policy"
              >
                <div className={styles.navIconWrapper}>
                  <ShieldCheck size={18} color="#10b981" />
                </div>
                <span className={styles.navLabel}>Policy</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
