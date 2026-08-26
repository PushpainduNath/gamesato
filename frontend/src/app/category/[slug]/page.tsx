import React from 'react';
import { Metadata } from 'next';
import CategoryClientView from './CategoryClientView';

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug.toLowerCase();
  const catName = slug.charAt(0).toUpperCase() + slug.slice(1);

  return {
    title: `${catName} Games - Play Free Online HTML5 Games on Gamesato`,
    description: `Play the best free online ${catName} games on Gamesato. Action, racing, sports, and arcade games available with no downloads required.`,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: `${catName} Games | Gamesato`,
      description: `Play free online ${catName} games on Gamesato.`,
      url: `https://gamesato.com/category/${slug}`,
    },
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  return <CategoryClientView slug={params.slug.toLowerCase()} />;
}
