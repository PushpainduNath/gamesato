'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './AdBanner.module.css';

interface AdBannerProps {
  type?: 'horizontal' | 'skyscraper' | 'auto';
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdBanner({
  type = 'horizontal',
  slot = '',
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isPushed = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkVisibility = () => {
      if (!containerRef.current) return false;
      const el = containerRef.current;

      // 1. Element must have rendered positive dimensions
      if (el.offsetWidth <= 0 || el.offsetHeight <= 0) {
        return false;
      }

      // 2. Element or parent must NOT be hidden by CSS media query (display: none)
      const computed = window.getComputedStyle(el);
      if (computed.display === 'none' || computed.visibility === 'hidden') {
        return false;
      }
      if (el.parentElement) {
        const parentComputed = window.getComputedStyle(el.parentElement);
        if (parentComputed.display === 'none' || parentComputed.visibility === 'hidden') {
          return false;
        }
      }

      return true;
    };

    const updateVisibility = () => {
      const visible = checkVisibility();
      setIsVisible(visible);
    };

    // Use requestAnimationFrame so CSS reflow/paint is settled
    const rafId = requestAnimationFrame(() => {
      updateVisibility();
    });

    window.addEventListener('resize', updateVisibility, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        updateVisibility();
      });
      observer.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateVisibility);
      if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Only push when visible and not already initialized
    if (!isVisible || isPushed.current) return;

    // Do not call push on localhost to avoid AdSense TagError
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local'));

    if (isLocal) {
      return;
    }

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      isPushed.current = true;
    } catch (err) {
      // Silently catch ad-block or unready errors
    }
  }, [isVisible]);

  const isSkyscraper = type === 'skyscraper';
  const wrapperClass = isSkyscraper ? styles.skyscraperWrapper : styles.adWrapper;
  const bannerClass = isSkyscraper ? styles.skyscraperBanner : styles.horizontalBanner;

  return (
    <div ref={containerRef} className={`${wrapperClass} ${className}`} style={style}>
      <span className={styles.adLabel}>Advertisement</span>
      <div className={bannerClass}>
        <div className={styles.placeholderNotice} aria-hidden="true">
          <span>{isSkyscraper ? 'Ad Space • Skyscraper' : 'Ad Space • Leaderboard'}</span>
        </div>
        {/* Only mount the <ins> tag when confirmed visible with positive width (prevents availableWidth=0) */}
        {isVisible && (
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              width: isSkyscraper ? '160px' : '100%',
              maxWidth: '100%',
              height: isSkyscraper ? '600px' : 'auto',
              minHeight: isSkyscraper ? '600px' : '90px',
              position: 'relative',
              zIndex: 1,
            }}
            data-ad-client="ca-pub-6678125372401107"
            {...(slot ? { 'data-ad-slot': slot } : {})}
            data-ad-format={isSkyscraper ? 'vertical' : format}
            data-full-width-responsive={isSkyscraper ? 'false' : responsive ? 'true' : 'false'}
          />
        )}
      </div>
    </div>
  );
}

