'use client';

import React from 'react';
import { useTranslation } from '@/store/useLanguageStore';

interface TranslateProps {
  textKey: string;
  fallback: string;
}

export default function Translate({ textKey, fallback }: TranslateProps) {
  const { t } = useTranslation();
  
  // Map category names dynamically if needed
  let key = textKey;
  if (key === 'New') key = 'newGames';
  if (key === 'Popular') key = 'popularGames';
  if (key === 'Racing') key = 'racingGames';
  if (key === 'Action') key = 'actionGames';
  if (key === 'Sport') key = 'sportsGames';
  if (key === 'Arcade') key = 'arcadeGames';
  if (key === 'Logic') key = 'logicGames';
  if (key === 'Number') key = 'numberGames';
  if (key === 'Adventure') key = 'adventureGames';
  if (key === 'Puzzle') key = 'puzzleGames';
  if (key === 'Board') key = 'boardGames';
  if (key === 'Favorites') key = 'favoriteGames';

  // @ts-ignore
  const translated = t(key);
  return <>{translated || fallback}</>;
}
