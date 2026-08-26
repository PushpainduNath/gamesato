import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
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
  meta_title?: string;
  meta_description?: string;
  published_at: string;
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';

  try {
    const res = await fetch(`${backendUrl}/api/blogs/${slug}`, { cache: 'no-store' });
    if (!res.ok) {
      return { title: 'Blog Post Not Found | Gamesato' };
    }
    const data = await res.json();
    const blog: Blog = data.blog;

    return {
      title: blog.meta_title || `${blog.title} | Gamesato Blog`,
      description: blog.meta_description || blog.excerpt,
      alternates: {
        canonical: `/blog/${slug}`,
      },
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        images: [getImageUrl(blog.cover_image) || '/logo.png'],
      },
    };
  } catch (err) {
    return { title: 'Gamesato Blog' };
  }
}

async function getBlog(slug: string): Promise<Blog | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';
  try {
    const res = await fetch(`${backendUrl}/api/blogs/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.blog || null;
  } catch (err) {
    console.error('Error fetching blog:', err);
    return null;
  }
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt,
    image: getImageUrl(blog.cover_image) || `${siteUrl}/logo.png`,
    url: `${siteUrl}/blog/${blog.slug}`,
    datePublished: blog.published_at,
    dateModified: blog.published_at,
    author: {
      '@type': 'Organization',
      name: blog.author || 'Gamesato Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Gamesato',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${blog.slug}`,
    },
  };

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
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: `${siteUrl}/blog/${blog.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className={styles.postContainer}>
        <Link href="/blog" className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        <div>
          <span className={styles.categoryBadge}>{blog.category}</span>
          <h1 className={styles.postTitle}>{blog.title}</h1>

          <div className={styles.postMeta}>
            <span className={styles.metaItem}>
              <User size={15} /> {blog.author}
            </span>
            <span className={styles.metaItem}>
              <Calendar size={15} />
              {new Date(blog.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
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

        <div
          className={styles.postBody}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>
    </>
  );
}
