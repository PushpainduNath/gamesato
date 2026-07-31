'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import Translate from '@/components/Translate';
import styles from './page.module.css';

export default function UpdateEmailPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [newEmail, setNewEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);



  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={36} className={styles.spinner} />
      </div>
    );
  }

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

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!confirmPassword) {
      setEmailError('Please confirm your password');
      return;
    }

    setEmailSaving(true);

    try {
      const res = await fetch('/api/users/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, password: confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setEmailSuccess(true);
        await update({
          ...session,
          user: {
            ...session?.user,
            email: newEmail
          }
        });
        setTimeout(() => {
          router.push('/profile/settings');
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
    <div className={styles.pageLayout}>
      
      {/* Header Bar */}
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
            <Translate textKey="updateEmailTitle" fallback="Update Email Address" />
          </h1>
        </div>
        <button 
          className={styles.headerBtn} 
          onClick={() => router.push('/profile')}
          aria-label="Close"
        >
          <X size={22} color="currentColor" />
        </button>
      </header>

      {/* Main Form Content */}
      <div className={styles.contentWrapper}>
        <p className={styles.descriptionText}>
          Please enter your new email address below. You will need to confirm your password to make the update.
        </p>

        <form onSubmit={handleUpdateEmail} className={styles.updateForm} autoComplete="off">
          {emailSuccess ? (
            <div className={styles.successMessage}>
              <CheckCircle size={32} color="#10b981" />
              <span>Email updated successfully!</span>
            </div>
          ) : (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="currentEmail">Current Email</label>
                <input 
                  type="email" 
                  id="currentEmail" 
                  name="current_email_display"
                  value={session?.user?.email || ''} 
                  disabled 
                  autoComplete="off"
                  className={styles.readonlyInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="newEmail">New Email</label>
                <input 
                  type="email" 
                  id="newEmail" 
                  name="new_email_no_autofill"
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  placeholder="Enter new email address"
                  autoComplete="off"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className={styles.passwordInputWrapper}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="confirmPassword" 
                    name="confirm_password_no_autofill"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    required
                  />
                  <button 
                    type="button" 
                    className={styles.eyeToggleBtn} 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {emailError && <p className={styles.errorMessage}>{emailError}</p>}

              <button 
                type="submit" 
                disabled={emailSaving} 
                className={styles.submitBtn}
              >
                {emailSaving ? (
                  <div className={styles.loadingState}>
                    <Loader2 size={18} className={styles.btnSpinner} />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          )}
        </form>
      </div>

    </div>
  );
}
