import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { Gamepad2, ArrowLeft, Play, Users, ChevronDown, ChevronsRight } from 'lucide-react';
import Translate from '@/components/Translate';
import GamePlayerCard from '@/components/GamePlayerCard';
import GameActions from '@/components/GameActions';
import MobileGameDetails from '@/components/MobileGameDetails';
import { getImageUrl } from '@/lib/utils';
import styles from './page.module.css';

// Type definitions
interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnail_url: string;
  game_url: string;
  play_count: number;
  created_at: string;
  game_page_both_url?: string | null;
  how_to_play?: string | null;
}



// Dynamic routes pre-generation
export async function generateStaticParams() {
  try {
    const res = await query(
      "SELECT slug FROM games WHERE status = 'published' ORDER BY created_at DESC"
    );
    return res.rows.map((row: { slug: string }) => ({
      slug: row.slug,
    }));
  } catch (err) {
    console.error('Error generating static parameters for ISR:', err);
    return [];
  }
}

// Dynamic SEO metadata generation
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { slug } = params;
  
  try {
    const res = await query(
      'SELECT title, description, thumbnail_url FROM games WHERE slug = $1',
      [slug]
    );

    if (res.rows.length === 0) {
      return {
        title: 'Game Not Found | Gamesato',
      };
    }

    const game = res.rows[0];
    return {
      title: `${game.title} - Play Free H5 Game Online`,
      description: game.description || `Play ${game.title} instantly in your web browser. A high-performance H5 web game on Gamesato.`,
      openGraph: {
        title: `${game.title} | Gamesato`,
        description: game.description,
        images: [game.thumbnail_url],
      },
    };
  } catch (err) {
    console.error('Error generating metadata for game page:', err);
    return {
      title: 'Gamesato Portal',
    };
  }
}

export default async function GameDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { slug } = params;

  // 1. Fetch game details directly from database (for ISR generation)
  let game: Game | null = null;
  let likesCount = 0;
  
  try {
    const gameRes = await query('SELECT * FROM games WHERE slug = $1', [slug]);
    if (gameRes.rows.length > 0) {
      const activeGame = gameRes.rows[0];
      game = activeGame;
      
      const likesRes = await query('SELECT COUNT(*) FROM likes WHERE "gameId" = $1', [activeGame.id]);
      likesCount = parseInt(likesRes.rows[0].count || '0');
    }
  } catch (err) {
    console.error('Failed to query game details:', err);
  }

  if (!game) {
    notFound();
  }

  // 2. Fetch up to 15 random games for "More Games" section on desktop
  let moreGames: Game[] = [];
  try {
    const moreRes = await query(
      "SELECT id, title, slug, thumbnail_url, category FROM games WHERE status = 'published' AND id != $1 ORDER BY RANDOM() LIMIT 15",
      [game.id]
    );
    moreGames = moreRes.rows;
  } catch (err) {
    console.error('Failed to fetch more games for details page:', err);
  }

  const gameImageUrl = getImageUrl(
    (game as any).game_page_both_url ||
    (game as any).featured_mobile_url ||
    (game as any).featured_desktop_url ||
    game.thumbnail_url
  );

  return (
    <div className={styles.container}>
      {/* ----------------- MOBILE LAYOUT (Screenshot layout matching) ----------------- */}
      <div className={styles.mobileLayout}>
        <MobileGameDetails
          gameId={game.id}
          gameSlug={game.slug}
          gameTitle={game.title}
          gameCategory={game.category}
          gameDescription={game.description}
          gameHowToPlay={game.how_to_play}
          gameImageUrl={gameImageUrl}
          initialLikes={likesCount}
          moreGames={moreGames}
        />
      </div>

      {/* ----------------- DESKTOP LAYOUT (Mockup screen visual) ----------------- */}
      <div className={styles.desktopLayout}>
        {/* Breadcrumbs */}
        <div className={styles.breadcrumbs}>
          <Link href="/" className={styles.breadcrumbLink}>
            <Translate textKey="home" fallback="Home" />
          </Link>
          <ChevronsRight size={18} className={styles.breadcrumbSeparator} />
          <Link href={`/category/${game.category.toLowerCase().replace(/\s+/g, '-')}`} className={styles.breadcrumbLink}>
            <Translate textKey={game.category} fallback={game.category} />
          </Link>
          <ChevronsRight size={18} className={styles.breadcrumbSeparator} />
          <span className={styles.breadcrumbActive}>{game.title}</span>
        </div>

        <div className={styles.layout}>
          {/* Left Side: Game Player Card */}
          <div className={styles.leftColumn}>
            <GamePlayerCard
              gameId={game.id}
              gameSlug={game.slug}
              gameTitle={game.title}
              imageUrl={gameImageUrl}
              gameUrl={game.game_url}
              initialLikes={likesCount}
            />
          </div>

          {/* Right Side: More Games grid container */}
          <div className={styles.rightColumn}>
            <div className={styles.moreGamesBox}>
              <h3 className={styles.moreGamesTitle}>
                <Translate textKey="moreGames" fallback="More Games" />
              </h3>
              <div className={styles.moreGamesScrollWrapper}>
                <div className={styles.moreGamesGrid}>
                  {moreGames.map((g) => {
                    const thumbUrl = getImageUrl(g.thumbnail_url);
                    return (
                      <Link
                        key={g.id}
                        href={`/games/${g.slug}`}
                        className={styles.moreGamesCard}
                        title={g.title}
                      >
                        <div className={styles.moreGamesThumbWrapper}>
                          <img src={thumbUrl} alt={g.title} className={styles.moreGamesThumb} />
                        </div>
                        <div className={styles.moreGamesCardContent}>
                          <span className={styles.moreGamesCardTitle}>
                            <Translate textKey={`game_${g.slug}_title`} fallback={g.title} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Bottom Details info card */}
        <div className={styles.detailsBox}>
          <h1 className={styles.detailsTitle}>
            <Translate textKey={`game_${game.slug}_title`} fallback={game.title} />
          </h1>
          <div className={styles.categoryRow}>
            <Gamepad2 size={16} className={styles.categoryIcon} />
            <span className={styles.categoryLabel}>
              <Translate textKey={game.category} fallback={game.category} />
            </span>
          </div>
          <div className={styles.detailsContent}>
            <Translate textKey={`game_${game.slug}_desc`} fallback={game.description || 'No description available for this game.'} />
          </div>
        </div>

        {/* How to Play Section */}
        {game.how_to_play && (
          <div className={styles.howToPlayBox}>
            <h2 className={styles.howToPlayTitle}>
              How to Play the {game.title}
            </h2>
            <ul className={styles.howToPlayList}>
              {game.how_to_play
                .split('\n')
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
                .map((bullet: string, index: number) => (
                  <li key={index} className={styles.howToPlayItem}>
                    {bullet.replace(/^[\s•*-]+/, '')}
                  </li>
                ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
