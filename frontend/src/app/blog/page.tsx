import React from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import styles from './page.module.css';

interface Blog {
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

export const metadata = {
  title: 'Gamesato Blog | Gaming News, Guides & Updates',
  description: 'Explore the latest web gaming news, strategy guides, developer updates, and game reviews on Gamesato.',
  alternates: {
    canonical: '/blog',
  },
};

function calculateReadingTime(excerpt: string, title: string): number {
  const words = (title + ' ' + excerpt).split(/\s+/).length * 15;
  return Math.max(3, Math.ceil(words / 200));
}

async function getBlogs() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';
  try {
    const res = await fetch(`${backendUrl}/api/blogs`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.blogs || [];
  } catch (err) {
    console.error('Failed to fetch blogs:', err);
    return [];
  }
}

export default async function BlogIndexPage() {
  const blogs: Blog[] = await getBlogs();
  const featuredBlog = blogs[0];
  const otherBlogs = blogs.slice(1);

  return (
    <div className={styles.blogContainer}>
      <div className={styles.blogHeader}>
        <h1 className={styles.blogTitle}>Gamesato Gaming Blog</h1>
        <p className={styles.blogSubtitle}>
          Discover expert gaming tips, H5 game development guides, community spotlights, and platform news.
        </p>
      </div>

      {blogs.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} color="#14b8a6" style={{ marginBottom: '1rem' }} />
          <h2>No Blog Posts Yet</h2>
          <p>Check back soon! New articles, guides, and game highlights are being written.</p>
        </div>
      ) : (
        <>
          {/* Featured Hero Banner */}
          {featuredBlog && (
            <Link href={`/blog/${featuredBlog.slug}`} className={styles.featuredBanner}>
              <div className={styles.featuredImageWrapper}>
                <img
                  src={getImageUrl(featuredBlog.cover_image) || '/logo.png'}
                  alt={featuredBlog.title}
                  className={styles.featuredImage}
                />
              </div>
              <div className={styles.featuredContent}>
                <span className={styles.tagBadge}>{featuredBlog.category || 'Featured'}</span>
                <h2 className={styles.featuredTitle}>{featuredBlog.title}</h2>
                <p className={styles.featuredExcerpt}>{featuredBlog.excerpt}</p>
                <div className={styles.postMeta}>
                  <span>
                    <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {featuredBlog.author}
                  </span>
                  <span>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {new Date(featuredBlog.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>
                    <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {calculateReadingTime(featuredBlog.excerpt, featuredBlog.title)} Min Read
                  </span>
                  <span className={styles.readMoreBtn}>
                    Read Article <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Other Blog Grid */}
          {otherBlogs.length > 0 && (
            <div className={styles.blogGrid}>
              {otherBlogs.map((blog) => {
                const readTime = calculateReadingTime(blog.excerpt, blog.title);
                return (
                  <div key={blog.id} className={styles.blogCard}>
                    <Link href={`/blog/${blog.slug}`} className={styles.cardImageWrapper}>
                      <img
                        src={getImageUrl(blog.cover_image) || '/logo.png'}
                        alt={blog.title}
                        className={styles.cardImage}
                      />
                    </Link>
                    <div className={styles.cardContent}>
                      <span className={styles.tagBadge}>{blog.category}</span>
                      <h3 className={styles.cardTitle}>
                        <Link href={`/blog/${blog.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {blog.title}
                        </Link>
                      </h3>
                      <p className={styles.cardExcerpt}>{blog.excerpt}</p>
                      
                      <div className={styles.cardFooter}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(blog.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Link 
                            href={`/blog/${blog.slug}`}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#ffffff',
                              borderRadius: '6px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              textDecoration: 'none',
                              transition: 'background 0.2s ease',
                            }}
                          >
                            Read More
                          </Link>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {readTime} Min Read
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
