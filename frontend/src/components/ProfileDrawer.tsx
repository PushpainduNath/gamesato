'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  X,
  Pencil,
  Clock,
  ChevronRight,
  Mail,
  Trash2,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Settings,
  User,
  LogOut,
  Sparkles,
  Heart,
  ExternalLink,
  Phone,
  Upload,
  Check,
} from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import Translate from '@/components/Translate';
import { useUiStore } from '@/store/useUiStore';
import styles from './ProfileDrawer.module.css';

const AVATAR_PRESETS = Array.from({ length: 20 }, (_, i) => `/avatars/memo_${i + 1}.png`);

interface FavoriteGame {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_url: string;
  play_count: number;
  likes_count: number;
}

export default function ProfileDrawer() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation();
  const { isProfileDrawerOpen, closeProfileDrawer } = useUiStore();
  const [favorites, setFavorites] = useState<FavoriteGame[]>([]);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const favoritesCarouselRef = useRef<HTMLDivElement>(null);

  const handleScrollNav = (direction: 'left' | 'right') => {
    if (favoritesCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      favoritesCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // View state: 'profile' | 'settings' | 'delete' | 'update-email' | 'contact-support'
  const [currentView, setCurrentView] = useState<'profile' | 'settings' | 'delete' | 'update-email' | 'contact-support'>('profile');

  // Email update form states
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Delete account form states
  const [isAgreed, setIsAgreed] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Reset drawer state on open/close
  useEffect(() => {
    if (!isProfileDrawerOpen) {
      setCurrentView('profile');
      setEmailModalOpen(false);
      setIsAvatarPickerOpen(false);
      setIsAvatarSaving(false);
      setNewEmail('');
      setConfirmPassword('');
      setIsAgreed(false);
      setDeletePassword('');
      setDeleteError('');
    }
  }, [isProfileDrawerOpen]);

  // Fetch & sync favorites (local likes + database likes)
  useEffect(() => {
    if (isProfileDrawerOpen) {
      let localLikedIds: string[] = [];
      try {
        const raw = localStorage.getItem('gamesato_liked_games');
        if (raw) localLikedIds = JSON.parse(raw);
      } catch (_) {}

      fetch('/api/users/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localLikedIds }),
      })
        .then((res) => (res.ok ? res.json() : { favorites: [] }))
        .then((data) => {
          if (Array.isArray(data.favorites)) {
            setFavorites(data.favorites);
          }
        })
        .catch(() => {
          fetch('/api/users/favorites')
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data.favorites)) setFavorites(data.favorites);
            })
            .catch((err) => console.error('Failed to fetch favorites:', err));
        });
    }
  }, [session, isProfileDrawerOpen]);

  // Sync favorites dynamically when reactions are updated
  useEffect(() => {
    const handleReactionsUpdated = () => {
      let localLikedIds: string[] = [];
      try {
        const raw = localStorage.getItem('gamesato_liked_games');
        if (raw) localLikedIds = JSON.parse(raw);
      } catch (_) {}

      fetch('/api/users/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localLikedIds }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.favorites)) setFavorites(data.favorites);
        })
        .catch(() => {});
    };

    window.addEventListener('gamesato_reactions_updated', handleReactionsUpdated);
    return () => window.removeEventListener('gamesato_reactions_updated', handleReactionsUpdated);
  }, []);

  // Load avatar from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      const savedAvatar = localStorage.getItem(`customProfileAvatar_${session.user.id}`);
      if (savedAvatar) {
        setCustomAvatar(savedAvatar);
      } else {
        setCustomAvatar(null);
      }
    }
  }, [session?.user?.id, isProfileDrawerOpen]);

  // Sync avatar updates in real-time
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (session?.user?.id) {
        const savedAvatar = localStorage.getItem(`customProfileAvatar_${session.user.id}`);
        setCustomAvatar(savedAvatar);
      }
    };
    window.addEventListener('customProfileAvatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('customProfileAvatarUpdated', handleAvatarUpdate);
  }, [session?.user?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAvatarSaving(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          // Define target max dimensions for avatar
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio scaling
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          // Rescale on canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress image to JPEG at 80% quality (guarantees size < 100kb, typically 15-30kb)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            // Optimistically set preview immediately
            setCustomAvatar(compressedBase64);
            if (session?.user?.id) {
              localStorage.setItem(`customProfileAvatar_${session.user.id}`, compressedBase64);
            }
            window.dispatchEvent(new Event('customProfileAvatarUpdated'));

            // Save to PostgreSQL database which writes the file to disk
            try {
              const res = await fetch('/api/users/update-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: compressedBase64 }),
              });
              const data = await res.json();
              if (res.ok && data.url) {
                // Save clean relative URL path instead of huge base64 string
                setCustomAvatar(data.url);
                if (session?.user?.id) {
                  localStorage.setItem(`customProfileAvatar_${session.user.id}`, data.url);
                }
                
                // Sync relative URL path with next-auth session
                await update({
                  ...session,
                  user: {
                    ...session?.user,
                    image: data.url
                  }
                });
                window.dispatchEvent(new Event('customProfileAvatarUpdated'));
              }
            } catch (err) {
              console.error('Failed to update avatar in database:', err);
            } finally {
              setIsAvatarSaving(false);
              setIsAvatarPickerOpen(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          } else {
            setIsAvatarSaving(false);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setIsAvatarSaving(true);
    setCustomAvatar(presetUrl);
    if (session?.user?.id) {
      localStorage.setItem(`customProfileAvatar_${session.user.id}`, presetUrl);
    }
    window.dispatchEvent(new Event('customProfileAvatarUpdated'));

    try {
      const res = await fetch('/api/users/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: presetUrl }),
      });
      if (res.ok) {
        await update({
          ...session,
          user: {
            ...session?.user,
            image: presetUrl,
          },
        });
        window.dispatchEvent(new Event('customProfileAvatarUpdated'));
      }
    } catch (err) {
      console.error('Failed to select preset avatar in drawer:', err);
    } finally {
      setIsAvatarSaving(false);
      setIsAvatarPickerOpen(false);
    }
  };

  const getProviderIcon = (provider?: string) => {
    const p = (provider || 'google').toLowerCase();
    if (p === 'facebook') {
      return (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    }
    if (p === 'discord') {
      return (
        <svg viewBox="0 0 127.14 96.36" width="15" height="15" fill="#5865F2">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1-.73,2-1.5,2.92-2.3a75.76,75.76,0,0,0,72.16,0c.93.8,1.91,1.57,2.92,2.3a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.3,47.88,122.9,25.13,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" width="15" height="15">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    );
  };

  const getLanguageLabel = () => {
    switch (language) {
      case 'fr': return 'French';
      case 'de': return 'German';
      case 'es': return 'Spanish';
      case 'it': return 'Italian';
      case 'ar': return 'Arabic';
      case 'hi': return 'Hindi';
      case 'ja': return 'Japanese';
      case 'pt': return 'Portuguese';
      default: return 'English (US)';
    }
  };

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
          setCurrentView('settings');
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

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) {
      setDeleteError('You must check the agreement box before deleting your account.');
      return;
    }

    setDeleteError('');
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
        closeProfileDrawer();
        await signOut({ callbackUrl: '/' });
      } else {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete account. Please try again.');
        setDeleting(false);
      }
    } catch (err) {
      console.error(err);
      setDeleteError('Something went wrong. Please try again later.');
      setDeleting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeProfileDrawer();
    }
  };

  if (!isProfileDrawerOpen || !session) {
    return null;
  }

  const avatarUrl = customAvatar || session.user?.image || '/defaultprofileicon.jpeg';

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.drawerPanel}>
        
        {/* Dynamic Header based on currentView */}
        {currentView === 'profile' && (
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}><Translate textKey="profile" fallback="Profile" /></h1>
            </div>
            <button className={styles.iconBtn} onClick={closeProfileDrawer} aria-label="Close">
              <X size={22} color="currentColor" />
            </button>
          </header>
        )}

        {currentView === 'settings' && (
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.iconBtn} onClick={() => setCurrentView('profile')} aria-label="Back to Profile">
                <ChevronLeft size={22} color="currentColor" />
              </button>
              <h1 className={styles.title}><Translate textKey="accountSettings" fallback="Account Settings" /></h1>
            </div>
            <button className={styles.iconBtn} onClick={closeProfileDrawer} aria-label="Close">
              <X size={22} color="currentColor" />
            </button>
          </header>
        )}

        {currentView === 'delete' && (
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.iconBtn} onClick={() => setCurrentView('settings')} aria-label="Back to Settings">
                <ChevronLeft size={22} color="currentColor" />
              </button>
              <h1 className={styles.title}><Translate textKey="deleteAccountTitle" fallback="Delete Account" /></h1>
            </div>
            <button className={styles.iconBtn} onClick={closeProfileDrawer} aria-label="Close">
              <X size={22} color="currentColor" />
            </button>
          </header>
        )}

        {currentView === 'update-email' && (
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.iconBtn} onClick={() => setCurrentView('settings')} aria-label="Back to Settings">
                <ChevronLeft size={22} color="currentColor" />
              </button>
              <h1 className={styles.title}><Translate textKey="updateEmailTitle" fallback="Update Email Address" /></h1>
            </div>
            <button className={styles.iconBtn} onClick={closeProfileDrawer} aria-label="Close">
              <X size={22} color="currentColor" />
            </button>
          </header>
        )}
        {currentView === 'contact-support' && (
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.iconBtn} onClick={() => setCurrentView('profile')} aria-label="Back to Profile">
                <ArrowLeft size={22} color="currentColor" />
              </button>
              <h1 className={styles.title}><Translate textKey="contactSupport" fallback="Contact Support" /></h1>
            </div>
            <button className={styles.iconBtn} onClick={closeProfileDrawer} aria-label="Close">
              <X size={22} color="currentColor" />
            </button>
          </header>
        )}

        {/* User profile details scroll wrapper */}
        <div className={styles.drawerContent}>
          
          {/* VIEW: PROFILE */}
          {currentView === 'profile' && (
            <>
              {/* Avatar Section */}
              <div className={styles.avatarSection}>
                <div className={styles.avatarOuterWrapper}>
                  <div 
                    className={styles.avatarGlowBorder}
                    onClick={() => setIsAvatarPickerOpen(true)}
                    style={{ cursor: 'pointer' }}
                    title="Change Avatar"
                  >
                    <img src={avatarUrl} alt={session.user?.name || 'User'} className={styles.avatarImg} />
                  </div>

                  {/* Provider icon badge on bottom-left */}
                  {(session.user as any).provider && (session.user as any).provider !== 'credentials' && (
                    <div className={styles.providerBadgeOverlay} title={(session.user as any).provider}>
                      {getProviderIcon((session.user as any).provider)}
                    </div>
                  )}

                  {/* Edit avatar button on bottom-right */}
                  <button 
                    type="button"
                    className={styles.editBtn} 
                    onClick={() => setIsAvatarPickerOpen(true)} 
                    aria-label="Edit Avatar"
                  >
                    <Pencil size={13} color="currentColor" />
                  </button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
                <h2 className={styles.profileName}>{session.user?.name || 'Gamer'}</h2>
              </div>

              {/* Favorites Slider Card */}
              <div className={`${styles.favoritesCard} glass`}>
                <div className={styles.favoritesHeader}>
                  <h3 className={styles.favoritesTitle}>
                    <Translate textKey="favoriteGames" fallback="Favorite Games" />
                  </h3>
                  {favorites.length > 0 && (
                    <div className={styles.carouselNavBtns}>
                      <button 
                        type="button" 
                        className={styles.navBtn} 
                        onClick={() => handleScrollNav('left')}
                        aria-label="Previous"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button 
                        type="button" 
                        className={styles.navBtn} 
                        onClick={() => handleScrollNav('right')}
                        aria-label="Next"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                {favorites.length > 0 ? (
                  <div className={styles.favoritesCarousel} ref={favoritesCarouselRef}>
                    {favorites.map((game) => (
                      <div 
                        key={game.id} 
                        className={styles.favoriteCard} 
                        onClick={() => {
                          closeProfileDrawer();
                          router.push(`/games/${game.slug}`);
                        }}
                      >
                        <div className={styles.favoriteThumbnailWrapper}>
                          <img 
                            src={game.thumbnail_url.startsWith('http') ? game.thumbnail_url : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022'}${game.thumbnail_url}`} 
                            alt={game.title} 
                            className={styles.favoriteThumbnail} 
                          />
                        </div>
                        <div className={styles.favoriteCardInfo}>
                          <span className={styles.favoriteGameTitle}>
                            <Translate textKey={`game_${game.slug}_title`} fallback={game.title} />
                          </span>
                          <span className={styles.lastPlayed}>
                            <Clock size={10} style={{ marginRight: '4px' }} /> <Translate textKey="lastPlayed" fallback="Last played" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyFavorites}>
                    <p><Translate textKey="emptyFavoritesDesc" fallback="Click the Heart icon on any game detail page to save it here." /></p>
                  </div>
                )}
              </div>

              {/* Navigation Options List */}
              <div className={styles.optionsList}>
                <div className={styles.optionItem} onClick={() => setCurrentView('settings')}>
                  <div className={styles.optionLeft}>
                    <div className={styles.optionIconWrapper}>
                      <User size={20} />
                    </div>
                    <span className={styles.optionText}><Translate textKey="accountSettings" fallback="Account settings" /></span>
                  </div>
                  <ChevronRight size={18} className={styles.arrowIcon} />
                </div>

                <div 
                  className={styles.optionItem} 
                  onClick={() => {
                    window.location.href = 'mailto:support@gamesato.com?subject=Gamesato%20Support%20Request';
                  }}
                >
                  <div className={styles.optionLeft}>
                    <div className={styles.optionIconWrapper}>
                      <Phone size={19} />
                    </div>
                    <span className={styles.optionText}><Translate textKey="contactSupport" fallback="Contact support" /></span>
                  </div>
                  <ChevronRight size={18} className={styles.arrowIcon} />
                </div>

                <div 
                  className={styles.optionItem} 
                  onClick={() => {
                    closeProfileDrawer();
                    signOut();
                  }}
                >
                  <div className={styles.optionLeft}>
                    <div className={styles.optionIconWrapper}>
                      <LogOut size={19} />
                    </div>
                    <span className={styles.optionText}><Translate textKey="logOut" fallback="Log out" /></span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
            <div className={styles.optionsList}>
              {/* Update Email address option - Only for credentials user */}
              {(session.user as any).provider === 'credentials' && (
                <div className={styles.optionItem} onClick={() => setCurrentView('update-email')}>
                  <div className={styles.optionLeft}>
                    <div className={styles.optionIconWrapper}>
                      <Mail size={20} color="currentColor" className={styles.optionSvgIcon} />
                    </div>
                    <div className={styles.optionMeta}>
                      <span className={styles.optionTitleText}>
                        <Translate textKey="updateEmailTitle" fallback="Update email address" />
                      </span>
                      <span className={styles.optionSubtext}>{session.user?.email || 'No email associated'}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className={styles.arrowIcon} />
                </div>
              )}

              {/* Delete account option */}
              <div className={styles.optionItem} onClick={() => setCurrentView('delete')}>
                <div className={styles.optionLeft}>
                  <div className={styles.optionIconWrapper} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                    <Trash2 size={18} />
                  </div>
                  <div className={styles.optionMeta}>
                    <span className={styles.optionTitleText} style={{ color: '#fca5a5' }}>
                      <Translate textKey="deleteAccountTitle" fallback="Delete account" />
                    </span>
                    <span className={styles.optionSubtext}>
                      <Translate textKey="deleteAccountSub" fallback="Secure all your data and account" />
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className={styles.arrowIcon} />
              </div>
            </div>
          )}

          {/* VIEW: DELETE */}
          {currentView === 'delete' && (
            <div className={styles.deleteSection}>
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

              <form onSubmit={handleDelete} className={styles.deletionForm}>
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
                  <div className={styles.inputGroup}>
                    <label htmlFor="deletePassword">Confirm Password</label>
                    <div className={styles.passwordInputWrapper}>
                      <input 
                        type={showDeletePassword ? "text" : "password"} 
                        id="deletePassword" 
                        value={deletePassword} 
                        onChange={(e) => setDeletePassword(e.target.value)} 
                        placeholder="Enter your password"
                        required
                      />
                      <button 
                        type="button" 
                        className={styles.eyeToggleBtn} 
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        aria-label={showDeletePassword ? "Hide password" : "Show password"}
                      >
                        {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.socialVerificationWrapper}>
                    <p className={styles.socialVerificationText}>
                      You signed in via <strong>{(session?.user as any)?.provider}</strong>. Please click below to verify and delete.
                    </p>
                  </div>
                )}

                {deleteError && <p className={styles.errorMessage}>{deleteError}</p>}

                <button 
                  type="submit" 
                  disabled={!isAgreed || deleting || ((session?.user as any)?.provider === 'credentials' && !deletePassword)} 
                  className={styles.deleteBtnRed}
                >
                  {deleting ? (
                    <div className={styles.loadingBtnState}>
                      <Loader2 size={18} className={styles.btnSpinner} />
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    <span>Delete My Account</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: UPDATE EMAIL */}
          {currentView === 'update-email' && (
            <div className={styles.deleteSection}>
              <p className={styles.warningText}>
                Please enter your new email address below. You will need to confirm your password to make the update.
              </p>

              <form onSubmit={handleUpdateEmail} className={styles.modalForm} autoComplete="off">
                <div className={styles.inputGroup}>
                  <label htmlFor="currentEmail">Current Email</label>
                  <input 
                    type="email" 
                    id="currentEmail" 
                    name="current_email_display"
                    value={session.user?.email || ''} 
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
                {emailSuccess && (
                  <div className={styles.successMessageInline}>
                    <CheckCircle size={18} color="#10b981" />
                    <span>Email updated successfully!</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={emailSaving} 
                  className={styles.saveChangesBtn}
                >
                  {emailSaving ? (
                    <div className={styles.loadingBtnState}>
                      <Loader2 size={18} className={styles.btnSpinner} />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: CONTACT SUPPORT (Commented out - direct mailto redirect enabled) */}
          {/* 
          {currentView === 'contact-support' && (
            <div className={styles.deleteSection}>
              <p className={styles.warningText}>
                Have any questions, concerns, or feedback? Get in touch with us using the channels below. We normally respond within 24–48 hours.
              </p>

              <div className={styles.supportChannels}>
                <div className={styles.supportCard}>
                  <div className={styles.supportCardHeader}>
                    <span>📧</span>
                    <strong style={{ color: 'white' }}>General Inquiries</strong>
                  </div>
                  <p className={styles.supportCardEmail}>support@gamesato.com</p>
                </div>

                <div className={styles.supportCard}>
                  <div className={styles.supportCardHeader}>
                    <span>🛠️</span>
                    <strong style={{ color: 'white' }}>Developer Relations</strong>
                  </div>
                  <p className={styles.supportCardEmail}>developers@gamesato.com</p>
                </div>
              </div>

              <div className={styles.socialVerificationWrapper} style={{ marginTop: '1.5rem' }}>
                <p className={styles.socialVerificationText}>
                  For technical issues related to a specific H5 game, please include the game name, direct URL link, and details of your device/browser in the email.
                </p>
              </div>

              <a 
                href="mailto:support@gamesato.com?subject=Gamesato Support Request" 
                className={styles.saveChangesBtn}
                style={{ display: 'flex', textDecoration: 'none', alignItems: 'center', justifyContent: 'center' }}
              >
                Email Us
              </a>
            </div>
          )}
          */}

        </div>

        {/* Panel Footer */}
        <div className={styles.panelFooter}>
          <footer className={styles.drawerFooter}>
            <Link href="/privacy" onClick={closeProfileDrawer}>Privacy</Link>
            <Link href="/terms" onClick={closeProfileDrawer}>Terms & conditions</Link>
          </footer>
        </div>

        {/* Avatar Selection Modal Overlay */}
        {isAvatarPickerOpen && (
          <div 
            className={styles.avatarModalOverlay} 
            onClick={() => !isAvatarSaving && setIsAvatarPickerOpen(false)}
          >
            <div 
              className={styles.avatarModalContent} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.avatarModalHeader}>
                <div className={styles.avatarModalTitleWrap}>
                  <h3 className={styles.avatarModalTitle}>
                    <Translate textKey="chooseAvatar" fallback="Choose Avatar" />
                  </h3>
                  <p className={styles.avatarModalSubtitle}>
                    Select a character or upload your own image
                  </p>
                </div>
                <button 
                  type="button"
                  className={styles.avatarModalCloseBtn}
                  onClick={() => !isAvatarSaving && setIsAvatarPickerOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className={styles.avatarModalBody}>
                {/* Upload Image Option */}
                <button 
                  type="button" 
                  className={styles.avatarUploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAvatarSaving}
                >
                  <div className={styles.avatarUploadIconWrap}>
                    <Upload size={18} />
                  </div>
                  <div className={styles.avatarUploadTextWrap}>
                    <span className={styles.avatarUploadMainText}>
                      <Translate textKey="uploadCustomImage" fallback="Upload Your Image" />
                    </span>
                    <span className={styles.avatarUploadSubText}>
                      PNG, JPG or WebP (square recommended)
                    </span>
                  </div>
                  {isAvatarSaving && (
                    <Loader2 size={18} className={styles.avatarSpinner} />
                  )}
                </button>

                {/* Divider */}
                <div className={styles.avatarDivider}>
                  <span><Translate textKey="orChooseAvatar" fallback="Or choose an avatar" /></span>
                </div>

                {/* Preset Avatars Grid */}
                <div className={styles.avatarPresetsGrid}>
                  {AVATAR_PRESETS.map((preset, index) => {
                    const isSelected = avatarUrl === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        className={`${styles.presetAvatarBtn} ${isSelected ? styles.presetAvatarSelected : ''}`}
                        onClick={() => handleSelectPresetAvatar(preset)}
                        disabled={isAvatarSaving}
                        aria-label={`Avatar option ${index + 1}`}
                      >
                        <img 
                          src={preset} 
                          alt={`Avatar ${index + 1}`} 
                          className={styles.presetAvatarImg}
                          loading="lazy" 
                        />
                        {isSelected && (
                          <div className={styles.presetSelectedBadge}>
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
