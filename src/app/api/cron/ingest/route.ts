import { db } from '../../../../lib/db';
import { companies, newsItems, newsItemTags, ingestionLogs } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchAllNews, filterCompanyNews } from '../../../../lib/api/rss';
import { scrapeArticle } from '../../../../lib/api/scraper';
import { checkDedupe } from '../../../../lib/pipeline/dedupe';
import { applyRules } from '../../../../lib/pipeline/tagger';
import { calculateScore } from '../../../../lib/pipeline/scorer';
import { generateSummary } from '../../../../lib/pipeline/summarizer';
import { normalizeUrl, normalizeTitle, normalizeDomain, extractDomain } from '../../../../lib/pipeline/normalize';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('=== Starting RSS ingestion ===');
    
    // 获取所有活跃公司
    const allCompanies = await db.query.companies.findMany({
      where: eq(companies.isActive, true),
    });
    console.log('Active companies:', allCompanies.map(c => c.name));
    
    // 创建 ingestion log
    const [log] = await db.insert(ingestionLogs).values({
      status: 'running',
    }).returning();
    
    // 1. 抓取所有 RSS 新闻
    console.log('Fetching RSS feeds...');
    const allNews = await fetchAllNews();
    console.log(`Total RSS items fetched: ${allNews.length}`);
    
    // 打印前10条看看所有内容
    if (allNews.length > 0) {
      console.log('=== All fetched news ===');
      allNews.slice(0, 10).forEach((n, i) => {
        console.log(`${i+1}. [${n.source}] ${n.title.slice(0, 60)}`);
      });
      console.log('=== End of sample ===');
    }
    
    // 2. 暂时不过滤，先全部导入测试
    const companyNews = allNews;
    console.log(`Processing all ${companyNews.length} items (filter disabled for test)`);
    
    let itemsNew = 0;
    let itemsError = 0;
    
    // 处理每条新闻 (最多 20 条，先测试)
    for (const article of companyNews.slice(0, 20)) {
      try {
        // 暂时跳过公司匹配，全部导入
        const company = allCompanies[Math.floor(Math.random() * allCompanies.length)];
        if (!company) continue;
        
        console.log(`Processing: ${article.title.slice(0, 40)}...`);
        
        // 抓取正文
        const scraped = await scrapeArticle(article.link);
        
        // 检查去重
        const dedupe = await checkDedupe({
          url: article.link,
          title: article.title,
          companyId: company.id,
          publishedAt: article.pubDate ? new Date(article.pubDate) : undefined,
        });
        
        if (dedupe.action === 'skip') {
          console.log(`Skipped duplicate: ${article.title.slice(0, 30)}`);
          continue;
        }
        
        // 标签
        const tagIds = await applyRules(article.title, scraped.content);
        
        // 评分
        const score = await calculateScore({
          tagIds,
          domain: extractDomain(article.link),
          publishedAt: article.pubDate ? new Date(article.pubDate) : undefined,
          content: scraped.content,
        });
        
        // 摘要
        const summary = await generateSummary({
          title: article.title,
          content: scraped.content,
          meta: scraped.meta,
          impactScore: score.score,
        });
        
        // 入库
        const [newsItem] = await db.insert(newsItems).values({
          companyId: company.id,
          sourceName: article.source,
          sourceDomain: normalizeDomain(extractDomain(article.link)),
          sourceType: 'rss',
          title: article.title,
          normalizedTitle: normalizeTitle(article.title),
          canonicalUrl: normalizeUrl(article.link),
          rawUrl: article.link,
          publishedAt: article.pubDate ? new Date(article.pubDate) : null,
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
        
        // 插入标签
        for (const tagId of tagIds) {
          await db.insert(newsItemTags).values({
            newsItemId: newsItem.id,
            tagId,
            source: 'rule',
          });
        }
        
        itemsNew++;
        console.log(`✓ Added: ${article.title.slice(0, 40)}`);
      } catch (error) {
        console.error(`Error processing:`, error);
        itemsError++;
      }
    }
    
    // 更新 log
    await db.update(ingestionLogs).set({
      completedAt: new Date(),
      itemsFound: companyNews.length,
      itemsNew,
      itemsError,
      status: itemsError > 0 ? 'error' : 'completed',
    }).where(eq(ingestionLogs.id, log.id));
    
    console.log(`=== Ingestion complete: ${itemsNew} new, ${itemsError} errors ===`);
    
    return Response.json({ success: true, itemsNew, itemsError });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
