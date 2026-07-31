'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart, ThumbsUp, ThumbsDown, Share2, Play, Puzzle, Gamepad2, ChevronsRight } from 'lucide-react';
import Translate from './Translate';
import styles from './MobileGameDetails.module.css';

const categoryIconMap: { [key: string]: string } = {
  'New': '/new.webp',
  'Popular': '/popular.webp',
  'Racing': '/racing.webp',
  'Action': '/action.webp',
  'Sport': '/sports.webp',
  'Arcade': '/arcade.webp',
  'Logic': '/logic.webp',
  'Number': '/number.webp',
  'Adventure': '/adventure.webp',
  'Puzzle': '/puzzle.webp',
  'Board': '/board.webp',
};

interface MoreGame {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string;
  category: string;
}

interface MobileGameDetailsProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  gameCategory: string;
  gameDescription: string;
  gameHowToPlay?: string | null;
  gameImageUrl: string;
  initialLikes: number;
  moreGames?: MoreGame[];
}

export default function MobileGameDetails({
  gameId,
  gameSlug,
  gameTitle,
  gameCategory,
  gameDescription,
  gameHowToPlay,
  gameImageUrl,
  initialLikes,
  moreGames = [],
}: MobileGameDetailsProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [dislikes, setDislikes] = useState(Math.max(10, Math.floor(initialLikes / 160)));
  const [isDisliked, setIsDisliked] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';

  // Fetch actual like status on mount if user is logged in
  useEffect(() => {
    async function fetchLikeStatus() {
      try {
        const res = await fetch(`/api/games/slug/${gameSlug}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setLikes(data.likesCount ?? initialLikes);
          setIsLiked(data.isLiked ?? false);
          // Scale dislike mockup proportionally based on true likes
          setDislikes(Math.max(10, Math.floor((data.likesCount ?? initialLikes) / 160)));
        }
      } catch (err) {
        console.error('Failed to sync mobile game status:', err);
      }
    }
    fetchLikeStatus();
  }, [gameSlug, session, backendUrl, initialLikes]);

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
        
        // If they liked it, make sure they don't dislike it
        if (data.liked && isDisliked) {
          setIsDisliked(false);
          setDislikes((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisliked) {
      setIsDisliked(false);
      setDislikes((prev) => Math.max(0, prev - 1));
    } else {
      setIsDisliked(true);
      setDislikes((prev) => prev + 1);
      
      // If they disliked, remove like if liked
      if (isLiked) {
        handleLike(); // Toggles like off
      }
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/games/${gameSlug}`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        })
        .catch((err) => console.error('Failed to copy share link:', err));
    }
  };

  const handlePlayNow = () => {
    router.push(`/games/${gameSlug}/play`);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return count.toString();
  };

  const iconPath = categoryIconMap[gameCategory] || '/puzzle.svg';

  return (
    <div className={styles.wrapper}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link href="/" className={styles.breadcrumbLink}>
          <Translate textKey="home" fallback="Home" />
        </Link>
        <ChevronsRight size={18} className={styles.breadcrumbSeparator} />
        <Link href={`/category/${gameCategory.toLowerCase().replace(/\s+/g, '-')}`} className={styles.breadcrumbLink}>
          <Translate textKey={gameCategory} fallback={gameCategory} />
        </Link>
        <ChevronsRight size={18} className={styles.breadcrumbSeparator} />
        <span className={styles.breadcrumbActive}>
          <Translate textKey={`game_${gameSlug}_title`} fallback={gameTitle} />
        </span>
      </div>

      {/* Full Width Game Banner Image */}
      <div className={styles.bannerContainer} onClick={handlePlayNow}>
        <img src={gameImageUrl} alt={gameTitle} className={styles.bannerImage} />
        <div className={styles.bannerOverlay} />
        <div className={styles.playButtonWrapper}>
          <img src="/PlayButton.svg" alt="Play Now" className={styles.playButtonImage} />
          <span className={styles.playNowText} style={{ color: '#ffffff' }}>Play Now</span>
        </div>
      </div>

      {/* Content Metadata Block */}
      <div className={styles.contentBlock}>
        {/* Title and Fav Heart button row */}
        <div className={styles.titleRow}>
          <h1 className={styles.gameTitle}>
            <Translate textKey={`game_${gameSlug}_title`} fallback={gameTitle} />
          </h1>
          <button 
            className={`${styles.heartBtn} ${isLiked ? styles.heartActive : ''}`} 
            onClick={(e) => handleLike(e)}
            aria-label="Add to Favorites"
          >
            <Heart size={22} fill={isLiked ? '#ff4b82' : 'none'} stroke={isLiked ? '#ff4b82' : '#94a3b8'} />
          </button>
        </div>

        {/* Category Label */}
        <div className={styles.categoryRow}>
          <img 
            src={iconPath} 
            alt={gameCategory} 
            className={styles.categoryIconImg} 
          />
          <span className={styles.categoryName}>
            <Translate textKey={gameCategory} fallback={gameCategory} />
          </span>
        </div>

        {/* Game Description */}
        <p className={styles.description}>
          <Translate textKey={`game_${gameSlug}_desc`} fallback={gameDescription || 'No description available for this game.'} />
        </p>

        {/* Like, Share Actions Row */}
        <div className={styles.actionsRow}>
          {/* Like */}
          <button 
            className={`${styles.actionCapsule} ${isLiked ? styles.activeLike : ''}`}
            onClick={(e) => handleLike(e)}
          >
            <ThumbsUp size={16} fill={isLiked ? 'currentColor' : 'none'} />
            <span className={styles.actionValue}>{formatCount(likes)}</span>
          </button>

          {/* Share */}
          <button className={styles.actionCapsule} onClick={handleShare}>
            <Share2 size={16} />
            <span className={styles.actionValue}>
              {shareCopied ? 'Copied!' : 'Share'}
            </span>
          </button>
        </div>

        {/* How to Play Section */}
        {gameHowToPlay && (
          <div className={styles.howToPlayBox}>
            <h3 className={styles.howToPlayTitle}>
              How to Play the {gameTitle}
            </h3>
            <ul className={styles.howToPlayList}>
              {gameHowToPlay
                .split('\n')
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
                .map((bullet: string, index: number) => (
                  <li key={index} className={styles.howToPlayItem}>
                    {bullet.replace(/^[\s•*-]+/, '')}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* More Games 3-Column Grid Section */}
        {moreGames && moreGames.length > 0 && (
          <div className={styles.moreGamesSection}>
            <h3 className={styles.moreGamesTitle}>
              <Translate textKey="moreGames" fallback="More Games" />
            </h3>
            <div className={styles.moreGamesGrid}>
              {moreGames.map((g) => {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
                const thumbUrl = g.thumbnail_url.startsWith('http')
                  ? g.thumbnail_url
                  : `${backendUrl}${g.thumbnail_url}`;
                return (
                  <Link
                    key={g.id}
                    href={`/games/${g.slug}`}
                    className={styles.moreGameCard}
                    title={g.title}
                  >
                    <img src={thumbUrl} alt={g.title} className={styles.moreGameThumb} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Auth warning toast overlay */}
      {showAuthWarning && (
        <div className={styles.toast}>Please login to favorite/like!</div>
      )}
    </div>
  );
}
