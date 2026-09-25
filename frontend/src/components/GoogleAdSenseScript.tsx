'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

interface GoogleAdSenseScriptProps {
  publisherId?: string;
}

export default function GoogleAdSenseScript({
  publisherId = 'ca-pub-6678125372401107',
}: GoogleAdSenseScriptProps) {
  const pathname = usePathname();
  const [isAllowedEnv, setIsAllowedEnv] = useState(false);

  useEffect(() => {
    // Only load AdSense script on production domains (not localhost / 127.0.0.1)
    const hostname = window.location.hostname;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local');

    if (!isLocal) {
      setIsAllowedEnv(true);
    }

    // Suppress AdSense TagError (e.g. availableWidth=0 or slot size issues) from triggering Next.js dev overlay
    const handleAdError = (event: ErrorEvent) => {
      const msg = event?.message || '';
      if (
        msg.includes('adsbygoogle') ||
        msg.includes('availableWidth') ||
        msg.includes('TagError') ||
        msg.includes('No slot size')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason?.toString() || '';
      if (
        reason.includes('adsbygoogle') ||
        reason.includes('availableWidth') ||
        reason.includes('TagError') ||
        reason.includes('No slot size')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handleAdError, true);
    window.addEventListener('unhandledrejection', handleRejection, true);
    return () => {
      window.removeEventListener('error', handleAdError, true);
      window.removeEventListener('unhandledrejection', handleRejection, true);
    };
  }, []);

  // Strictly do NOT load AdSense on the dedicated game play screen
  if (pathname && pathname.includes('/play')) {
    return null;
  }

  // In local development, do not load Google AdSense script (avoids TagError and domain reject errors)
  if (!isAllowedEnv) {
    return null;
  }

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

