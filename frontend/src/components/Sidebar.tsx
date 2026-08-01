'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/store/useUiStore';
import { useTranslation } from '@/store/useLanguageStore';
import styles from './Sidebar.module.css';
import headerStyles from './Header.module.css';

interface SidebarItem {
  label: string;
  categoryName: string; // matches DB category
  href: string;
  iconPath: string;
  translationKey: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = React.useState('');
  const { isSidebarOpen, isMenuIconCross, openSidebar, closeSidebar } = useUiStore();
  const { t } = useTranslation();

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      openSidebar();
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      closeSidebar();
    }
  };
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
  const [socialLinks, setSocialLinks] = React.useState({
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com'
  });

  // Dynamic Real-time Browser Navigation Bar Auto-Detection
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const updateDynamicBottomPadding = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const browserBottomBarHeight = Math.max(0, window.innerHeight - vv.height);
      const dynamicPadding = Math.max(24, browserBottomBarHeight + 20);
      document.documentElement.style.setProperty('--sidebar-dynamic-bottom-padding', `${dynamicPadding}px`);
    };

    updateDynamicBottomPadding();
    window.visualViewport.addEventListener('resize', updateDynamicBottomPadding);
    window.visualViewport.addEventListener('scroll', updateDynamicBottomPadding);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateDynamicBottomPadding);
      window.visualViewport?.removeEventListener('scroll', updateDynamicBottomPadding);
    };
  }, []);

  React.useEffect(() => {
    const checkTheme = () => {
      const isLight = document.documentElement.classList.contains('light-theme') || document.body.classList.contains('light-theme');
      setTheme(isLight ? 'light' : 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSocialLinks({
            twitter: data.social_twitter || 'https://twitter.com',
            facebook: data.social_facebook || 'https://facebook.com',
            youtube: data.social_youtube || 'https://youtube.com',
            instagram: data.social_instagram || 'https://instagram.com'
          });
        }
      })
      .catch((err) => console.error('Failed to fetch sidebar settings:', err));
  }, []);

  const handleLinkClick = (href?: string) => {
    if (href === '/') {
      setActiveHash('');
      if (typeof window !== 'undefined') {
        if (window.location.hash) {
          window.history.pushState("", document.title, window.location.pathname + window.location.search);
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else if (href && href.startsWith('#')) {
      setActiveHash(href);
    } else {
      setActiveHash('');
    }

    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 768) {
        document.body.style.overflow = '';
        closeSidebar();
      }
    }
  };

  // Reset body scroll lock & smooth scroll to top on route change
  React.useEffect(() => {
    document.body.style.overflow = '';
    if (pathname === '/' && typeof window !== 'undefined' && !window.location.hash) {
      setActiveHash('');
    }
  }, [pathname]);

  React.useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch categories for sidebar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSidebarData();
  }, []);

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Lock body scroll when mobile sidebar drawer is open
  React.useEffect(() => {
    const handleScrollLock = () => {
      if (isSidebarOpen && window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    handleScrollLock();

    window.addEventListener('resize', handleScrollLock);
    return () => {
      window.removeEventListener('resize', handleScrollLock);
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);
  
  // Hide sidebar on the full-screen Play Page
  if (pathname.includes('/play')) {
    return null;
  }

  const staticItems: SidebarItem[] = [
    {
      label: 'Home',
      categoryName: 'Home',
      href: '/',
      iconPath: '/home.webp',
      translationKey: 'home',
    },
    {
      label: 'New Games',
      categoryName: 'New',
      href: '/#category-New',
      iconPath: '/new.webp',
      translationKey: 'newGames',
    },
    {
      label: 'Popular Games',
      categoryName: 'Popular',
      href: '/#category-Popular',
      iconPath: '/popular.webp',
      translationKey: 'popularGames',
    },
  ];

  // Map dynamic categories to SidebarItem objects
  const dynamicItems: SidebarItem[] = categories.map((cat) => {
    const translationKey = `${cat.slug}Games`;
    let iconPath = cat.icon || '/arcade.webp';
    if (!iconPath.startsWith('http')) {
      iconPath = iconPath.replace(/\.svg$/, '.webp');
    }
    return {
      label: `${cat.name} Games`,
      categoryName: cat.name,
      href: `/category/${cat.slug}`,
      iconPath,
      translationKey,
    };
  });

  const items = [...staticItems, ...dynamicItems];

  return (
    <>
      {isSidebarOpen && (
        <div className={styles.backdrop} onClick={closeSidebar} />
      )}
      <aside 
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Mobile Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogoArea} onClick={() => handleLinkClick('/')}>
            <img 
              src={theme === 'light' ? '/logo-light-theme.webp' : '/logo-dark-theme.webp'} 
              alt="Gamesato Logo" 
              className={styles.sidebarLogo} 
              onError={(e) => { e.currentTarget.src = theme === 'light' ? '/logo-light-theme.png' : '/logo-dark-theme.png'; }}
            />
          </Link>
          <button 
            className={`${headerStyles.menuToggleBtn} ${isMenuIconCross ? headerStyles.menuOpen : ''}`} 
            onClick={closeSidebar} 
            aria-label="Close sidebar"
          >
            <div className={headerStyles.hamburgerIcon}>
              <span className={headerStyles.hamburgerBar} />
              <span className={headerStyles.hamburgerBar} />
              <span className={headerStyles.hamburgerBar} />
            </div>
          </button>
        </div>

        {items.map((item, index) => {
          const isHome = item.href === '/' || item.categoryName === '';

          const isCurrentCategoryPage = pathname.toLowerCase() === `/category/${item.categoryName.toLowerCase()}`;
          const isCategorySectionActive = activeHash.startsWith('#category-') && activeHash.toLowerCase() === `#category-${item.categoryName.toLowerCase()}`;

          const isActive = isHome 
            ? (pathname === '/' && (!activeHash || !activeHash.startsWith('#category-'))) 
            : (isCurrentCategoryPage || (pathname === '/' && isCategorySectionActive));

          return (
            <React.Fragment key={index}>
              <Link
                href={item.href}
                className={`${styles.item} ${isActive ? styles.activeItem : ''}`}
                onClick={() => handleLinkClick(item.href)}
              >
                <span className={styles.icon}>
                  <img 
                    src={item.iconPath} 
                    alt="" 
                    className={styles.iconImage}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedSvg) {
                        target.dataset.triedSvg = 'true';
                        target.src = item.iconPath.replace(/\.webp$/, '.svg');
                      } else if (!target.dataset.triedDefault) {
                        target.dataset.triedDefault = 'true';
                        target.src = `/${item.categoryName.toLowerCase()}.webp`;
                      } else {
                        target.src = '/arcade.webp';
                      }
                    }} 
                  />
                </span>
                <span className={styles.label} style={{ color: isActive ? '#ffffff' : undefined }}>
                  {t(item.translationKey as any) || item.label}
                </span>
              </Link>
              {item.categoryName === 'Popular' && <hr className={styles.separator} />}
            </React.Fragment>
          );
        })}

        <hr className={styles.separator} />

        {/* Mobile-only Static Links */}
        <div className={styles.mobileOnlyLinks}>
          <Link 
            href="/about" 
            className={`${styles.item} ${pathname === '/about' ? styles.activeItem : ''}`} 
            onClick={() => handleLinkClick('/about')}
          >
            <span className={styles.icon}>
              <img 
                src="/about.webp" 
                alt="" 
                className={styles.iconImage}
                onError={(e) => { e.currentTarget.src = '/about.svg'; }}
              />
            </span>
            <span className={styles.label} style={{ color: pathname === '/about' ? '#ffffff' : undefined }}>
              {t('aboutUs')}
            </span>
          </Link>
          <Link 
            href="/privacy" 
            className={`${styles.item} ${pathname === '/privacy' ? styles.activeItem : ''}`} 
            onClick={() => handleLinkClick('/privacy')}
          >
            <span className={styles.icon}>
              <img 
                src="/privacy.webp" 
                alt="" 
                className={styles.iconImage}
                onError={(e) => { e.currentTarget.src = '/privacy.svg'; }}
              />
            </span>
            <span className={styles.label} style={{ color: pathname === '/privacy' ? '#ffffff' : undefined }}>
              {t('privacyPolicy')}
            </span>
          </Link>
          <Link 
            href="/terms" 
            className={`${styles.item} ${pathname === '/terms' ? styles.activeItem : ''}`} 
            onClick={() => handleLinkClick('/terms')}
          >
            <span className={styles.icon}>
              <img 
                src="/terms.webp" 
                alt="" 
                className={styles.iconImage}
                onError={(e) => { e.currentTarget.src = '/terms.svg'; }}
              />
            </span>
            <span className={styles.label} style={{ color: pathname === '/terms' ? '#ffffff' : undefined }}>
              {t('termsCondition')}
            </span>
          </Link>
        </div>

        <hr className={styles.mobileOnlyDivider} />

        {/* Mobile-only Social Icons Row */}
        <div className={styles.mobileOnlySocials}>
          <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.sidebarSocialLink}>
            <img 
              src="/sidebar-twitter.webp" 
              alt="Twitter" 
              className={styles.sidebarSocialIconImage}
              onError={(e) => { e.currentTarget.src = '/sidebar-twitter.svg'; }}
            />
          </a>
          <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className={styles.sidebarSocialLink}>
            <img 
              src="/sidebar-fb.webp" 
              alt="Facebook" 
              className={styles.sidebarSocialIconImage}
              onError={(e) => { e.currentTarget.src = '/sidebar-fb.svg'; }}
            />
          </a>
          <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className={styles.sidebarSocialLink}>
            <img 
              src="/sidebar-youtube.webp" 
              alt="YouTube" 
              className={styles.sidebarSocialIconImage}
              onError={(e) => { e.currentTarget.src = '/sidebar-youtube.svg'; }}
            />
          </a>
          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={styles.sidebarSocialLink}>
            <img 
              src="/sidebar-instagram.webp" 
              alt="Instagram" 
              className={styles.sidebarSocialIconImage}
              onError={(e) => { e.currentTarget.src = '/sidebar-instagram.svg'; }}
            />
          </a>
        </div>
      </aside>
    </>
  );
}
