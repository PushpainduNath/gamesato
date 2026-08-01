'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, X, ChevronLeft } from 'lucide-react';
import styles from '../login/page.module.css';

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Redirect if already authenticated & sync active theme
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
    const isLight = document.documentElement.classList.contains('light-theme') || localStorage.getItem('theme') === 'light';
    setTheme(isLight ? 'light' : 'dark');
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Submit signup request to register API
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        throw new Error(regData.error || 'Registration failed');
      }

      // 2. Automatically log the user in using credentials
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    signIn(provider, { callbackUrl: '/' });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mobileHeader}>
        <button 
          type="button" 
          onClick={() => router.push('/')} 
          className={styles.backBtn}
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          type="button" 
          onClick={() => router.push('/')} 
          className={styles.closeBtn}
          aria-label="Close page"
        >
          <X size={24} />
        </button>
      </div>

      <button 
        type="button" 
        onClick={() => router.push('/')} 
        className={styles.closePageBtn}
        aria-label="Close page"
      >
        <X size={20} />
      </button>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <img 
            src={theme === 'light' ? '/logo-light-theme.webp' : '/logo-dark-theme.webp'} 
            alt="Gamesato Logo" 
            className={styles.logo}
            onError={(e) => { e.currentTarget.src = theme === 'light' ? '/logo-light-theme.png' : '/logo-dark-theme.png'; }}
          />
        </div>
        <h2 className={styles.title}>
          Get Started With <span>Free</span>
        </h2>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>Name</label>
            <div className={styles.inputWrapper}>
              <input
                id="name"
                type="text"
                required
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <div className={styles.inputWrapper}>
              <input
                id="email"
                type="email"
                required
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="*********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeButton}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLineLeft}></div>
          <span className={styles.dividerText}>or continue with</span>
          <div className={styles.dividerLineRight}></div>
        </div>

        <div className={styles.socials}>
          {/* Facebook */}
          <button 
            type="button" 
            onClick={() => handleSocialLogin('facebook')} 
            className={styles.socialButton}
            aria-label="Continue with Facebook"
          >
            <svg viewBox="0 0 24 24" className={styles.socialIcon}>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          {/* Google */}
          <button 
            type="button" 
            onClick={() => handleSocialLogin('google')} 
            className={styles.socialButton}
            aria-label="Continue with Google"
          >
            <svg viewBox="0 0 24 24" className={styles.socialIcon}>
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.414 0-6.19-2.775-6.19-6.19 0-3.414 2.776-6.19 6.19-6.19 1.483 0 2.842.525 3.9 1.4 l3.013-3.013C18.905 1.83 15.795 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.977 0-.746-.08-1.302-.22-1.825H12.24z"/>
            </svg>
          </button>

          {/* Discord */}
          <button 
            type="button" 
            onClick={() => handleSocialLogin('discord')} 
            className={styles.socialButton}
            aria-label="Continue with Discord"
          >
            <svg viewBox="0 0 24 24" className={styles.socialIcon}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.172-.393-.412-.882-.63-1.25a.077.077 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
            </svg>
          </button>
        </div>

        <p className={styles.footerText}>
          Already have an account ? 
          <Link href="/login" className={styles.footerLink}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
