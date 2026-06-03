// 统一数据结构与服务层类型定义
// 对应需求说明书 §6 TrendItem

export type Platform =
  | 'youtube'
  | 'reddit'
  | 'hackernews'
  | 'google_news'
  | 'tmdb'
  | 'giphy';

export type Category = 'news' | 'tech' | 'entertainment' | 'social' | 'meme';

// 热点变化状态:新冒出 / 快速上升 / 持续在榜 / 已回落
export type TrendStatus = 'new' | 'rising' | 'stable' | 'declining';

/**
 * 统一热点条目。对应需求 §6。
 * 注意:popularity / velocity / engagement_rate 为归一化后的 0–1 值,
 * composite_score 由打分流水线计算得出(见 services/scoring.ts)。
 */
export interface TrendItem {
  source: Platform;
  category: Category;
  title: string;
  url: string;
  media_url?: string | null; // 仅合规来源的图/封面/预览(梗图用)
  popularity: number; // 归一化绝对热度 0–1
  velocity: number; // 上升速度 0–1
  engagement_rate: number; // 互动率 0–1
  composite_score: number; // 综合排序分(0–100),由流水线计算
  author?: string;
  published_at: string; // 展示用相对时间或 ISO
  fetched_at?: string; // 本次采集时间 ISO(算 velocity / 变化追踪用)
  sources?: Platform[]; // 去重合并后,该话题出现过的平台
  status: TrendStatus;
  extra?: Record<string, unknown>; // 各平台特有字段
}

// 排序维度
export type SortKey =
  | 'composite_score'
  | 'popularity'
  | 'velocity'
  | 'engagement_rate'
  | 'published_at';

export interface TrendQuery {
  platform?: Platform | 'all';
  category?: Category | 'all';
  search?: string;
  sortBy?: SortKey;
}

export interface TrendsResponse {
  items: TrendItem[];
  fetched_at: string; // ISO,本次采集时间
  source: 'mock' | 'live'; // 数据来源,便于前端提示
}

// 单源采集状态(对应需求 §8 可观测性)
export interface SourceStatus {
  source: Platform;
  ok: boolean;
  count: number;
  error?: string;
}

// 月度汇总数据结构
export interface MonthlyStats {
  month: string; // 如 "2026-06"
  dailyTrends: { date: string; total: number; rising: number; new: number }[];
  platformDistribution: { name: string; value: number; color: string }[];
  categoryPerformance: { category: string; count: number; avgScore: number }[];
  topTopics: { title: string; platform: string; score: string; views: string }[];
  summary: {
    totalTrends: number;
    avgDailyActive: number;
    topTopic: string;
    topTopicScore: string;
    newMemes: number;
    totalTrendsChange: string;
    avgDailyActiveChange: string;
    newMemesChange: string;
  };
}
