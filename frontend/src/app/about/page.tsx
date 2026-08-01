import React from 'react';
import { Metadata } from 'next';
import styles from './page.module.css';

interface PageData {
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_tags: string | null;
  created_at: string;
  updated_at: string;
}

async function getPageData(): Promise<PageData | null> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
    const res = await fetch(`${backendUrl}/api/admin/content/pages/public/about`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching about page content:', err);
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPageData();
  if (data) {
    return {
      title: data.meta_title || data.title,
      description: data.meta_description || undefined,
      keywords: data.meta_tags || undefined,
    };
  }
  return {
    title: 'About Us | Gamesato',
  };
}

export default async function AboutPage() {
  const pageData = await getPageData();

  if (pageData) {
    const formattedDate = new Date(pageData.updated_at || pageData.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });

    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          {pageData.title || 'About Us'}
        </h1>
        <p className={styles.updatedAt}>
          Last updated on {formattedDate}
        </p>
        
        <hr className={styles.divider} />

        <div 
          className={styles.contentBody}
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      </div>
    );
  }

  // Fallback to static version
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        About Gamesato
      </h1>
      <p className={styles.updatedAt}>
        Last updated on 1/12/2021
      </p>
      
      <hr className={styles.divider} />

      <div className={styles.contentBody}>
        <div>
          <p>
            Welcome to Gamesato, your ultimate destination for high-quality, instant-play HTML5 H5 web games. Our mission is to deliver a fast, responsive, and engaging gaming experience right inside your browser—no downloads, installations, or sign-ups required to start playing.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2>Our Core Vision</h2>
          <p>
            We believe that playing web games should be frictionless. By optimizing game asset pipelines and using modern lightweight servers, we serve H5 game packages at maximum speeds, allowing gamers on any device (mobile, tablet, or desktop) to play instantly.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2>Developer Platform</h2>
          <p>
            Gamesato is also built to support the game developer community. We provide creators with developer-centric tools to upload ZIP game packages, monitor analytics, evaluate real-time play counts, and get in-depth user feedback metrics securely.
          </p>
        </div>
      </div>
    </div>
  );
}
