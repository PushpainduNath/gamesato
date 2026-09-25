'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Play, Heart, Share2, ThumbsUp, ThumbsDown, Maximize, Minimize, Wrench } from 'lucide-react';
import { useGamePlayTracker, toggleLocalReaction, getLocalReactions } from '@/lib/usePlayHistory';
import OrientationRotateOverlay from './OrientationRotateOverlay';
import GameLoadingOverlay from './GameLoadingOverlay';
import styles from './GamePlayerCard.module.css';

interface GamePlayerCardProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  imageUrl: string;
  gameUrl: string;
  initialLikes: number;
  orientation?: 'LANDSCAPE' | 'PORTRAIT' | 'AUTO' | string;
  category?: string;
}

export default function GamePlayerCard({
  gameId,
  gameSlug,
  gameTitle,
  imageUrl,
  gameUrl,
  initialLikes,
  orientation = 'AUTO',
  category = 'Games',
}: GamePlayerCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [dislikes, setDislikes] = useState(0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return count.toString();
  };

  // Playing, Fullscreen, Maintenance, and Orientation States (Autoplays directly on page load)
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoadingOverlayVisible, setIsLoadingOverlayVisible] = useState(true);

  // Track active gameplay time in the background
  useGamePlayTracker(
    {
      id: gameId,
      slug: gameSlug,
      title: gameTitle,
      thumbnail_url: imageUrl,
      category: 'Games',
    },
    isPlaying
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isForceRotated, setIsForceRotated] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
  const isExternalEmbed = gameUrl.startsWith('http://') || gameUrl.startsWith('https://') || gameUrl.startsWith('//');
  const iframeSrc = isExternalEmbed ? gameUrl : `${backendUrl}${gameUrl}`;

  // Monitor screen dimensions and device orientation
  useEffect(() => {
    const handleScreenCheck = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMobile(w <= 768);
      setDeviceOrientation(h > w ? 'portrait' : 'landscape');
    };
    handleScreenCheck();
    window.addEventListener('resize', handleScreenCheck);
    window.addEventListener('orientationchange', handleScreenCheck);
    return () => {
      window.removeEventListener('resize', handleScreenCheck);
      window.removeEventListener('orientationchange', handleScreenCheck);
    };
  }, []);

  // Sync likes and check if user has liked this game
  useEffect(() => {
    // 1. Check local guest reaction first
    const localReactions = getLocalReactions();
    if (localReactions[gameId] === 'like') {
      setIsLiked(true);
      setIsDisliked(false);
      setDislikes(0);
    } else if (localReactions[gameId] === 'dislike') {
      setIsLiked(false);
      setIsDisliked(true);
      setDislikes(1);
    } else {
      setDislikes(0);
    }

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/games/slug/${gameSlug}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setLikes(data.likesCount ?? initialLikes);
          if (data.isLiked) {
            setIsLiked(true);
            setIsDisliked(false);
            setDislikes(0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch status for game player card:', err);
      }
    }
    fetchStatus();

    const handleReactionsUpdated = () => {
      const updated = getLocalReactions();
      if (updated[gameId] === 'like') {
        setIsLiked(true);
        setIsDisliked(false);
      } else if (updated[gameId] === 'dislike') {
        setIsLiked(false);
        setIsDisliked(true);
      } else {
        setIsLiked(false);
        setIsDisliked(false);
      }
    };
    window.addEventListener('gamesato_reactions_updated', handleReactionsUpdated);
    return () => window.removeEventListener('gamesato_reactions_updated', handleReactionsUpdated);
  }, [gameId, gameSlug, session, backendUrl, initialLikes]);

  // Check if game files are accessible before or during play
  const verifyGameFile = async () => {
    if (isExternalEmbed) {
      setIsMaintenance(false);
      return;
    }
    try {
      const res = await fetch(iframeSrc, { method: 'GET' });
      if (!res.ok) {
        setIsMaintenance(true);
      } else {
        setIsMaintenance(false);
      }
    } catch (err) {
      console.warn('Game file fetch failed, setting maintenance status:', err);
      setIsMaintenance(true);
    }
  };

  // Generate unique session ID when game starts playing
  useEffect(() => {
    if (isPlaying) {
      const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setSessionId(uuid);
      verifyGameFile();
    } else {
      setSessionId('');
    }
  }, [isPlaying, iframeSrc]);

  // Send play event and setup heartbeat pings for analytics tracking
  useEffect(() => {
    if (!sessionId || !isPlaying || isMaintenance) return;

    const eventUrl = `${backendUrl}/api/analytics/event`;

    async function sendEvent(type: 'play' | 'heartbeat') {
      try {
        const res = await fetch(eventUrl, {
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
        if (res.status === 404) {
          console.warn('Game no longer exists on server, stopping analytics heartbeat.');
          return false;
        }
        return true;
      } catch (err) {
        console.error(`Failed to send analytics ${type} event:`, err);
        return true;
      }
    }

    sendEvent('play');

    const interval = setInterval(async () => {
      const ok = await sendEvent('heartbeat');
      if (ok === false) {
        clearInterval(interval);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, gameId, backendUrl, isPlaying, isMaintenance]);

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
    setIsLoadingOverlayVisible(true);
  };

  const handleExitPlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying(false);
    setIsMaintenance(false);
    setIsLoadingOverlayVisible(true);
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
    setIsLoadingOverlayVisible(true);
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

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleLocalReaction(gameId, 'like');
    setIsLiked(result.liked);
    setIsDisliked(result.disliked);
    setLikes((prev) => (result.liked ? prev + 1 : Math.max(0, prev - 1)));

    if (result.liked && isDisliked) {
      setDislikes((prev) => Math.max(0, prev - 1));
    }

    // Send async backend update (guest or authenticated)
    fetch(`/api/games/${gameId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ liked: result.liked }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.likesCount === 'number') {
          setLikes(data.likesCount);
        }
      })
      .catch(() => {});
  };

  const handleDislikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasLiked = isLiked;
    const result = toggleLocalReaction(gameId, 'dislike');
    if (wasLiked) {
      setLikes((prev) => Math.max(0, prev - 1));
      fetch(`/api/games/${gameId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ liked: false }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.likesCount === 'number') {
            setLikes(data.likesCount);
          }
        })
        .catch(() => {});
    }
    setIsLiked(result.liked);
    setIsDisliked(result.disliked);
    setDislikes((prev) => (result.disliked ? prev + 1 : Math.max(0, prev - 1)));
  };


  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;

    const shareUrl = `${window.location.origin}/games/${gameSlug}`;
    const shareData = {
      title: `${gameTitle} - Gamesato`,
      text: `Play ${gameTitle} free online on Gamesato!`,
      url: shareUrl,
    };

    // Native device share sheet popup (iOS, Android, macOS Safari/Chrome, Windows)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: Copy to clipboard if native share sheet is unavailable
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const targetOrientation = (orientation || 'AUTO').toUpperCase();
  const isPortraitGame = targetOrientation === 'PORTRAIT';
  const isMismatch = isMobile && !isForceRotated && (
    (targetOrientation === 'LANDSCAPE' && deviceOrientation === 'portrait') ||
    (targetOrientation === 'PORTRAIT' && deviceOrientation === 'landscape')
  );

  const applyMobilePortraitCard = isPortraitGame && isMobile;
  const isDesktopPortrait = isPortraitGame && !isMobile;

  return (
    <div className={`${styles.playerCard} ${applyMobilePortraitCard ? styles.portraitCard : ''} ${isForceRotated ? styles.forceRotated : ''}`} ref={cardRef}>
      {/* Ambient Blurred Artwork Backdrop for Desktop Portrait Games */}
      {isDesktopPortrait && isPlaying && (
        <img src={imageUrl} alt="" className={styles.ambientBackdrop} aria-hidden="true" />
      )}

      {isPlaying && isMismatch && (
        <OrientationRotateOverlay
          requiredOrientation={targetOrientation as any}
          onForceRotate={() => {
            setIsForceRotated(true);
            try {
              if (cardRef.current && cardRef.current.requestFullscreen) {
                cardRef.current.requestFullscreen().catch(() => {});
              }
              if (screen.orientation && (screen.orientation as any).lock) {
                (screen.orientation as any).lock(targetOrientation.toLowerCase()).catch(() => {});
              }
            } catch (e) {}
          }}
        />
      )}

      {/* Main 16:9 Game Screen Viewport Area */}
      <div className={styles.gameViewArea}>
        {/* Gamesato 5-Second Animated Loading Screen Overlay */}
        {isLoadingOverlayVisible && !isMaintenance && (
          <GameLoadingOverlay
            gameTitle={gameTitle}
            imageUrl={imageUrl}
            durationMs={5000}
            onComplete={() => setIsLoadingOverlayVisible(false)}
          />
        )}

        {isMaintenance ? (
          <div className={styles.maintenanceContainer}>
            <div className={styles.maintenanceCard}>
              <div className={styles.iconPulseWrapper}>
                <Wrench size={32} />
              </div>
              <h3 className={styles.maintenanceTitle}>Game Under Maintenance</h3>
              <p className={styles.maintenanceDescription}>
                The game files for this title are currently being updated or under maintenance. Please check back soon!
              </p>
              <div className={styles.maintenanceActions}>
                <button className={styles.exploreBtn} onClick={() => router.push('/')}>
                  Explore Other Games
                </button>
                <button className={styles.exitBtn} onClick={handleExitPlay}>
                  Back to Info
                </button>
              </div>
            </div>
          </div>
        ) : isDesktopPortrait ? (
          <div className={styles.portraitWrapper}>
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              title={gameTitle}
              className={styles.iframe}
              allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={gameTitle}
            className={styles.iframe}
            allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Poki-Style Gamesato Theme Bottom Player Bar */}
      <div className={styles.playerBottomBar}>
        <div className={styles.barLeft}>
          <img src={imageUrl} alt={gameTitle} className={styles.barThumb} />
          <div className={styles.barMeta}>
            <span className={styles.barTitle} title={gameTitle}>
              {gameTitle}
            </span>
            <span className={styles.barSubtitle}>
              by Gamesato • {category || 'Free Online Game'}
            </span>
          </div>
        </div>

        <div className={styles.barRight}>
          {/* Like Button */}
          <button
            type="button"
            className={`${styles.barBtn} ${isLiked ? styles.barBtnLikeActive : ''}`}
            onClick={handleLikeClick}
            title={isLiked ? "Unlike game" : "Like game"}
            aria-label="Like game"
          >
            <ThumbsUp size={19} fill={isLiked ? '#10b981' : 'none'} stroke={isLiked ? '#10b981' : 'currentColor'} />
            <span className={styles.barBtnCount}>{formatCount(likes)}</span>
          </button>

          {/* Dislike Button */}
          <button
            type="button"
            className={`${styles.barBtn} ${isDisliked ? styles.barBtnDislikeActive : ''}`}
            onClick={handleDislikeClick}
            title="Dislike game"
            aria-label="Dislike game"
          >
            <ThumbsDown size={19} fill={isDisliked ? '#ef4444' : 'none'} stroke={isDisliked ? '#ef4444' : 'currentColor'} />
            <span className={styles.barBtnCount}>{formatCount(dislikes)}</span>
          </button>

          {/* Favorite Heart Button */}
          <button
            type="button"
            className={`${styles.barBtn} ${isLiked ? styles.barBtnHeartActive : ''}`}
            onClick={handleLikeClick}
            title={isLiked ? "Remove from Favorites" : "Add to Favorites"}
            aria-label="Favorite game"
          >
            <Heart size={19} fill={isLiked ? '#ff4b82' : 'none'} stroke={isLiked ? '#ff4b82' : 'currentColor'} />
            <span className={styles.barBtnCount}>{isLiked ? 'Saved' : 'Save'}</span>
          </button>


          {/* Share Button */}
          <button
            type="button"
            className={styles.barBtn}
            onClick={handleShareClick}
            title="Share game link"
            aria-label="Share game"
          >
            <Share2 size={19} />
            <span className={styles.barBtnCount}>{shareCopied ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            className={styles.barBtn}
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
            <span className={styles.barBtnCount}>{isFullscreen ? 'Exit' : 'Full'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
