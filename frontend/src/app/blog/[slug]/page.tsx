import React from 'react';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import BlogClientView from './BlogClientView';

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

async function getBlogData(slug: string): Promise<{ blog: Blog | null; relatedBlogs: Blog[] }> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';
  try {
    const res = await fetch(`${backendUrl}/api/blogs/${slug}`, { cache: 'no-store' });
    if (!res.ok) return { blog: null, relatedBlogs: [] };
    const data = await res.json();
    const blog: Blog = data.blog || null;

    let related: Blog[] = [];
    try {
      const listRes = await fetch(`${backendUrl}/api/blogs`, { cache: 'no-store' });
      if (listRes.ok) {
        const listData = await listRes.json();
        const allBlogs: Blog[] = listData.blogs || [];
        related = allBlogs.filter((b) => b.slug !== slug);
      }
    } catch (e) {
      console.error('Error fetching related blogs:', e);
    }

    return { blog, relatedBlogs: related };
  } catch (err) {
    console.error('Error fetching blog data:', err);
    return { blog: null, relatedBlogs: [] };
  }
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const { blog, relatedBlogs } = await getBlogData(slug);

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

      <BlogClientView blog={blog} relatedBlogs={relatedBlogs} siteUrl={siteUrl} />
    </>
  );
}
