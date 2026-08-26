'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Gamepad2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import styles from './page.module.css';

interface Blog {
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

interface BlogClientViewProps {
  blog: Blog;
  relatedBlogs: Blog[];
  siteUrl: string;
}

function calculateReadingTime(text: string): number {
  const cleanText = text.replace(/<[^>]+>/g, '');
  const words = cleanText.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogClientView({ blog, relatedBlogs, siteUrl }: BlogClientViewProps) {
  // Parse H2 headings for Table of Contents and inject IDs into content
  const { processedContent, tocHeadings } = useMemo(() => {
    if (!blog.content) return { processedContent: '', tocHeadings: [] };

    const headings: { id: string; text: string }[] = [];
    let index = 0;

    const updatedHtml = blog.content.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, textContent) => {
      const cleanText = textContent.replace(/<[^>]+>/g, '').trim();
      const id = `toc-heading-${index}`;
      headings.push({ id, text: cleanText });
      index++;
      return `<h2 id="${id}" ${attrs}>${textContent}</h2>`;
    });

    return { processedContent: updatedHtml, tocHeadings: headings };
  }, [blog.content]);

  const readingTime = calculateReadingTime(blog.content);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Floating PLAY GAMES Right Side Button */}
      <Link href="/" className={styles.floatingPlayBtn} title="Play Games on Gamesato">
        <div className={styles.floatingPlayBtnInner}>
          <Gamepad2 size={16} />
          <span>PLAY GAMES</span>
        </div>
      </Link>

      <div className={styles.mainLayout}>
        {/* Left Sidebar (Desktop Table of Contents & Promo) */}
        <aside className={styles.leftSidebar}>
          <div className={styles.promoCard}>
            <h3>We're here for all your gaming ideas!</h3>
            <Link href="/contact" className={styles.contactBtn}>
              CONTACT US
            </Link>
          </div>

          {tocHeadings.length > 0 && (
            <div className={styles.tocCard}>
              <h3 className={styles.tocTitle}>Table of Contents</h3>
              <ul className={styles.tocList}>
                {tocHeadings.map((heading) => (
                  <li key={heading.id}>
                    <button
                      type="button"
                      onClick={() => scrollToHeading(heading.id)}
                      className={styles.tocLink}
                    >
                      {heading.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Right Main Article Content */}
        <main className={styles.articleMain}>
          <Link href="/blog" className={styles.backBtn}>
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <div>
            <span className={styles.categoryBadge}>{blog.category}</span>
            <h1 className={styles.postTitle}>{blog.title}</h1>

            <div className={styles.postMeta}>
              <span className={styles.metaItem}>
                <User size={15} /> {blog.author || 'Gamesato Team'}
              </span>
              <span className={styles.metaItem}>
                <Calendar size={15} />
                {new Date(blog.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className={styles.metaItem}>
                <Clock size={15} /> {readingTime} Min Read
              </span>
            </div>
          </div>

          {blog.cover_image && (
            <div className={styles.coverImageWrapper}>
              <img
                src={getImageUrl(blog.cover_image)}
                alt={blog.title}
                className={styles.coverImage}
              />
            </div>
          )}

          {/* Article HTML Content */}
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* Related Posts Section */}
          {relatedBlogs.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.relatedHeading}>RELATED POSTS</h2>
              <div className={styles.relatedGrid}>
                {relatedBlogs.slice(0, 3).map((item) => (
                  <div key={item.id} className={styles.relatedCard}>
                    <Link href={`/blog/${item.slug}`} className={styles.relatedImgLink}>
                      <img
                        src={getImageUrl(item.cover_image)}
                        alt={item.title}
                        className={styles.relatedImg}
                      />
                    </Link>
                    <div className={styles.relatedCardBody}>
                      <span className={styles.relatedDate}>
                        {new Date(item.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <h3 className={styles.relatedCardTitle}>
                        <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                      </h3>
                      <p className={styles.relatedCardExcerpt}>{item.excerpt}</p>
                      
                      <div className={styles.relatedCardFooter}>
                        <Link href={`/blog/${item.slug}`} className={styles.readMoreBtn}>
                          Read More
                        </Link>
                        <span className={styles.readTimeText}>
                          {calculateReadingTime(item.content)} Min Read
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
