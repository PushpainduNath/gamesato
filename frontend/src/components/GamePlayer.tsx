'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import styles from './GamePlayer.module.css';

interface GamePlayerProps {
  gameId: string;
  gameSlug: string;
  gameUrl: string;
  gameTitle: string;
}

export default function GamePlayer({ gameId, gameSlug, gameUrl, gameTitle }: GamePlayerProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { t } = useTranslation();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const iframeSrc = `${backendUrl}${gameUrl}`;

  // Generate unique session ID on client side mount
  useEffect(() => {
    const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSessionId(uuid);
  }, []);

  // Lock body scroll to prevent elastic bounce scrolling in iOS Safari
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Send play event and setup heartbeat pings
  useEffect(() => {
    if (!sessionId) return;

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
        
        if (res.ok && type === 'play') {
          setIsConnected(true);
        }
      } catch (err) {
        console.error(`Failed to send analytics ${type} event:`, err);
      }
    }

    // 1. Send immediate play event
    sendEvent('play');

    // 2. Schedule heartbeat event every 30 seconds
    const interval = setInterval(() => {
      sendEvent('heartbeat');
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, gameId, backendUrl]);

  const handleBack = () => {
    router.push(`/games/${gameSlug}`);
  };

  const translatedTitle = t(`game_${gameSlug}_title` as any) || gameTitle;

  return (
    <div className={styles.playerContainer}>
      <button className={styles.backBtn} onClick={handleBack} aria-label="Exit Game" title="Exit Game">
        <ArrowLeft size={18} />
      </button>

      <iframe 
        src={iframeSrc} 
        title={translatedTitle} 
        className={styles.iframe}
        allow="autoplay; fullscreen; keyboard; gamepad"
      />
    </div>
  );
}
