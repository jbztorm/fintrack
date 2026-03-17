import { db } from '@/lib/db';
import { newsItems } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { normalizeUrl, normalizeTitle, normalizeDomain, extractDomain } from './normalize';
import { wordJaccardSimilarity } from '@/lib/utils/similarity';

interface DedupeResult {
  action: 'skip' | 'group' | 'insert';
  existingId?: string;
  groupId?: string;
}

export async function checkDedupe(item: {
  url: string;
  title: string;
  companyId: string;
  publishedAt?: Date;
}): Promise<DedupeResult> {
  const canonicalUrl = normalizeUrl(item.url);
  const normalizedTitle = normalizeTitle(item.title);
  const sourceDomain = normalizeDomain(extractDomain(item.url));
  
  // 1. Strong dedupe: exact URL match
  const existingByUrl = await db.query.newsItems.findFirst({
    where: eq(newsItems.canonicalUrl, canonicalUrl),
  });
  
  if (existingByUrl) {
    return { action: 'skip', existingId: existingByUrl.id };
  }
  
  // 2. Strong dedupe: title + domain + 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const existingByTitle = await db.query.newsItems.findFirst({
    where: and(
      eq(newsItems.normalizedTitle, normalizedTitle),
      eq(newsItems.sourceDomain, sourceDomain),
      eq(newsItems.companyId, item.companyId),
      gte(newsItems.publishedAt, oneDayAgo)
    ),
  });
  
  if (existingByTitle) {
    return { action: 'skip', existingId: existingByTitle.id };
  }
  
  // 3. Weak grouping: similarity > 0.8
  const recentItems = await db.query.newsItems.findMany({
    where: and(
      eq(newsItems.companyId, item.companyId),
      gte(newsItems.discoveredAt, oneDayAgo)
    ),
    orderBy: [desc(newsItems.discoveredAt)],
    limit: 50,
  });
  
  for (const recent of recentItems) {
    if (recent.normalizedTitle) {
      const similarity = wordJaccardSimilarity(normalizedTitle, recent.normalizedTitle);
      if (similarity > 0.8) {
        return { action: 'group', groupId: recent.relatedGroupId || recent.id };
      }
    }
  }
  
  return { action: 'insert' };
}
