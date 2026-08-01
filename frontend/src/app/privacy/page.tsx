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
    const res = await fetch(`${backendUrl}/api/admin/content/pages/public/privacy`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching privacy page content:', err);
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
    title: 'Privacy Policy | Gamesato',
  };
}

export default async function PrivacyPage() {
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
          {pageData.title || 'Privacy Policy'}
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
        Privacy Policy
      </h1>
      <p className={styles.updatedAt}>
        Last updated on 1/12/2021
      </p>
      
      <hr className={styles.divider} />

      <div className={styles.contentBody}>
        <div>
          <p>
            At Gamesato, we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard information when you visit and play games on our platform.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2>1. Information We Collect</h2>
          <p>
            We collect non-personal analytics information such as browser type, device specifications, and page interactions to optimize performance. If you register an account, we securely store your email address and username encrypted in our database.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2>2. Cookies and Storage</h2>
          <p>
            We use browser LocalStorage and essential cookies strictly to maintain user authentication sessions, save game favorites, and remember your display preferences (such as dark mode and language settings).
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2>3. Data Security & Protection</h2>
          <p>
            Your account credentials are strictly protected with industry-standard bcrypt hashing. We never sell, lease, or share your personal information with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
