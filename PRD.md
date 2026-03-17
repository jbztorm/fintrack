# FinTrack - 跨境支付公司情报追踪系统 PRD

---

## 1. 产品背景

| 项目 | 内容 |
|------|------|
| **产品名称** | FinTrack |
| **产品定位** | 高密度、可筛选、可研究、可回看的情报看板 / research terminal |
| **核心价值** | 持续追踪指定公司的新闻动态，自动归类、去重、评分和展示 |
| **目标用户** | 金融科技从业者、投资人研究员、市场分析师 |

---

## 2. 目标用户与场景

### 目标用户
- 金融科技公司从业者（竞品监控）
- VC/PE 投资人（行业追踪）
- 市场分析师（情报收集）
- 跨境电商从业者（支付通道选择）

### 使用场景
1. **每日监控**：查看"今日新增"快速了解行业动态
2. **深度研究**：筛选特定公司+标签+时间范围进行定向分析
3. **回溯查询**：查找历史新闻了解事件完整脉络
4. **横向对比**：同标签下对比不同公司动态

---

## 3. 产品目标

| 目标 | 衡量指标 |
|------|----------|
| 新闻覆盖率 | 目标公司新闻 95%+ 被收录 |
| 更新时效性 | 新闻发现到展示 < 2小时 |
| 筛选效率 | 3步内找到目标信息 |
| 可读性 | 平均停留时间 > 2分钟 |

---

## 4. 非目标

- ❌ 不做资讯门户（不做新闻原创）
- ❌ 不做社交功能
- ❌ 不做用户生成内容
- ❌ MVP 阶段不做登录态
- ❌ 不做全文搜索（仅标题/摘要搜索）

---

## 5. MVP 范围

### 必须做 (MVP)
- [x] 7 家目标公司新闻追踪
- [x] 自动新闻发现与抓取
- [x] 规则 + LLM 双轨标签分类
- [x] 规则 + LLM 双轨影响力评分
- [x] LLM 摘要 + 抽取式 fallback
- [x] 强去重 + 弱聚合两层去重
- [x] 多维筛选（公司/标签/分数/时间）
- [x] 今日新增区域
- [x] 60 天数据保留 + 自动清理
- [x] Dark Mode 终端风格 UI
- [x] RLS 策略配置

### 建议做
- [ ] 来源筛选
- [ ] 关键词搜索
- [ ] 热门标签展示

### 暂不做
- [ ] 登录态 / Admin 后台
- [ ] 邮件 / 订阅 / Digest
- [ ] 全文搜索
- [ ] 用户收藏

---

## 6. 信息架构

```
FinTrack
├── 首页 (/)
│   ├── 今日新增区域 (最近24h)
│   ├── 全部新闻列表
│   │   ├── 筛选器侧边栏
│   │   └── 新闻卡片流
│   └── Footer
└── 关于 (/about)
```

---

## 7. 页面结构

