'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { 
  ChevronDown, 
  Zap, 
  Smartphone, 
  ShieldCheck, 
  Gamepad2, 
  Sparkles,
  HelpCircle,
  Car,
  Swords,
  Brain,
  Users,
  Trophy,
  Flame
} from 'lucide-react';
import styles from './SeoFaqSection.module.css';

export interface FaqItem {
  question: string;
  answer: string;
}

interface SeoFaqSectionProps {
  faqList?: FaqItem[];
  homeContent?: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "What is Gamesato?",
    answer: "Gamesato is a premier online gaming platform offering thousands of high-quality, free-to-play HTML5 and WebGL browser games. From action-packed shooters and high-speed car racing to relaxing brain puzzles and 2-player games, all titles run instantly in your web browser with zero downloads or installations required."
  },
  {
    question: "Are all games on Gamesato completely free to play?",
    answer: "Yes, 100%! Every single game on Gamesato is entirely free. There are no paywalls, no paid memberships, and no credit card required. Simply click on any game card and start playing right away."
  },
  {
    question: "Do I need to download or install any software or plugins?",
    answer: "No downloads, no installations, and no plugins are ever needed. Gamesato uses cutting-edge HTML5 and WebGL web standards that run natively in modern web browsers like Google Chrome, Apple Safari, Microsoft Edge, Mozilla Firefox, and Opera."
  },
  {
    question: "Can I play Gamesato games on mobile phones, tablets, and Chromebooks?",
    answer: "Absolutely! Gamesato is built from the ground up to be fully responsive. Games seamlessly adapt to touchscreens on iPhones, iPads, and Android devices, as well as keyboard and mouse setups on desktop PCs, MacBooks, and school Chromebooks."
  },
  {
    question: "How do I save my favorite games and track my playtime?",
    answer: "You can click the 👍 Like button on any game while playing, and it will instantly be saved to your 'Favorites' list in the sidebar. Gamesato automatically tracks your playtime and remembers your favorites on your device without forcing you to sign up, though you can also log in to sync across different devices."
  },
  {
    question: "Can I play 2-Player games with friends on the same device?",
    answer: "Yes! Gamesato features a dedicated library of 2-Player games where two people can play together locally on the same computer or laptop using shared keyboard controls (like WASD vs Arrow keys), as well as turn-based mobile challenges."
  },
  {
    question: "Are Gamesato games unblocked for school or office breaks?",
    answer: "Gamesato games run on lightweight HTTPS web protocols designed for ultra-fast loading with minimal bandwidth. It is a safe, family-friendly destination perfect for unwinding during quick study sessions or office breaks."
  },
  {
    question: "How often are new games added to Gamesato?",
    answer: "Our team updates the catalog every week with trending releases, popular community requests, and award-winning indie titles, ensuring you always have fresh challenges to conquer."
  }
];

const POPULAR_GENRES = [
  {
    name: 'Car & Racing',
    slug: 'racing',
    desc: 'Drift supercars, speedway tracks & parking simulators',
    icon: Car,
    color: '#38bdf8'
  },
  {
    name: 'Action & Combat',
    slug: 'action',
    desc: 'Battle royales, 3D FPS arenas & zombie survival',
    icon: Swords,
    color: '#f43f5e'
  },
  {
    name: 'Puzzle & Logic',
    slug: 'puzzle',
    desc: 'Brain-training teasers, 2048, match-3 & physics mazes',
    icon: Brain,
    color: '#a855f7'
  },
  {
    name: '2 Player & Co-op',
    slug: '2-player',
    desc: 'Local split-screen battles & co-op quests on 1 device',
    icon: Users,
    color: '#10b981'
  },
  {
    name: 'Sports & Shootout',
    slug: 'sports',
    desc: 'Soccer penalty duels, basketball dunks & tennis cups',
    icon: Trophy,
    color: '#f59e0b'
  },
  {
    name: 'Trending & Hot',
    slug: 'arcade',
    desc: 'Viral internet hits, retro classics & instant arcade fun',
    icon: Flame,
    color: '#ec4899'
  }
];

