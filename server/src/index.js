import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { fetchHackerNews } from './adapters/hackernews.js';
import { fetchRedditHot, toTrendItems } from './adapters/reddit.js';
import { classify } from './classify.js';
import { CLASSIFY_RULES, REDDIT_CONTENT_SUBS, REDDIT_MIN_UPVOTES } from './rules.js';

const app = express();
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
app.use(express.json());

const now = () => new Date().toISOString();
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);

app.get('/health', (_req, res) => {
  res.json({ ok: true, reddit: config.reddit.hasCreds ? 'oauth' : 'public-json', time: now() });
});

// ===== /trends:Hacker News(tech) + Reddit(social),单源故障隔离 =====
app.get('/trends', async (_req, res) => {
  const fetched_at = now();
  const raw = [];
  const statuses = [];

  // Hacker News
  try {
    const hn = await fetchHackerNews(20);
    raw.push(...hn);
    statuses.push({ source: 'hackernews', ok: true, count: hn.length });
  } catch (e) {
    statuses.push({ source: 'hackernews', ok: false, count: 0, error: String(e.message || e) });
    log('HN failed:', e.message);
  }

  // Reddit
  try {
    const posts = await fetchRedditHot(['technology', 'todayilearned'], 15);
    const items = toTrendItems(posts, fetched_at);
    raw.push(...items);
    statuses.push({ source: 'reddit', ok: true, count: items.length });
  } catch (e) {
    statuses.push({ source: 'reddit', ok: false, count: 0, error: String(e.message || e) });
    log('Reddit failed:', e.message);
  }

  res.json({ raw, statuses, fetched_at, source: 'live' });
});

// ===== /opportunities:Reddit 内容版块 → 自动分类成内容机会 =====
app.get('/opportunities', async (_req, res) => {
  const fetched_at = now();
  try {
    const posts = await fetchRedditHot(REDDIT_CONTENT_SUBS, 25);
    const items = [];
    let excludedCount = 0;

    for (const p of posts) {
      if ((p.ups ?? 0) < REDDIT_MIN_UPVOTES) continue; // 热度门槛(Upvote>200)
      const keywords = [
        ...String(p.title).toLowerCase().split(/\W+/).filter((w) => w.length > 2),
        p.subreddit, p.link_flair_text,
      ].filter(Boolean);
      const c = classify(p.title, keywords, CLASSIFY_RULES);
      if (c.excluded) { excludedCount++; continue; }

      items.push({
        id: `reddit_${p.id}`,
        name: p.title,
        platform: 'reddit',
        country: 'US',
        heat_signal: `Upvotes ${p.ups} · ${p.num_comments} 评论 · r/${p.subreddit}`,
        heat_score: Math.min((p.ups ?? 0) / 50000, 1),
        url: `https://www.reddit.com${p.permalink}`,
        keywords,
        fetched_at,
        category: c.category,
        tags: c.tags,
        recommended_products: c.recommended_products,
        status: c.category === 'pending' ? 'pending' : 'new',
        score: null,
        grade: null,
      });
    }
    items.sort((a, b) => b.heat_score - a.heat_score);
    res.json({ items, excludedCount, fetched_at, source: 'live' });
  } catch (e) {
    log('opportunities failed:', e.message);
    res.status(502).json({ items: [], excludedCount: 0, fetched_at, error: String(e.message || e) });
  }
});

// ===== /monthly:占位(真实月度需历史快照存储) =====
app.get('/monthly', (req, res) => {
  const month = String(req.query.month ?? '2026-06');
  res.json({
    month,
    note: '占位数据。真实月度汇总需后端持久化每日采集快照后聚合。',
    dailyTrends: Array.from({ length: 30 }, (_, i) => ({ date: `${month.split('-')[1]}/${i + 1}`, total: 90, rising: 32, new: 18 })),
    platformDistribution: [
      { name: 'Reddit', value: 45, color: '#f97316' },
      { name: 'Hacker News', value: 30, color: '#f59e0b' },
      { name: 'Google Trends', value: 15, color: '#3b82f6' },
      { name: 'Pinterest', value: 10, color: '#ef4444' },
    ],
    categoryPerformance: [
      { category: '审美', count: 0, avgScore: 0 },
    ],
    topTopics: [],
    summary: {
      totalTrends: 0, avgDailyActive: 0, topTopic: '-', topTopicScore: '-',
      newMemes: 0, totalTrendsChange: '+0%', avgDailyActiveChange: '+0%', newMemesChange: '+0%',
    },
  });
});

// ===== /ads:Meta 广告资料库(需 token);未配置则返回空 =====
app.get('/ads', async (_req, res) => {
  const fetched_at = now();
  if (!config.metaAdLibToken) {
    return res.json({ ads: [], fetched_at, note: '未配置 META_ADLIB_TOKEN,广告情报为空。' });
  }
  // TODO: 调 https://graph.facebook.com/.../ads_archive
  res.json({ ads: [], fetched_at, note: '已配置 token,Ad Library 调用待实现。' });
});

app.listen(config.port, () => {
  log(`后端已启动 → http://localhost:${config.port}`);
  log(`Reddit 模式:${config.reddit.hasCreds ? 'OAuth(已配置)' : '公开 .json 兜底(未配置 client_id/secret)'}`);
  log(`前端接入:在前端项目设 VITE_API_BASE_URL=http://localhost:${config.port}`);
});
