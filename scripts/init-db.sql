-- FinTrack Database Schema
-- 运行此 SQL 创建所有表

-- Companies 表
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  search_queries JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags 表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  priority INTEGER DEFAULT 0
);

-- News Items 表
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  source_name TEXT,
  source_domain TEXT,
  source_type TEXT DEFAULT 'news_api',
  title TEXT NOT NULL,
  normalized_title TEXT,
  canonical_url TEXT,
  raw_url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  published_at_precision TEXT DEFAULT 'unknown',
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  impact_score DECIMAL(3,1) DEFAULT '5.0',
  impact_reason TEXT,
  summary TEXT,
  summary_type TEXT DEFAULT 'none',
  raw_snippet TEXT,
  status TEXT DEFAULT 'pending',
  related_group_id UUID,
  fetch_status TEXT DEFAULT 'pending',
  fetch_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News Item Tags 关联表
CREATE TABLE IF NOT EXISTS news_item_tags (
  news_item_id UUID REFERENCES news_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'rule',
  PRIMARY KEY (news_item_id, tag_id)
);

-- Ingestion Logs 表
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  items_found INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  items_error INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running'
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_news_company ON news_items(company_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_status ON news_items(status);
CREATE INDEX IF NOT EXISTS idx_news_impact ON news_items(impact_score);

-- 种子数据 - 公司
INSERT INTO companies (name, slug, search_queries, is_active) VALUES
('Stripe', 'stripe', '["Stripe payment", "Stripe fintech", "Stripe API", "Stripe Connect"]', true),
('Adyen', 'adyen', '["Adyen payment", "Adyen fintech", "Adyen platform"]', true),
('Checkout.com', 'checkout-com', '["Checkout.com payment", "Checkout fintech"]', true),
('Payoneer', 'payoneer', '["Payoneer payment", "Payoneer freelancer"]', true),
('PingPong', 'pingpong', '["PingPong payment", "PingPong cross-border"]', true),
('LianLian', 'lianlian', '["LianLian Pay", "连连支付", "LianLian cross-border"]', true),
('WorldFirst', 'worldfirst', '["WorldFirst", "WorldFirst Alipay", "Antom"]', true)
ON CONFLICT (name) DO NOTHING;

-- 种子数据 - 标签
INSERT INTO tags (name, slug, category, priority) VALUES
('产品发布', 'product', 'product', 2),
('公司动态', 'company', 'dynamic', 1),
('费率变动', 'pricing', 'pricing', 0),
('高管变动', 'leadership', 'leadership', 1),
('财报发布', 'financial', 'financial', 2),
('监管合规', 'regulatory', 'regulatory', 2),
('市场扩张', 'expansion', 'expansion', 0),
('其他', 'other', 'other', 0)
ON CONFLICT (name) DO NOTHING;

-- RLS 策略（可选）
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read news_items" ON news_items FOR SELECT USING (true);
CREATE POLICY "Public read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read news_item_tags" ON news_item_tags FOR SELECT USING (true);
