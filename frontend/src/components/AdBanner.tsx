'use client';

import React from 'react';

interface AdBannerProps {
  type?: 'horizontal' | 'skyscraper' | 'auto';
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Master toggle: Set to true once Google AdSense account is approved to serve live ads
const ADS_ENABLED = false;

export default function AdBanner({
  type = 'horizontal',
  slot = '',
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}: AdBannerProps) {
  // During review, do not render any ad slots or placeholders to prevent policy warnings
  if (!ADS_ENABLED) {
    return null;
  }

  return null;
}


