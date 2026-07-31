'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart, ThumbsUp, Play, Info } from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import styles from './GameActions.module.css';

interface GameActionsProps {
  gameId: string;
  gameSlug: string;
  initialLikes: number;
}

export default function GameActions({ gameId, gameSlug, initialLikes }: GameActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';

  // Fetch interactive states (Like) on mount if session exists
  useEffect(() => {
    async function fetchUserStatus() {
      try {
        const res = await fetch(`${backendUrl}/api/games/slug/${gameSlug}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          // Send credentials (cookies) to Express so it can authenticate
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setLikes(data.likesCount ?? initialLikes);
          setIsLiked(data.isLiked ?? false);
        }
      } catch (err) {
        console.error('Error fetching game statuses from backend:', err);
      }
    }

    fetchUserStatus();
  }, [gameSlug, session, backendUrl, initialLikes]);

  const handleLike = async () => {
    if (!session) {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 4000);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/games/${gameId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikes(prev => data.liked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handlePlay = () => {
    router.push(`/games/${gameSlug}/play`);
  };

  return (
    <div className={styles.actionsContainer}>
      <div className={styles.buttonRow}>
        <button className={styles.playBtn} onClick={handlePlay}>
          <Play size={20} fill="currentColor" /> {t('playGame' as any) || 'Play Game'}
        </button>

        <button 
          className={`${styles.iconBtn} ${isLiked ? styles.favoritedBtn : ''}`}
          onClick={handleLike}
          title={session ? (t('likeGame' as any) || 'Like Game') : (t('signInToLike' as any) || 'Sign in to like')}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          <span className={styles.badge}>{likes}</span>
        </button>
      </div>

      {showAuthWarning && (
        <div className={styles.authWarning}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Info size={16} /> {t('signInRequiredToLike' as any) || 'Sign in is required to like games!'}
          </span>
        </div>
      )}
    </div>
  );
}
