'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart, ThumbsUp, ThumbsDown, Share2, Play, Puzzle, Gamepad2, ChevronsRight, Flame } from 'lucide-react';
import { toggleLocalReaction, getLocalReactions } from '@/lib/usePlayHistory';
import { formatCompactNumber, getImageUrl } from '@/lib/utils';
import Translate from './Translate';
import GamePlayer from './GamePlayer';
import AdBanner from './AdBanner';
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

export interface MoreGame {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string;
  category: string;
  play_count?: number;
  likes_count?: number;
  featured_desktop_url?: string | null;
  featured_mobile_url?: string | null;
}

interface MobileGridItem {
  game: MoreGame;
  size: 'medium' | 'small';
}

function generateMobileExploreItems(games: MoreGame[]): MobileGridItem[] {
  if (!games || games.length === 0) return [];

  const total = games.length;
  const items: MobileGridItem[] = [];

  // Mobile strictly 2x2 ('medium') and 1x1 ('small') - NO 3x3 on mobile!
  // In a 3-column mobile grid:
  // - 2x2 Medium takes 2 columns x 2 rows (4 units)
  // - 1x1 Small takes 1 column x 1 row (1 unit)
  // Combination: 2x2 + two 1x1s = 6 units (2 full rows). Three 1x1s = 3 units (1 full row).
  for (let idx = 0; idx < total; idx++) {
    const game = games[idx];
    const remaining = total - idx - 1;

    let size: 'medium' | 'small' = 'small';

    // Rhythmic 2x2 Medium cards, strictly when at least 5 cards remain
    if (
      (idx === 0 || idx === 3 || idx === 7 || idx === 11 || idx === 15 || (idx > 15 && idx % 4 === 0)) &&
      remaining >= 5
    ) {
      size = 'medium';
    }

    items.push({ game, size });
  }

  // Calculate total units (cells) to ensure 100% full 3-column rows
  let totalUnits = 0;
  for (const it of items) {
    totalUnits += it.size === 'medium' ? 4 : 1;
  }

  // Trim incomplete tail items so totalUnits % 3 === 0 (all columns end at the exact same row!)
  const remainder = totalUnits % 3;
  if (remainder !== 0) {
    for (let k = 0; k < remainder; k++) {
      if (items.length > 0 && items[items.length - 1].size === 'small') {
        items.pop();
      }
    }
  }

  return items;
}

