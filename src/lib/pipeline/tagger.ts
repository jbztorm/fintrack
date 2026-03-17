import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

interface TagRule {
  pattern: RegExp;
  tagSlug: string;
}

const TAG_RULES: TagRule[] = [
  { pattern: /发布|推出|上线|launch|release|new feature/i, tagSlug: 'product' },
  { pattern: /融资|收购|合作|acquire|funding|partnership/i, tagSlug: 'company' },
  { pattern: /费率|价格|pricing|fee|降低|调整/i, tagSlug: 'pricing' },
  { pattern: /CEO|CTO|任命|join|leave|离职|加入/i, tagSlug: 'leadership' },
  { pattern: /财报|营收|Q[1-4]|revenue|earnings|财报季/i, tagSlug: 'financial' },
  { pattern: /监管|合规|罚|regulatory|compliance|SEC|FCA/i, tagSlug: 'regulatory' },
  { pattern: /进入|扩张|expand|market|global|international/i, tagSlug: 'expansion' },
];

export async function applyRules(title: string, content?: string): Promise<string[]> {
  const text = `${title} ${content || ''}`.toLowerCase();
  const matchedSlugs = new Set<string>();
  
  for (const rule of TAG_RULES) {
    if (rule.pattern.test(text)) {
      matchedSlugs.add(rule.tagSlug);
    }
  }
  
  // Default to 'other'
  if (matchedSlugs.size === 0) {
    matchedSlugs.add('other');
  }
  
  // Query tag IDs
  const tagList = await db.select().from(tags).where(inArray(tags.slug, Array.from(matchedSlugs)));
  
  return tagList.map(t => t.id);
}
