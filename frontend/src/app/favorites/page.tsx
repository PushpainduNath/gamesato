import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { query } from '@/lib/db';
import { Play, Heart } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import Translate from '@/components/Translate';
import styles from './page.module.css';

interface Game {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_url: string;
  play_count: number;
  likes_count: number;
}

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  // Redirect to home if user is not logged in
  if (!session) {
    redirect('/');
  }

  let favorites: Game[] = [];

  try {
    const res = await query(
      `SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.play_count,
              (SELECT COUNT(*)::int FROM likes WHERE "gameId" = g.id) as likes_count
       FROM games g
       JOIN likes l ON g.id = l."gameId"
       WHERE l."userId" = $1 AND g.status = 'published'
       ORDER BY l.created_at DESC`,
      [session.user.id]
    );
    favorites = res.rows;
  } catch (err) {
    console.error('Failed to query user favorites:', err);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Heart className={styles.heartIcon} size={28} fill="currentColor" />
          <h1 className={styles.title}>
            <Translate textKey="myFavoriteGames" fallback="My Favorite Games" />
          </h1>
        </div>
        <p className={styles.subtitle}>
          <Translate textKey="favoritesSubtitle" fallback="Quick access to the H5 games you love playing most." />
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className={styles.grid}>
          {favorites.map((game) => (
            <Link 
              key={game.id} 
              href={`/games/${game.slug}`} 
              className={`${styles.card} glass glass-interactive`}
            >
              <div className={styles.thumbnailWrapper}>
                <img src={game.thumbnail_url.startsWith('http') ? game.thumbnail_url : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022'}${game.thumbnail_url}`} alt={game.title} className={styles.thumbnail} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.category}>{game.category}</span>
                <h3 className={styles.cardTitle}>
                  <Translate textKey={`game_${game.slug}_title`} fallback={game.title} />
                </h3>
                <div className={styles.cardFooter}>
                  <span className={styles.playCount}>
                    <Play size={12} fill="currentColor" /> {formatCompactNumber(game.play_count)}
                  </span>
                  <span className={styles.likesCount}>
                    <Heart size={12} fill="currentColor" /> {formatCompactNumber(game.likes_count)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={`${styles.emptyState} glass`}>
          <Heart size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>
            <Translate textKey="emptyFavorites" fallback="Your list is empty" />
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <Translate textKey="emptyFavoritesDesc" fallback="Click the Heart icon on any game detail page to save it here." />
          </p>
          <Link href="/" className={styles.exploreBtn}>
            <Translate textKey="exploreGames" fallback="Explore Games" />
          </Link>
        </div>
      )}
    </div>
  );
}
