import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { fetchHackerNews } from './adapters/hackernews.js';
import { fetchRedditHot, toTrendItems } from './adapters/reddit.js';
import { fetchGoogleNews } from './adapters/googlenews.js';
import { fetchGoogleTrends } from './adapters/googletrends.js';
import { fetchAppStoreReviews } from './adapters/appstore.js';
import { fetchGooglePlayReviews } from './adapters/googleplay.js';
import { fetchXTrends } from './adapters/x.js';
import { fetchTikTokTrendsHeadless, fetchPinterestTodayHeadless } from './adapters/headless.js';
import { COMPETITOR_APPS } from './competitors.js';
import { aggregateComplaints, aggregateDemands, aggregatePraises, sentiment } from './reviewInsights.js';
import { deepseekChat } from './adapters/deepseek.js';
import { buildMessages } from './analyze.js';
import { classify } from './classify.js';
import { clamp01 } from './scoring.js';
import { CLASSIFY_RULES, REDDIT_CONTENT_SUBS, REDDIT_MIN_UPVOTES } from './rules.js';
import { deriveChange, getMonthly, recordObservations, rollupToday } from './db.js';

const app = express();
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
app.use(express.json());

const now = () => new Date().toISOString();
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);

app.get('/health', (_req, res) => {
  res.json({ ok: true, reddit: config.reddit.hasCreds ? 'oauth' : 'public-json', time: now() });
});

// 采集 trends(HN + Google News + Reddit)+ 历史对比 + 入库。供路由与定时器复用。
async function collectTrends() {
  const fetched_at = now();
  const raw = [];
  const statuses = [];

  try {
    const hn = await fetchHackerNews(20);
    raw.push(...hn);
    statuses.push({ source: 'hackernews', ok: true, count: hn.length });
  } catch (e) {
    statuses.push({ source: 'hackernews', ok: false, count: 0, error: String(e.message || e) });
    log('HN failed:', e.message);
  }
  try {
    const news = await fetchGoogleNews(20);
    raw.push(...news);
    statuses.push({ source: 'google_news', ok: true, count: news.length });
  } catch (e) {
    statuses.push({ source: 'google_news', ok: false, count: 0, error: String(e.message || e) });
    log('GoogleNews failed:', e.message);
  }
  try {
    const posts = await fetchRedditHot(['technology', 'todayilearned'], 15);
    const items = toTrendItems(posts, fetched_at);
    raw.push(...items);
    statuses.push({ source: 'reddit', ok: true, count: items.length });
  } catch (e) {
    statuses.push({ source: 'reddit', ok: false, count: 0, error: String(e.message || e) });
    log('Reddit failed:', e.message);
  }

  // 历史快照对比 → 真实 velocity 与 新/升/稳/降 状态
  const ts = Date.parse(fetched_at) || Date.now();
  const keyed = raw.map((r) => ({
    key: r.url || r.title, heat: r.popularity,
    source: r.source, title: r.title, platform: r.source, category: r.category,
  }));
  const change = deriveChange('trend', keyed, ts);
  for (const r of raw) {
    const ch = change.get(r.url || r.title);
    if (ch?.hasHistory) { r.velocity = ch.velocity; r.status = ch.status; }
    else { r.status = 'new'; }
  }
  recordObservations('trend', keyed, ts);
  rollupToday(raw, ts);

  return { raw, statuses, fetched_at, source: 'live' };
}

// ===== /trends:HN + Google News + Reddit,单源故障隔离,历史驱动 velocity/状态 =====
app.get('/trends', async (_req, res) => {
  try {
    res.json(await collectTrends());
  } catch (e) {
    res.status(500).json({ raw: [], statuses: [], fetched_at: now(), error: String(e.message || e) });
  }
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

  // X (Twitter) 美区热搜(免 Key,trends24)
  try {
    const xs = await fetchXTrends('united-states', 25);
    xs.forEach((t, i) => candidates.push({
      id: `x_${i}`, name: t.term, platform: 'x', country: 'US',
      heat_signal: '美区热搜', heat_score: clamp01((25 - i) / 25), url: t.url, keywords: words(t.term),
    }));
    statuses.push({ source: 'x', ok: true, count: xs.length });
  } catch (e) { statuses.push({ source: 'x', ok: false, count: 0, error: String(e.message || e) }); log('X failed:', e.message); }

  // TikTok / Pinterest(需 Playwright,未安装则优雅跳过)
  for (const [src, fn, plat] of [
    ['tiktok', fetchTikTokTrendsHeadless, 'tiktok'],
    ['pinterest', fetchPinterestTodayHeadless, 'pinterest'],
  ]) {
    try {
      const list = await fn(20);
      list.forEach((t, i) => candidates.push({
        id: `${src}_${i}`, name: t.term, platform: plat, country: 'US',
        heat_signal: src === 'tiktok' ? '热门标签' : 'Today 飙升', heat_score: clamp01((20 - i) / 20), url: t.url, keywords: words(t.term),
      }));
      statuses.push({ source: src, ok: true, count: list.length });
    } catch (e) { statuses.push({ source: src, ok: false, count: 0, error: String(e.message || e) }); log(`${src} skipped:`, e.message); }
  }

  // 注:竞品评论已独立到 /review-insights(区分 iOS/Android),不再混入趋势机会。

  // 统一分类 + 排除
  const items = [];
  let excludedCount = 0;
  let irrelevantCount = 0;
  for (const cand of candidates) {
    const c = classify(cand.name, cand.keywords, CLASSIFY_RULES);
    if (c.excluded) { excludedCount++; continue; }
    // 宽口径趋势源(Google Trends / X / TikTok / Pinterest 偏泛):只保留命中内容方向的,丢弃无关泛趋势。
    // App Store 已过滤为"需求型"评论,即使未归类也作为待确认需求信号保留。
    if (['google_trends', 'x', 'tiktok', 'pinterest'].includes(cand.platform) && c.category === 'pending') { irrelevantCount++; continue; }
    const { _demand, ...rest } = cand;
    items.push({
      ...rest, fetched_at,
      category: c.category, tags: c.tags,
      // 聚合需求的产品映射来自主题词库(比关键词分类更准)
      recommended_products: _demand?.products ?? c.recommended_products,
      status: c.category === 'pending' ? 'pending' : 'new', score: null, grade: null,
      ...(_demand ? { extra: { mentions: _demand.count, apps: _demand.apps, avgRating: _demand.avgRating, examples: _demand.examples } } : {}),
    });
  }
  items.sort((a, b) => b.heat_score - a.heat_score);
  res.json({ items, excludedCount, irrelevantCount, statuses, fetched_at, source: 'live' });
});

