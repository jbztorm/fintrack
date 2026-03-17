import { db } from '../db';
import { tags } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

const AUTHORITATIVE_DOMAINS = [
  'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com',
  'techcrunch.com', 'theverge.com', 'wired.com',
  'mit.edu', 'technologyreview.com',
  '36kr.com', '虎嗅.com', '钛媒体.com'
];

const TAG_SCORES: Record<string, number> = {
  regulatory: 3,    // 监管合规
  financial: 2,     // 财报发布
  product: 1,      // 产品发布
  leadership: 1,   // 高管变动
  company: 0.5,    // 公司动态
  pricing: 0.5,    // 费率变动
  expansion: 0.5,  // 市场扩张
  other: 0,
};

interface ScoreInput {
  tagIds: string[];
  domain: string;
  publishedAt?: Date;
  content?: string;
}

interface ScoreResult {
  score: number;
  reason: string;
}

export async function calculateScore(input: ScoreInput): Promise<ScoreResult> {
  let score = 5.0; // Base score
  const reasons: string[] = ['基础分 5.0'];
  
  // 1. Tag-based scoring
  if (input.tagIds.length > 0) {
    const tagList = await db.select().from(tags).where(inArray(tags.id, input.tagIds));
    
    for (const tag of tagList) {
      const tagScore = TAG_SCORES[tag.slug] || 0;
      if (tagScore > 0) {
        score += tagScore;
        reasons.push(`${tag.name} +${tagScore}`);
      }
    }
  }
  
  // 2. Source authority
  const isAuthoritative = AUTHORITATIVE_DOMAINS.some(d => input.domain.includes(d));
  if (isAuthoritative) {
    score += 1.5;
    reasons.push('权威媒体 +1.5');
  } else if (input.domain) {
    score += 0.5;
    reasons.push('一般媒体 +0.5');
  }
  
  // 3. Recency
  if (input.publishedAt) {
    const hoursAgo = (Date.now() - input.publishedAt.getTime()) / 36e5;
    if (hoursAgo <= 24) {
      score += 1;
      reasons.push('24h内 +1');
    } else if (hoursAgo <= 168) { // 7 days
      score += 0.5;
      reasons.push('7天内 +0.5');
    }
  }
  
  return {
    score: Math.min(10, Math.max(1, score)),
    reason: reasons.join(' + '),
  };
}
