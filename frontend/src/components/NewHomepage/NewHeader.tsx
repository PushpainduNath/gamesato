'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Wand2, User, Sparkles, Menu, X, Play, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUiStore } from '@/store/useUiStore';
import { getImageUrl, formatCompactNumber } from '@/lib/utils';
import styles from './NewHeader.module.css';

export interface HeaderGameItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_url: string;
  play_count?: number;
}

interface NewHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileMenu?: () => void;
  onToggleMenu?: () => void;
  isSidebarPinnedDesktop?: boolean;
  isMenuOpen?: boolean;
  featuredGames?: HeaderGameItem[];
}

export default function NewHeader({
  searchQuery,
  onSearchChange,
  onToggleMobileMenu,
  onToggleMenu,
  isSidebarPinnedDesktop = false,
  isMenuOpen = false,
  featuredGames = []
}: NewHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openProfileDrawer } = useUiStore();
  const [isSurprising, setIsSurprising] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [featuredList, setFeaturedList] = useState<HeaderGameItem[]>(featuredGames || []);
  const [searchResults, setSearchResults] = useState<HeaderGameItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Sync custom avatar from localStorage
  useEffect(() => {
    const syncAvatar = () => {
      if (typeof window !== 'undefined' && session?.user?.id) {
        const savedAvatar = localStorage.getItem(`customProfileAvatar_${session.user.id}`);
        setCustomAvatar(savedAvatar);
      } else {
        setCustomAvatar(null);
      }
    };
    syncAvatar();
    window.addEventListener('customProfileAvatarUpdated', syncAvatar);
    return () => {
      window.removeEventListener('customProfileAvatarUpdated', syncAvatar);
    };
  }, [session]);

  // Load featured games for instant display on search focus
  useEffect(() => {
    if (featuredGames && featuredGames.length > 0) {
      setFeaturedList(featuredGames.slice(0, 8));
    } else {
      fetch('/api/games?featured=true&limit=8')
        .then((r) => r.json())
        .then((d) => {
          if (d?.games?.length > 0) {
            setFeaturedList(d.games);
          }
        })
        .catch(() => {});
    }
  }, [featuredGames]);

  // Live debounced search as user types
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/games?search=${encodeURIComponent(query)}&limit=8`)
        .then((r) => r.json())
        .then((d) => {
          setSearchResults(d.games || []);
        })
        .catch((err) => {
          console.error('Search fetch error:', err);
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close floating search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Surprise Me random game launch
  const handleSurpriseMe = async () => {
    if (isSurprising) return;
    setIsSurprising(true);
    try {
      const res = await fetch('/api/games/random');
      const data = await res.json();
      if (data?.slug) {
        router.push(`/games/${data.slug}`);
      }
    } catch (err) {
      console.error('Surprise me error:', err);
    } finally {
      setIsSurprising(false);
    }
  };

  const getUserInitial = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return 'G';
  };

  const handleAvatarClick = () => {
    if (session?.user) {
      openProfileDrawer();
    } else {
      router.push('/login');
    }
  };

  const effectiveIsOpen = isMenuOpen || isSidebarPinnedDesktop;

  return (
    <header className={styles.header}>
      {/* 1. Left Section: Hamburger Button + Gamesato Brand Logo + Desktop Quote */}
      <div className={styles.leftSection}>
        {/* Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMenu || onToggleMobileMenu}
          className={`${styles.burgerBtn} ${effectiveIsOpen ? styles.burgerBtnActive : ''}`}
          aria-label={effectiveIsOpen ? 'Close menu' : 'Open menu'}
          title={effectiveIsOpen ? 'Close menu' : 'Open menu'}
        >
          <div className={`${styles.iconRotator} ${effectiveIsOpen ? styles.iconRotatorActive : ''}`}>
            <Menu 
              size={20} 
              className={`${styles.iconMenu} ${effectiveIsOpen ? styles.iconMenuHidden : ''}`} 
              color={effectiveIsOpen ? '#c4b5fd' : '#ffffff'} 
            />
            <X 
              size={20} 
              className={`${styles.iconClose} ${effectiveIsOpen ? styles.iconCloseVisible : ''}`} 
              color={effectiveIsOpen ? '#c4b5fd' : '#ffffff'} 
            />
          </div>
        </button>

        {/* Full Logo */}
        <Link href="/" className={styles.logoLink} aria-label="Gamesato Home">
          <Image
            src="/logo-full.png"
            alt="Gamesato"
            width={145}
            height={44}
            className={styles.logoImg}
            priority
          />
        </Link>

        {/* Desktop Quote */}
        <div className={styles.leftQuote}>
          <span>Your daily dose of <span className={styles.boldPlay}>play.</span></span>
          <span className={styles.starIcon}>✦</span>
        </div>
      </div>

      {/* 2. Middle Center Section: Prominent Centered Search Bar with Floating Dropdown */}
      <div ref={searchWrapperRef} className={styles.centerSection}>
        <div 
          className={`${styles.searchContainer} ${isSearchOpen ? styles.searchContainerActive : ''}`}
          onClick={() => {
            setIsSearchOpen(true);
            searchInputRef.current?.focus();
          }}
          suppressHydrationWarning
        >
          <Search size={16} className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search 1,000+ free online games..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSearchOpen(false);
                searchInputRef.current?.blur();
              }
            }}
            suppressHydrationWarning
          />

          {searchQuery ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <span className={styles.shortcutBadge}>/</span>
          )}
        </div>

        {/* Floating Games Dropdown Box */}
        {isSearchOpen && (
          <div className={styles.floatingDropdown} role="listbox">
            {/* Mode A: User is typing a Search Query */}
            {searchQuery.trim() ? (
              <>
                <div className={styles.dropdownHeader}>
                  <div className={styles.headerTitleGroup}>
                    <Search size={14} className={styles.dropdownHeaderIcon} />
                    <span className={styles.dropdownTitle}>Search Results</span>
                  </div>
                  <span className={styles.resultsBadge}>
                    {isSearching ? 'Searching...' : `${searchResults.length} found`}
                  </span>
                </div>

                {isSearching ? (
                  <div className={styles.loadingDropdown}>
                    <div className={styles.miniSpinner} />
                    <span>Searching games...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className={styles.gamesList}>
                    {searchResults.map((game) => (
                      <Link
                        href={`/games/${game.slug}`}
                        key={`search_${game.id}`}
                        className={styles.gameResultRow}
                        onClick={() => setIsSearchOpen(false)}
                      >
                        <div className={styles.thumbWrapper}>
                          <Image
                            src={getImageUrl(game.thumbnail_url)}
                            alt={game.title}
                            width={44}
                            height={44}
                            className={styles.gameThumb}
                            unoptimized
                          />
                        </div>
                        <div className={styles.gameInfo}>
                          <h4 className={styles.gameTitleText}>{game.title}</h4>
                          <span className={styles.gameCategoryText}>{game.category}</span>
                        </div>
                        <div className={styles.gameMeta}>
                          {game.play_count !== undefined && (
                            <span className={styles.playCountBadge}>
                              <Play size={10} fill="#a78bfa" color="#a78bfa" />
                              {formatCompactNumber(game.play_count || 0)}
                            </span>
                          )}
                          <span className={styles.playNowPill}>
                            Play
                            <ArrowRight size={12} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyResults}>
                    <p className={styles.emptyText}>No games found matching "{searchQuery}"</p>
                    <span className={styles.emptySubtext}>Try searching for popular terms like action, puzzle, or car</span>
                  </div>
                )}
              </>
            ) : (
              /* Mode B: Search is empty (just clicked) -> Show Featured Games & Quick Categories */
              <>
                {/* Quick Category Jump Tags */}
                <div className={styles.quickCategoriesSection}>
                  <span className={styles.quickLabel}>Popular Categories</span>
                  <div className={styles.quickTagsList}>
                    {['Action', 'Racing', 'Puzzle', 'Sports', 'Arcade', 'Adventure'].map((cat) => (
                      <Link
                        key={cat}
                        href={`/category/${cat.toLowerCase()}`}
                        className={styles.quickTag}
                        onClick={() => setIsSearchOpen(false)}
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Featured Games Header */}
                <div className={styles.dropdownHeader}>
                  <div className={styles.headerTitleGroup}>
                    <Sparkles size={15} color="#eab308" className={styles.dropdownHeaderIcon} />
                    <span className={styles.dropdownTitle}>Featured Games</span>
                  </div>
                  <span className={styles.handpickedBadge}>POPULAR NOW</span>
                </div>

                {/* Featured Games List */}
                <div className={styles.gamesList}>
                  {featuredList.slice(0, 6).map((game) => (
                    <Link
                      href={`/games/${game.slug}`}
                      key={`feat_${game.id}`}
                      className={styles.gameResultRow}
                      onClick={() => setIsSearchOpen(false)}
                    >
                      <div className={styles.thumbWrapper}>
                        <Image
                          src={getImageUrl(game.thumbnail_url)}
                          alt={game.title}
                          width={44}
                          height={44}
                          className={styles.gameThumb}
                          unoptimized
                        />
                      </div>
                      <div className={styles.gameInfo}>
                        <h4 className={styles.gameTitleText}>{game.title}</h4>
                        <span className={styles.gameCategoryText}>{game.category}</span>
                      </div>
                      <div className={styles.gameMeta}>
                        {game.play_count !== undefined && (
                          <span className={styles.playCountBadge}>
                            <Play size={10} fill="#a78bfa" color="#a78bfa" />
                            {formatCompactNumber(game.play_count || 0)}
                          </span>
                        )}
                        <span className={styles.playNowPill}>
                          Play
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Dropdown footer tip */}
            <div className={styles.dropdownFooter}>
              <span>Press <kbd className={styles.kbdKey}>Esc</kbd> to close</span>
              <span>Instant browser play • Zero downloads</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Controls: Surprise Me, Profile */}
      <div className={styles.rightControls}>
        <button
          type="button"
          onClick={handleSurpriseMe}
          disabled={isSurprising}
          className={styles.surpriseBtn}
          title="Surprise me with a random game!"
        >
          <Wand2 size={16} className={`${styles.surpriseIcon} ${isSurprising ? 'animate-spin' : ''}`} />
          <span className={styles.surpriseText}>
            {isSurprising ? 'Picking...' : 'Surprise me'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleAvatarClick}
          className={styles.avatarBtn}
          title={session ? 'Profile Settings' : 'Sign In'}
        >
          {customAvatar ? (
            <Image 
              src={customAvatar} 
              alt="Avatar" 
              width={40} 
              height={40} 
              unoptimized
              className={styles.avatarImg}
            />
          ) : session?.user?.image ? (
            <Image 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              width={40} 
              height={40} 
              unoptimized
              className={styles.avatarImg}
            />
          ) : session ? (
            <span>{getUserInitial()}</span>
          ) : (
            <User size={18} />
          )}
        </button>
      </div>
    </header>
  );
}