### 首页布局
```
┌─────────────────────────────────────────────────┐
│  HEADER: Logo + 简洁导航                         │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│   筛选器      │      主内容区                     │
│   侧边栏      │      - 今日新增高亮               │
│              │      - 新闻卡片列表                │
│  - 公司      │        (7天展开/7天后折叠)        │
│  - 标签      │                                  │
│  - 分数      │                                  │
│  - 时间      │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

---

## 8. 列表与卡片展示规则

### 新闻卡片
```
┌────────────────────────────────────────────┐
│ 🏷️ 产品发布    ⏰ 3小时前    ⭐ 8.5        │
│────────────────────────────────────────────│
│ Stripe 推出全新税务解决方案                  │
│────────────────────────────────────────────│
│ [摘要折叠区 - 点击展开]                      │
│ Stripe 今日宣布推出全新税务管理解决方案...   │
│────────────────────────────────────────────│
│ 来源: TechCrunch | 原文链接 →               │
└────────────────────────────────────────────┘
```

### 展开规则
| 条件 | 展开状态 |
|------|----------|
| 发布时间 ≤ 7 天 | 默认展开 |
| 发布时间 > 7 天 | 默认折叠 |
| 分数 ≥ 8 | 始终展开 |
| 今日新增 | 高亮标记 |

---

## 9. 数据字段定义

### companies 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 公司名 |
| slug | string | 短标识 |
| logo_url | string | logo 链接 |
| search_queries | jsonb | 搜索关键词数组 |
| is_active | boolean | 是否追踪 |
| created_at | timestamp | 创建时间 |

### news_items 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| company_id | UUID | 外键 → companies |
| source_name | string | 来源名称 |
| source_domain | string | 归一化来源域名 |
| source_type | enum | 来源类型 (news_api, rss, manual) |
| title | string | 原始标题 |
| normalized_title | string | 归一化标题 |
| canonical_url | string | 归一化 URL |
| raw_url | string | 原始 URL |
| published_at | timestamp | 发布时间 |
| published_at_precision | enum | 精度 (hour, day, month, unknown) |
| discovered_at | timestamp | 发现时间 |
| impact_score | float | 影响力评分 1-10 |
| impact_reason | string | 评分理由 |
| summary | text | 摘要 |
| summary_type | enum | 摘要类型 (llm, extractive, none) |
| raw_snippet | text | 原始片段 |
| status | enum | 状态 (pending, ready, error) |
| related_group_id | UUID | 弱聚合组ID |
| fetch_status | enum | 抓取状态 (pending, success, failed) |
| fetch_error | string | 抓取错误信息 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### tags 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 标签名 |
| slug | string | 短标识 |
| category | enum | 分类 (product, dynamic, pricing, leadership, financial, regulatory, expansion, other) |
| priority | integer | 优先级 (高:2, 中:1, 低:0) |

### news_item_tags 表
| 字段 | 类型 | 说明 |
|------|------|------|
| news_item_id | UUID | 外键 → news_items |
| tag_id | UUID | 外键 → tags |
| source | enum | 来源 (rule, llm) |

### ingestion_logs 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| company_id | UUID | 外键 → companies |
| started_at | timestamp | 开始时间 |
| completed_at | timestamp | 结束时间 |
| items_found | integer | 发现数 |
| items_new | integer | 新增数 |
| items_error | integer | 错误数 |
| status | enum | 状态 (running, completed, error) |

---

## 10. 目标公司搜索 Query（核心补充）

### 公司搜索关键词模板

| 公司 | 搜索 Query | 优先级 |
|------|-----------|--------|
| Stripe | ["Stripe payment", "Stripe fintech", "Stripe API", "Stripe Connect"] | 高 |
| Adyen | ["Adyen payment", "Adyen fintech", "Adyen platform"] | 高 |
| Checkout.com | ["Checkout.com payment", "Checkout fintech"] | 高 |
| Payoneer | ["Payoneer payment", "Payoneer freelancer"] | 中 |
| PingPong | ["PingPong payment", "PingPong cross-border"] | 中 |
| LianLian | ["LianLian Pay", "连连支付", "LianLian cross-border"] | 中 |
| WorldFirst | ["WorldFirst", "WorldFirst Alipay", "Antom"] | 中 |

### 搜索策略
- 每轮抓取随机选择 2-3 家公司，避免超出 NewsAPI 免费额度
- 优先搜索高优先级公司
- 配合 RSS 补充（见附录）

---

## 11. 标签体系

### 一级标签
| 标签 | 英文 | 说明 | 优先级 | 触发规则 |
|------|------|------|--------|----------|
| 产品发布 | Product | 新产品/新功能发布 | 高 | /发布\|推出\|上线\|launch\|release\|new feature/i |
| 公司动态 | Company | 融资、收购、合作 | 中 | /融资\|收购\|合作\|acquire\|funding\|partnership/i |
| 费率变动 | Pricing | 费率调整 | 低 | /费率\|价格\|pricing\|fee\|降低\|调整/i |
| 高管变动 | Leadership | 人事任免 | 中 | /CEO\|CTO\|任命\|join\|leave\|离职\|加入/i |
| 财报发布 | Financial | 财报、业绩 | 高 | /财报\|营收\|Q[1-4]\|revenue\|earnings\|财报季/i |
| 监管合规 | Regulatory | 监管、合规、处罚 | 高 | /监管\|合规\|罚\|regulatory\|compliance\|SEC\| FCA/i |
| 市场扩张 | Expansion | 地域/客户扩张 | 低 | /进入\|扩张\|expand\|market\|global\|international/i |
| 其他 | Other | 无法分类 | 低 | 默认 |

### 标签优先级定义
- **高 (2)**：产品发布、财报发布、监管合规 → 前端高亮展示
- **中 (1)**：公司动态、高管变动 → 正常展示
- **低 (0)**：费率变动、市场扩张、其他 → 正常展示

---

## 12. 影响力评分规则

### 评分维度与权重

**基础分**: 所有新闻默认 **5.0 分**，在此基础上加减各项得分。

| 维度 | 权重 | 分数范围 | 规则 |
|------|------|----------|------|
| 事件类型 | 40% | +1~3 | 监管合规 +3, 财报发布 +2, 产品发布 +1, 高管变动 +1 |
| 影响范围 | 30% | +0.5~2 | 全球 +2, 区域 +1, 特定行业 +0.5 |
| 源权威性 | 15% | +0~1.5 | 权威媒体 +1.5 (Reuters, Bloomberg, FT, WSJ), 一般媒体 +0.5, 自媒体 +0 |
| 时效性 | 15% | +0~1 | 24h内 +1, 7天内 +0.5, 更早 +0 |

### 权威媒体白名单
```typescript
const AUTHORITATIVE_SOURCES = [
  'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com',
  'techcrunch.com', 'theverge.com', 'wired.com',
  'mit.edu', 'technologyreview.com',
  '36kr.com', '虎嗅.com', '钛媒体.com'
];
```

### LLM 修正规则
- 规则基础分 6-9 分：LLM 可在 ±1 范围内调整
- 规则基础分 < 6 或 > 9：保持不变
- LLM 调整必须保留理由

### 评分理由模板
```
规则: 基础分 5.0 + [事件类型+影响范围+时效性+权威性] = X 分
调整: [LLM调整理由](如有) → 最终 Y 分
```

---

## 13. 摘要生成策略

### 优先级
1. **LLM 摘要** (推荐)：调用 LLM 生成 50-100 字研究型摘要
2. **抽取式 Fallback 链**：
   - meta og:description
   - meta description
   - 文章首段 (前 200 字)
   - 搜索 API snippet

### Fallback 触发条件
- 页面抓取失败 (fetch_status = 'failed')
- LLM API 错误或超时
- Token 超限
- 页面不可解析

### 摘要格式
```
[一句话概括] | [关键数据/影响] | [背景补充]
```

### 成本控制策略
- 默认只对 impact_score >= 7 的新闻启用 LLM 摘要
- 其他新闻使用抽取式摘要

---

## 14. 去重与聚合策略

### URL 归一化（核心补充）
```typescript
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // 移除尾部斜杠、www、查询参数、hash
    return u.origin + u.pathname.replace(/\/+$/, '').replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '') // 移除特殊字符
    .replace(/\s+/g, '') // 移除空格
    .trim();
}

