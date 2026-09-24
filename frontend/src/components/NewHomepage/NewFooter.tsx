'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Globe, ChevronDown, Sparkles } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import styles from './NewFooter.module.css';

interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ar', label: 'العربية', flag: '🇦🇪' },
];

export default function NewFooter() {
  const { language, setLanguage } = useLanguageStore();
  const [langOpen, setLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className={styles.footer} aria-label="Site footer">
      {/* POKI-STYLE GEOMETRIC CUTTING ART TOP DIVIDER */}
      <div className={styles.cuttingArtWrap} aria-hidden="true">
        <svg 
          className={styles.cuttingSvg} 
          viewBox="0 0 1440 60" 
          preserveAspectRatio="none" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cuttingLineGrad" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#818cf8" />
              <stop offset="70%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Solid fill strictly BELOW the cutting line (matches footerContentWrap exactly) */}
          <path 
            d="M0 44L400 12L840 40L1180 15L1440 28V60H0V44Z" 
            fill="#111624" 
          />

          {/* Crisp neon glowing cutting line along the top ridge */}
          <path 
            d="M0 44L400 12L840 40L1180 15L1440 28" 
            stroke="url(#cuttingLineGrad)" 
            strokeWidth="2.5" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className={styles.footerContentWrap}>
        <div className={styles.footerMain}>
        {/* BRAND & LANGUAGE & SOCIALS (LEFT) */}
        <div className={styles.brandCol}>
          <div className={styles.brandHeader}>
            <Link href="/" className={styles.brandLogoLink} title="Gamesato - Free Web Games">
              <Image 
                src="/logo-full.png" 
                alt="Gamesato" 
                width={160} 
                height={58} 
                className={styles.footerLogoImg}
                priority
              />
            </Link>
            <span className={styles.brandTagline}>Let the world play</span>
          </div>

          {/* Language Selector Pill */}
          <div className={styles.langWrapper} ref={langMenuRef}>
            <button
              type="button"
              className={styles.langButton}
              onClick={() => setLangOpen(!langOpen)}
              aria-expanded={langOpen}
              aria-label="Select website language"
            >
              <Globe size={15} className={styles.langIcon} />
              <span className={styles.langFlag}>{currentLang.flag}</span>
              <span className={styles.langLabel}>{currentLang.label}</span>
              <ChevronDown 
                size={14} 
                className={`${styles.langChevron} ${langOpen ? styles.langChevronRotated : ''}`} 
              />
            </button>

            {langOpen && (
              <div className={styles.langDropdown}>
                {SUPPORTED_LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`${styles.langOption} ${language === item.code ? styles.langOptionActive : ''}`}
                    onClick={() => {
                      setLanguage(item.code);
                      setLangOpen(false);
                    }}
                  >
                    <span className={styles.langOptionFlag}>{item.flag}</span>
                    <span className={styles.langOptionText}>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Social Media Circular Buttons (Poki Style) */}
          <div className={styles.socialRow}>
            {/* TikTok */}
            <a
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles.socialTiktok}`}
              aria-label="TikTok"
              title="TikTok"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.46V12.9a8.28 8.28 0 0 0 5.73 2.27V11.7a4.83 4.83 0 0 1-3.77-1.55v-3.46z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles.socialInsta}`}
              aria-label="Instagram"
              title="Instagram"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles.socialYt}`}
              aria-label="YouTube"
              title="YouTube"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Discord */}
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles.socialDiscord}`}
              aria-label="Discord"
              title="Discord"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>

        {/* NAV LINK COLUMNS (RIGHT) */}
        <div className={styles.navColumns}>
          {/* Column 1: POPULAR */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>POPULAR</h4>
            <ul className={styles.linkList}>
              <li><Link href="/category/racing" className={styles.navLink}>Car Games</Link></li>
              <li><Link href="/category/action" className={styles.navLink}>.io Games</Link></li>
              <li><Link href="/category/2-player" className={styles.navLink}>2 Player Games</Link></li>
              <li><Link href="/category/puzzle" className={styles.navLink}>Puzzle Games</Link></li>
              <li><Link href="/category/sports" className={styles.navLink}>Sports Games</Link></li>
              <li><Link href="/" className={styles.navLink}>All Games</Link></li>
            </ul>
          </div>

          {/* Column 2: HELP AND SUPPORT */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>HELP AND SUPPORT</h4>
            <ul className={styles.linkList}>
              <li><Link href="/faq" className={styles.navLink}>FAQ</Link></li>
              <li><Link href="/contact" className={styles.navLink}>Contact</Link></li>
              <li><Link href="/privacy" className={styles.navLink}>Privacy Center</Link></li>
              <li><Link href="/terms" className={styles.navLink}>Terms of Use</Link></li>
            </ul>
          </div>

          {/* Column 3: GET TO KNOW US */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>GET TO KNOW US</h4>
            <ul className={styles.linkList}>
              <li><Link href="/about" className={styles.navLink}>About</Link></li>
              <li><Link href="/blog" className={styles.navLink}>Blog</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* SUB-FOOTER BOTTOM BAR */}
      <div className={styles.subFooter}>
        <div className={styles.copyright}>© 2026 Gamesato. All rights reserved.</div>

        <div className={styles.mottoText}>
          <Sparkles size={14} className={styles.sparkle} />
          <span>A whole world of play. No downloads needed.</span>
        </div>

        <button 
          type="button" 
          onClick={scrollToTop} 
          className={styles.backToTopBtn}
          title="Back to top"
        >
          <span>Back to top</span>
          <ArrowUp size={14} />
        </button>
      </div>
      </div>
    </footer>
  );
}
