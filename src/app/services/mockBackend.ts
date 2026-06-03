// 内置 mock 后端:模拟「多 Adapter 采集 → 单源故障隔离」。
// 对应需求 §4.1 适配器架构、§8 可观测性。
// 真实后端就位后,client.ts 会改为请求 API_BASE_URL,这个文件即可弃用。
import { MOCK_LATENCY_MS } from './config';
import type { MonthlyStats, Platform, SourceStatus, TrendItem } from './types';

// 各平台的「原始」热点信号(popularity/velocity/engagement 已归一化到 0–1)。
// composite_score 不在这里写死,由 scoring 流水线统一计算。
type RawTrend = Omit<TrendItem, 'composite_score' | 'sources'>;

const RAW_BY_SOURCE: Record<Platform, RawTrend[]> = {
  hackernews: [
    {
      source: 'hackernews', category: 'tech',
      title: 'Claude 4.7 Released with Extended Context Window',
      url: 'https://news.ycombinator.com', popularity: 0.95, velocity: 0.88,
      engagement_rate: 0.42, author: 'anthropic', published_at: '2h ago', status: 'rising',
    },
    {
      source: 'hackernews', category: 'tech',
      title: 'Rust 2.0 Proposal: Memory Safety Meets Performance',
      url: 'https://news.ycombinator.com', popularity: 0.74, velocity: 0.68,
      engagement_rate: 0.48, author: 'rust-team', published_at: '7h ago', status: 'stable',
    },
    {
      source: 'hackernews', category: 'tech',
      title: 'WebAssembly now supports full GC integration',
      url: 'https://news.ycombinator.com', popularity: 0.61, velocity: 0.52,
      engagement_rate: 0.39, author: 'wasm-team', published_at: '11h ago', status: 'stable',
    },
    // 跨平台重复:Gemini 3.0 也上了 HN 热榜
    {
      source: 'hackernews', category: 'tech',
      title: 'Google announces Gemini 3.0 with breakthrough reasoning',
      url: 'https://news.ycombinator.com', popularity: 0.9, velocity: 0.82,
      engagement_rate: 0.47, author: 'google-ai', published_at: '3h ago', status: 'rising',
    },
  ],
  youtube: [
    {
      source: 'youtube', category: 'tech',
      title: 'Apple Vision Pro 2 Hands-On: Everything Changed',
      url: 'https://youtube.com', popularity: 0.92, velocity: 0.91,
      engagement_rate: 0.38, author: 'MKBHD', published_at: '4h ago', status: 'rising',
    },
    {
      source: 'youtube', category: 'entertainment',
      title: 'Behind the Scenes: Avatar 4 Production',
      url: 'https://youtube.com', popularity: 0.81, velocity: 0.71,
      engagement_rate: 0.36, author: 'James Cameron', published_at: '8h ago', status: 'stable',
    },
    {
      source: 'youtube', category: 'tech',
      title: 'Framework Laptop 16 Review: Modular Computing Done Right',
      url: 'https://youtube.com', popularity: 0.66, velocity: 0.58,
      engagement_rate: 0.35, author: 'Linus Tech Tips', published_at: '10h ago', status: 'stable',
    },
    {
      source: 'youtube', category: 'entertainment',
      title: 'Taylor Swift Announces Surprise Album Drop',
      url: 'https://youtube.com', popularity: 0.91, velocity: 0.38,
      engagement_rate: 0.49, author: 'Taylor Swift', published_at: '18h ago', status: 'declining',
    },
    // 跨平台重复:同一话题也出现在 YouTube(用于演示去重合并)
    {
      source: 'youtube', category: 'tech',
      title: 'Google announces Gemini 3.0 with breakthrough reasoning',
      url: 'https://youtube.com', popularity: 0.83, velocity: 0.79,
      engagement_rate: 0.41, author: 'Google', published_at: '3h ago', status: 'rising',
    },
    {
      source: 'youtube', category: 'entertainment',
      title: 'Dune: Part Three Breaks Opening Weekend Records',
      url: 'https://youtube.com', popularity: 0.8, velocity: 0.77,
      engagement_rate: 0.4, author: 'Warner Bros', published_at: '6h ago', status: 'rising',
    },
  ],
  reddit: [
    {
      source: 'reddit', category: 'tech',
      title: 'Google announces Gemini 3.0 with breakthrough reasoning',
      url: 'https://reddit.com/r/technology', popularity: 0.89, velocity: 0.85,
      engagement_rate: 0.51, author: 'u/techie2026', published_at: '3h ago', status: 'rising',
    },
    {
      source: 'reddit', category: 'meme',
      title: 'AI trying to understand human humor - new template',
      url: 'https://reddit.com/r/memes',
      media_url: 'https://picsum.photos/seed/aihumor/400/300',
      popularity: 0.78, velocity: 0.92, engagement_rate: 0.67,
      author: 'u/mememaster', published_at: '5h ago', status: 'new',
    },
    {
      source: 'reddit', category: 'social',
      title: 'TIL: The origin story of the Internet Archive',
      url: 'https://reddit.com/r/todayilearned', popularity: 0.69, velocity: 0.55,
      engagement_rate: 0.41, author: 'u/historian123', published_at: '9h ago', status: 'stable',
    },
    {
      source: 'reddit', category: 'meme',
      title: 'When you finally understand async/await',
      url: 'https://reddit.com/r/programmerhumor',
      media_url: 'https://picsum.photos/seed/asyncawait/400/300',
      popularity: 0.63, velocity: 0.81, engagement_rate: 0.69,
      author: 'u/devmemes', published_at: '6h ago', status: 'new',
    },
  ],
  google_news: [
    {
      source: 'google_news', category: 'news',
      title: 'Major Climate Agreement Reached at COP35',
      url: 'https://news.google.com', popularity: 0.88, velocity: 0.76,
      engagement_rate: 0.33, published_at: '1h ago', status: 'stable',
    },
    {
      source: 'google_news', category: 'news',
      title: 'SpaceX Successfully Launches Mars Colony Ship',
      url: 'https://news.google.com', popularity: 0.84, velocity: 0.62,
      engagement_rate: 0.29, published_at: '12h ago', status: 'declining',
    },
    {
      source: 'google_news', category: 'news',
      title: 'EU Announces Universal Charging Standard 2.0',
      url: 'https://news.google.com', popularity: 0.72, velocity: 0.44,
      engagement_rate: 0.27, published_at: '16h ago', status: 'declining',
    },
    // 跨平台重复:Dune 3 也上了 Google News
    {
      source: 'google_news', category: 'entertainment',
      title: 'Dune: Part Three Breaks Opening Weekend Records',
      url: 'https://news.google.com', popularity: 0.85, velocity: 0.74,
      engagement_rate: 0.31, published_at: '6h ago', status: 'rising',
    },
  ],
  tmdb: [
    {
      source: 'tmdb', category: 'entertainment',
      title: 'Dune: Part Three Breaks Opening Weekend Records',
      url: 'https://themoviedb.org', popularity: 0.86, velocity: 0.82,
      engagement_rate: 0.44, published_at: '6h ago', status: 'rising',
    },
    {
      source: 'tmdb', category: 'entertainment',
      title: 'Stranger Things Season 6 Finale Reactions',
      url: 'https://themoviedb.org', popularity: 0.77, velocity: 0.48,
      engagement_rate: 0.52, published_at: '14h ago', status: 'declining',
    },
  ],
  giphy: [
    {
      source: 'giphy', category: 'meme',
      title: 'Confused Cat Reacts to New iPhone',
      url: 'https://giphy.com',
      media_url: 'https://picsum.photos/seed/confusedcat/400/300',
      popularity: 0.71, velocity: 0.89, engagement_rate: 0.72,
      published_at: '3h ago', status: 'new',
    },
    {
      source: 'giphy', category: 'meme',
      title: 'Monday Morning Motivation (but make it sarcastic)',
      url: 'https://giphy.com',
      media_url: 'https://picsum.photos/seed/mondaymotivation/400/300',
      popularity: 0.58, velocity: 0.76, engagement_rate: 0.64,
      published_at: '7h ago', status: 'new',
    },
  ],
  // 真实数据源:TikTok Creative Center(ads.tiktok.com/creative/creativeCenter,Trends 板块)
  // 官方免费,提供热门话题标签/音乐/视频/Top Ads;后端经其 creative_radar_api 接口(需匿名令牌握手)或无头渲染获取。以下为示意数据。
  tiktok: [
    {
      source: 'tiktok', category: 'social',
      title: '#SilentWalking 挑战席卷全网,2 亿次播放',
      url: 'https://www.tiktok.com', popularity: 0.93, velocity: 0.95,
      engagement_rate: 0.71, author: '@wellnessdaily', published_at: '2h ago', status: 'new',
    },
    {
      source: 'tiktok', category: 'entertainment',
      title: 'POV: 你妈发现了你的 TikTok 账号',
      url: 'https://www.tiktok.com', popularity: 0.87, velocity: 0.9,
      engagement_rate: 0.78, author: '@comedyqueen', published_at: '4h ago', status: 'rising',
    },
    {
      source: 'tiktok', category: 'meme',
      title: 'AI 翻唱经典老歌 - 新一轮二创模板',
      url: 'https://www.tiktok.com',
      media_url: 'https://picsum.photos/seed/tiktokai/400/300',
      popularity: 0.79, velocity: 0.88, engagement_rate: 0.69,
      author: '@musicremix', published_at: '5h ago', status: 'new',
    },
    {
      source: 'tiktok', category: 'entertainment',
      title: '60 秒看懂量子计算(科普区爆款)',
      url: 'https://www.tiktok.com', popularity: 0.74, velocity: 0.66,
      engagement_rate: 0.55, author: '@sciencebites', published_at: '9h ago', status: 'stable',
    },
  ],
  // 注:Facebook 自然内容无官方热榜 API,以下为示意数据;公开数据以广告资料库为主
  facebook: [
    {
      source: 'facebook', category: 'news',
      title: 'Breaking: 全球科技峰会公布 AI 安全新框架',
      url: 'https://www.facebook.com', popularity: 0.85, velocity: 0.72,
      engagement_rate: 0.34, author: 'Tech Insider', published_at: '3h ago', status: 'rising',
    },
    {
      source: 'facebook', category: 'social',
      title: '这个本地咖啡馆的故事感动了 50 万人',
      url: 'https://www.facebook.com', popularity: 0.76, velocity: 0.63,
      engagement_rate: 0.58, author: 'Humans of City', published_at: '6h ago', status: 'stable',
    },
    {
      source: 'facebook', category: 'entertainment',
      title: '怀旧:90 年代经典动画即将重制',
      url: 'https://www.facebook.com', popularity: 0.7, velocity: 0.59,
      engagement_rate: 0.47, author: 'Retro Fans', published_at: '11h ago', status: 'stable',
    },
  ],
};

