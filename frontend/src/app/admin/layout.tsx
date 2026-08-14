'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminStore, AdminTheme } from '@/store/useAdminStore';
import Link from 'next/link';
import { 
  LayoutDashboard, Gamepad2, Users, ShieldCheck, 
  RotateCcw, LogOut, Layers, Search, Palette, Check, ChevronDown, FileText,
  Sun, Moon, X, Mic
} from 'lucide-react';
import styles from './layout.module.css';

import CustomDialogModal, { DialogState } from '@/components/CustomDialogModal';

const THEME_OPTIONS: { id: AdminTheme; label: string; bg: string; accent: string; dotColor: string }[] = [
  { id: 'default', label: 'Dark', bg: '#0c0d14', accent: '#14b8a6', dotColor: '#0f172a' },
  { id: 'cyberwhite', label: 'White', bg: '#f0f4f9', accent: '#14b8a6', dotColor: '#ffffff' },
  // { id: 'creamy', label: 'Creamy White', bg: '#f5f2eb', accent: '#d97706', dotColor: '#f5f2eb' },
  // { id: 'forest', label: 'Forest Green', bg: '#06120c', accent: '#10b981', dotColor: '#10b981' },
  // { id: 'ocean', label: 'Ocean Blue', bg: '#071124', accent: '#0284c7', dotColor: '#0284c7' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, token, logout, globalSearchQuery, setGlobalSearchQuery, theme, setTheme } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => setIsListening(true);
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setGlobalSearchQuery(transcript);
          }
        };
        rec.onend = () => setIsListening(false);
        setRecognition(rec);
      }
    }
  }, [setGlobalSearchQuery]);

  const startVoiceSearch = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Isolate Admin panel from portal light-theme pollution
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
      document.documentElement.setAttribute('data-admin-active', 'true');
      document.body.setAttribute('data-admin-active', 'true');
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.documentElement.removeAttribute('data-admin-active');
        document.body.removeAttribute('data-admin-active');
      }
    };
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname === '/admin/login') return;

    if (!token) {
      router.push('/admin/login');
    }
  }, [mounted, token, pathname, router]);

  const handleFlushCache = async () => {
    if (!token) return;
    setFlushing(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/cache/flush`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setDialogState({
          isOpen: true,
          type: 'success',
          title: 'Cache Flushed',
          message: 'Redis cache database flushed successfully!'
        });
      } else {
        const err = await res.json();
        setDialogState({
          isOpen: true,
          type: 'danger',
          title: 'Flush Failed',
          message: err.error || 'Failed to flush Redis cache'
        });
      }
    } catch (err) {
      console.error(err);
      setDialogState({
        isOpen: true,
        type: 'danger',
        title: 'Connection Error',
        message: 'Failed to connect to backend.'
      });
    } finally {
      setFlushing(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: '#06080e' }}>
        Loading Admin Interface...
      </div>
    );
  }

  // Render children directly on login page or if not logged in
  if (pathname === '/admin/login' || !token) {
    return <>{children}</>;
  }

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';
  const currentThemeObj = THEME_OPTIONS.find(t => t.id === (theme || 'default')) || THEME_OPTIONS[0];

  return (
    <div className={styles.adminContainer} data-admin-theme={theme || 'default'}>
      {/* Left Sidebar */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logoArea}>
          <img src="/dark_logo_withoutbg.png" alt="Gamesato" className={styles.logoImg} />
          <span className={styles.logoText}>
            Game<span className={styles.logoTextSato}>sato</span>
          </span>
        </Link>

        <nav className={styles.menu}>
          <Link 
            href="/admin/games" 
            className={`${styles.menuItem} ${pathname === '/admin/games' ? styles.activeItem : ''}`}
          >
            <Gamepad2 size={18} className={styles.menuLucideIcon} />
            <span>Game Management</span>
          </Link>

          <Link 
            href="/admin/categories" 
            className={`${styles.menuItem} ${pathname === '/admin/categories' ? styles.activeItem : ''}`}
          >
            <Layers size={18} className={styles.menuLucideIcon} />
            <span>Category Management</span>
          </Link>

          <Link 
            href="/admin/users" 
            className={`${styles.menuItem} ${pathname === '/admin/users' ? styles.activeItem : ''}`}
          >
            <Users size={18} className={styles.menuLucideIcon} />
            <span>User Management</span>
          </Link>

          <Link 
            href="/admin/content" 
            className={`${styles.menuItem} ${pathname === '/admin/content' ? styles.activeItem : ''}`}
          >
            <FileText size={18} className={styles.menuLucideIcon} />
            <span>Content Management</span>
          </Link>

          {isSuperAdmin && (
            <Link 
              href="/admin/admins" 
              className={`${styles.menuItem} ${pathname.startsWith('/admin/admins') ? styles.activeItem : ''}`}
            >
              <ShieldCheck size={18} className={styles.menuLucideIcon} />
              <span>Admin Management</span>
            </Link>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            onClick={handleFlushCache} 
            disabled={flushing}
            className={`${styles.actionBtn} ${styles.flushBtn}`}
          >
            <RotateCcw size={16} />
            <span>{flushing ? 'Flushing...' : 'Flush Redis Cache'}</span>
          </button>
          
          <button 
            onClick={handleLogout} 
            className={`${styles.actionBtn} ${styles.logoutBtn}`}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.headerSearch}>
            <Search size={16} className={styles.headerSearchIcon} />
            <input 
              type="text" 
              placeholder="Search..." 
              className={styles.headerSearchInput} 
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
            />
            {globalSearchQuery && (
              <button
                type="button"
                onClick={() => setGlobalSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--adm-text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  marginRight: '2px',
                  borderRadius: '50%',
                  transition: 'color 0.2s ease',
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={startVoiceSearch}
              style={{
                background: 'transparent',
                border: 'none',
                color: isListening ? '#14b8a6' : 'var(--adm-text-secondary, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
                transition: 'color 0.2s ease',
              }}
              title={isListening ? "Listening..." : "Voice Search"}
            >
              <Mic size={16} />
            </button>
          </div>
          <div className={styles.headerRight}>
            {/* Theme Toggle Button hidden until enabled by management */}
            {/* <button
              type="button"
              className={`${styles.themeToggleSlider} ${theme === 'cyberwhite' ? styles.themeToggleLight : styles.themeToggleDark}`}
              onClick={() => setTheme(theme === 'cyberwhite' ? 'default' : 'cyberwhite')}
              aria-label="Toggle Theme"
              title={`Switch to ${theme === 'cyberwhite' ? 'Dark' : 'Light'} mode`}
            >
              <span className={styles.themeKnob}>
                {theme === 'cyberwhite' ? <Sun size={14} /> : <Moon size={14} />}
              </span>
              <span className={styles.themeLabelText}>
                {theme === 'cyberwhite' ? 'Light' : 'Dark'}
              </span>
            </button> */}

            <div className={styles.profileCircle}>
              {admin?.name ? admin.name.substring(0, 2).toUpperCase() : (admin?.email ? admin.email.substring(0, 2).toUpperCase() : 'AD')}
            </div>
          </div>
        </header>

        <div className={styles.pageContentWrapper}>
          {children}
        </div>
      </main>
      <CustomDialogModal {...dialogState} onClose={() => setDialogState({ isOpen: false })} />
    </div>
  );
}