function normalizeDomain(domain: string): string {
  return domain.replace(/^www\./, '').toLowerCase();
}
```

### 分层去重

#### 强去重（直接丢弃）
| 条件 | 处理 |
|------|------|
| canonical_url 完全相同 | 丢弃 |
| normalized_title + company_id + source_domain + 24h 内相同 | 丢弃 |

#### 弱聚合（标记，不丢弃）

**生成算法**:
- 使用 **Jaccard 相似度** 计算 normalized_title 相似度
- 阈值: > 0.8 则判定为同一事件
- related_group_id: 使用共享 UUID（同组新闻使用相同 ID）

| 条件 | 处理 |
|------|------|
| normalized_title 相似度 > 0.8 | 标记相同 related_group_id |
| 同一公司 + 同一事件关键词 | 标记相同 related_group_id |
| 不同来源报道同一事件 | 标记 related_group_id |

#### 产品策略
- **宁可稍微重复也不漏掉重要新闻**
- 弱聚合的新闻在 UI 显示 "X 条相关内容"

---

## 15. 抓取流水线

### Step 1: 候选发现
```
For each company (random 2-3 per run):
  For each query in company.search_queries:
    results = news_api.search(query, pageSize=20)
    save raw to temp table
```

### Step 2: 抓取与解析
```
For each candidate (max 10 per run):
  try:
    html = fetch(url, timeout=10s)
    parsed = parse(html)
    title = parsed.title
    content = parsed.content
    meta = parsed.meta
    fetch_status = 'success'
  catch (e):
    fetch_status = 'failed'
    fetch_error = e.message
```

### Step 3: 归一化
```
canonical_url = normalizeUrl(raw_url)
normalized_title = normalizeTitle(title)
source_domain = normalizeDomain(extractDomain(url))
```

### Step 4-9: 流水线处理
```
强去重 → 弱聚合 → 标签(规则) → 评分(规则) → 摘要(LLM/抽取) → 入库
```

### 抓取频率
| 环境 | 频率 | 说明 |
|------|------|------|
| 开发 | 手动触发 | 需要时运行 |
| 生产 | 每 4 小时一次 | 避免超出 NewsAPI 免费额度 (100 req/day) |

---

## 16. 错误处理

| 错误类型 | 重试 | 间隔 | 失败处理 |
|----------|------|------|----------|
| 搜索 API | 3 | 5s | 记录日志，跳过该公司 |
| 页面抓取 | 2 | 3s | 标记 fetch_status='failed'，使用 fallback |
| LLM 调用 | 1 | - | fallback 到抽取式摘要 |
| 数据库写入 | 3 | 2s | 标记 status='error'，发送告警 |

---

## 17. 60 天保留策略

### 清理任务
```sql
-- 每天 UTC 02:00 执行
DELETE FROM news_items
WHERE published_at < NOW() - INTERVAL '60 days'
  AND status = 'ready';

