'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  ChevronsRight,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Gamepad2,
  List,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import NewHeader from '@/components/NewHomepage/NewHeader';
import NewSidebar from '@/components/NewHomepage/NewSidebar';
import NewFooter from '@/components/NewHomepage/NewFooter';
import { getImageUrl } from '@/lib/utils';
import styles from './page.module.css';

export interface BlogDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author: string;
  published_at: string;
}

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  icon?: string;
  count?: number;
}

interface BlogClientViewProps {
  blog: BlogDetail;
  relatedBlogs: BlogDetail[];
  categories: CategoryItem[];
  featuredGames: any[];
  favoritesCount: number;
  siteUrl: string;
}

function calculateReadingTime(text?: string): number {
  if (!text) return 3;
  const cleanText = text.replace(/<[^>]+>/g, '').trim();
  const words = cleanText.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 180));
}

export default function BlogClientView({
  blog,
  relatedBlogs = [],
  categories = [],
  featuredGames = [],
  favoritesCount = 0,
  siteUrl,
}: BlogClientViewProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinnedDesktop, setIsSidebarPinnedDesktop] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // Restore saved desktop pinned sidebar state
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

  // Parse H2 headings for Table of Contents and inject IDs into content
  const { processedContent, tocHeadings } = useMemo(() => {
    if (!blog.content) return { processedContent: '', tocHeadings: [] };

    const headings: { id: string; text: string }[] = [];
    let index = 0;

    const updatedHtml = blog.content.replace(
      /<h2([^>]*)>(.*?)<\/h2>/gi,
      (match, attrs, textContent) => {
        const cleanText = textContent.replace(/<[^>]+>/g, '').trim();
        const id = `heading-${index}`;
        headings.push({ id, text: cleanText });
        index++;
        return `<h2 id="${id}" ${attrs}>${textContent}</h2>`;
      }
    );

    return { processedContent: updatedHtml, tocHeadings: headings };
  }, [blog.content]);

  // Scroll spy for active heading in TOC
  useEffect(() => {
    if (tocHeadings.length === 0) return;

    const handleScroll = () => {
      const headingElements = tocHeadings
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];

      const scrollPosition = window.scrollY + 120;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el.offsetTop <= scrollPosition) {
          setActiveHeadingId(el.id);
          return;
        }
      }
      setActiveHeadingId('');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocHeadings]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const readingTime = calculateReadingTime(blog.content || blog.excerpt);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `${siteUrl}/blog/${blog.slug}`;

  return (
    <div className={styles.pageContainer}>
      {/* 1. Header */}
      <NewHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMenu={handleToggleMenu}
        onToggleMobileMenu={handleToggleMenu}
        isSidebarPinnedDesktop={isSidebarPinnedDesktop}
        isMenuOpen={isSidebarPinnedDesktop}
        featuredGames={featuredGames}
      />

      {/* 2. Main Body with Collapsible Sidebar */}
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
            {/* Breadcrumb Navigation */}
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href="/" className={styles.breadcrumbLink}>
                <Home size={13} />
                <span>Home</span>
              </Link>
              <ChevronsRight size={14} className={styles.breadcrumbDivider} />
              <Link href="/blog" className={styles.breadcrumbLink}>
                <span>Blog</span>
              </Link>
              <ChevronsRight size={14} className={styles.breadcrumbDivider} />
              <span className={styles.breadcrumbCurrent}>{blog.title}</span>
            </nav>

            {/* Back to Blog Pill */}
            <div className={styles.topBackRow}>
              <Link href="/blog" className={styles.backBtn}>
                <ArrowLeft size={15} />
                <span>Back to All Articles</span>
              </Link>
            </div>

            {/* Article Header Card */}
            <header className={styles.articleHeaderCard}>
              <div className={styles.headerPillsRow}>
                <span className={styles.categoryBadge}>{blog.category}</span>
                <div className={styles.readTimePill}>
                  <Clock size={13} />
                  <span>{readingTime} min read</span>
                </div>
              </div>

              <h1 className={styles.articleTitle}>{blog.title}</h1>

              <div className={styles.metaAndShareRow}>
                <div className={styles.authorMeta}>
                  <div className={styles.authorAvatar}>
                    <User size={15} />
                  </div>
                  <div className={styles.authorInfo}>
                    <span className={styles.authorName}>{blog.author || 'Gamesato Team'}</span>
                    <span className={styles.publishDate}>
                      <Calendar size={12} />
                      {new Date(blog.published_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div className={styles.shareGroup}>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`${styles.shareBtn} ${copiedLink ? styles.shareBtnActive : ''}`}
                    title="Copy article link"
                    aria-label="Copy link"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                  </button>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.shareIconBtn}
                    aria-label="Share on X"
                    title="Share on X"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.shareIconBtn}
                    aria-label="Share on Facebook"
                    title="Share on Facebook"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Cover Image */}
              {blog.cover_image && (
                <div className={styles.coverImageContainer}>
                  <img
                    src={getImageUrl(blog.cover_image)}
                    alt={blog.title}
                    className={styles.coverImage}
                    loading="eager"
                  />
                </div>
              )}
            </header>

            {/* 2-Column Article Body with Sticky Left TOC */}
            <div className={styles.articleBodyLayout}>
              {/* Left Column (Sticky Sidebar) */}
              <aside className={styles.articleSidebar}>
                {/* Table of Contents */}
                {tocHeadings.length > 0 && (
                  <div className={styles.tocCard}>
                    <div className={styles.tocHeader}>
                      <List size={16} className={styles.tocIcon} />
                      <h3 className={styles.tocTitle}>Table of Contents</h3>
                    </div>
                    <ul className={styles.tocList}>
                      {tocHeadings.map((heading) => {
                        const isActive = activeHeadingId === heading.id;
                        return (
                          <li key={heading.id}>
                            <button
                              type="button"
                              onClick={() => scrollToHeading(heading.id)}
                              className={`${styles.tocLink} ${isActive ? styles.tocLinkActive : ''}`}
                            >
                              <span>{heading.text}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Play Games CTA Box */}
                <div className={styles.playGamesCard}>
                  <div className={styles.playIconBadge}>
                    <Gamepad2 size={22} color="#38bdf8" />
                  </div>
                  <h4 className={styles.playCardTitle}>Play Instant Games</h4>
                  <p className={styles.playCardText}>
                    Ready for action? Jump straight into thousands of free browser games with zero downloads.
                  </p>
                  <Link href="/" className={styles.playCardBtn}>
                    <span>Play Games Free</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Developer / Submission Promo Card */}
                <div className={styles.promoCard}>
                  <Sparkles size={18} className={styles.promoIcon} />
                  <h4 className={styles.promoTitle}>Have a Game to Publish?</h4>
                  <p className={styles.promoText}>
                    Share your HTML5 creation with millions of active gamers worldwide.
                  </p>
                  <Link href="/contact" className={styles.promoBtn}>
                    <span>Developer Portal</span>
                  </Link>
                </div>
              </aside>

              {/* Right Column (Article HTML Content) */}
              <article className={styles.articleContentColumn}>
                {/* Highlight Callout */}
                {blog.excerpt && (
                  <div className={styles.highlightBox}>
                    <Sparkles size={18} className={styles.highlightIcon} />
                    <p className={styles.highlightText}>{blog.excerpt}</p>
                  </div>
                )}

                {/* Main Article Content */}
                <div
                  className={styles.articleText}
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />

                {/* Author Bio Card */}
                <div className={styles.authorBioCard}>
                  <div className={styles.bioAvatar}>
                    <User size={24} />
                  </div>
                  <div className={styles.bioText}>
                    <h4 className={styles.bioName}>Written by {blog.author || 'Gamesato Editorial Team'}</h4>
                    <p className={styles.bioDesc}>
                      The Gamesato Editorial Team brings you curated guides, game mechanics breakdowns, and the latest web gaming industry insights.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            {/* Related Articles Section */}
            {relatedBlogs.length > 0 && (
              <section className={styles.relatedSection}>
                <div className={styles.relatedSectionHeader}>
                  <h2 className={styles.relatedHeading}>More From Gamesato Blog</h2>
                  <Link href="/blog" className={styles.viewAllBtn}>
                    <span>View All Articles</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className={styles.relatedGrid}>
                  {relatedBlogs.slice(0, 3).map((item) => {
                    const readTime = calculateReadingTime(item.content || item.excerpt);
                    return (
                      <article key={item.id} className={styles.relatedCard}>
                        <Link
                          href={`/blog/${item.slug}`}
                          className={styles.relatedImgLink}
                          title={item.title}
                        >
                          <img
                            src={getImageUrl(item.cover_image) || '/logo.png'}
                            alt={item.title}
                            className={styles.relatedImg}
                            loading="lazy"
                          />
                          <span className={styles.relatedCatPill}>{item.category}</span>
                        </Link>

                        <div className={styles.relatedBody}>
                          <div className={styles.relatedMetaRow}>
                            <span className={styles.relatedDate}>
                              <Calendar size={11} />
                              {new Date(item.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className={styles.relatedReadTime}>
                              <Clock size={11} />
                              {readTime} min
                            </span>
                          </div>

                          <h3 className={styles.relatedCardTitle}>
                            <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                          </h3>

                          <p className={styles.relatedExcerpt}>{item.excerpt}</p>

                          <div className={styles.relatedFooter}>
                            <Link
                              href={`/blog/${item.slug}`}
                              className={styles.relatedReadMore}
                            >
                              <span>Read Article</span>
                              <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* 4. Modern Poki/Cyber Footer */}
          <NewFooter />
        </main>
      </div>
    </div>
  );
}