// ===== /review-insights:竞品评论洞察(区分 iOS / Android)=====
app.get('/review-insights', async (req, res) => {
  const fetched_at = now();
  const osFilter = req.query.os; // 'iOS' | 'Android' | undefined
  const targets = COMPETITOR_APPS.filter((a) => !osFilter || a.os === osFilter);

  const apps = await Promise.all(targets.map(async (app) => {
    try {
      const reviews = app.platform === 'app_store'
        ? await fetchAppStoreReviews(app.id, 'us', 3)
        : await fetchGooglePlayReviews(app.id, 80);
      return {
        ...app,
        ok: true,
        reviewCount: reviews.length,
        ...sentiment(reviews),
        demands: aggregateDemands(reviews),
        praises: aggregatePraises(reviews),
        complaints: aggregateComplaints(reviews),
      };
    } catch (e) {
      return { ...app, ok: false, error: String(e.message || e), reviewCount: 0, demands: [], praises: [], complaints: [] };
    }
  }));

  // 跨 App 聚合某维度(按平台拆分)
  const merge = (list, dim) => {
    const m = new Map();
    for (const app of list) {
      for (const d of app[dim] ?? []) {
        if (!m.has(d.label)) m.set(d.label, { label: d.label, products: d.products ?? [], count: 0, apps: new Set(), examples: [] });
        const a = m.get(d.label);
        a.count += d.count; a.apps.add(app.name);
        for (const ex of d.examples) if (a.examples.length < 3) a.examples.push(ex);
      }
    }
    return [...m.values()].map((a) => ({ ...a, apps: [...a.apps] })).sort((a, b) => b.count - a.count);
  };
  const byOS = (os) => apps.filter((a) => a.os === os);

  res.json({
    fetched_at,
    apps,
    aggregated: {
      iOS: { demands: merge(byOS('iOS'), 'demands'), praises: merge(byOS('iOS'), 'praises'), complaints: merge(byOS('iOS'), 'complaints') },
      Android: { demands: merge(byOS('Android'), 'demands'), praises: merge(byOS('Android'), 'praises'), complaints: merge(byOS('Android'), 'complaints') },
    },
  });
});

// ===== /analyze:DeepSeek AI 分析(热点 / 内容机会 / 竞品评论)=====
app.get('/analyze/status', (_req, res) => {
  res.json({ enabled: config.deepseek.enabled, model: config.deepseek.model });
});

app.post('/analyze', async (req, res) => {
  const { kind = 'trends', payload = {}, question = '' } = req.body || {};
  if (!config.deepseek.enabled) {
    return res.status(503).json({ error: '后端未配置 DeepSeek Key(在 server/.env 设置 DEEPSEEK_API_KEY)' });
  }
  try {
    const messages = buildMessages(kind, payload, question);
    const out = await deepseekChat(messages);
    res.json({ analysis: out.content, model: out.model, usage: out.usage, kind });
  } catch (e) {
    log('analyze failed:', e.message);
    res.status(502).json({ error: String(e.message || e) });
  }
});

// ===== /monthly:基于历史快照真实聚合(无数据时给出引导) =====
app.get('/monthly', (req, res) => {
  const month = String(req.query.month ?? new Date().toISOString().slice(0, 7));
  const data = getMonthly(month);
  if (data) return res.json(data);
  res.json({
    month,
    note: '暂无该月历史快照。多次访问 /trends(或开启定时采集)以积累每日数据后,此处将显示真实聚合。',
    dailyTrends: [], platformDistribution: [], categoryPerformance: [], topTopics: [],
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

// 可选定时采集:设 COLLECT_INTERVAL_MIN 后周期性采集并入库,自动积累历史(velocity/月度变真实)。
const collectMin = Number(process.env.COLLECT_INTERVAL_MIN ?? 0);
if (collectMin > 0) {
  log(`定时采集已开启:每 ${collectMin} 分钟`);
  setInterval(() => {
    collectTrends()
      .then((r) => log(`定时采集完成:${r.raw.length} 条`))
      .catch((e) => log('定时采集失败:', e.message));
  }, collectMin * 60000);
}

app.listen(config.port, () => {
  log(`后端已启动 → http://localhost:${config.port}`);
  log(`Reddit 模式:${config.reddit.hasCreds ? 'OAuth(已配置)' : '公开 .json 兜底(未配置 client_id/secret)'}`);
  log(`前端接入:在前端项目设 VITE_API_BASE_URL=http://localhost:${config.port}`);
});
