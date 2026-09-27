export function formatCompactNumber(num: number): string {
  if (num >= 1e12) {
    return (num / 1e12).toFixed(1).replace(/\.0$/, '') + 't';
  }
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'b';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || '';
  }
  return process.env.BACKEND_URL || 'http://127.0.0.1:3102';
}

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  let cleanUrl = url.trim();

  // Strip accidental local machine loopback addresses that might be prepended or stored
  cleanUrl = cleanUrl.replace(/^http:\/\/(127\.0\.0\.1|localhost):(3102|3022)/, '');

  // If it's a valid external URL (e.g. CDN or GameMonetize), return it directly
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  // Return clean relative path starting with '/' for seamless browser delivery
  return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
}

