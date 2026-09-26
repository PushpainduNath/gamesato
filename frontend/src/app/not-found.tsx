import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Gamepad2, Home, Flame, Compass } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found (404) | Gamesato',
  description: 'The game or page you are looking for could not be found. Explore hundreds of other free online games on Gamesato.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      background: 'radial-gradient(ellipse at top, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80px',
        height: '80px',
        borderRadius: '24px',
        background: 'rgba(168, 85, 247, 0.15)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        marginBottom: '24px',
        boxShadow: '0 0 30px rgba(168, 85, 247, 0.25)',
      }}>
        <Gamepad2 size={40} color="#c084fc" />
      </div>

      <span style={{
        fontSize: '0.85rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#f43f5e',
        background: 'rgba(244, 63, 94, 0.12)',
        border: '1px solid rgba(244, 63, 94, 0.25)',
        padding: '4px 12px',
        borderRadius: '9999px',
        marginBottom: '16px',
      }}>
        Error 404 • Game Not Found
      </span>

      <h1 style={{
        fontSize: 'clamp(2rem, 5vw, 3rem)',
        fontWeight: 800,
        color: '#ffffff',
        margin: '0 0 12px 0',
        letterSpacing: '-0.02em',
      }}>
        Looks like this level is missing!
      </h1>

      <p style={{
        fontSize: '1rem',
        color: '#94a3b8',
        maxWidth: '480px',
        lineHeight: 1.6,
        margin: '0 0 32px 0',
      }}>
        The game or link you were trying to access might have been moved or updated. Don&apos;t worry, there are 100+ other free games waiting for you!
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
      }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(124, 58, 237, 0.35)',
            transition: 'transform 0.2s ease',
          }}
        >
          <Home size={18} />
          <span>Back to Home</span>
        </Link>

        <Link
          href="/?filter=Popular"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          <Flame size={18} color="#f97316" fill="#f97316" />
          <span>Popular Games</span>
        </Link>

        <Link
          href="/category/action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          <Compass size={18} color="#38bdf8" />
          <span>Explore Categories</span>
        </Link>
      </div>
    </div>
  );
}
