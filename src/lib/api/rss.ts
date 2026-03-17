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

async function fetchRSS(url: string, sourceName: string, domain: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FinTrack/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) return [];
    
    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    
    const items: RSSItem[] = [];
    
    $('item').each((_, el) => {
      const title = $(el).find('title').text() || $(el).find('title').text();
      const link = $(el).find('link').first().text();
      const description = $(el).find('description').text() || $(el).find('content\\:encoded').text();
      const pubDate = $(el).find('pubDate').text() || $(el).find('dc\\:date').text();
      
      if (title && link) {
        items.push({
          title: title.trim(),
          link: link.trim(),
          description: description?.slice(0, 500) || '',
          pubDate: pubDate || new Date().toISOString(),
          source: sourceName,
          sourceDomain: domain,
        });
      }
    });
    
    return items;
  } catch (error) {
    console.error(`RSS fetch error for ${sourceName}:`, error);
    return [];
  }
}

async function fetchGoogleRSS(query: string): Promise<RSSItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FinTrack/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) return [];
    
    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    
    const items: RSSItem[] = [];
    
    $('item').each((_, el) => {
      const title = $(el).find('title').text();
      const link = $(el).find('link').text();
      const description = $(el).find('description').text();
      const pubDate = $(el).find('pubDate').text();
      
      if (title && link) {
        // 从 Google RSS link 中提取原始URL
        const originalUrl = link.replace('https://news.google.com/rss/articles/', '').split('?')[0];
        
        items.push({
          title: title.trim(),
          link: originalUrl || link,
          description: description?.slice(0, 500) || '',
          pubDate: pubDate || new Date().toISOString(),
          source: 'Google News',
          sourceDomain: new URL(link).hostname || 'news.google.com',
        });
      }
    });
    
    return items;
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
