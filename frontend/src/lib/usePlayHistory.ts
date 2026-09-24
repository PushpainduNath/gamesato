'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface PlayHistoryItem {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string;
  category: string;
  playTimeSeconds: number;
  playCount: number;
  lastPlayedAt: number;
}

const STORAGE_HISTORY_KEY = 'gamesato_play_history';
const STORAGE_REACTIONS_KEY = 'gamesato_reactions';
const STORAGE_LIKED_KEY = 'gamesato_liked_games';

// Helper: Safely read from localStorage
export function getLocalPlayHistory(): PlayHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    const parsed: Record<string, PlayHistoryItem> = JSON.parse(raw);
    return Object.values(parsed).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
  } catch (err) {
    console.error('Failed to parse play history:', err);
    return [];
  }
}

// Helper: Safely read liked game IDs
export function getLocalLikedGameIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_LIKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper: Safely read reactions
export function getLocalReactions(): Record<string, 'like' | 'dislike'> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_REACTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Helper: Record game play session (called periodically or on exit)
export function recordGamePlay(
  game: {
    id: string;
    slug: string;
    title: string;
    thumbnail_url: string;
    category: string;
  },
  additionalSeconds: number = 0
) {
  if (typeof window === 'undefined' || !game?.id) return;
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    const history: Record<string, PlayHistoryItem> = raw ? JSON.parse(raw) : {};

    const existing = history[game.id] || {
      id: game.id,
      slug: game.slug,
      title: game.title,
      thumbnail_url: game.thumbnail_url,
      category: game.category,
      playTimeSeconds: 0,
      playCount: 0,
      lastPlayedAt: Date.now(),
    };

    existing.playTimeSeconds += additionalSeconds;
    if (additionalSeconds === 0) {
      existing.playCount += 1;
    }
    existing.lastPlayedAt = Date.now();
    // Update metadata if changed
    existing.title = game.title;
    existing.thumbnail_url = game.thumbnail_url;
    existing.category = game.category;
    existing.slug = game.slug;

    history[game.id] = existing;
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));

    // Dispatch custom event only when a new game session starts (NOT on every 5s heartbeat!)
    if (additionalSeconds === 0) {
      window.dispatchEvent(new Event('gamesato_history_updated'));
    }
  } catch (err) {
    console.error('Failed to record game play:', err);
  }
}

// Helper: Toggle Like / Dislike (Guest-friendly, no login needed)
export function toggleLocalReaction(gameId: string, reaction: 'like' | 'dislike'): {
  liked: boolean;
  disliked: boolean;
  action: 'added' | 'removed' | 'switched';
} {
  if (typeof window === 'undefined') {
    return { liked: false, disliked: false, action: 'removed' };
  }

  try {
    const reactions = getLocalReactions();
    const likedList = new Set(getLocalLikedGameIds());
    const current = reactions[gameId];

    let action: 'added' | 'removed' | 'switched' = 'added';
    let liked = false;
    let disliked = false;

    if (current === reaction) {
      // Toggle off
      delete reactions[gameId];
      if (reaction === 'like') {
        likedList.delete(gameId);
      }
      action = 'removed';
    } else {
      // Set new reaction
      if (current) {
        action = 'switched';
      }
      reactions[gameId] = reaction;
      if (reaction === 'like') {
        likedList.add(gameId);
        liked = true;
      } else {
        likedList.delete(gameId);
        disliked = true;
      }
    }

    localStorage.setItem(STORAGE_REACTIONS_KEY, JSON.stringify(reactions));
    localStorage.setItem(STORAGE_LIKED_KEY, JSON.stringify(Array.from(likedList)));
    window.dispatchEvent(new Event('gamesato_reactions_updated'));

    return { liked, disliked, action };
  } catch (err) {
    console.error('Failed to toggle reaction:', err);
    return { liked: false, disliked: false, action: 'removed' };
  }
}

/**
 * React Hook: useGamePlayTracker
 * Tracks active gameplay seconds in the background while iframe is open.
 * Automatically pauses if browser tab is hidden or game is paused.
 */
export function useGamePlayTracker(
  game: {
    id: string;
    slug: string;
    title: string;
    thumbnail_url: string;
    category: string;
  } | null,
  isPlaying: boolean
) {
  const { data: session } = useSession();
  const sessionStartedRef = useRef(false);

  // Initial play count increment when game starts playing
  useEffect(() => {
    if (isPlaying && game && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      recordGamePlay(game, 0);

      // Optional background sync if user is logged in
      if (session?.user) {
        fetch('/api/user/play-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            action: 'start',
          }),
        }).catch(() => {});
      }
    } else if (!isPlaying) {
      sessionStartedRef.current = false;
    }
  }, [isPlaying, game, session]);

  // Periodic heartbeat timer (every 5 seconds)
  useEffect(() => {
    if (!isPlaying || !game) return;

    const interval = setInterval(() => {
      // Only count active playtime if the tab is visible
      if (document.visibilityState === 'visible') {
        recordGamePlay(game, 5);

        // Periodically sync with backend for authenticated user every 30s
        if (session?.user && Math.random() < 0.17) {
          fetch('/api/user/play-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: game.id,
              action: 'heartbeat',
              seconds: 30,
            }),
          }).catch(() => {});
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, game, session]);
}

/**
 * React Hook: usePlayHistoryList
 * Allows any component (like homepage grid) to subscribe to play history and reactions.
 */
export function usePlayHistoryList() {
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const { data: session } = useSession();

  const refresh = useCallback(() => {
    setHistory(getLocalPlayHistory());
    setLikedIds(getLocalLikedGameIds());
  }, []);

  useEffect(() => {
    refresh();

    const handleHistory = () => refresh();
    const handleReactions = () => refresh();

    window.addEventListener('gamesato_history_updated', handleHistory);
    window.addEventListener('gamesato_reactions_updated', handleReactions);
    window.addEventListener('storage', handleHistory);

    // If user is logged in, optionally fetch and merge cloud play history into localStorage
    if (session?.user) {
      fetch('/api/user/play-history')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.history && Array.isArray(data.history)) {
            const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
            const localMap: Record<string, PlayHistoryItem> = raw ? JSON.parse(raw) : {};

            for (const item of data.history) {
              if (!localMap[item.id] || localMap[item.id].lastPlayedAt < item.lastPlayedAt) {
                localMap[item.id] = item;
              }
            }
            localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(localMap));
            refresh();
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('gamesato_history_updated', handleHistory);
      window.removeEventListener('gamesato_reactions_updated', handleReactions);
      window.removeEventListener('storage', handleHistory);
    };
  }, [refresh, session]);

  return {
    history,
    likedIds,
    refresh,
  };
}
