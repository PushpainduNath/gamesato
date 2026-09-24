'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  Home,
  ChevronsRight,
  Search,
  Calendar,
  User,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
  TrendingUp,
  X,
  Flame,
} from 'lucide-react';
import NewHeader from '@/components/NewHomepage/NewHeader';
import NewSidebar from '@/components/NewHomepage/NewSidebar';
import NewFooter from '@/components/NewHomepage/NewFooter';
import { getImageUrl } from '@/lib/utils';
import styles from './page.module.css';

export interface BlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
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

interface BlogIndexClientViewProps {
  blogs: BlogItem[];
  categories: CategoryItem[];
  featuredGames: any[];
  favoritesCount: number;
}

function calculateReadingTime(excerpt: string = '', content: string = ''): number {
  const combined = (content || excerpt || '').replace(/<[^>]+>/g, '').trim();
  const words = combined.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 180));
}

export default function BlogIndexClientView({
  blogs = [],
  categories = [],
  featuredGames = [],
  favoritesCount = 0,
}: BlogIndexClientViewProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinnedDesktop, setIsSidebarPinnedDesktop] = useState(false);

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

  // Distinct blog categories for pills
  const blogCategories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return ['All', ...Array.from(set)];
  }, [blogs]);

  // Filtered blogs based on search query & category pill
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        b.category?.toLowerCase() === selectedCategory.toLowerCase();
      const q = blogSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [blogs, selectedCategory, blogSearchQuery]);

  const featuredBlog = filteredBlogs[0];
  const remainingBlogs = filteredBlogs.slice(1);

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
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
    ],
  };

  return (
    <div className={styles.pageContainer}>
      <Script
        id="blog-index-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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
              <span className={styles.breadcrumbCurrent}>Gaming Blog</span>
            </nav>

            {/* Hero Header Card */}
            <header className={styles.heroCard}>
              <div className={styles.heroTopRow}>
                <div className={styles.badgeGroup}>
                  <span className={styles.categoryPill}>GAMESATO JOURNAL</span>
                  <span className={styles.verifiedPill}>
                    <Sparkles size={13} />
                    <span>Guides, News & Tips</span>
                  </span>
                </div>

                <div className={styles.statsPill}>
                  <TrendingUp size={14} />
                  <span>{blogs.length} Articles Published</span>
                </div>
              </div>

              <div className={styles.heroTitleGroup}>
                <div className={styles.heroIconBadge}>
                  <BookOpen size={28} color="#22d3ee" />
                </div>
                <div className={styles.heroTitleText}>
                  <h1 className={styles.pageTitle}>Gamesato Gaming Blog</h1>
                  <p className={styles.pageSubtitle}>
                    Master top browser games, discover secret game strategies, stay updated with HTML5 game releases, and learn pro tips directly from our editorial team.
                  </p>
                </div>
              </div>
            </header>

            {/* Filter & Search Toolbar */}
            <div className={styles.toolbarCard}>
              {/* Category Pills */}
              <div className={styles.categoryPillsWrap}>
                {blogCategories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
                    >
                      {cat === 'All' && <Flame size={13} />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* In-page Blog Search */}
              <div className={styles.searchBox}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={blogSearchQuery}
                  onChange={(e) => setBlogSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Search articles"
                />
                {blogSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBlogSearchQuery('')}
                    className={styles.clearSearchBtn}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Content Results */}
            {filteredBlogs.length === 0 ? (
              <div className={styles.emptyCard}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No Articles Found</h3>
                <p className={styles.emptyText}>
                  No articles matched &quot;{blogSearchQuery}&quot; in category &quot;{selectedCategory}&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBlogSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className={styles.resetBtn}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className={styles.articlesFeed}>
                {/* Featured Hero Article */}
                {featuredBlog && (
                  <article className={styles.featuredBanner}>
                    <Link
                      href={`/blog/${featuredBlog.slug}`}
                      className={styles.featuredImgLink}
                      title={featuredBlog.title}
                    >
                      <img
                        src={getImageUrl(featuredBlog.cover_image) || '/logo.png'}
                        alt={featuredBlog.title}
                        className={styles.featuredImg}
                        loading="eager"
                      />
                      <span className={styles.featuredBadgeOverlay}>
                        <Flame size={13} /> Featured Story
                      </span>
                    </Link>

                    <div className={styles.featuredContent}>
                      <div className={styles.featuredTopRow}>
                        <span className={styles.articleCatPill}>
                          {featuredBlog.category || 'General'}
                        </span>
                        <div className={styles.readTimePill}>
                          <Clock size={13} />
                          <span>{calculateReadingTime(featuredBlog.excerpt, featuredBlog.content)} min read</span>
                        </div>
                      </div>

                      <h2 className={styles.featuredTitle}>
                        <Link href={`/blog/${featuredBlog.slug}`}>
                          {featuredBlog.title}
                        </Link>
                      </h2>

                      <p className={styles.featuredExcerpt}>{featuredBlog.excerpt}</p>

                      <div className={styles.featuredFooter}>
                        <div className={styles.authorMeta}>
                          <div className={styles.authorAvatarCircle}>
                            <User size={14} />
                          </div>
                          <div className={styles.authorTextGroup}>
                            <span className={styles.authorName}>{featuredBlog.author || 'Gamesato Team'}</span>
                            <span className={styles.publishedDate}>
                              <Calendar size={11} />
                              {new Date(featuredBlog.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/blog/${featuredBlog.slug}`}
                          className={styles.readArticleBtn}
                        >
                          <span>Read Full Story</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                )}

                {/* Remaining Articles Grid */}
                {remainingBlogs.length > 0 && (
                  <div className={styles.articlesGrid}>
                    {remainingBlogs.map((blog) => {
                      const readTime = calculateReadingTime(blog.excerpt, blog.content);
                      return (
                        <article key={blog.id} className={styles.gridCard}>
                          <Link
                            href={`/blog/${blog.slug}`}
                            className={styles.cardImgLink}
                            title={blog.title}
                          >
                            <img
                              src={getImageUrl(blog.cover_image) || '/logo.png'}
                              alt={blog.title}
                              className={styles.cardImg}
                              loading="lazy"
                            />
                            <span className={styles.cardCatBadge}>{blog.category}</span>
                          </Link>

                          <div className={styles.cardContent}>
                            <div className={styles.cardMetaRow}>
                              <span className={styles.cardDate}>
                                <Calendar size={12} />
                                {new Date(blog.published_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className={styles.cardReadTime}>
                                <Clock size={12} />
                                {readTime} min
                              </span>
                            </div>

                            <h3 className={styles.cardTitle}>
                              <Link href={`/blog/${blog.slug}`}>
                                {blog.title}
                              </Link>
                            </h3>

                            <p className={styles.cardExcerpt}>{blog.excerpt}</p>

                            <div className={styles.cardFooter}>
                              <div className={styles.cardAuthor}>
                                <div className={styles.cardAuthorDot} />
                                <span>{blog.author || 'Editorial'}</span>
                              </div>

                              <Link
                                href={`/blog/${blog.slug}`}
                                className={styles.cardReadMore}
                              >
                                <span>Read</span>
                                <ArrowRight size={13} />
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Modern Poki/Cyber Footer */}
          <NewFooter />
        </main>
      </div>
    </div>
  );
}
