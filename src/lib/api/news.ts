interface NewsAPIArticle {
  source: { id: string; name: string };
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

export async function searchCompanyNews(companyName: string, queries: string[]): Promise<NewsAPIArticle[]> {
  const allResults: NewsAPIArticle[] = [];
  
  for (const query of queries) {
    try {
      const encodedQuery = encodeURIComponent(`${query} AND (${companyName})`);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodedQuery}&sortBy=publishedAt&pageSize=20&language=en`,
        {
          headers: { 'X-Api-Key': process.env.NEWS_API_KEY! },
          next: { revalidate: 0 }
        }
      );
      
      if (!response.ok) {
        console.error(`NewsAPI error for ${query}:`, response.status);
        continue;
      }
      
      const data: NewsAPIResponse = await response.json();
      if (data.articles) {
        allResults.push(...data.articles);
      }
    } catch (error) {
      console.error(`NewsAPI fetch error for ${query}:`, error);
    }
  }
  
  // Deduplicate by URL
  const unique = new Map();
  for (const article of allResults) {
    if (!unique.has(article.url)) {
      unique.set(article.url, article);
    }
  }
  
  return Array.from(unique.values());
}
