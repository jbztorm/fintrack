# FinTrack - 跨境支付公司情报追踪系统

高密度、可筛选、可研究的情报看板。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **搜索**: NewsAPI.org
- **部署**: Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-name/fintrack.git
cd fintrack
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下配置：

```env
# Supabase (必填)
DATABASE_URL=postgres://[user]:[password]@[host]:5432/postgres
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# News API (必填) - https://newsapi.org/
NEWS_API_KEY=your-newsapi-key

# OpenAI (可选)
OPENAI_API_KEY=sk-...

# Cron 密钥
CRON_SECRET=your-secret
```

### 4. 初始化数据库

```bash
npm run db:push
npm run db:seed
```

### 5. 启动开发

```bash
npm run dev
```

访问 http://localhost:3000

## 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. Deploy

### 配置 Cron

在 Vercel Dashboard → Settings → Cron Jobs:

```
Path: /api/cron/ingest
Schedule: 0 */4 * * *

Path: /api/cron/cleanup
Schedule: 0 2 * * *
```

## 项目结构

```
fintrack/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/ingest/    # 新闻抓取
│   │   │   ├── cron/cleanup/   # 数据清理
│   │   │   └── news/           # 新闻列表 API
│   │   ├── page.tsx           # 首页
│   │   └── layout.tsx         # 布局
│   ├── lib/
│   │   ├── db/                # 数据库
│   │   ├── api/               # 外部 API
│   │   ├── pipeline/          # 处理流水线
│   │   └── utils/             # 工具函数
├── drizzle.config.ts
├── vercel.json
└── package.json
```

## 功能

- [x] 7 家目标公司新闻追踪
- [x] 自动新闻发现与抓取
- [x] 规则 + LLM 双轨标签分类
- [x] 规则 + LLM 双轨影响力评分
- [x] LLM 摘要 + 抽取式 fallback
- [x] 强去重 + 弱聚合两层去重
- [x] 多维筛选（公司/标签/分数）
- [x] 今日新增区域
- [x] 60 天数据保留
- [x] Dark Mode 终端风格 UI

## 许可证

MIT