interface MobileGameDetailsProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  gameCategory: string;
  gameDescription: string;
  gameHowToPlay?: string | null;
  gameImageUrl: string;
  gameUrl?: string;
  orientation?: string;
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
  gameUrl,
  orientation,
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
  const [isPlayingFullscreen, setIsPlayingFullscreen] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
  const categorySlug = (gameCategory || 'all').toLowerCase().replace(/\s+/g, '-');

  const exploreItems = useMemo(() => {
    return generateMobileExploreItems(moreGames);
  }, [moreGames]);

  // Fetch actual like status on mount and sync local reactions
  useEffect(() => {
    // 1. Check local reaction first
    const localReactions = getLocalReactions();
    if (localReactions[gameId] === 'like') {
      setIsLiked(true);
      setIsDisliked(false);
    } else if (localReactions[gameId] === 'dislike') {
      setIsLiked(false);
      setIsDisliked(true);
    }

    async function fetchLikeStatus() {
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
          }
          // Scale dislike mockup proportionally based on true likes
          setDislikes(Math.max(10, Math.floor((data.likesCount ?? initialLikes) / 160)));
        }
      } catch (err) {
        console.error('Failed to sync mobile game status:', err);
      }
    }
    fetchLikeStatus();
  }, [gameId, gameSlug, session, backendUrl, initialLikes]);

  const handleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const result = toggleLocalReaction(gameId, 'like');
    setIsLiked(result.liked);
    setIsDisliked(result.disliked);
    setLikes((prev) => (result.liked ? prev + 1 : Math.max(0, prev - 1)));

    if (result.liked && isDisliked) {
      setDislikes((prev) => Math.max(0, prev - 1));
    }

    // Async backend update
    fetch(`/api/games/${gameId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }).catch(() => {});
  };

  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleLocalReaction(gameId, 'dislike');
    if (isLiked) {
      setLikes((prev) => Math.max(0, prev - 1));
      fetch(`/api/games/${gameId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).catch(() => {});
    }
    setIsLiked(result.liked);
    setIsDisliked(result.disliked);
    setDislikes((prev) => (result.disliked ? prev + 1 : Math.max(0, prev - 1)));
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/games/${gameSlug}`;
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: gameTitle,
            text: `Play ${gameTitle} online for free on Gamesato!`,
            url: shareUrl,
          });
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
        }
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
          })
          .catch((err) => console.error('Failed to copy share link:', err));
      }
    }
  };

  const handlePlayNow = () => {
    setIsPlayingFullscreen(true);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ modal: 'play' }, '', `/games/${gameSlug}/play`);
      } catch (_) {}
    }
  };

  const handleExitPlay = () => {
    setIsPlayingFullscreen(false);
    if (typeof window !== 'undefined') {
      try {
        if (window.location.pathname.endsWith('/play')) {
          window.history.pushState(null, '', `/games/${gameSlug}`);
        }
      } catch (_) {}
    }
  };

  // Close full-screen player if user taps physical back button or browser back
  useEffect(() => {
    const handlePopState = () => {
      if (isPlayingFullscreen) {
        setIsPlayingFullscreen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isPlayingFullscreen]);

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

      {/* 3:3 Aspect Ratio Game Card with Play Button */}
      <div 
        className={styles.bannerContainer} 
        onClick={handlePlayNow}
        role="button"
        tabIndex={0}
        aria-label={`Play ${gameTitle}`}
      >
        <img src={gameImageUrl} alt={gameTitle} className={styles.bannerImage} />
        <div className={styles.bannerOverlay} />
        <div className={styles.playButtonWrapper}>
          <div className={styles.playPulseGlow} />
          <img src="/PlayButton.svg" alt="Play Now" className={styles.playButtonImage} />
          <span className={styles.playNowText}>
            <Translate textKey="playNow" fallback="Play Now" />
          </span>
        </div>
      </div>

      {/* Full Screen Player Modal with Loading Screen */}
      {isPlayingFullscreen && gameUrl && (
        <GamePlayer
          gameId={gameId}
          gameSlug={gameSlug}
          gameUrl={gameUrl}
          gameTitle={gameTitle}
          imageUrl={gameImageUrl}
          orientation={orientation || 'AUTO'}
          onExit={handleExitPlay}
        />
      )}

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

        {/* Mobile In-Feed Responsive Ad Banner */}
        <AdBanner type="horizontal" />

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

        {/* Explore More Games Section with 2x2 & 3x3 Bento Pattern */}
        {exploreItems && exploreItems.length > 0 && (
          <section className={styles.exploreSection}>
            {/* Header */}
            <div className={styles.exploreHeader}>
              <div className={styles.exploreTitleGroup}>
                <Flame size={20} className={styles.flameIcon} />
                <h3 className={styles.exploreTitle}>
                  <Translate textKey="exploreMoreGames" fallback="Explore More Games" />
                </h3>
              </div>
              <Link
                href={`/category/${categorySlug}`}
                className={styles.viewMoreHeaderLink}
              >
                <span>{gameCategory}</span>
                <ChevronsRight size={14} />
              </Link>
            </div>

            {/* 3-Column Bento Grid (2x2 and 3x3 Box Pattern) */}
            <div className={styles.exploreGrid}>
              {exploreItems.map((item, idx) => {
                const { game: g, size } = item;
                const isMedium = size === 'medium';
                const isSmall = size === 'small';

                const cardImage = getImageUrl(
                  !isSmall && (g.featured_mobile_url || g.featured_desktop_url)
                    ? (g.featured_mobile_url || g.featured_desktop_url)!
                    : g.thumbnail_url
                );

                const cardClass = isMedium
                  ? `${styles.exploreCard} ${styles.exploreMediumCard}`
                  : styles.exploreCard;

                return (
                  <Link
                    key={`${g.id}_${idx}`}
                    href={`/games/${g.slug}`}
                    className={cardClass}
                    title={g.title}
                  >
                    <div className={styles.exploreImageWrapper}>
                      <img
                        src={cardImage}
                        alt={g.title}
                        className={styles.exploreImage}
                        loading={idx < 6 ? 'eager' : 'lazy'}
                      />
                      <div className={styles.exploreOverlay} />
                    </div>

                    {/* Badge Top Left for 2x2 cards */}
                    {isMedium && (
                      <div className={styles.badgeTopLeft}>
                        <span className={idx % 2 === 0 ? styles.badgeHot : styles.badgeHero}>
                          {idx % 2 === 0 ? 'HOT' : '★ FEATURED'}
                        </span>
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className={styles.explorePlayOverlay}>
                      <Play size={isMedium ? 18 : 14} fill="#ffffff" />
                    </div>

                    {/* Content for Medium 2x2 Cards */}
                    {isMedium && (
                      <div className={styles.exploreContent}>
                        <h4 className={styles.exploreCardTitle}>{g.title}</h4>
                        <div className={styles.exploreMeta}>
                          <span className={styles.exploreCategoryTag}>{g.category}</span>
                          {(g.play_count || 0) > 0 && (
                            <span className={styles.exploreStat}>
                              <Play size={8} fill="currentColor" />
                              <span>{formatCompactNumber(g.play_count || 0)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* View More Games Option Button */}
            <div className={styles.viewMoreFooter}>
              <Link
                href={`/category/${categorySlug}`}
                className={styles.viewMoreButton}
              >
                <span>View All in {gameCategory}</span>
                <ChevronsRight size={17} />
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Auth warning toast overlay */}
      {showAuthWarning && (
        <div className={styles.toast}>Please login to favorite/like!</div>
      )}
    </div>
  );
}
