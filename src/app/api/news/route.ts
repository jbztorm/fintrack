import { db } from '@/lib/db';
import { newsItems, companies, newsItemTags, tags, ingestionLogs } from '@/lib/db/schema';
import { eq, and, desc, gte, sql, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const companyId = searchParams.get('company');
  const tagId = searchParams.get('tag');
  const minScore = parseFloat(searchParams.get('minScore') || '0');
  const days = parseInt(searchParams.get('days') || '60');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  // Build conditions
  const conditions = [eq(newsItems.status, 'ready')];
  
  if (companyId) {
    conditions.push(eq(newsItems.companyId, companyId));
  }
  
  if (minScore > 0) {
    conditions.push(sql`${newsItems.impactScore}::numeric >= ${minScore}`);
  }
  
  if (days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    conditions.push(gte(newsItems.publishedAt, since));
  }
  
  // Get news items
  const news = await db.select({
    id: newsItems.id,
    title: newsItems.title,
    summary: newsItems.summary,
    impactScore: newsItems.impactScore,
    publishedAt: newsItems.publishedAt,
    sourceName: newsItems.sourceName,
    canonicalUrl: newsItems.canonicalUrl,
    companyId: newsItems.companyId,
    companyName: companies.name,
    companySlug: companies.slug,
  })
  .from(newsItems)
  .leftJoin(companies, eq(newsItems.companyId, companies.id))
  .where(conditions.length > 0 ? and(...conditions) : undefined)
  .orderBy(desc(newsItems.publishedAt))
  .limit(limit)
  .offset(offset);
  
  // Get tags for each news item
  const newsWithTags = await Promise.all(news.map(async (item) => {
    const itemTags = await db.select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      priority: tags.priority,
    })
    .from(newsItemTags)
    .leftJoin(tags, eq(newsItemTags.tagId, tags.id))
    .where(eq(newsItemTags.newsItemId, item.id));
    
    return { ...item, tags: itemTags };
  }));
  
  // Get filter options
  const allCompanies = await db.select().from(companies).where(eq(companies.isActive, true));
  const allTags = await db.select().from(tags);
  
  return Response.json({
    news: newsWithTags,
    filters: {
      companies: allCompanies,
      tags: allTags,
    },
  });
}
