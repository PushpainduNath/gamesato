'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import { 
  LogOut, Heart, X, Menu, Gamepad2, 
  Search, Mic, ChevronDown, User, ArrowLeft, ChevronLeft,
  Sun, Moon, Star, ChevronRight
} from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { useTranslation } from '@/store/useLanguageStore';
import styles from './Header.module.css';
import { formatCompactNumber, getImageUrl } from '@/lib/utils';

const dropdownLanguages = [
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'de', label: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'es', label: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'fr', label: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'id', label: 'Indonesia', flag: 'https://flagcdn.com/w40/id.png' },
];

function HeaderContent() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSidebarOpen, isMenuIconCross, toggleSidebar, closeSidebar, openProfileDrawer } = useUiStore();
  const { t, language, setLanguage } = useTranslation();

  const getLangInfo = () => {
    const found = dropdownLanguages.find((l) => l.code === language);
    if (found) {
      const codeUpper = found.code.toUpperCase();
      const shortLabel = codeUpper === 'EN' ? 'EN(US)' : codeUpper;
      return { label: shortLabel, flag: found.flag };
    }
    return { label: 'EN(US)', flag: 'https://flagcdn.com/w40/us.png' };
  };
  const langInfo = getLangInfo();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedForQuery, setSearchedForQuery] = useState('');
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Sync custom avatar from localStorage on route or auth state updates
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
  }, [pathname, session]);

  useEffect(() => {
    if (document.documentElement.classList.contains('light-theme')) {
      setTheme('light');
    }
    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.classList.contains('light-theme');
      setTheme(isLight ? 'light' : 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [featuredGames, setFeaturedGames] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const lastSearchQueryRef = useRef('');

  // Fetch 3 featured games for search dropdown
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch(`/api/games?featured=true&limit=3&t=${Date.now()}`, {
          cache: 'no-store'
        });
        const data = await res.json();
        if (data && data.games) {
          setFeaturedGames(data.games);
        }
      } catch (err) {
        console.error('Failed to fetch featured games for search dropdown:', err);
      }
    }
    fetchFeatured();
  }, []);

  // 300ms Debounced Progressive Search Technique for Live Autocomplete Results
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setSearchResults([]);
      setSearchedForQuery('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games?search=${encodeURIComponent(trimmedQuery)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.games || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Failed to perform debounced search:', err);
        setSearchResults([]);
      } finally {
        setSearchedForQuery(trimmedQuery);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

  // Initialize Speech Recognition in browser client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          setVoiceFeedback(null);
          setIsSearchFocused(true);
          if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSearchQuery(transcript);
          setVoiceFeedback(null);
          setIsSearchFocused(true);
          if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setIsMobileSearchExpanded(true);
          }
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 50);
        };

        rec.onerror = (event: any) => {
          setIsListening(false);
          let message = '';
          if (event.error === 'no-speech') {
            message = 'No speech detected, try again...';
          } else if (event.error === 'not-allowed') {
            message = 'Microphone access denied';
          } else if (event.error !== 'aborted') {
            message = 'Voice recognition failed, try again...';
            console.warn('Speech recognition status:', event.error);
          }

          if (message) {
            setVoiceFeedback(message);
            if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = setTimeout(() => {
              setVoiceFeedback(null);
            }, 4000);
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecognition(rec);
      }
    }
  }, [router]);

  const startVoiceSearch = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    setIsSearchFocused(true);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsMobileSearchExpanded(true);
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const displayedGames = searchQuery.trim() ? searchResults : featuredGames;

  const unfocusSearch = () => {
    setIsSearchFocused(false);
    setSelectedIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Reset selected search index when search query or focus state changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery, isSearchFocused]);

  // Auto-scroll selected search item into view
  useEffect(() => {
    if (selectedIndex >= 0 && searchListRef.current) {
      const activeChild = searchListRef.current.children[selectedIndex] as HTMLElement;
      if (activeChild) {
        activeChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchFocused || displayedGames.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayedGames.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedGames.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < displayedGames.length) {
        const selectedGame = displayedGames[selectedIndex];
        if (selectedGame) {
          unfocusSearch();
          router.push(`/games/${selectedGame.slug}`);
        }
      } else {
        setSelectedIndex(0);
      }
    } else if (e.key === 'Escape') {
      unfocusSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (searchParams.get('search')) {
      router.push('/');
    }
  };

  // Sync search input from searchParams without page scroll
  useEffect(() => {
    const queryVal = searchParams.get('search') || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery(queryVal);
  }, [searchParams]);

  // Close sidebar, mobile search overlay, and search dropdown only on page pathname changes (e.g. navigating to details/favorites)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      closeSidebar();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileSearchExpanded(false);
    unfocusSearch();
  }, [pathname, closeSidebar]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (searchFormRef.current && !searchFormRef.current.contains(event.target as Node)) {
        unfocusSearch();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle gameplay, language, and profile page exclusion
  if (pathname.includes('/play') || pathname.includes('/language') || pathname.startsWith('/profile')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < displayedGames.length) {
      const selectedGame = displayedGames[selectedIndex];
      if (selectedGame) {
        unfocusSearch();
        router.push(`/games/${selectedGame.slug}`);
      }
    } else if (displayedGames.length > 0) {
      setSelectedIndex(0);
    }
  };

  const handleProviderLogin = (provider: string) => {
    signIn(provider);
    setModalOpen(false);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.leftHeaderSection}>
          {/* Left Logo */}
          <Link href="/" className={styles.logoArea} title="Gamesato" aria-label="Gamesato">
            <img 
              src={theme === 'light' ? '/light_logo_withoutbg.png' : '/dark_logo_withoutbg.png'} 
              alt="Gamesato Logo" 
              className={styles.logo} 
              onError={(e) => { e.currentTarget.src = theme === 'light' ? '/logo-light-theme.png' : '/logo-dark-theme.png'; }}
            />
            <span className={styles.logoText}>
              Game<span className={styles.logoTextSato}>sato</span>
            </span>
          </Link>
        </div>

        {/* Center Search bar */}
        <form onSubmit={handleSearchSubmit} className={styles.searchForm} ref={searchFormRef}>
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder={voiceFeedback ? voiceFeedback : isListening ? "Listening... Speak now" : "Search games"}
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              suppressHydrationWarning
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className={styles.clearBtn}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`${styles.micBtn} ${isListening ? styles.micBtnListening : ''}`}
              title={isListening ? "Listening..." : "Voice Search"}
            >
              <Mic size={18} className={styles.micIconInner} />
            </button>
          </div>

          {isSearchFocused && (
            <div className={styles.searchDropdown}>
              {searchQuery.trim() ? (
                <>
                  <h3 className={styles.searchDropdownHeader}>
                    <Search size={20} color="#14b8a6" className={styles.searchDropdownStar} />
                    <span>Search Results</span>
                    {isSearching && (
                      <span className={styles.searchingBadge}>Searching...</span>
                    )}
                  </h3>
                  <div className={styles.searchDropdownList} ref={searchListRef}>
                    {searchResults.length > 0 ? (
                      searchResults.map((game, idx) => {
                        const thumbUrl = getImageUrl(game.thumbnail_url);
                        const isSelected = idx === selectedIndex;

                        return (
                          <Link 
                            key={game.id}
                            href={`/games/${game.slug}`}
                            className={`${styles.searchDropdownItem} ${isSelected ? styles.searchDropdownItemSelected : ''}`}
                            onClick={unfocusSearch}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className={styles.searchDropdownItemLeft}>
                              <img src={thumbUrl} alt={game.title} className={styles.searchDropdownThumb} />
                              <div className={styles.searchDropdownMeta}>
                                <span className={styles.searchDropdownTitle}>{game.title}</span>
                                <span className={styles.searchDropdownPlays}>
                                  <span>{game.category}</span>
                                  <span className={styles.dotSeparator}>•</span>
                                  <span>{formatCompactNumber(game.play_count)} plays</span>
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={20} className={styles.searchDropdownChevron} />
                          </Link>
                        );
                      })
                    ) : (searchQuery.trim() === searchedForQuery && !isSearching) ? (
                      <div className={styles.searchEmptyState}>
                        No games found for "{searchQuery}"
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                featuredGames.length > 0 && (
                  <>
                    <h3 className={styles.searchDropdownHeader}>
                      <Star size={20} fill="#FFD700" color="#FFD700" className={styles.searchDropdownStar} />
                      {t('featuredGames' as any) || 'Featured Games'}
                    </h3>
                    <div className={styles.searchDropdownList} ref={searchListRef}>
                      {featuredGames.map((game, idx) => {
                        const thumbUrl = getImageUrl(game.thumbnail_url);
                        const isSelected = idx === selectedIndex;

                        return (
                          <Link 
                            key={game.id}
                            href={`/games/${game.slug}`}
                            className={`${styles.searchDropdownItem} ${isSelected ? styles.searchDropdownItemSelected : ''}`}
                            onClick={unfocusSearch}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className={styles.searchDropdownItemLeft}>
                              <img src={thumbUrl} alt={game.title} className={styles.searchDropdownThumb} />
                              <div className={styles.searchDropdownMeta}>
                                <span className={styles.searchDropdownTitle}>{game.title}</span>
                                <span className={styles.searchDropdownPlays}>
                                  <span>{formatCompactNumber(game.play_count)} plays</span>
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={20} className={styles.searchDropdownChevron} />
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )
              )}
            </div>
          )}
        </form>

        {/* Right Actions */}
        <div className={styles.rightActions}>
          {/* Mobile Search Toggle Button */}
          <button 
            className={styles.mobileSearchToggleBtn}
            onClick={() => setIsMobileSearchExpanded(true)}
            aria-label="Open search"
            title="Search"
          >
            <img src="/search-icon.svg" alt="Search" className={styles.mobileActionIcon} />
          </button>

          {/* User profile avatar / Login button */}
          <div className={styles.profileArea} ref={dropdownRef}>
            {status === 'loading' ? (
              <div className="pulse" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>...</div>
            ) : session ? (
              <button 
                className={styles.avatarBtn} 
                onClick={() => {
                  if (window.innerWidth > 768) {
                    openProfileDrawer();
                  } else {
                    router.push('/profile');
                  }
                }}
              >
                <img 
                  src={customAvatar || session.user?.image || '/defaultprofileicon.jpeg'} 
                  alt={session.user?.name || 'User'} 
                  className={styles.avatarImg} 
                />
              </button>
            ) : (
              <button className={styles.avatarBtn} onClick={() => router.push('/login')} title={t('signIn' as any) || 'Sign In'}>
                <img src="/defaultprofileicon.jpeg" alt="Profile" className={styles.avatarImg} />
              </button>
            )}

            {/* Dropdown Menu */}
            {dropdownOpen && session && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownUserInfo}>
                  <div className={styles.dropdownName}>{session.user?.name || 'Gamer'}</div>
                  <div className={styles.dropdownEmail}>{session.user?.email}</div>
                  <span className={styles.userRole}>{session.user?.role}</span>
                </div>
                 <Link href="/favorites" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                  <Heart size={14} /> {t('myFavorites' as any) || 'My Favorites'}
                </Link>
                <button 
                  onClick={() => {
                    localStorage.removeItem('custom_avatar');
                    setCustomAvatar(null);
                    signOut({ callbackUrl: '/' });
                    setDropdownOpen(false);
                  }} 
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                >
                  <LogOut size={14} /> {t('logOut' as any) || 'Log Out'}
                </button>
              </div>
            )}
          </div>

          {/* Menu Toggle Button (Right side on Mobile) */}
          <button 
            className={`${styles.menuToggleBtn} ${isMenuIconCross ? styles.menuOpen : ''}`} 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <div className={styles.hamburgerIcon}>
              <span className={styles.hamburgerBar} />
              <span className={styles.hamburgerBar} />
              <span className={styles.hamburgerBar} />
            </div>
          </button>
        </div>

        {/* Fullscreen Mobile Search Screen */}
        {isMobileSearchExpanded && (
          <div className={styles.fullMobileSearchScreen}>
            {/* Top Bar with Back Arrow and Pill Input */}
            <div className={styles.mobileSearchTopBar}>
              <button
                type="button"
                className={styles.mobileSearchBackArrowBtn}
                onClick={() => setIsMobileSearchExpanded(false)}
                aria-label="Close search"
              >
                <ChevronLeft size={24} />
              </button>
              <form onSubmit={handleSearchSubmit} className={styles.mobileSearchPillInputWrapper}>
                <Search size={20} className={styles.mobileSearchPillIcon} />
                <input
                  type="text"
                  autoFocus
                  className={styles.mobileSearchPillInput}
                  placeholder={voiceFeedback ? voiceFeedback : isListening ? "Listening... Speak now" : "Search games"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className={styles.clearBtn}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>
            </div>

            {/* Mobile Search Body */}
            <div className={styles.mobileSearchBody}>
              {searchQuery.trim() ? (
                <>
                  <div className={styles.mobileSearchHeaderRow}>
                    <Search size={24} color="#14b8a6" />
                    <h3 className={styles.mobileSearchHeaderTitle}>Search Results</h3>
                    {isSearching && (
                      <span className={styles.searchingBadge}>Searching...</span>
                    )}
                  </div>
                  <div className={styles.mobileSearchGamesList}>
                    {searchResults.length > 0 ? (
                      searchResults.map((game) => {
                        const thumbUrl = getImageUrl(game.thumbnail_url);

                        return (
                          <Link
                            key={game.id}
                            href={`/games/${game.slug}`}
                            className={styles.mobileSearchGameCard}
                            onClick={() => setIsMobileSearchExpanded(false)}
                          >
                            <img src={thumbUrl} alt={game.title} className={styles.mobileSearchGameThumb} />
                            <div className={styles.mobileSearchGameMeta}>
                              <span className={styles.mobileSearchGameTitle}>{game.title}</span>
                              <span className={styles.mobileSearchGameSub}>
                                {formatCompactNumber(game.play_count)} plays
                              </span>
                            </div>
                          </Link>
                        );
                      })
                    ) : (searchQuery.trim() === searchedForQuery && !isSearching) ? (
                      <div className={styles.searchEmptyState}>
                        No games found for "{searchQuery}"
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                featuredGames.length > 0 && (
                  <>
                    <div className={styles.mobileSearchHeaderRow}>
                      <Star size={23} fill="#FFCC00" color="#FFCC00" />
                      <h3 className={styles.mobileSearchHeaderTitle}>
                        {t('featuredGames' as any) || 'Featured Games'}
                      </h3>
                    </div>
                    <div className={styles.mobileSearchGamesList}>
                      {featuredGames.map((game) => {
                        const thumbUrl = getImageUrl(game.thumbnail_url);

                        return (
                          <Link
                            key={game.id}
                            href={`/games/${game.slug}`}
                            className={styles.mobileSearchGameCard}
                            onClick={() => setIsMobileSearchExpanded(false)}
                          >
                            <img src={thumbUrl} alt={game.title} className={styles.mobileSearchGameThumb} />
                            <div className={styles.mobileSearchGameMeta}>
                              <span className={styles.mobileSearchGameTitle}>{game.title}</span>
                              <span className={styles.mobileSearchGameSub}>
                                {formatCompactNumber(game.play_count)} plays
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass`}>
            <button className={styles.closeModalBtn} onClick={() => setModalOpen(false)}>
              <X size={20} />
            </button>
            
            {/* Tabs Header */}
            <div className={styles.tabHeader}>
              <button 
                className={`${styles.tabBtn} ${authMode === 'login' ? styles.activeTabBtn : ''}`}
                onClick={() => setAuthMode('login')}
              >
                {t('logIn' as any) || 'Log In'}
              </button>
              <button 
                className={`${styles.tabBtn} ${authMode === 'signup' ? styles.activeTabBtn : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                {t('signUp' as any) || 'Sign Up'}
              </button>
            </div>

            <h3 className={styles.modalTitle}>
              {authMode === 'login' ? (t('welcomeBack' as any) || 'Welcome Back!') : (t('joinGamesato' as any) || 'Join Gamesato')}
            </h3>
            <p className={styles.modalDesc}>
              {authMode === 'login' 
                ? (t('loginDesc' as any) || 'Log in to load your saved favorites, likes, and game statistics.') 
                : (t('signupDesc' as any) || 'Create an account to save favorites, like games, and track your gameplay statistics.')}
            </p>
            
            <div className={styles.providersList}>
              <button 
                className={styles.providerBtn}
                onClick={() => handleProviderLogin('google')}
              >
                {authMode === 'login' ? (t('loginWithGoogle' as any) || 'Log In with Google') : (t('signupWithGoogle' as any) || 'Sign Up with Google')}
              </button>
              <button 
                className={styles.providerBtn}
                onClick={() => handleProviderLogin('facebook')}
              >
                {authMode === 'login' ? 'Log In with Facebook' : 'Sign Up with Facebook'}
              </button>
              <button 
                className={styles.providerBtn}
                onClick={() => handleProviderLogin('discord')}
              >
                {authMode === 'login' ? 'Log In with Discord' : 'Sign Up with Discord'}
              </button>
            </div>

            <div className={styles.modalFooterText}>
              {authMode === 'login' ? (
                <>
                  {t('dontHaveAccount' as any) || "Don't have an account?"}
                  <button 
                    className={styles.modalFooterLink} 
                    onClick={() => setAuthMode('signup')}
                  >
                    {t('signUp' as any) || 'Sign Up'}
                  </button>
                </>
              ) : (
                <>
                  {t('alreadyHaveAccount' as any) || 'Already have an account?'}
                  <button 
                    className={styles.modalFooterLink} 
                    onClick={() => setAuthMode('login')}
                  >
                    {t('logIn' as any) || 'Log In'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}
