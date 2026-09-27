'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import CookieConsent from './CookieConsent';

import { useUiStore } from '@/store/useUiStore';
import { useSession } from 'next-auth/react';
import ProfileDrawer from './ProfileDrawer';

export default function PortalLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setSidebarOpen, isProfileDrawerOpen, closeProfileDrawer } = useUiStore();

  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const shouldBlur = isProfileDrawerOpen && isDesktop && !!session;

  // Auto-close profile drawer if user is not logged in
  React.useEffect(() => {
    if (!session && isProfileDrawerOpen) {
      closeProfileDrawer();
    }
  }, [session, isProfileDrawerOpen, closeProfileDrawer]);

  // Desktop-only body scroll lock when drawer is active
  React.useEffect(() => {
    const handleScrollLock = () => {
      if (shouldBlur) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };
    handleScrollLock();
    window.addEventListener('resize', handleScrollLock);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleScrollLock);
    };
  }, [shouldBlur]);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  // If path starts with /admin, or is /login or /signup, render children directly without public header, sidebar, footer.
  if (pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  // All public routes (including home, games, categories, static pages, and 404 not-found)
  // use the unified modern theme with NewHeader, NewSidebar, NewFooter in their respective views.
  return (
    <>
      <div
        style={{
          filter: shouldBlur ? 'blur(6px)' : 'none',
          transition: 'filter 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          pointerEvents: shouldBlur ? 'none' : 'auto',
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
      <ProfileDrawer />
      <CookieConsent />
    </>
  );
}
