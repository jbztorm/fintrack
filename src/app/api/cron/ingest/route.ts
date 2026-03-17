import { db } from '@/lib/db';
import { companies, newsItems, newsItemTags, ingestionLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { searchCompanyNews } from '@/lib/api/news';
import { scrapeArticle } from '@/lib/api/scraper';
import { checkDedupe } from '@/lib/pipeline/dedupe';
import { applyRules } from '@/lib/pipeline/tagger';
import { calculateScore } from '@/lib/pipeline/scorer';
import { generateSummary } from '@/lib/pipeline/summarizer';
import { normalizeUrl, normalizeTitle, normalizeDomain, extractDomain } from '@/lib/pipeline/normalize';

export async function POST(request: Request) {
  // Cron auth
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get active companies (random 2-3)
    const allCompanies = await db.query.companies.findMany({
      where: eq(companies.isActive, true),
    });
    
    const selected = allCompanies.sort(() => Math.random() - 0.5).slice(0, 3);
    
    console.log(`Processing ${selected.length} companies...`);
    
    for (const company of selected) {
      // Create ingestion log
      const [log] = await db.insert(ingestionLogs).values({
        companyId: company.id,
        status: 'running',
      }).returning();
      
      console.log(`Fetching news for ${company.name}...`);
      
      // 1. Search news
      const articles = await searchCompanyNews(company.name, company.searchQueries);
      console.log(`Found ${articles.length} articles`);
      
      let itemsNew = 0;
      let itemsError = 0;
      
      // Process each article (max 10)
      for (const article of articles.slice(0, 10)) {
        try {
          // 2. Scrape content
          const scraped = await scrapeArticle(article.url);
          
          // 3. Check dedupe
          const dedupe = await checkDedupe({
            url: article.url,
            title: article.title,
            companyId: company.id,
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
          });
          
          if (dedupe.action === 'skip') {
            console.log(`Skipped duplicate: ${article.title.slice(0, 50)}`);
            continue;
          }
          
          // 4. Apply tags
          const tagIds = await applyRules(article.title, scraped.content);
          
          // 5. Calculate score
          const score = await calculateScore({
            tagIds,
            domain: extractDomain(article.url),
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
            content: scraped.content,
          });
          
          // 6. Generate summary
          const summary = await generateSummary({
            title: article.title,
            content: scraped.content,
            meta: scraped.meta,
            impactScore: score.score,
          });
          
          // 7. Insert news item
          const [newsItem] = await db.insert(newsItems).values({
            companyId: company.id,
            sourceName: article.source?.name,
            sourceDomain: normalizeDomain(extractDomain(article.url)),
            sourceType: 'news_api',
            title: article.title,
            normalizedTitle: normalizeTitle(article.title),
            canonicalUrl: normalizeUrl(article.url),
            rawUrl: article.url,
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
            impactScore: score.score.toString(),
            impactReason: score.reason,
            summary: summary.summary,
            summaryType: summary.type,
            rawSnippet: article.description,
            status: 'ready',
            fetchStatus: scraped.fetchStatus,
            fetchError: scraped.error,
            relatedGroupId: dedupe.groupId,
          }).returning();
          
          // 8. Insert tags
          for (const tagId of tagIds) {
            await db.insert(newsItemTags).values({
              newsItemId: newsItem.id,
              tagId,
              source: 'rule',
            });
          }
          
          itemsNew++;
        } catch (error) {
          console.error(`Error processing article:`, error);
          itemsError++;
        }
      }
      
      // Update ingestion log
      await db.update(ingestionLogs).set({
        completedAt: new Date(),
        itemsFound: articles.length,
        itemsNew,
        itemsError,
        status: itemsError > 0 ? 'error' : 'completed',
      }).where(eq(ingestionLogs.id, log.id));
      
      console.log(`Completed ${company.name}: ${itemsNew} new, ${itemsError} errors`);
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
