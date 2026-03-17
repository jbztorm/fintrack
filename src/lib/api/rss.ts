import * as cheerio from 'cheerio';

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceDomain: string;
}

const RSS_SOURCES = [
  // Tech
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', domain: 'techcrunch.com' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', domain: 'theverge.com' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', domain: 'wired.com' },
  // 中文
  { name: '36kr', url: 'https://www.36kr.com/feed/', domain: '36kr.com' },
  { name: '虎嗅', url: 'https://www.huxiu.com/rss', domain: 'huxiu.com' },
  // 金融
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/', domain: 'reuters.com' },
];

// 目标公司关键词
const COMPANY_KEYWORDS = [
  'Stripe', 'Adyen', 'Checkout.com', 'Payoneer', 
  'PingPong', 'LianLian', 'WorldFirst', '连连支付', '蚂蚁集团'
];

// 使用 rss2json API 抓取 RSS
async function fetchRSS(url: string, sourceName: string, domain: string): Promise<RSSItem[]> {
  try {
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    
    const response = await fetch(rss2jsonUrl, {
      headers: { 'User-Agent': 'FinTrack/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.status !== 'ok' || !data.items) {
      console.warn(`rss2json error for ${sourceName}: ${data.message || 'unknown error'}`);
      return [];
    }
    
    const items: RSSItem[] = data.items.map((item: any) => ({
      title: item.title || '',
      link: item.link || '',
      description: item.description?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
      pubDate: item.pubDate || new Date().toISOString(),
      source: sourceName,
      sourceDomain: domain,
    }));
    
    return items.filter((item: RSSItem) => item.title && item.link);
  } catch (error) {
    console.error(`RSS fetch error for ${sourceName}:`, error);
    return [];
  }
}

async function fetchGoogleRSS(query: string): Promise<RSSItem[]> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    const response = await fetch(rss2jsonUrl, {
      headers: { 'User-Agent': 'FinTrack/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.status !== 'ok' || !data.items) {
      console.warn(`rss2json Google RSS error for ${query}: ${data.message || 'unknown error'}`);
      return [];
    }
    
    const items: RSSItem[] = data.items.map((item: any) => {
      // 从 Google RSS link 中提取原始URL
      const link = item.link?.replace('https://news.google.com/rss/articles/', '').split('?')[0] || item.link;
      
      return {
        title: item.title || '',
        link: link || '',
        description: item.description?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
        pubDate: item.pubDate || new Date().toISOString(),
        source: 'Google News',
        sourceDomain: 'news.google.com',
      };
    });
    
    return items.filter((item: RSSItem) => item.title && item.link);
  } catch (error) {
    console.error(`Google RSS fetch error for ${query}:`, error);
    return [];
  }
}

export async function fetchAllNews(): Promise<RSSItem[]> {
  const allItems: RSSItem[] = [];
  
  // 1. 抓取固定 RSS 源
  console.log('Fetching RSS sources...');
  for (const source of RSS_SOURCES) {
    const items = await fetchRSS(source.url, source.name, source.domain);
    console.log(`  ${source.name}: ${items.length} items`);
    allItems.push(...items);
  }
  
  // 2. 抓取 Google RSS（针对每家公司）
  console.log('Fetching Google RSS...');
  for (const keyword of COMPANY_KEYWORDS) {
    const items = await fetchGoogleRSS(`${keyword} payment fintech`);
    allItems.push(...items);
  }
  
  // 3. 去重（基于 title + domain）
  const seen = new Set<string>();
  const uniqueItems = allItems.filter(item => {
    const key = `${item.title.slice(0, 50)}-${item.sourceDomain}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  console.log(`Total unique items: ${uniqueItems.length}`);
  return uniqueItems;
}

// 过滤与目标公司相关的新闻
export function filterCompanyNews(items: RSSItem[]): RSSItem[] {
  return items.filter(item => {
    const text = `${item.title} ${item.description}`.toLowerCase();
    return COMPANY_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  });
}
