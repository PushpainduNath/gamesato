'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  Home,
  ChevronsRight,
  ShieldCheck,
  Sparkles,
  FileText,
  Clock,
  Mail,
  CheckCircle2,
  Info,
  ExternalLink,
  MessageSquare,
  Lock,
} from 'lucide-react';
import NewHeader from '@/components/NewHomepage/NewHeader';
import NewSidebar from '@/components/NewHomepage/NewSidebar';
import NewFooter from '@/components/NewHomepage/NewFooter';
import styles from './StaticPageClientView.module.css';

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  icon?: string;
}

interface StaticPageClientViewProps {
  slug: 'about' | 'privacy' | 'terms' | 'contact';
  pageTitle: string;
  pageSubtitle: string;
  badgeText: string;
  iconType: 'about' | 'privacy' | 'terms' | 'contact';
  lastUpdated: string;
  highlightText?: string;
  contentHtml?: string | null;
  categories?: CategoryItem[];
  featuredGames?: any[];
  favoritesCount?: number;
  children?: React.ReactNode;
}

export default function StaticPageClientView({
  slug,
  pageTitle,
  pageSubtitle,
  badgeText,
  iconType,
  lastUpdated,
  highlightText,
  contentHtml,
  categories = [],
  featuredGames = [],
  favoritesCount = 0,
  children,
}: StaticPageClientViewProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinnedDesktop, setIsSidebarPinnedDesktop] = useState(false);

  // Restore saved desktop pinned sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gamesato_sidebar_pinned');
        if (saved === 'true') {
          setIsSidebarPinnedDesktop(true);
        }
      } catch (_) {}
    }
  }, []);

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsSidebarPinnedDesktop((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('gamesato_sidebar_pinned', String(next));
        } catch (_) {}
        return next;
      });
    }
  };

  const handleSelectSidebarFilter = (filter: string) => {
    setIsMobileMenuOpen(false);
    if (filter === 'All') {
      router.push('/');
    } else if (['Popular', 'New', 'Favorites'].includes(filter)) {
      router.push(`/?filter=${encodeURIComponent(filter)}`);
    } else {
      const match = categories.find(
        (c) => c.name.toLowerCase() === filter.toLowerCase()
      );
      if (match) {
        router.push(`/category/${match.slug}`);
      }
    }
  };

  // Icon mapping
  const renderHeroIcon = () => {
    switch (iconType) {
      case 'privacy':
        return <ShieldCheck size={28} color="#34d399" />;
      case 'terms':
        return <FileText size={28} color="#f59e0b" />;
      case 'about':
        return <Sparkles size={28} color="#a78bfa" />;
      default:
        return <Info size={28} color="#38bdf8" />;
    }
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pageTitle,
        item: `${siteUrl}/${slug}`,
      },
    ],
  };

  return (
    <div className={styles.pageContainer}>
      <Script
        id="policy-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* 1. Sticky Header */}
      <NewHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMenu={handleToggleMenu}
        onToggleMobileMenu={handleToggleMenu}
        isSidebarPinnedDesktop={isSidebarPinnedDesktop}
        isMenuOpen={isSidebarPinnedDesktop}
        featuredGames={featuredGames}
      />

      {/* 2. Main Body with Collapsible / Floating Sidebar */}
      <div className={styles.bodyWrapper}>
        <NewSidebar
          categories={categories}
          activeFilter=""
          onSelectFilter={handleSelectSidebarFilter}
          favoritesCount={favoritesCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isPinnedDesktop={isSidebarPinnedDesktop}
        />

        {/* 3. Main Content Feed */}
        <main className={styles.mainContent}>
          <div className={styles.contentArea}>
            {/* Breadcrumbs Navigation */}
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href="/" className={styles.breadcrumbLink}>
                <Home size={13} />
                <span>Home</span>
              </Link>
              <ChevronsRight size={14} className={styles.breadcrumbDivider} />
              <span className={styles.breadcrumbCurrent}>{pageTitle}</span>
            </nav>

            {/* Hero Header Card */}
            <header className={styles.heroCard}>
              <div className={styles.heroTopRow}>
                <div className={styles.badgeGroup}>
                  <span className={styles.categoryPill}>{badgeText}</span>
                  <span className={styles.verifiedPill}>
                    <CheckCircle2 size={13} />
                    <span>Official Document</span>
                  </span>
                </div>

                <div className={styles.datePill}>
                  <Clock size={14} />
                  <span>Last updated: {lastUpdated}</span>
                </div>
              </div>

              <div className={styles.heroTitleGroup}>
                <div className={styles.heroIconBadge}>{renderHeroIcon()}</div>
                <div className={styles.heroTitleText}>
                  <h1 className={styles.pageTitle}>{pageTitle}</h1>
                  <p className={styles.pageSubtitle}>{pageSubtitle}</p>
                </div>
              </div>
            </header>

            {/* Main Content Article Card */}
            <article className={styles.contentCard}>
              {/* Highlight / Key Takeaway Callout */}
              {highlightText && (
                <div className={styles.highlightBox}>
                  <Lock size={20} className={styles.highlightIcon} />
                  <p className={styles.highlightText}>{highlightText}</p>
                </div>
              )}

              {/* Body Content */}
              <div className={styles.bodyText}>
                {contentHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                ) : (
                  children
                )}
              </div>
            </article>

            {/* Support / Questions Card */}
            <section className={styles.supportCard}>
              <div className={styles.supportLeft}>
                <div className={styles.supportIconCircle}>
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className={styles.supportTitle}>
                    Questions regarding our {pageTitle}?
                  </h3>
                  <p className={styles.supportSubtitle}>
                    Our compliance and support team is always available to help you with any inquiries.
                  </p>
                </div>
              </div>

              <div className={styles.supportActions}>
                <Link href="/contact" className={styles.contactBtn}>
                  <Mail size={15} />
                  <span>Contact Support</span>
                </Link>
                <a href="mailto:support@gamesato.com" className={styles.emailBtn}>
                  <ExternalLink size={14} />
                  <span>support@gamesato.com</span>
                </a>
              </div>
            </section>
          </div>

          {/* 4. Modern Unified Footer */}
          <NewFooter />
        </main>
      </div>
    </div>
  );
}
