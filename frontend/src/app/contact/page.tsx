'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface PageData {
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_tags: string | null;
  created_at: string;
  updated_at: string;
}

export default function ContactPage() {
  const [pageData, setPageData] = useState<PageData | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
    
    fetch(`${backendUrl}/api/admin/content/pages/public/contact`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to load page');
      })
      .then(data => {
        setPageData(data);
        
        // Dynamically inject meta tags
        document.title = data.meta_title || data.title;
        if (data.meta_description) {
          let desc = document.querySelector('meta[name="description"]');
          if (!desc) {
            desc = document.createElement('meta');
            desc.setAttribute('name', 'description');
            document.head.appendChild(desc);
          }
          desc.setAttribute('content', data.meta_description);
        }
        if (data.meta_tags) {
          let keywords = document.querySelector('meta[name="keywords"]');
          if (!keywords) {
            keywords = document.createElement('meta');
            keywords.setAttribute('name', 'keywords');
            document.head.appendChild(keywords);
          }
          keywords.setAttribute('content', data.meta_tags);
        }
      })
      .catch(err => {
        console.error('Error fetching contact page content:', err);
        document.title = 'Contact Support';
      });
  }, []);

  if (pageData) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white' }}>{pageData.title}</h1>
        
        <div className="glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div 
            dangerouslySetInnerHTML={{ __html: pageData.content }}
            style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}
          />

          <div style={{ marginTop: '1rem' }}>
            <Link href="/" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)', color: 'white', padding: '0.8rem 1.8rem', borderRadius: '50px', fontWeight: 600 }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to static version
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white' }}>Contact Support</h1>
      
      <div className="glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          Have any questions, concerns, or feedback? Get in touch with us using the channels below. We normally respond within 24–48 hours.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '1rem 0' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px' }}>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '0.5rem' }}>📧 General Inquiries</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>support@gamesato.com</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px' }}>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '0.5rem' }}>🛠️ Developer Relations</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>developers@gamesato.com</p>
          </div>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          For technical issues related to a specific H5 game, please include the game name, direct URL link, and details of your device/browser in the email.
        </p>

        <div style={{ marginTop: '1rem' }}>
          <Link href="/" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)', color: 'white', padding: '0.8rem 1.8rem', borderRadius: '50px', fontWeight: 600 }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
