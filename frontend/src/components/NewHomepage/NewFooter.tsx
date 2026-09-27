import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Sparkles } from 'lucide-react';
import styles from './NewFooter.module.css';

export default function NewFooter() {
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
        </div>

        {/* NAV LINK COLUMNS (RIGHT) */}
        <div className={styles.navColumns}>
          {/* Column 1: POPULAR */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>POPULAR</h4>
            <ul className={styles.linkList}>
              <li><Link href="/category/racing" className={styles.navLink}>Car Games</Link></li>
              <li><Link href="/category/action" className={styles.navLink}>Action Games</Link></li>
              <li><Link href="/category/arcade" className={styles.navLink}>Arcade Games</Link></li>
              <li><Link href="/category/puzzle" className={styles.navLink}>Puzzle Games</Link></li>
              <li><Link href="/category/sport" className={styles.navLink}>Sports Games</Link></li>
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
