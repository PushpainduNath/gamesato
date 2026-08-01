'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import CookieConsent from './CookieConsent';

import { useUiStore } from '@/store/useUiStore';
import ProfileDrawer from './ProfileDrawer';

export default function PortalLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setSidebarOpen, isProfileDrawerOpen } = useUiStore();

  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const shouldBlur = isProfileDrawerOpen && isDesktop;

  // Desktop-only body scroll lock when drawer is active
  React.useEffect(() => {
    const handleScrollLock = () => {
      if (isProfileDrawerOpen && window.innerWidth > 768) {
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
  }, [isProfileDrawerOpen]);

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

  return (
    <>
      <Header />
      <div 
        style={{ 
          display: 'flex', 
          flex: 1, 
          minHeight: isDesktop ? 'calc(100vh - 70px)' : 'auto', 
          width: '100%',
          filter: shouldBlur ? 'blur(6px)' : 'none',
          transition: 'filter 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          pointerEvents: shouldBlur ? 'none' : 'auto'
        }}
      >
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </main>
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </div>
      <ProfileDrawer />
      <CookieConsent />
    </>
  );
}
