import React from 'react';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import GamePlayer from '@/components/GamePlayer';

interface PlayPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic'; // Always render on request to match session tracking

export async function generateMetadata(props: PlayPageProps) {
  const params = await props.params;
  const { slug } = params;
  
  try {
    const res = await query('SELECT title FROM games WHERE slug = $1', [slug]);
    if (res.rows.length === 0) return { title: 'Play Game' };
    return {
      title: `Playing ${res.rows[0].title} | Gamesato`,
      robots: 'noindex, nofollow', // Play pages do not need to be indexed directly by search engines
    };
  } catch {
    return { title: 'Play Game' };
  }
}

export default async function PlayPage(props: PlayPageProps) {
  const params = await props.params;
  const { slug } = params;

  let game: any = null;

  try {
    const res = await query(
      'SELECT id, title, slug, game_url FROM games WHERE slug = $1 AND status = \'published\'',
      [slug]
    );
    if (res.rows.length > 0) {
      game = res.rows[0];
    }
  } catch (err) {
    console.error('Error fetching game details for player page:', err);
  }

  if (!game) {
    notFound();
  }

  return (
    <GamePlayer 
      gameId={game.id} 
      gameSlug={game.slug} 
      gameUrl={game.game_url} 
      gameTitle={game.title} 
    />
  );
}
