import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { fetchHackerNews } from './adapters/hackernews.js';
import { fetchRedditHot, toTrendItems } from './adapters/reddit.js';
import { fetchGoogleNews } from './adapters/googlenews.js';
import { fetchGoogleTrends } from './adapters/googletrends.js';
import { fetchAppStoreReviewSignals } from './adapters/appstore.js';
import { classify } from './classify.js';
import { clamp01 } from './scoring.js';
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

  // Google News(免 Key)
  try {
    const news = await fetchGoogleNews(20);
    raw.push(...news);
    statuses.push({ source: 'google_news', ok: true, count: news.length });
  } catch (e) {
    statuses.push({ source: 'google_news', ok: false, count: 0, error: String(e.message || e) });
    log('GoogleNews failed:', e.message);
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

// ===== /opportunities:多源(Reddit + Google Trends + App Store)→ 自动分类 =====
app.get('/opportunities', async (_req, res) => {
  const fetched_at = now();
  const candidates = []; // { id,name,platform,country,heat_signal,heat_score,url,keywords }
  const statuses = [];
  const words = (s) => String(s).toLowerCase().split(/\W+/).filter((w) => w.length > 2);

  // Reddit 内容版块
  try {
    const posts = await fetchRedditHot(REDDIT_CONTENT_SUBS, 25);
    let n = 0;
    for (const p of posts) {
      if ((p.ups ?? 0) < REDDIT_MIN_UPVOTES) continue; // Upvote>200
      candidates.push({
        id: `reddit_${p.id}`, name: p.title, platform: 'reddit', country: 'US',
        heat_signal: `Upvotes ${p.ups} · ${p.num_comments} 评论 · r/${p.subreddit}`,
        heat_score: clamp01((p.ups ?? 0) / 50000),
        url: `https://www.reddit.com${p.permalink}`,
        keywords: [...words(p.title), p.subreddit, p.link_flair_text].filter(Boolean),
      });
      n++;
    }
    statuses.push({ source: 'reddit', ok: true, count: n });
  } catch (e) { statuses.push({ source: 'reddit', ok: false, count: 0, error: String(e.message || e) }); log('Reddit opp failed:', e.message); }

  // Google Trends 每日热搜(免 Key)
  try {
    const trends = await fetchGoogleTrends('US', 20);
    trends.forEach((t, i) => candidates.push({
      id: `gt_${i}`, name: t.term, platform: 'google_trends', country: 'US',
      heat_signal: t.traffic ? `搜索 ${t.traffic.toLocaleString()}+` : '搜索上升',
      heat_score: clamp01(t.traffic / 200000), url: t.url, keywords: words(t.term),
    }));
    statuses.push({ source: 'google_trends', ok: true, count: trends.length });
  } catch (e) { statuses.push({ source: 'google_trends', ok: false, count: 0, error: String(e.message || e) }); log('GTrends failed:', e.message); }

  // App Store 竞品评论(免 Key,挖需求)
  try {
    const reviews = await fetchAppStoreReviewSignals({ perApp: 8 });
    reviews.forEach((r, i) => {
      const phrase = (r.name && r.name.trim().length > 8) ? r.name.trim() : String(r.content).slice(0, 60);
      candidates.push({
        id: `as_${i}`, name: `需求: ${phrase}`, platform: 'app_store', country: 'US',
        heat_signal: `评分 ${r.rating}★ · ${r.app}`, heat_score: 0.4,
        url: `https://apps.apple.com/us/app/id${r.appId}`,
        keywords: [...words(r.name), ...words(r.content)].slice(0, 12),
      });
    });
    statuses.push({ source: 'app_store', ok: true, count: reviews.length });
  } catch (e) { statuses.push({ source: 'app_store', ok: false, count: 0, error: String(e.message || e) }); log('AppStore failed:', e.message); }

  // 统一分类 + 排除
  const items = [];
  let excludedCount = 0;
  let irrelevantCount = 0;
  for (const cand of candidates) {
    const c = classify(cand.name, cand.keywords, CLASSIFY_RULES);
    if (c.excluded) { excludedCount++; continue; }
    // Google Trends 每日热搜偏泛:只保留命中内容方向的,丢弃无关泛趋势。
    // App Store 已过滤为"需求型"评论,即使未归类也作为待确认需求信号保留。
    if (cand.platform === 'google_trends' && c.category === 'pending') { irrelevantCount++; continue; }
    items.push({
      ...cand, fetched_at,
      category: c.category, tags: c.tags, recommended_products: c.recommended_products,
      status: c.category === 'pending' ? 'pending' : 'new', score: null, grade: null,
    });
  }
  items.sort((a, b) => b.heat_score - a.heat_score);
  res.json({ items, excludedCount, irrelevantCount, statuses, fetched_at, source: 'live' });
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
