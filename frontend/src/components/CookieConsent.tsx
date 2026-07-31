'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/store/useLanguageStore';
import styles from './CookieConsent.module.css';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if consent has been recorded in localStorage
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setIsVisible(false);
  };



  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.cookieBackdrop}>
      <div className={styles.cookieCard}>
        <div className={styles.cookieIconContainer}>
          <img 
            src="/cookie-icon.webp" 
            alt="Cookie Icon" 
            className={styles.cookieIcon} 
            onError={(e) => { e.currentTarget.src = '/cookie-icon.svg'; }}
          />
        </div>
        
        <div className={styles.cookieContent}>
          <h2 className={styles.cookieTitle}>{t('cookieTitle') || 'Cookie Policy'}</h2>
          <p className={styles.cookieText}>
            We care about your data, and we'd use cookies only to improve your experience. By using this website, you accept our Cookies Policy. <Link href="/privacy" className={styles.cookieLink}>Learn More</Link>
          </p>
        </div>
        
        <div className={styles.cookieButtons}>
          <button onClick={handleAccept} className={styles.acceptBtn} aria-label="Accept Cookies">
            {t('accept') || 'Accept'}
          </button>
          <button onClick={handleReject} className={styles.rejectBtn} aria-label="Reject Cookies">
            {t('reject') || 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
