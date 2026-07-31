'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { useLanguageStore, useTranslation } from '@/store/useLanguageStore';
import styles from './page.module.css';

const languages = [
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w80/us.png' },
  { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w80/de.png' },
  { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w80/es.png' },
  { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w80/fr.png' },
  { code: 'id', name: 'Indonesia', flag: 'https://flagcdn.com/w80/id.png' },
];

export default function LanguagePage() {
  const router = useRouter();
  const { setLanguage, isMounted, setMounted } = useLanguageStore();
  const [selectedLang, setSelectedLang] = useState('en');
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('appLanguage') || 'en';
      setSelectedLang(stored);
      setMounted();
    }
  }, [setMounted]);

  const handleContinue = () => {
    setLanguage(selectedLang);
    router.push('/');
  };

  const handleBackOrClose = () => {
    router.push('/');
  };

  return (
    <div className={styles.container}>
      {/* Header bar */}
      <header className={styles.header}>
        <button className={styles.iconBtn} onClick={handleBackOrClose} aria-label="Back">
          <ArrowLeft size={22} color="currentColor" />
        </button>
        <h1 className={styles.title}>{t('chooseLanguage')}</h1>
        <button className={styles.iconBtn} onClick={handleBackOrClose} aria-label="Close">
          <X size={22} color="currentColor" />
        </button>
      </header>

      {/* Languages List */}
      <main className={styles.list}>
        {languages.map((lang) => {
          const isSelected = selectedLang === lang.code;
          const isDisabled = lang.code !== 'en';
          return (
            <div 
              key={lang.code} 
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
              onClick={() => {
                if (!isDisabled) {
                  setSelectedLang(lang.code);
                }
              }}
              style={isDisabled ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
            >
              <div className={styles.cardLeft}>
                <div className={styles.flagWrapper}>
                  <img src={lang.flag} alt={`${lang.name} flag`} className={styles.flagImg} />
                </div>
                <span className={styles.langName}>{lang.name}</span>
              </div>
              <div className={styles.radioWrapper}>
                <div className={`${styles.radio} ${isSelected ? styles.radioSelected : ''}`}>
                  {isSelected && <div className={styles.radioDot} />}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom Sticky Action Bar */}
      <div className={styles.footerContainer}>
        <button className={styles.continueBtn} onClick={handleContinue}>
          {t('continue')}
        </button>
      </div>
    </div>
  );
}
