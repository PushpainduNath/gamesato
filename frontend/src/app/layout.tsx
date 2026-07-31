import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import PortalLayoutWrapper from '@/components/PortalLayoutWrapper';
import React from 'react';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gamebite.io'),
  title: {
    default: 'Gamebite | Free Online Web Games',
    template: '%s | Gamebite',
  },
  description: 'Play free online HTML5 games instantly on Gamebite. Action, racing, sports, logic, adventure, and arcade games available to play in your browser with no downloads required.',
  keywords: ['Gamebite', 'H5 games', 'web games', 'free online games', 'arcade', 'racing games', 'action games', 'mobile games'],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  verification: {
    google: 'google72b218ef6dc38146',
  },
  openGraph: {
    title: 'Gamebite | Free Online Web Games',
    description: 'Play free online HTML5 games instantly on Gamebite. No downloads required.',
    url: 'https://gamebite.io',
    siteName: 'Gamebite',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gamebite | Free Online Web Games',
    description: 'Play free online HTML5 games instantly on Gamebite. No downloads required.',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light-theme');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <PortalLayoutWrapper>{children}</PortalLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
