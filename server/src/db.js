// 历史快照存储(SQLite,内置 node:sqlite)。
// 用途:跨次采集对比 → 真实 velocity(上升速度)与"新/升/稳/降"状态追踪 + 月度聚合。
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, 'snapshots.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,          -- 'trend' | 'opportunity'
    key  TEXT NOT NULL,          -- 稳定标识(url 优先)
    source TEXT, title TEXT, platform TEXT, category TEXT,
    heat REAL NOT NULL,          -- 归一化热度 0–1
    ts INTEGER NOT NULL          -- epoch ms
  );
  CREATE INDEX IF NOT EXISTS idx_obs_key ON observations(kind, key, ts);
  CREATE TABLE IF NOT EXISTS daily_rollup (
    date TEXT PRIMARY KEY,       -- YYYY-MM-DD
    total INTEGER, rising INTEGER, fresh INTEGER,
    platforms TEXT, categories TEXT, top TEXT,
    updated_ts INTEGER
  );
`);

const lastObsStmt = db.prepare(
  'SELECT heat, ts FROM observations WHERE kind=? AND key=? ORDER BY ts DESC LIMIT 1',
);
const insertObsStmt = db.prepare(
  'INSERT INTO observations (kind,key,source,title,platform,category,heat,ts) VALUES (?,?,?,?,?,?,?,?)',
);

export function lastObservation(kind, key) {
  return lastObsStmt.get(kind, key) ?? null;
}

export function recordObservations(kind, rows, ts) {
  db.exec('BEGIN');
  try {
    for (const it of rows) {
      insertObsStmt.run(kind, it.key, it.source ?? null, it.title ?? null,
        it.platform ?? null, it.category ?? null, it.heat, ts);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

const clamp01 = (n) => Math.max(0, Math.min(1, n));

/**
 * 用历史对比为 trend 计算真实 velocity 与状态。
 * @param items 含 {key, heat(=popularity)} 的数组
 * @param ts 本次采集时间(ms)
 * @returns Map<key, { velocity, status, hasHistory }>
 */
export function deriveChange(kind, items, ts) {
  const result = new Map();
  for (const it of items) {
    const prev = lastObservation(kind, it.key);
    if (!prev) {
      result.set(it.key, { velocity: null, status: 'new', hasHistory: false });
      continue;
    }
    const dtH = Math.max(0.05, (ts - prev.ts) / 3600000);
    const growth = it.heat - prev.heat;                // 热度增量(0–1 尺度)
    const rate = growth / dtH;                         // 每小时增速
    const velocity = clamp01(rate > 0 ? rate * 6 : 0); // 仅上升计入速度
    let status;
    if (growth > 0.01) status = 'rising';
    else if (growth < -0.01) status = 'declining';
    else status = 'stable';
    result.set(it.key, { velocity, status, hasHistory: true });
  }
  return result;
}

// ===== 每日汇总 =====
const upsertRollup = db.prepare(`
  INSERT INTO daily_rollup (date,total,rising,fresh,platforms,categories,top,updated_ts)
  VALUES (@date,@total,@rising,@fresh,@platforms,@categories,@top,@ts)
  ON CONFLICT(date) DO UPDATE SET
    total=@total, rising=@rising, fresh=@fresh,
    platforms=@platforms, categories=@categories, top=@top, updated_ts=@ts
`);

function countBy(items, field) {
  const m = {};
  for (const it of items) { const k = it[field] ?? 'unknown'; m[k] = (m[k] ?? 0) + 1; }
  return m;
}

/** 用本次 trend 快照刷新"今天"的汇总行。 */
export function rollupToday(items, ts) {
  const date = new Date(ts).toISOString().slice(0, 10);
  const top = [...items]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 10)
    .map((t) => ({ title: t.title, platform: t.source, score: ((t.popularity ?? 0) * 100).toFixed(1) }));
  upsertRollup.run({
    date,
    total: items.length,
    rising: items.filter((t) => t.status === 'rising').length,
    fresh: items.filter((t) => t.status === 'new').length,
    platforms: JSON.stringify(countBy(items, 'source')),
    categories: JSON.stringify(countBy(items, 'category')),
    top: JSON.stringify(top),
    ts,
  });
}

const PLATFORM_COLOR = {
  hackernews: '#f59e0b', google_news: '#3b82f6', reddit: '#f97316',
  youtube: '#ef4444', tmdb: '#eab308', giphy: '#10b981', tiktok: '#f43f5e', facebook: '#0ea5e9',
};
const CAT_LABEL = { tech: '科技', news: '新闻', social: '社交', entertainment: '娱乐', meme: '梗图' };

/** 聚合某月的 daily_rollup → 前端 MonthlyStats 结构。无数据返回 null。 */
export function getMonthly(month) {
  const rows = db.prepare('SELECT * FROM daily_rollup WHERE date LIKE ? ORDER BY date').all(`${month}-%`);
  if (!rows.length) return null;

  const dailyTrends = rows.map((r) => {
    const [, m, d] = r.date.split('-');
    return { date: `${Number(m)}/${Number(d)}`, total: r.total, rising: r.rising, new: r.fresh };
  });

  // 平台分布 / 分类表现:用全月累加
  const platAgg = {}; const catAgg = {};
  for (const r of rows) {
    for (const [k, v] of Object.entries(JSON.parse(r.platforms || '{}'))) platAgg[k] = (platAgg[k] ?? 0) + v;
    for (const [k, v] of Object.entries(JSON.parse(r.categories || '{}'))) catAgg[k] = (catAgg[k] ?? 0) + v;
  }
  const platformDistribution = Object.entries(platAgg).map(([name, value]) => ({
    name, value, color: PLATFORM_COLOR[name] ?? '#64748b',
  }));
  const categoryPerformance = Object.entries(catAgg).map(([category, count]) => ({
    category: CAT_LABEL[category] ?? category, count, avgScore: 0,
  }));

  const latest = rows[rows.length - 1];
  const topTopics = JSON.parse(latest.top || '[]').map((t) => ({
    title: t.title, platform: t.platform, score: t.score, views: '-',
  }));

  const totalTrends = rows.reduce((a, r) => a + r.total, 0);
  const avgDailyActive = Math.round(totalTrends / rows.length);

  return {
    month,
    note: `基于 ${rows.length} 天历史快照聚合(随采集天数增加而更完整)。`,
    dailyTrends,
    platformDistribution,
    categoryPerformance,
    topTopics,
    summary: {
      totalTrends, avgDailyActive,
      topTopic: topTopics[0]?.title ?? '-', topTopicScore: topTopics[0]?.score ?? '-',
      newMemes: catAgg.meme ?? 0,
      totalTrendsChange: '+0%', avgDailyActiveChange: '+0%', newMemesChange: '+0%',
    },
  };
}
