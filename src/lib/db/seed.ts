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
}

seed().catch(console.error);
