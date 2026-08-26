import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from '@/components/Providers';
import PortalLayoutWrapper from '@/components/PortalLayoutWrapper';
import React from 'react';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Gamesato | Free Online Web Games',
    template: '%s | Gamesato',
  },
  description: 'Play free online HTML5 games instantly on Gamesato. Action, racing, sports, logic, adventure, and arcade games available to play in your browser with no downloads required.',
  keywords: ['Gamesato', 'H5 games', 'web games', 'free online games', 'arcade', 'racing games', 'action games', 'mobile games'],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'google72b218ef6dc38146',
  },
  openGraph: {
    title: 'Gamesato | Free Online Web Games',
    description: 'Play free online HTML5 games instantly on Gamesato. No downloads required.',
    url: 'https://gamesato.com',
    siteName: 'Gamesato',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gamesato | Free Online Web Games',
    description: 'Play free online HTML5 games instantly on Gamesato. No downloads required.',
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Gamesato',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com'}/logo.png`,
  sameAs: [
    'https://twitter.com',
    'https://facebook.com',
    'https://youtube.com',
    'https://instagram.com',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@gamesato.com',
    contactType: 'customer support',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('light-theme');
                  localStorage.setItem('theme', 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-B3F3Z0WNME"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-B3F3Z0WNME');
          `}
        </Script>
        <Providers>
          <PortalLayoutWrapper>{children}</PortalLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
