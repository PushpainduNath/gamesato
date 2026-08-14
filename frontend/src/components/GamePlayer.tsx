'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wrench } from 'lucide-react';
import { useTranslation } from '@/store/useLanguageStore';
import OrientationRotateOverlay from './OrientationRotateOverlay';
import styles from './GamePlayer.module.css';

interface GamePlayerProps {
  gameId: string;
  gameSlug: string;
  gameUrl: string;
  gameTitle: string;
  orientation?: 'LANDSCAPE' | 'PORTRAIT' | 'AUTO' | string;
}

export default function GamePlayer({ gameId, gameSlug, gameUrl, gameTitle, orientation = 'AUTO' }: GamePlayerProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isForceRotated, setIsForceRotated] = useState(false);
  const { t } = useTranslation();

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

  // Check if game files exist
  useEffect(() => {
    async function checkFile() {
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
        setIsMaintenance(true);
      }
    }
    checkFile();
  }, [iframeSrc, isExternalEmbed]);

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
    if (!sessionId || isMaintenance) return;

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
        } else if (res.status === 404) {
          console.warn('Game no longer exists on server, stopping analytics heartbeat.');
          return false;
        }
        return true;
      } catch (err) {
        console.error(`Failed to send analytics ${type} event:`, err);
      }
    }

    // 1. Send immediate play event
    sendEvent('play');

    // 2. Schedule heartbeat event every 30 seconds
    const interval = setInterval(async () => {
      const ok = await sendEvent('heartbeat');
      if (ok === false) {
        clearInterval(interval);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, gameId, backendUrl, isMaintenance]);

  const handleBack = () => {
    router.push(`/games/${gameSlug}`);
  };

  const translatedTitle = t(`game_${gameSlug}_title` as any) || gameTitle;
  const targetOrientation = (orientation || 'AUTO').toUpperCase();
  const isMismatch = isMobile && !isForceRotated && (
    (targetOrientation === 'LANDSCAPE' && deviceOrientation === 'portrait') ||
    (targetOrientation === 'PORTRAIT' && deviceOrientation === 'landscape')
  );

  return (
    <div className={styles.playerContainer}>
      <button className={styles.backBtn} onClick={handleBack} aria-label="Exit Game" title="Exit Game">
        <ArrowLeft size={18} />
      </button>

      {isMismatch && (
        <OrientationRotateOverlay
          requiredOrientation={targetOrientation as any}
          onForceRotate={() => {
            setIsForceRotated(true);
            try {
              if (screen.orientation && (screen.orientation as any).lock) {
                (screen.orientation as any).lock(targetOrientation.toLowerCase()).catch(() => {});
              }
            } catch (e) {}
          }}
        />
      )}

      {isMaintenance ? (
        <div className={styles.maintenanceContainer}>
          <div className={styles.maintenanceCard}>
            <div className={styles.iconPulseWrapper}>
              <Wrench size={36} />
            </div>
            <h3 className={styles.maintenanceTitle}>Game Under Maintenance</h3>
            <p className={styles.maintenanceDescription}>
              The game files for this title are currently being updated or under maintenance. Please check back soon!
            </p>
            <div className={styles.maintenanceActions}>
              <button className={styles.exploreBtn} onClick={() => router.push('/')}>
                Explore Other Games
              </button>
              <button className={styles.exitBtn} onClick={handleBack}>
                Back to Game Info
              </button>
            </div>
          </div>
        </div>
      ) : (
        <iframe 
          src={iframeSrc} 
          title={translatedTitle} 
          className={styles.iframe}
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
