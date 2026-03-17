export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.origin + u.pathname.replace(/\/+$/, '')).toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export function normalizeDomain(domain: string): string {
  return domain.replace(/^www\./, '').toLowerCase();
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
