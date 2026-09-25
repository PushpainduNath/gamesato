'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface GoogleAdSenseScriptProps {
  publisherId?: string;
}

export default function GoogleAdSenseScript({
  publisherId = 'ca-pub-6678125372401107',
}: GoogleAdSenseScriptProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Strictly do NOT load AdSense on the dedicated game play screen
    if (pathname && pathname.includes('/play')) {
      return;
    }

    // Only load AdSense script on production domains (not localhost / 127.0.0.1)
    const hostname = window.location.hostname;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local');

    if (!isLocal) {
      const existingScript = document.querySelector(
        'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
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
  }, [pathname, publisherId]);

  return null;
}

