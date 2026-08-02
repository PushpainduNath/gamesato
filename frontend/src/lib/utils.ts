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
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3102';
}

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = getBackendUrl();
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

