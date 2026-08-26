'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  const [socialLinks, setSocialLinks] = useState({
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com'
  });

  useEffect(() => {
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
      .catch((err) => console.error('Failed to fetch footer settings:', err));
  }, []);

  // Sync with active theme on mount (forced dark by default)
  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.remove('light-theme');
    setTheme('dark');
  }, []);

  const toggleTheme = (targetTheme: 'dark' | 'light') => {
    if (targetTheme === 'light') {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  // Hide footer on full-screen play pages
  if (pathname.includes('/play')) {
    return null;
  }

  const hideMainFooter = pathname.includes('/language') || pathname.includes('/profile');

  const floatingThemeBtn = (
    <div className={styles.floatingThemeWrapper}>
      {/* Mobile round floating theme toggle */}
      <button 
        className={`${styles.floatingThemeToggle} ${styles.mobileOnlyThemeToggle} ${theme === 'light' ? styles.floatingThemeToggleLight : ''}`} 
        onClick={() => toggleTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Sun size={20} className={styles.floatingThemeIcon} />
        ) : (
          <Moon size={20} className={styles.floatingThemeIcon} />
        )}
      </button>

      {/* Desktop pill slider toggle floating bottom right */}
      <button 
        className={`${styles.themeToggleSlider} ${styles.desktopOnlyThemeToggle} ${theme === 'light' ? styles.themeToggleLight : styles.themeToggleDark}`}
        onClick={() => toggleTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label="Toggle Theme"
      >
        <span className={styles.themeKnob}>
          {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
        </span>
        <span className={styles.themeLabelText}>
          {theme === 'light' ? 'Light' : 'Dark'}
        </span>
      </button>
    </div>
  );

  return (
    <>
      {!hideMainFooter && (
        <footer className={styles.footer}>
        {/* Desktop Footer (hidden on mobile) */}
        <div className={`${styles.container} ${styles.desktopOnlyFooter}`}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logoArea}>
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
            <p className={styles.tagline}>
              Your premier destination for instant browser-based gaming. Fast, fun, and free forever.
            </p>
          </div>

          {/* Links Column 1: Platform */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Platform</h4>
            <ul className={styles.linksList}>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Social Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Social Links</h4>
            <div className={styles.socialsList}>
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                <img 
                  src="/sidebar-fb.svg" 
                  alt="Facebook" 
                  className={styles.socialIconImage} 
                />
              </a>
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
                <img 
                  src="/sidebar-twitter.svg" 
                  alt="Twitter" 
                  className={styles.socialIconImage} 
                />
              </a>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="YouTube">
                <img 
                  src="/sidebar-youtube.svg" 
                  alt="YouTube" 
                  className={styles.socialIconImage} 
                />
              </a>
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                <img 
                  src="/sidebar-instagram.svg" 
                  alt="Instagram" 
                  className={styles.socialIconImage} 
                />
              </a>
            </div>
          </div>

          {/* Desktop Copyright Line */}
          <div className={styles.desktopCopyrightRow} style={{
            width: '100%',
            gridColumn: '1 / -1',
            marginTop: '0px',
            padding: '14px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            fontSize: '0.825rem',
            color: 'var(--text-secondary, rgba(255, 255, 255, 0.5))'
          }}>
            © 2026 Gamesato. All rights reserved.
          </div>
        </div>

        {/* Mobile Footer Layout (shown on mobile screens only) */}
        <div className={`${styles.mobileContainer} ${styles.mobileOnlyFooter}`}>
          {/* Logo */}
          <Link href="/" className={styles.mobileLogoArea}>
            <img 
              src={theme === 'light' ? '/light_logo_withoutbg.png' : '/dark_logo_withoutbg.png'} 
              alt="Gamesato Logo" 
              className={styles.mobileLogo} 
              onError={(e) => { e.currentTarget.src = theme === 'light' ? '/logo-light-theme.png' : '/logo-dark-theme.png'; }}
            />
            <span className={styles.logoText}>
              Game<span className={styles.logoTextSato}>sato</span>
            </span>
          </Link>

          {/* Tagline */}
          <p className={styles.mobileTagline}>
            Your premier destination for instant browser-based gaming. Fast, fun, and free forever.
          </p>

          {/* Divider 1 */}
          <div className={styles.mobileDivider} />

          {/* Quick Links */}
          <div className={styles.mobileQuickLinks}>
            <Link href="/blog">Blog</Link>
            <span className={styles.linkSeparator}>|</span>
            <Link href="/about">About Us</Link>
            <span className={styles.linkSeparator}>|</span>
            <Link href="/privacy">Privacy Policy</Link>
            <span className={styles.linkSeparator}>|</span>
            <Link href="/terms">Terms & Conditions</Link>
          </div>
          
          {/* Social Icons */}
          <div className={styles.mobileSocials}>
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className={styles.mobileSocialLink} aria-label="Facebook">
              <img 
                src="/sidebar-fb.svg" 
                alt="Facebook" 
                className={styles.socialIconImage} 
              />
            </a>
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.mobileSocialLink} aria-label="Twitter">
              <img 
                src="/sidebar-twitter.svg" 
                alt="Twitter" 
                className={styles.socialIconImage} 
              />
            </a>
            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className={styles.mobileSocialLink} aria-label="YouTube">
              <img 
                src="/sidebar-youtube.svg" 
                alt="YouTube" 
                className={styles.socialIconImage} 
              />
            </a>
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={styles.mobileSocialLink} aria-label="Instagram">
              <img 
                src="/sidebar-instagram.svg" 
                alt="Instagram" 
                className={styles.socialIconImage} 
              />
            </a>
          </div>

          {/* Divider 2 */}
          <div className={styles.mobileDivider} />

          {/* Copyright */}
          <span className={styles.mobileCopyright}>
            © 2026 Gamesato. All rights reserved.
          </span>
        </div>
      </footer>
      )}

      {/* Floating theme toggle button disabled/hidden for now */}
      {/* {mounted && createPortal(floatingThemeBtn, document.body)} */}
    </>
  );
}
