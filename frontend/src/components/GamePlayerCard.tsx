'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Play, Heart, Share2, ThumbsUp, Maximize, Minimize, X } from 'lucide-react';
import styles from './GamePlayerCard.module.css';

interface GamePlayerCardProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  imageUrl: string;
  gameUrl: string;
  initialLikes: number;
}

export default function GamePlayerCard({
  gameId,
  gameSlug,
  gameTitle,
  imageUrl,
  gameUrl,
  initialLikes,
}: GamePlayerCardProps) {
  const { data: session } = useSession();
  
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  // Playing and Fullscreen States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  const cardRef = useRef<HTMLDivElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
  const iframeSrc = `${backendUrl}${gameUrl}`;

  // Sync likes and check if user has liked this game
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/games/slug/${gameSlug}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setLikes(data.likesCount ?? initialLikes);
          setIsLiked(data.isLiked ?? false);
        }
      } catch (err) {
        console.error('Failed to fetch status for game player card:', err);
      }
    }
    fetchStatus();
  }, [gameSlug, session, backendUrl, initialLikes]);

  // Generate unique session ID when game starts playing
  useEffect(() => {
    if (isPlaying) {
      const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setSessionId(uuid);
    } else {
      setSessionId('');
    }
  }, [isPlaying]);

  // Send play event and setup heartbeat pings for analytics tracking
  useEffect(() => {
    if (!sessionId || !isPlaying) return;

    const eventUrl = `${backendUrl}/api/analytics/event`;

    async function sendEvent(type: 'play' | 'heartbeat') {
      try {
        await fetch(eventUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId,
            eventType: type,
            sessionId,
          }),
          credentials: 'include',
        });
      } catch (err) {
        console.error(`Failed to send analytics ${type} event:`, err);
      }
    }

    sendEvent('play');

    const interval = setInterval(() => {
      sendEvent('heartbeat');
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, gameId, backendUrl, isPlaying]);

  // Track browser fullscreen status change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  const handleExitPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const element = cardRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Failed to enter fullscreen:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Failed to exit fullscreen:', err));
    }
  };

  const handleFullscreenPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    // Request fullscreen after state change
    setTimeout(() => {
      const element = cardRef.current;
      if (element && !document.fullscreenElement) {
        element.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error('Failed to enter fullscreen:', err));
      }
    }, 50);
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/games/${gameId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikes((prev) => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/games/${gameSlug}`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        })
        .catch((err) => console.error('Failed to copy link:', err));
    }
  };

  const handleVolumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  return (
    <div className={styles.playerCard} ref={cardRef}>
      {isPlaying ? (
        <div className={styles.iframeContainer}>
          <iframe
            src={iframeSrc}
            title={gameTitle}
            className={styles.iframe}
            allow="autoplay; fullscreen; keyboard; gamepad"
          />
          {/* Floating exit control in top-right */}
          <div className={styles.exitControl}>
            <button onClick={handleExitPlay} className={styles.floatingBtn} title="Exit Game">
              <X size={18} />
            </button>
          </div>

          {/* Floating fullscreen control in bottom-right */}
          <div className={styles.fullscreenControl}>
            <button onClick={toggleFullscreen} className={styles.floatingBtn} title="Toggle Fullscreen">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.previewContainer} onClick={handlePlayClick}>
          {/* Thumbnail Image */}
          <img src={imageUrl} alt={gameTitle} className={styles.thumbnail} />
          
          {/* Dark tint overlay */}
          <div className={styles.darkOverlay} />

          {/* Center Play Button Wrapper */}
          <div className={styles.playButtonWrapper}>
            <img src="/PlayButton.svg" alt="Play Now" className={styles.playButtonImage} />
            <span className={styles.playNowText} style={{ color: '#ffffff' }}>Play Now</span>
          </div>

          {/* Share Toast Feedback */}
          {shareCopied && (
            <div className={styles.toast}>Link Copied!</div>
          )}

          {/* Auth Warning Toast */}
          {showAuthWarning && (
            <div className={styles.toast}>Please login to like!</div>
          )}

          {/* Bottom Controls Overlay */}
          <div className={styles.bottomControls} onClick={(e) => e.stopPropagation()}>
            {/* Left Side */}
            <div className={styles.controlGroup}>
              <button onClick={handlePlayClick} className={styles.actionBtn} aria-label="Play">
                <Play size={18} fill="#ffffff" stroke="#ffffff" />
              </button>
            </div>

            {/* Right Side */}
            <div className={styles.controlGroup}>
              <button 
                onClick={handleLikeClick} 
                className={`${styles.actionBtn} ${isLiked ? styles.activeHeart : ''}`} 
                aria-label="Like"
              >
                <Heart size={18} fill={isLiked ? '#ff4b82' : 'none'} stroke={isLiked ? '#ff4b82' : '#ffffff'} />
              </button>

              <button onClick={handleFullscreenPlay} className={styles.actionBtn} aria-label="Play Fullscreen" title="Play Fullscreen">
                <Maximize size={18} />
              </button>
              
              <button onClick={handleShareClick} className={styles.actionBtn} aria-label="Share">
                <Share2 size={18} />
              </button>

              <div className={styles.statItem}>
                <ThumbsUp size={16} fill="#14b8a6" stroke="#14b8a6" />
                <span className={styles.statVal} style={{ color: '#ffffff' }}>{likes}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