export default function SeoFaqSection({ faqList, homeContent }: SeoFaqSectionProps) {
  const effectiveFaqs = faqList && faqList.length > 0 ? faqList : DEFAULT_FAQS;
  const [openIndices, setOpenIndices] = useState<number[]>([0, 1]);

  const toggleFaq = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: effectiveFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <section className={styles.seoSection} aria-label="About Gamesato and FAQ">
      <Script
        id="seo-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className={styles.containerCard}>
        {/* TOP HERO SEO INTRO */}
        <header className={styles.introHeader}>
          <div className={styles.badgeRow}>
            <span className={styles.pillBadge}>
              <Sparkles size={13} className={styles.badgeIcon} />
              <span>UNLIMITED BROWSER GAMING</span>
            </span>
          </div>

          <h2 className={styles.mainTitle}>
            Play Free Online Games on Gamesato – Instant Fun, No Downloads
          </h2>

          <p className={styles.introParagraph}>
            Welcome to <strong>Gamesato</strong>, your ultimate destination for free online browser games. 
            Whether you have 5 minutes to spare on a coffee break or hours to master challenging levels, 
            Gamesato delivers instant access to over 2,000+ curated HTML5 and WebGL games directly in your web browser. 
            No downloads, no storage clutter, no annoying installations—just pure, frictionless gaming.
          </p>
        </header>

        {/* 3 CORE VALUE PROPOSITIONS */}
        <div className={styles.valueGrid}>
          <div className={styles.valueCard}>
            <div className={`${styles.valueIconWrap} ${styles.iconWrapBlue}`}>
              <Zap size={22} />
            </div>
            <h3 className={styles.valueTitle}>Instant Zero-Wait Play</h3>
            <p className={styles.valueText}>
              Every game loads in seconds via modern HTML5 web standards. No software to install, no updates to download, and zero disk space consumed.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={`${styles.valueIconWrap} ${styles.iconWrapPurple}`}>
              <Smartphone size={22} />
            </div>
            <h3 className={styles.valueTitle}>Play Anywhere, Any Screen</h3>
            <p className={styles.valueText}>
              Responsive controls adapt dynamically across iPhones, Android phones, iPads, Chromebooks, MacBooks, and desktop PCs with touch, mouse, or keyboard.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={`${styles.valueIconWrap} ${styles.iconWrapGreen}`}>
              <ShieldCheck size={22} />
            </div>
            <h3 className={styles.valueTitle}>100% Free & Safe</h3>
            <p className={styles.valueText}>
              Enjoy a clean, family-friendly environment with zero subscription fees. Like your favorite games with one click to build your personal library automatically.
            </p>
          </div>
        </div>

        {/* POPULAR CATEGORIES & SEO INTERNAL LINKS */}
        <div className={styles.genresSection}>
          <div className={styles.subHeader}>
            <Gamepad2 size={20} className={styles.subHeaderIcon} />
            <h3 className={styles.subTitle}>Explore Top Game Categories</h3>
          </div>

          <div className={styles.genresGrid}>
            {POPULAR_GENRES.map((genre) => {
              const IconComp = genre.icon;
              return (
                <Link
                  key={genre.slug}
                  href={`/category/${genre.slug}`}
                  className={styles.genreCard}
                >
                  <div 
                    className={styles.genreIconWrap} 
                    style={{ background: `${genre.color}18`, color: genre.color }}
                  >
                    <IconComp size={20} />
                  </div>
                  <div className={styles.genreInfo}>
                    <span className={styles.genreName}>{genre.name}</span>
                    <span className={styles.genreDesc}>{genre.desc}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* FAQ ACCORDION */}
        <div className={styles.faqSection}>
          <div className={styles.subHeader}>
            <HelpCircle size={20} className={styles.subHeaderIcon} />
            <div>
              <h3 className={styles.subTitle}>Frequently Asked Questions</h3>
              <span className={styles.subSubtitle}>Everything you need to know about Gamesato</span>
            </div>
          </div>

          <div className={styles.faqList}>
            {effectiveFaqs.map((faq, index) => {
              const isOpen = openIndices.includes(index);
              return (
                <div 
                  key={index} 
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.faqQuestionBtn}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.faqQuestionText}>{faq.question}</span>
                    <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronRotated : ''}`}>
                      <ChevronDown size={18} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className={styles.faqAnswerWrapper}>
                      <p className={styles.faqAnswerText}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
