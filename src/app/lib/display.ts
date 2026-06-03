// 平台/分类/状态的统一展示元数据(颜色、标签),供列表、详情、画廊共用。
import type { Category, Platform, TrendStatus } from '../services/types';

export const PLATFORM_META: Record<Platform, { label: string; chip: string }> = {
  youtube: { label: 'YouTube', chip: 'bg-red-500/10 text-red-400' },
  reddit: { label: 'Reddit', chip: 'bg-orange-500/10 text-orange-400' },
  hackernews: { label: 'Hacker News', chip: 'bg-orange-600/10 text-orange-300' },
  google_news: { label: 'Google News', chip: 'bg-blue-500/10 text-blue-400' },
  tmdb: { label: 'TMDb', chip: 'bg-yellow-500/10 text-yellow-400' },
  giphy: { label: 'Giphy', chip: 'bg-green-500/10 text-green-400' },
  tiktok: { label: 'TikTok', chip: 'bg-rose-500/10 text-rose-400' },
  facebook: { label: 'Facebook', chip: 'bg-sky-500/10 text-sky-400' },
};

export const CATEGORY_META: Record<Category, { label: string; chip: string }> = {
  news: { label: '新闻', chip: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  tech: { label: '科技', chip: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  entertainment: { label: '娱乐', chip: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  social: { label: '社交', chip: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  meme: { label: '梗图', chip: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export const STATUS_META: Record<TrendStatus, { label: string; full: string; color: string }> = {
  new: { label: '新', full: '新冒出', color: 'text-amber-400 bg-amber-500/10' },
  rising: { label: '升', full: '快速上升', color: 'text-emerald-400 bg-emerald-500/10' },
  stable: { label: '稳', full: '持续在榜', color: 'text-cyan-400 bg-cyan-500/10' },
  declining: { label: '降', full: '已回落', color: 'text-slate-400 bg-slate-500/10' },
};
