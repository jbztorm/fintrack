import { db } from '../lib/db';
import { newsItems, companies, tags, newsItemTags } from '../lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import Link from 'next/link';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function formatTimeAgo(date: Date | null): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
  return date.toLocaleDateString('zh-CN');
}

function isToday(date: Date | null): boolean {
  if (!date) return false;
  return date.toDateString() === new Date().toDateString();
}

// 安全的数据获取函数，带错误处理
async function getNewsData(companyId?: string, tagId?: string, minScore: number = 0) {
  try {
    const conditions = [eq(newsItems.status, 'ready')];
    if (companyId) conditions.push(eq(newsItems.companyId, companyId));
    if (minScore > 0) conditions.push(sql`${newsItems.impactScore}::numeric >= ${minScore}`);
    
    const news = await db.select({
      id: newsItems.id,
      title: newsItems.title,
      summary: newsItems.summary,
      impactScore: newsItems.impactScore,
      publishedAt: newsItems.publishedAt,
      sourceName: newsItems.sourceName,
      canonicalUrl: newsItems.canonicalUrl,
      companyName: companies.name,
    })
    .from(newsItems)
    .leftJoin(companies, eq(newsItems.companyId, companies.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(newsItems.publishedAt))
    .limit(100);
    
    const newsWithTags = await Promise.all(news.map(async (item) => {
      const itemTags = await db.select({ id: tags.id, name: tags.name, slug: tags.slug, priority: tags.priority })
        .from(newsItemTags).leftJoin(tags, eq(newsItemTags.tagId, tags.id))
        .where(eq(newsItemTags.newsItemId, item.id));
      return { ...item, tags: itemTags };
    }));
    
    return { news: newsWithTags, error: null };
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return { news: [], error: error instanceof Error ? error.message : 'Failed to fetch news data' };
  }
}

async function getFilterOptions() {
  try {
    const allCompanies = await db.query.companies.findMany({ where: eq(companies.isActive, true) });
    const allTags = await db.query.tags.findMany();
    return { companies: allCompanies, tags: allTags, error: null };
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    return { companies: [], tags: [], error: error instanceof Error ? error.message : 'Failed to fetch filters' };
  }
}

export default async function HomePage({ searchParams }: { searchParams: { company?: string; tag?: string; minScore?: string } }) {
  const companyId = searchParams.company;
  const tagId = searchParams.tag;
  const minScore = parseFloat(searchParams.minScore || '0');
  
  // 并行获取数据，带错误处理
  const [newsData, filterOptions] = await Promise.all([
    getNewsData(companyId, tagId, minScore),
    getFilterOptions()
  ]);
  
  // 如果有错误，显示友好信息
  if (newsData.error || filterOptions.error) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold"><span className="text-emerald-500">◆</span> FinTrack</Link>
            <div className="text-sm text-neutral-500">跨境支付情报看板</div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 max-w-md mx-auto">
            <div className="text-amber-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">服务暂时不可用</h2>
            <p className="text-neutral-400 mb-4">
              {newsData.error || filterOptions.error || '数据库连接失败'}
            </p>
            <p className="text-sm text-neutral-500">
              请稍后刷新页面，或联系管理员检查数据库配置
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const { news: newsWithTags } = newsData;
  const { companies: allCompanies, tags: allTags } = filterOptions;
  
  const filteredNews = tagId ? newsWithTags.filter(n => n.tags.some(t => t.id === tagId)) : newsWithTags;
  
  const todayNews = filteredNews.filter(n => isToday(n.publishedAt));
  const olderNews = filteredNews.filter(n => !isToday(n.publishedAt));
  
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold"><span className="text-emerald-500">◆</span> FinTrack</Link>
          <div className="text-sm text-neutral-500">跨境支付情报看板</div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <aside className="w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase mb-3">公司</h3>
            <div className="space-y-1">
              <Link href="/" className={`block px-2 py-1.5 rounded text-sm ${!companyId ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}>全部</Link>
              {allCompanies.map(c => <Link key={c.id} href={`/?company=${c.id}`} className={`block px-2 py-1.5 rounded text-sm ${companyId === c.id ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}>{c.name}</Link>)}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase mb-3">标签</h3>
            <div className="space-y-1">
              <Link href="/" className={`block px-2 py-1.5 rounded text-sm ${!tagId ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}>全部</Link>
              {allTags.map(t => <Link key={t.id} href={`/?tag=${t.id}`} className={`block px-2 py-1.5 rounded text-sm ${tagId === t.id ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}>{t.name}</Link>)}
            </div>
          </div>
        </aside>
        <main className="flex-1 space-y-8">
          {todayNews.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>今日新增 ({todayNews.length})</h2>
              <div className="space-y-3">
                {todayNews.map(item => (
                  <article key={item.id} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      {item.tags.slice(0, 2).map(tag => <span key={tag.id} className={`px-1.5 py-0.5 rounded ${(tag.priority ?? 0) >= 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800'}`}>{tag.name}</span>)}
                      <span className="text-neutral-500">{formatTimeAgo(item.publishedAt)}</span>
                      <span className="text-emerald-500">⭐ {item.impactScore}</span>
                    </div>
                    <h3 className="font-medium mb-1">{item.canonicalUrl ? <a href={item.canonicalUrl} target="_blank" className="hover:text-emerald-400">{item.title}</a> : item.title}</h3>
                    {item.summary && <p className="text-sm text-neutral-400 line-clamp-2">{item.summary}</p>}
                    <div className="text-xs text-neutral-500 mt-2">{item.sourceName} • {item.companyName}</div>
                  </article>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-neutral-400">{todayNews.length > 0 ? '更早新闻' : '全部新闻'}</h2>
            <div className="space-y-3">
              {olderNews.map(item => (
                <article key={item.id} className="bg-neutral-900/30 border border-neutral-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    {item.tags.slice(0, 2).map(tag => <span key={tag.id} className="px-1.5 py-0.5 rounded bg-neutral-800">{tag.name}</span>)}
                    <span className="text-neutral-500">{formatTimeAgo(item.publishedAt)}</span>
                    <span className={parseFloat(item.impactScore ?? '0') >= 7 ? 'text-emerald-400' : 'text-neutral-500'}>⭐ {item.impactScore}</span>
                  </div>
                  <h3 className="font-medium text-neutral-300">{item.canonicalUrl ? <a href={item.canonicalUrl} target="_blank" className="hover:text-emerald-400">{item.title}</a> : item.title}</h3>
                  <div className="text-xs text-neutral-500 mt-2">{item.sourceName} • {item.companyName}</div>
                </article>
              ))}
              {filteredNews.length === 0 && <div className="text-center py-12 text-neutral-500">暂无新闻数据</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
