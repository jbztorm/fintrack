import { db } from './index';
import { companies, tags } from './schema';

const COMPANY_DATA = [
  { name: 'Stripe', slug: 'stripe', searchQueries: ['Stripe payment', 'Stripe fintech', 'Stripe API', 'Stripe Connect'], isActive: true },
  { name: 'Adyen', slug: 'adyen', searchQueries: ['Adyen payment', 'Adyen fintech', 'Adyen platform'], isActive: true },
  { name: 'Checkout.com', slug: 'checkout-com', searchQueries: ['Checkout.com payment', 'Checkout fintech'], isActive: true },
  { name: 'Payoneer', slug: 'payoneer', searchQueries: ['Payoneer payment', 'Payoneer freelancer'], isActive: true },
  { name: 'PingPong', slug: 'pingpong', searchQueries: ['PingPong payment', 'PingPong cross-border'], isActive: true },
  { name: 'LianLian', slug: 'lianlian', searchQueries: ['LianLian Pay', '连连支付', 'LianLian cross-border'], isActive: true },
  { name: 'WorldFirst', slug: 'worldfirst', searchQueries: ['WorldFirst', 'WorldFirst Alipay', 'Antom'], isActive: true },
];

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
  { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', domain: 'bloomberg.com' },
];

const TAG_DATA = [
  { name: '产品发布', slug: 'product', category: 'product' as const, priority: 2 },
  { name: '公司动态', slug: 'company', category: 'dynamic' as const, priority: 1 },
  { name: '费率变动', slug: 'pricing', category: 'pricing' as const, priority: 0 },
  { name: '高管变动', slug: 'leadership', category: 'leadership' as const, priority: 1 },
  { name: '财报发布', slug: 'financial', category: 'financial' as const, priority: 2 },
  { name: '监管合规', slug: 'regulatory', category: 'regulatory' as const, priority: 2 },
  { name: '市场扩张', slug: 'expansion', category: 'expansion' as const, priority: 0 },
  { name: '其他', slug: 'other', category: 'other' as const, priority: 0 },
];

async function seed() {
  console.log('Seeding database...');

  // Seed companies
  for (const company of COMPANY_DATA) {
    await db.insert(companies).values(company).onConflictDoNothing();
    console.log(`Inserted company: ${company.name}`);
  }

  // Seed tags
  for (const tag of TAG_DATA) {
    await db.insert(tags).values(tag).onConflictDoNothing();
    console.log(`Inserted tag: ${tag.name}`);
  }

  console.log('Seeding complete!');
  console.log('RSS Sources:', RSS_SOURCES.map(s => s.name).join(', '));
}

seed().catch(console.error);
