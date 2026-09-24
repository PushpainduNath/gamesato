'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Zap, Sparkles, Activity, ShieldCheck, ChevronRight } from 'lucide-react';
import styles from './GameLoadingOverlay.module.css';

interface GameLoadingOverlayProps {
  gameTitle: string;
  imageUrl: string;
  durationMs?: number; // Defaults to 5000ms
  onComplete: () => void;
}

const STATUS_MESSAGES = [
  { text: 'Initializing WebGL 2.0 & Shaders', icon: Zap },
  { text: 'Calibrating 60 FPS Low-Latency Controls', icon: Gamepad2 },
  { text: 'Optimizing Cloud Assets • Gamesato Stream', icon: Sparkles },
  { text: 'Synchronizing High-Res Audio & Canvas', icon: Activity },
  { text: 'Game Engine Ready! Launching...', icon: ShieldCheck },
];

export default function GameLoadingOverlay({
  gameTitle,
  imageUrl,
  durationMs = 5000,
  onComplete,
}: GameLoadingOverlayProps) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const percentageTextRef = useRef<HTMLSpanElement>(null);
  const isCompleteRef = useRef(false);

  useEffect(() => {
    const startTime = performance.now();
    let animFrameId: number;
    let lastStep = 0;

    const updateProgress = (currentTime: number) => {
      if (isCompleteRef.current) return;

      const elapsed = currentTime - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));

      // Direct DOM update: 0 React re-renders for 60/120 FPS buttery smooth progress
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${pct}%`;
      }
      if (percentageTextRef.current) {
        percentageTextRef.current.innerText = `${pct}%`;
      }

      // Only trigger React state update when step changes (5 times total over 5 seconds!)
      const currentStep = Math.max(
        0,
        Math.min(
          STATUS_MESSAGES.length - 1,
          Math.floor((pct / 100) * STATUS_MESSAGES.length)
        )
      );

      if (currentStep !== lastStep) {
        lastStep = currentStep;
        setStatusIndex(currentStep);
      }

      if (elapsed < durationMs) {
        animFrameId = requestAnimationFrame(updateProgress);
      } else {
        isCompleteRef.current = true;
        if (progressBarRef.current) progressBarRef.current.style.width = '100%';
        if (percentageTextRef.current) percentageTextRef.current.innerText = '100%';
        setStatusIndex(STATUS_MESSAGES.length - 1);
        setIsExiting(true);
        setTimeout(() => {
          onComplete();
        }, 450);
      }
    };

    animFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [durationMs, onComplete]);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    isCompleteRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  const safeIndex =
    typeof statusIndex === 'number' && statusIndex >= 0 && statusIndex < STATUS_MESSAGES.length
      ? statusIndex
      : 0;
  const currentStatus = STATUS_MESSAGES[safeIndex] || STATUS_MESSAGES[0];
  const CurrentIcon = currentStatus?.icon || Zap;
  const currentStatusText = currentStatus?.text || 'Loading Game Engine...';

  return (
    <div
      className={`${styles.overlayContainer} ${isExiting ? styles.fadeOut : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dynamic Cyber Grid & Nebula Background */}
      <div className={styles.nebulaGlowViolet} />
      <div className={styles.nebulaGlowCyan} />
      <div className={styles.cyberGrid} />
      <div className={styles.scanlines} />

      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          <span className={styles.liveText}>GAMESATO ENGINE</span>
        </div>

        <button
          type="button"
          className={styles.skipBtn}
          onClick={handleSkip}
          aria-label="Skip loading animation"
        >
          <span>Skip</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Centerpiece Gamesato Brand & Artwork Portal */}
      <div className={styles.centerSection}>
        {/* Prominent Big Gamesato Brand in Center */}
        <div className={styles.centerBrand}>
          <div className={styles.brandAuraGlow} />
          <img
            src="/logo-full.png"
            alt="Gamesato"
            className={styles.centerLogoImg}
            onError={(e) => {
              e.currentTarget.src = '/logo-full.webp';
            }}
          />
          <div className={styles.brandSubBadge}>
            <span className={styles.brandSubLine} />
            <span className={styles.brandSubText}>OFFICIAL CLOUD GAMING</span>
            <span className={styles.brandSubLine} />
          </div>
        </div>

        {/* Game Thumbnail Avatar with Neon Portal */}
        <div className={styles.portalWrapper}>
          <div className={styles.pulseRing} />
          <div className={`${styles.pulseRing} ${styles.pulseRingDelay}`} />
          <div className={styles.rotatingRing} />
          <div className={styles.rotatingRingCounter} />

          <div className={styles.avatarInner}>
            {imageUrl ? (
              <img src={imageUrl} alt={gameTitle} className={styles.gameThumb} />
            ) : (
              <div className={styles.fallbackThumb}>
                <Gamepad2 size={36} color="#a78bfa" />
              </div>
            )}
            <div className={styles.thumbGleam} />
          </div>
        </div>

        {/* Game Title with Loading Prefix */}
        <div className={styles.titleWrapper}>
          <span className={styles.loadingPrefix}>LOADING GAME</span>
          <h2 className={styles.gameTitle} title={gameTitle}>
            {gameTitle}
          </h2>
        </div>

        {/* Dynamic Status Pill */}
        <div className={styles.statusPill}>
          <CurrentIcon size={15} className={styles.statusIcon} />
          <span className={styles.statusText}>{currentStatusText}</span>
        </div>
      </div>

      {/* Bottom Progress Engine & HUD Telemetry */}
      <div className={styles.bottomSection}>
        <div className={styles.progressHeader}>
          <span className={styles.systemTag}>GAMESATO CLOUD ENGINE 2.0</span>
          <span ref={percentageTextRef} className={styles.percentageText}>
            0%
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className={styles.progressBarTrack}>
          <div ref={progressBarRef} className={styles.progressBarFill} style={{ width: '0%' }} />
        </div>

        {/* Telemetry HUD Footer */}
        <div className={styles.hudFooter}>
          <div className={styles.hudMetric}>
            <span className={styles.hudLabel}>RESOLUTION</span>
            <span className={styles.hudValue}>1080P HD</span>
          </div>

          <div className={styles.hudMetric}>
            <span className={styles.hudLabel}>FPS TARGET</span>
            <span className={styles.hudValue}>60.0 FPS</span>
          </div>

          <div className={styles.hudMetric}>
            <span className={styles.hudLabel}>LATENCY</span>
            <span className={styles.hudValueCyan}>&lt; 8ms</span>
          </div>

          <div className={styles.hudEqualizer}>
            <span className={styles.eqBar} />
            <span className={styles.eqBar} />
            <span className={styles.eqBar} />
            <span className={styles.eqBar} />
            <span className={styles.eqBar} />
          </div>
        </div>
      </div>
    </div>
  );
}
