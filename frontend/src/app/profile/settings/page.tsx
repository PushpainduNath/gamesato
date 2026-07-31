'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, X, ArrowLeft, Loader2, Mail, Trash2, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import Translate from '@/components/Translate';
import styles from './page.module.css';

export default function AccountSettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  // Dialog States
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Email input states
  const [newEmail, setNewEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Sync current email to form on load
  useEffect(() => {
    if (session?.user?.email) {
      setNewEmail(session.user.email);
    }
  }, [session]);

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
        <p><Translate textKey="unauthorizedText" fallback="Please log in to access account settings." /></p>
        <button className={styles.backHomeBtn} onClick={() => router.push('/')}>
          <Translate textKey="backHome" fallback="Back to Home" />
        </button>
      </div>
    );
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailSaving(true);
    try {
      const res = await fetch('/api/users/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setEmailSuccess(true);
        // Refresh session data
        await update({
          ...session,
          user: {
            ...session?.user,
            email: newEmail
          }
        });
        setTimeout(() => {
          setEmailModalOpen(false);
          setEmailSuccess(false);
          setConfirmPassword('');
        }, 1500);
      } else {
        setEmailError(data.error || 'Failed to update email address');
      }
    } catch (err) {
      console.error(err);
      setEmailError('Something went wrong, please try again.');
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <div className={styles.settingsLayout}>
      
      {/* Header bar matches mockup */}
      <header className={styles.settingsHeader}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.headerBtn} 
            onClick={() => router.push('/profile')}
            aria-label="Back to Profile"
          >
            <ChevronLeft size={22} color="currentColor" />
          </button>
          <h1 className={styles.headerTitle}>
            <Translate textKey="accountSettings" fallback="Account Settings" />
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

      {/* Options List */}
      <div className={styles.optionsList}>
        
        {/* Update Email Row - Only for credentials users */}
        {(session?.user as any)?.provider === 'credentials' && (
          <div className={styles.optionRow} onClick={() => router.push('/profile/settings/update-email')}>
            <div className={styles.optionLeft}>
              <div className={styles.iconWrapper}>
                <Mail size={20} color="currentColor" className={styles.optionSvgIcon} />
              </div>
              <div className={styles.optionMeta}>
                <span className={styles.optionTitle}>
                  <Translate textKey="updateEmailTitle" fallback="Update email address" />
                </span>
                <span className={styles.optionSubtitle}>{session?.user?.email || 'No email associated'}</span>
              </div>
            </div>
            <ChevronRight size={18} className={styles.chevron} />
          </div>
        )}

        {/* Delete Account Row */}
        <div className={styles.optionRow} onClick={() => router.push('/profile/settings/delete')}>
          <div className={styles.optionLeft}>
            <div className={styles.iconWrapper}>
              <Trash2 size={20} color="currentColor" className={styles.optionSvgIcon} />
            </div>
            <div className={styles.optionMeta}>
              <span className={styles.optionTitle}>
                <Translate textKey="deleteAccountTitle" fallback="Delete account" />
              </span>
              <span className={styles.optionSubtitle}>
                <Translate textKey="deleteAccountSub" fallback="Secure all your data and account" />
              </span>
            </div>
          </div>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

      </div>

      {/* Modal Overlay: Update Email */}
      {emailModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setEmailModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Translate textKey="updateEmailTitle" fallback="Update email address" />
              </h3>
              <button className={styles.closeBtn} onClick={() => setEmailModalOpen(false)}>
                <X size={18} color="currentColor" />
              </button>
            </div>
            <form onSubmit={handleUpdateEmail} className={styles.modalForm}>
              {emailSuccess ? (
                <div className={styles.successMessage}>
                  <CheckCircle size={32} color="#10b981" />
                  <span>Email updated successfully!</span>
                </div>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <label htmlFor="email">New Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      placeholder="e.g. user@example.com"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input 
                      type="password" 
                      id="confirmPassword" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  {emailError && <p className={styles.errorMessage}>{emailError}</p>}
                  <button type="submit" disabled={emailSaving} className={styles.submitBtn}>
                    {emailSaving ? <Loader2 size={16} className={styles.btnSpinner} /> : 'Save changes'}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
