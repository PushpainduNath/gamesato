import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from '@/components/Providers';
import PortalLayoutWrapper from '@/components/PortalLayoutWrapper';
import GoogleAdSenseScript from '@/components/GoogleAdSenseScript';
import React from 'react';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Gamesato - Play Free Online HTML5 Games (No Download)',
    template: '%s | Gamesato',
  },
  description: 'Play 100+ free online HTML5 games instantly on Gamesato. Enjoy unblocked action, racing, sports, puzzle, adventure, and arcade games in your browser on mobile and desktop with zero downloads.',
  keywords: [
    'Gamesato',
    'free online games',
    'play HTML5 games',
    'unblocked games',
    'browser games',
    'no download games',
    'free racing games',
    'free action games',
    'mobile web games',
    'instant play games',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=3', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-48x48.png?v=3', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico?v=3' },
    ],
    shortcut: '/favicon.ico?v=3',
    apple: '/apple-touch-icon.png?v=3',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'google72b218ef6dc38146',
  },
  other: {
    'google-adsense-account': 'ca-pub-6678125372401107',
  },
  openGraph: {
    title: 'Gamesato - Play Free Online HTML5 Games (No Download)',
    description: 'Play free online HTML5 games instantly on Gamesato. Action, racing, sports, puzzle, and arcade games with no downloads required.',
    url: 'https://gamesato.com',
    siteName: 'Gamesato',
    type: 'website',
    images: [
      {
        url: 'https://gamesato.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Gamesato - Play Free Online HTML5 Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gamesato - Play Free Online HTML5 Games (No Download)',
    description: 'Play free online HTML5 games instantly on Gamesato. No downloads required.',
    images: ['https://gamesato.com/logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com';

const globalJsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Gamesato',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@gamesato.com',
        contactType: 'customer support',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Gamesato',
      description: 'Play free online HTML5 browser games instantly on mobile and desktop with no downloads.',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        <meta name="google-adsense-account" content="ca-pub-6678125372401107" />
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6678125372401107"
            crossOrigin="anonymous"
          />
        )}
        <script
          id="organization-website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLdSchema) }}
        />
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.documentElement.classList.remove('light-theme');
                localStorage.setItem('theme', 'dark');
              } catch (e) {}
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
        <GoogleAdSenseScript />
        <Providers>
          <PortalLayoutWrapper>{children}</PortalLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
