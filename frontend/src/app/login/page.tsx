'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, X, ChevronLeft } from 'lucide-react';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
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
      setError('An unexpected error occurred. Please try again.');
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
          <Link href="/" className={styles.logoLink} aria-label="Gamesato Home">
            <img 
              src="/logo-full.png" 
              alt="Gamesato Logo" 
              className={styles.logo}
              onError={(e) => { e.currentTarget.src = '/logo-full.webp'; }}
            />
          </Link>
        </div>
        <h2 className={styles.title}>
          Welcome Back!
        </h2>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form} suppressHydrationWarning>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <div className={styles.inputWrapper} suppressHydrationWarning>
              <input
                id="email"
                type="email"
                required
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                suppressHydrationWarning
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.inputWrapper} suppressHydrationWarning>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="*********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                suppressHydrationWarning
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

          <Link href="#" className={styles.forgotPassword} onClick={(e) => { e.preventDefault(); setError('Password reset feature is not configured yet. Please contact an administrator.'); }}>
            Forgot Password?
          </Link>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLineLeft}></div>
          <span className={styles.dividerText}>or continue with</span>
          <div className={styles.dividerLineRight}></div>
        </div>

        <div className={styles.socials}>
          {/* Facebook - Temporarily hidden
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
          */}

          {/* Google */}
          <button 
            type="button" 
            onClick={() => handleSocialLogin('google')} 
            className={styles.googleButton}
            aria-label="Continue with Google"
          >
            <svg viewBox="0 0 24 24" className={styles.googleIcon}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Discord - Temporarily hidden
          <button 
            type="button" 
            onClick={() => handleSocialLogin('discord')} 
            className={styles.socialButton}
            aria-label="Continue with Discord"
          >
            <svg viewBox="0 0 24 24" className={styles.socialIcon}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.172-.393-.412-.882-.63-1.25a.077.077 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
            </svg>
          </button>
          */}
        </div>

        <p className={styles.footerText}>
          Haven't any account? 
          <Link href="/signup" className={styles.footerLink}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