const ALL_SOURCES = Object.keys(RAW_BY_SOURCE) as Platform[];

function delay(): Promise<void> {
  const { min, max } = MOCK_LATENCY_MS;
  // 用一个基于条目数的伪随机延迟,避免依赖被禁用的 Math.random 也无所谓——此处可用。
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 模拟「每个 Adapter 独立采集,单源失败不影响其它源」。
 * 返回原始条目 + 每个源的采集状态(供前端展示可观测信息)。
 */
export async function fetchRawTrends(): Promise<{
  raw: RawTrend[];
  statuses: SourceStatus[];
  fetched_at: string;
}> {
  await delay();
  const fetched_at = new Date().toISOString();
  const raw: RawTrend[] = [];
  const statuses: SourceStatus[] = [];

  for (const source of ALL_SOURCES) {
    try {
      const items = RAW_BY_SOURCE[source].map((it) => ({ ...it, fetched_at }));
      raw.push(...items);
      statuses.push({ source, ok: true, count: items.length });
    } catch (err) {
      // 异常隔离:记录失败但不影响其它源
      statuses.push({
        source,
        ok: false,
        count: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { raw, statuses, fetched_at };
}

export const mockMonthlyStats: MonthlyStats = {
  month: '2026-06',
  dailyTrends: [
    { date: '6/1', total: 82, rising: 28, new: 15 },
    { date: '6/2', total: 78, rising: 25, new: 12 },
    { date: '6/3', total: 91, rising: 32, new: 18 },
    { date: '6/4', total: 88, rising: 30, new: 16 },
    { date: '6/5', total: 95, rising: 35, new: 21 },
    { date: '6/6', total: 103, rising: 38, new: 24 },
    { date: '6/7', total: 97, rising: 34, new: 19 },
    { date: '6/8', total: 86, rising: 29, new: 14 },
    { date: '6/9', total: 92, rising: 31, new: 17 },
    { date: '6/10', total: 99, rising: 36, new: 22 },
    { date: '6/11', total: 105, rising: 39, new: 25 },
    { date: '6/12', total: 108, rising: 41, new: 27 },
    { date: '6/13', total: 102, rising: 37, new: 23 },
    { date: '6/14', total: 94, rising: 33, new: 18 },
    { date: '6/15', total: 89, rising: 30, new: 16 },
    { date: '6/16', total: 96, rising: 35, new: 20 },
    { date: '6/17', total: 101, rising: 38, new: 24 },
    { date: '6/18', total: 107, rising: 40, new: 26 },
    { date: '6/19', total: 112, rising: 43, new: 29 },
    { date: '6/20', total: 106, rising: 39, new: 25 },
    { date: '6/21', total: 98, rising: 35, new: 21 },
    { date: '6/22', total: 93, rising: 32, new: 18 },
    { date: '6/23', total: 100, rising: 37, new: 23 },
    { date: '6/24', total: 104, rising: 39, new: 25 },
    { date: '6/25', total: 110, rising: 42, new: 28 },
    { date: '6/26', total: 115, rising: 44, new: 31 },
    { date: '6/27', total: 109, rising: 41, new: 27 },
    { date: '6/28', total: 101, rising: 37, new: 22 },
    { date: '6/29', total: 96, rising: 34, new: 19 },
    { date: '6/30', total: 103, rising: 38, new: 24 },
  ],
  platformDistribution: [
    { name: 'YouTube', value: 26, color: '#ef4444' },
    { name: 'Reddit', value: 18, color: '#f97316' },
    { name: 'TikTok', value: 14, color: '#f43f5e' },
    { name: 'Hacker News', value: 13, color: '#f59e0b' },
    { name: 'Facebook', value: 10, color: '#0ea5e9' },
    { name: 'Google News', value: 9, color: '#3b82f6' },
    { name: 'TMDb', value: 6, color: '#eab308' },
    { name: 'Giphy', value: 4, color: '#10b981' },
  ],
  categoryPerformance: [
    { category: '科技', count: 856, avgScore: 75.2 },
    { category: '新闻', count: 642, avgScore: 71.8 },
    { category: '娱乐', count: 524, avgScore: 68.5 },
    { category: '社交', count: 483, avgScore: 64.3 },
    { category: '梗图', count: 342, avgScore: 72.9 },
  ],
  topTopics: [
    { title: 'Claude 4.7 Released with Extended Context Window', platform: 'Hacker News', score: '92.5', views: '2.4M' },
    { title: 'Apple Vision Pro 2 Hands-On Review', platform: 'YouTube', score: '91.2', views: '3.8M' },
    { title: 'Google Gemini 3.0 Breakthrough', platform: 'Reddit', score: '89.8', views: '1.9M' },
    { title: 'Major Climate Agreement at COP35', platform: 'Google News', score: '85.4', views: '5.2M' },
    { title: 'Dune: Part Three Box Office Records', platform: 'TMDb', score: '84.7', views: '2.1M' },
    { title: 'AI Understanding Human Humor Meme', platform: 'Reddit', score: '84.2', views: '1.5M' },
    { title: 'Avatar 4 Production Behind Scenes', platform: 'YouTube', score: '79.3', views: '2.8M' },
    { title: 'Rust 2.0 Memory Safety Proposal', platform: 'Hacker News', score: '74.8', views: '892K' },
    { title: 'SpaceX Mars Colony Ship Launch', platform: 'Google News', score: '73.5', views: '4.1M' },
    { title: 'Framework Laptop 16 Modular Review', platform: 'YouTube', score: '71.8', views: '1.2M' },
  ],
  summary: {
    totalTrends: 2847,
    avgDailyActive: 95,
    topTopic: 'Claude 4.7',
    topTopicScore: '92.5分',
    newMemes: 342,
    totalTrendsChange: '+23.5%',
    avgDailyActiveChange: '+12.8%',
    newMemesChange: '+41.2%',
  },
};

// 由基准月(2026-06)派生其它月份,用确定性缩放因子做差异(不依赖随机数)。
function deriveMonth(month: string, label: string, scale: number): MonthlyStats {
  const s = (n: number) => Math.round(n * scale);
  const pct = (base: number) => `${base > 0 ? '+' : ''}${(base * scale).toFixed(1)}%`;
  return {
    ...mockMonthlyStats,
    month,
    dailyTrends: mockMonthlyStats.dailyTrends.map((d) => ({
      date: d.date.replace(/^\d+\//, `${label}/`),
      total: s(d.total),
      rising: s(d.rising),
      new: s(d.new),
    })),
    categoryPerformance: mockMonthlyStats.categoryPerformance.map((c) => ({
      ...c,
      count: s(c.count),
    })),
    summary: {
      ...mockMonthlyStats.summary,
      totalTrends: s(mockMonthlyStats.summary.totalTrends),
      avgDailyActive: s(mockMonthlyStats.summary.avgDailyActive),
      newMemes: s(mockMonthlyStats.summary.newMemes),
      totalTrendsChange: pct(18),
      avgDailyActiveChange: pct(9),
      newMemesChange: pct(30),
    },
  };
}

const MONTHLY_BY_MONTH: Record<string, MonthlyStats> = {
  '2026-06': mockMonthlyStats,
  '2026-05': deriveMonth('2026-05', '5', 0.86),
  '2026-04': deriveMonth('2026-04', '4', 0.72),
};

export const AVAILABLE_MONTHS = Object.keys(MONTHLY_BY_MONTH).sort().reverse();

export async function fetchMockMonthlyStats(month?: string): Promise<MonthlyStats> {
  await delay();
  return MONTHLY_BY_MONTH[month ?? ''] ?? mockMonthlyStats;
}
