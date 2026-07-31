'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, Loader2 } from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import Translate from '@/components/Translate';
import styles from './page.module.css';

export default function DeleteAccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [isAgreed, setIsAgreed] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={36} className={styles.spinner} />
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className={styles.unauthorizedContainer}>
        <h3><Translate textKey="unauthorizedTitle" fallback="Access Denied" /></h3>
        <p><Translate textKey="unauthorizedText" fallback="Please log in to access this page." /></p>
        <button className={styles.backHomeBtn} onClick={() => router.push('/')}>
          <Translate textKey="backHome" fallback="Back to Home" />
        </button>
      </div>
    );
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) {
      setError('You must check the agreement box before deleting your account.');
      return;
    }

    setError('');
    setDeleting(true);

    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: deletePassword, 
          provider: (session?.user as any)?.provider 
        }),
      });

      if (res.ok) {
        // Automatically logout and redirect to home page
        await signOut({ callbackUrl: '/' });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account. Please try again.');
        setDeleting(false);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again later.');
      setDeleting(false);
    }
  };

  return (
    <div className={styles.deleteLayout}>
      
      {/* Header bar matching settings layout & mockup */}
      <header className={styles.settingsHeader}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.headerBtn} 
            onClick={() => router.push('/profile/settings')}
            aria-label="Back to settings"
          >
            <ChevronLeft size={22} color="currentColor" />
          </button>
          <h1 className={styles.headerTitle}>
            <Translate textKey="deleteAccountTitle" fallback="Delete Account" />
          </h1>
        </div>
        <button 
          className={styles.headerBtn} 
          onClick={() => router.push('/profile')}
          aria-label="Close"
        >
          <X size={20} color="currentColor" />
        </button>
      </header>

      {/* Main warning container block */}
      <div className={styles.contentContainer}>
        <p className={styles.warningText}>
          <Translate 
            textKey="deleteAccountIntro" 
            fallback="Delete account action cannot be undone. Please read the following carefully." 
          />
        </p>

        <div className={styles.warningCardGroup}>
          <div className={styles.warningCardItem}>
            <div className={styles.warningCardIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className={styles.warningCardContent}>
              <h4 className={styles.warningCardTitle}>Data Deletion</h4>
              <p className={styles.warningCardDesc}>
                All your personal information, history, and saved preferences will be permanently erased from our servers.
              </p>
            </div>
          </div>

          <div className={styles.warningCardItem}>
            <div className={styles.warningCardIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m4.93 4.93 14.14 14.14"/>
              </svg>
            </div>
            <div className={styles.warningCardContent}>
              <h4 className={styles.warningCardTitle}>Loss of Access</h4>
              <p className={styles.warningCardDesc}>
                You will immediately lose access to all services and active subscriptions associated with this account.
              </p>
            </div>
          </div>
        </div>

        {/* Deletion Form */}
        <form onSubmit={handleDelete} className={styles.deletionForm}>
          
          {/* Agreement Checkbox */}
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={isAgreed} 
              onChange={(e) => setIsAgreed(e.target.checked)}
              className={styles.hiddenCheckbox}
            />
            <span className={`${styles.customCheckbox} ${isAgreed ? styles.checkboxChecked : ''}`} />
            <span className={styles.checkboxText}>
              <Translate 
                textKey="deleteAccountCheckbox" 
                fallback="I understand that deactivating my account is permanent and cannot be reversed." 
              />
            </span>
          </label>

          {/* Confirm Password input field - Only for manual registrations */}
          {(session?.user as any)?.provider === 'credentials' ? (
            <div className={styles.inputGroup} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="deletePassword" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Confirm Password</label>
              <input 
                type="password" 
                id="deletePassword" 
                value={deletePassword} 
                onChange={(e) => setDeletePassword(e.target.value)} 
                placeholder="Enter your password"
                required
                className={styles.passwordInput}
              />
            </div>
          ) : (
            <div className={styles.socialVerificationWrapper} style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.85rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4 }}>
                You signed in via <strong>{(session?.user as any)?.provider}</strong>. Please click below to verify and delete.
              </p>
            </div>
          )}

          {error && <p className={styles.errorMessage}>{error}</p>}

          {/* Delete Account button using custom SVG */}
          <button 
            type="submit" 
            disabled={!isAgreed || deleting || ((session?.user as any)?.provider === 'credentials' && !deletePassword)} 
            className={styles.deleteButtonSubmit}
            aria-label="Delete My Account"
          >
            {deleting ? (
              <div className={styles.loadingBtnState}>
                <Loader2 size={24} className={styles.btnSpinner} />
                <span>Deleting...</span>
              </div>
            ) : (
              <img 
                src="/delete-button.svg" 
                alt="Delete My Account Button" 
                className={styles.deleteBtnImg} 
              />
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