-- 保留 ingestion_logs 90 天
DELETE FROM ingestion_logs
WHERE started_at < NOW() - INTERVAL '90 days';
```

### 归档方案（未来）
- 可导出为 CSV/JSON 存档
- 放在 Supabase Storage

---

## 18. RLS 策略（核心补充）

```sql
-- 启用 RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_item_tags ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read news_items" ON news_items FOR SELECT USING (true);
CREATE POLICY "Public read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read news_item_tags" ON news_item_tags FOR SELECT USING (true);

-- 仅服务角色可写入
CREATE POLICY "Service role insert news_items" ON news_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update news_items" ON news_items FOR UPDATE USING (true);
```

---

## 19. 定时任务设计

### vercel.json 配置
```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

| 任务 | 频率 | 说明 |
|------|------|------|
| /api/cron/ingest | 每 4 小时 | 新闻抓取流水线 |
| /api/cron/cleanup | 每天 02:00 | 60 天数据清理 |

---

## 20. 性能要求

| 指标 | 要求 |
|------|------|
| 首页加载 (TTFB) | < 2s |
| 筛选响应 | < 500ms |
| 单次抓取 | < 5 分钟 |
| 并发抓取 | 最多 3 个 |
| 每日 API 消耗 | < 80 req (留 buffer) |

---

## 21. 安全与合规

- 仅展示公开新闻，不抓取付费内容
- 遵守 robots.txt
- 控制请求频率（每目标站 > 2s 间隔）
- 不存储用户数据（MVP 阶段）
- 无敏感信息

---

## 22. 扩展性设计

### 预留扩展口
| 扩展方向 | 当前实现 | 预留方式 |
|----------|----------|----------|
| 新增公司 | 手动添加 | companies 表 + search_queries JSON |
| 新增标签 | 手动添加 | tags 表可无限扩展 |
| 评分维度 | 规则+LLM | 可在 scorer.ts 添加新维度 |
| Digest/周报 | 未实现 | 预留 cron 扩展点 |
| Admin 后台 | 未实现 | 预留 auth + RBAC 扩展 |

---

## 23. 成功指标

| 指标 | 目标 |
|------|------|
| 新闻覆盖率 | > 90% |
| 平均更新延迟 | < 2h |
| 系统可用性 | > 99% |
| 首页加载 | < 2s |
| 免费额度消耗 | < 80%/天 |

---

## 附录 A：tags 表初始化数据

种子数据（Seed Script 预置）:

```sql
INSERT INTO tags (name, slug, category, priority) VALUES
('产品发布', 'product', 'product', 2),
('公司动态', 'company', 'dynamic', 1),
('费率变动', 'pricing', 'pricing', 0),
('高管变动', 'leadership', 'leadership', 1),
('财报发布', 'financial', 'financial', 2),
('监管合规', 'regulatory', 'regulatory', 2),
('市场扩张', 'expansion', 'expansion', 0),
('其他', 'other', 'other', 0);
```

---

## 附录 B：RSS 补充源

作为 NewsAPI 的补充，可选添加 RSS 源：

| 公司 | RSS 源 |
|------|--------|
| Stripe | https://stripe.com/blog/feed |
| Adyen | https://www.adyen.com/en_IN/press-room/rss |
| 36氪 | https://www.36kr.com/feed |

---

## 附录 B：环境变量清单

| 变量 | 必填 | 说明 |
|------|------|------|
| DATABASE_URL | ✅ | Supabase 连接字符串 |
| SUPABASE_ANON_KEY | ✅ | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | Supabase service role key |
| NEWS_API_KEY | ✅ | NewsAPI.org API Key |
| OPENAI_API_KEY | ⚠️ | OpenAI API Key (可选，不填则只用抽取式摘要) |
| CRON_SECRET | ✅ | Cron 访问密钥 |

---

## 附录 C：数据模型 ER 图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  companies  │────<│  news_items │────<│news_item_tags│
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │                   │
                    ┌──────┴──────┐      ┌─────┴─────┐
                    │ingestion_   │      │   tags    │
                    │   logs      │
                    └─────────────┘
```

---

*版本: 1.1*
*更新日期: 2026-03-17*
*状态: 已审核*
