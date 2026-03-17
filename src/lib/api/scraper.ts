import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  content: string;
  meta: {
    description?: string;
    ogDescription?: string;
    author?: string;
    publishDate?: string;
  };
  fetchStatus: 'success' | 'failed';
  error?: string;
}

export async function scrapeArticle(url: string): Promise<ScrapedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FinTrack/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract meta
    const meta = {
      description: $('meta[name="description"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      author: $('meta[name="author"]').attr('content'),
      publishDate: $('meta[property="article:published_time"]').attr('content')
        || $('time').attr('datetime'),
    };
    
    // Extract content (simplified)
    const content = $('article').text().slice(0, 2000) 
      || $('main').text().slice(0, 2000)
      || $('body').text().slice(0, 1000);
    
    return {
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
      content: content.trim(),
      meta,
      fetchStatus: 'success',
    };
  } catch (error) {
    return {
      title: '',
      content: '',
      meta: {},
      fetchStatus: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
