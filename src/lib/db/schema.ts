import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const sourceTypeEnum = pgEnum('source_type', ['news_api', 'rss', 'manual']);
export const precisionEnum = pgEnum('published_at_precision', ['hour', 'day', 'month', 'unknown']);
export const statusEnum = pgEnum('status', ['pending', 'ready', 'error', 'running', 'completed']);
export const fetchStatusEnum = pgEnum('fetch_status', ['pending', 'success', 'failed']);
export const summaryTypeEnum = pgEnum('summary_type', ['llm', 'extractive', 'none']);
export const tagSourceEnum = pgEnum('tag_source', ['rule', 'llm']);
export const tagCategoryEnum = pgEnum('tag_category', [
  'product', 'dynamic', 'pricing', 'leadership', 
  'financial', 'regulatory', 'expansion', 'other'
]);

// Companies Table
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  searchQueries: jsonb('search_queries').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tags Table
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  category: tagCategoryEnum('category').notNull(),
  priority: integer('priority').default(0),
});

// News Items Table
export const newsItems = pgTable('news_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  sourceName: text('source_name'),
  sourceDomain: text('source_domain'),
  sourceType: sourceTypeEnum('source_type').default('news_api'),
  title: text('title').notNull(),
  normalizedTitle: text('normalized_title'),
  canonicalUrl: text('canonical_url'),
  rawUrl: text('raw_url').notNull(),
  publishedAt: timestamp('published_at'),
  publishedAtPrecision: precisionEnum('published_at_precision').default('unknown'),
  discoveredAt: timestamp('discovered_at').defaultNow(),
  impactScore: decimal('impact_score', { precision: 3, scale: 1 }).default('5.0'),
  impactReason: text('impact_reason'),
  summary: text('summary'),
  summaryType: summaryTypeEnum('summary_type').default('none'),
  rawSnippet: text('raw_snippet'),
  status: statusEnum('status').default('pending'),
  relatedGroupId: uuid('related_group_id'),
  fetchStatus: fetchStatusEnum('fetch_status').default('pending'),
  fetchError: text('fetch_error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// News Item Tags Junction Table
export const newsItemTags = pgTable('news_item_tags', {
  newsItemId: uuid('news_item_id').references(() => newsItems.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
  source: tagSourceEnum('source').default('rule'),
});

// Ingestion Logs Table
export const ingestionLogs = pgTable('ingestion_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  itemsFound: integer('items_found').default(0),
  itemsNew: integer('items_new').default(0),
  itemsError: integer('items_error').default(0),
  status: statusEnum('status').default('running'),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  newsItems: many(newsItems),
  ingestionLogs: many(ingestionLogs),
}));

export const newsItemsRelations = relations(newsItems, ({ one, many }) => ({
  company: one(companies, { fields: [newsItems.companyId], references: [companies.id] }),
  tags: many(newsItemTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  newsItems: many(newsItemTags),
}));

export const newsItemTagsRelations = relations(newsItemTags, ({ one }) => ({
  newsItem: one(newsItems, { fields: [newsItemTags.newsItemId], references: [newsItems.id] }),
  tag: one(tags, { fields: [newsItemTags.tagId], references: [tags.id] }),
}));

export const ingestionLogsRelations = relations(ingestionLogs, ({ one }) => ({
  company: one(companies, { fields: [ingestionLogs.companyId], references: [companies.id] }),
}));

// Type Exports
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type NewsItem = typeof newsItems.$inferSelect;
export type NewNewsItem = typeof newsItems.$inferInsert;
export type NewsItemTag = typeof newsItemTags.$inferSelect;
export type IngestionLog = typeof ingestionLogs.$inferSelect;
