'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeft, X, Pencil, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import Translate from '@/components/Translate';
import styles from './page.module.css';

interface FavoriteGame {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_url: string;
  play_count: number;
  likes_count: number;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation();
  const [favorites, setFavorites] = useState<FavoriteGame[]>([]);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const favoritesCarouselRef = useRef<HTMLDivElement>(null);

  const handleScrollNav = (direction: 'left' | 'right') => {
    if (favoritesCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      favoritesCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Sync session loading & redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch favorites from our newly created API route
  useEffect(() => {
    if (session) {
      fetch('/api/users/favorites')
        .then((res) => res.json())
        .then((data) => {
          if (data.favorites) {
            setFavorites(data.favorites);
          }
        })
        .catch((err) => console.error('Failed to fetch favorites:', err));
    }
  }, [session]);

  // Load custom avatar from localStorage if set
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      const savedAvatar = localStorage.getItem(`customProfileAvatar_${session.user.id}`);
      if (savedAvatar) {
        setCustomAvatar(savedAvatar);
      } else {
        setCustomAvatar(null);
      }
    }
  }, [session?.user?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
            }
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

  const getProviderLabel = (provider?: string) => {
    if (!provider) return 'Google';
    const p = provider.toLowerCase();
    if (p === 'google') return 'Google';
    if (p === 'facebook') return 'Facebook';
    if (p === 'discord') return 'Discord';
    if (p === 'credentials') return 'Local Account';
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      router.push('/');
    }
  };

  const getProviderIcon = (provider?: string) => {
    const p = (provider || 'google').toLowerCase();
    if (p === 'facebook') {
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    }
    if (p === 'discord') {
      return (
        <svg viewBox="0 0 127.14 96.36" width="16" height="16" fill="#5865F2">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1-.73,2-1.5,2.92-2.3a75.76,75.76,0,0,0,72.16,0c.93.8,1.91,1.57,2.92,2.3a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.3,47.88,122.9,25.13,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    );
  };

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Use custom uploaded avatar, session avatar, or default profile icon
  const avatarUrl = customAvatar || session.user?.image || '/defaultprofileicon.jpeg';

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.drawerPanel}>
        {/* Header bar */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}><Translate textKey="profile" fallback="Profile" /></h1>
          </div>
          <button className={styles.iconBtn} onClick={() => router.push('/')} aria-label="Close">
            <X size={22} color="currentColor" />
          </button>
        </header>

        {/* User profile details scroll wrapper */}
        <div className={styles.drawerContent}>
          {/* Avatar Section */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarOuterWrapper}>
              <div className={styles.avatarGlowBorder}>
                <img src={avatarUrl} alt={session.user?.name || 'User'} className={styles.avatarImg} />
              </div>
              <button className={styles.editBtn} onClick={triggerFileInput} aria-label="Edit Avatar">
                <Pencil size={14} color="currentColor" />
              </button>
              
              {(session.user as any).provider && (session.user as any).provider !== 'credentials' && (
                <div className={styles.providerBadgeOverlay} title={getProviderLabel((session.user as any).provider)}>
                  {getProviderIcon((session.user as any).provider)}
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
            <h2 className={styles.profileName}>{session.user?.name || 'Yuki Tsunoda'}</h2>
          </div>

          {/* Favorites Slider Card */}
          <div className={`${styles.favoritesCard} glass`}>
            <div className={styles.favoritesHeader}>
              <h3 className={styles.favoritesTitle}><Translate textKey="favoriteGames" fallback="Favorites" /></h3>
              {favorites.length > 0 && (
                <div className={styles.carouselNavBtns}>
                  <button 
                    type="button" 
                    className={styles.navBtn} 
                    onClick={() => handleScrollNav('left')}
                    aria-label="Previous"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    type="button" 
                    className={styles.navBtn} 
                    onClick={() => handleScrollNav('right')}
                    aria-label="Next"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
            
            {favorites.length > 0 ? (
              <div className={styles.favoritesCarousel} ref={favoritesCarouselRef}>
                {favorites.map((game) => (
                  <div key={game.id} className={styles.favoriteCard} onClick={() => router.push(`/games/${game.slug}`)}>
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
            <div className={styles.optionItem} onClick={() => router.push('/profile/settings')}>
              <div className={styles.optionLeft}>
                <div className={styles.optionIconWrapper}>
                  <img src="/profile.webp" alt="Profile" className={styles.optionIcon} onError={(e) => { e.currentTarget.src = '/profile.svg'; }} />
                </div>
                <span className={styles.optionText}><Translate textKey="accountSettings" fallback="Account settings" /></span>
              </div>
              <ChevronRight size={18} className={styles.arrowIcon} />
            </div>

            <div 
              className={styles.optionItem} 
              onClick={() => {
                window.location.href = 'mailto:support@gamebite.com?subject=Gamebite%20Support%20Request';
              }}
            >
              <div className={styles.optionLeft}>
                <div className={styles.optionIconWrapper}>
                  <img src="/contact.webp" alt="Contact" className={styles.optionIcon} onError={(e) => { e.currentTarget.src = '/contact.svg'; }} />
                </div>
                <span className={styles.optionText}><Translate textKey="contactSupport" fallback="Contact support" /></span>
              </div>
              <ChevronRight size={18} className={styles.arrowIcon} />
            </div>

            <div className={styles.optionItem} onClick={() => signOut()}>
              <div className={styles.optionLeft}>
                <div className={styles.optionIconWrapper}>
                  <img src="/logout.webp" alt="Logout" className={styles.optionIcon} onError={(e) => { e.currentTarget.src = '/logout.svg'; }} />
                </div>
                <span className={styles.optionText}><Translate textKey="logOut" fallback="Log out" /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
