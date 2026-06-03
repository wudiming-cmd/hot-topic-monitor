// 服务层公共入口。前端只通过这里取数,不直接碰 mock。
// 设置 VITE_API_BASE_URL 即切换到真实后端,前端代码无需改动。
import { API_BASE_URL } from './config';
import { fetchMockMonthlyStats, fetchRawTrends } from './mockBackend';
import { dedupeTrends, rescore, sortTrends } from './scoring';
import type {
  MonthlyStats,
  SourceStatus,
  TrendItem,
  TrendQuery,
  TrendsResponse,
} from './types';

/**
 * 获取热点榜单。
 * 流水线:采集(mock/live)→ 统一打分 → 去重合并 → 过滤 → 排序。
 */
export async function getTrends(query: TrendQuery = {}): Promise<
  TrendsResponse & { statuses: SourceStatus[] }
> {
  const { platform = 'all', category = 'all', search = '', sortBy = 'composite_score' } = query;

  let raw: Omit<TrendItem, 'composite_score' | 'sources'>[];
  let statuses: SourceStatus[];
  let fetched_at: string;
  let source: 'mock' | 'live';

  if (API_BASE_URL) {
    // 真实后端:期望返回与 mockBackend 一致的结构
    const res = await fetch(`${API_BASE_URL}/trends`);
    if (!res.ok) throw new Error(`后端返回 ${res.status}`);
    const data = await res.json();
    raw = data.raw ?? data.items ?? [];
    statuses = data.statuses ?? [];
    fetched_at = data.fetched_at ?? new Date().toISOString();
    source = 'live';
  } else {
    const result = await fetchRawTrends();
    raw = result.raw;
    statuses = result.statuses;
    fetched_at = result.fetched_at;
    source = 'mock';
  }

  // 统一打分(用配置权重计算 composite_score)
  let items: TrendItem[] = rescore(
    raw.map((it) => ({ ...it, composite_score: 0 })),
  );

  // 跨平台去重合并
  items = dedupeTrends(items);

  // 过滤:平台 / 分类 / 关键词
  const kw = search.trim().toLowerCase();
  items = items.filter((item) => {
    const platformMatch = platform === 'all' || item.source === platform;
    const categoryMatch = category === 'all' || item.category === category;
    const searchMatch =
      !kw ||
      item.title.toLowerCase().includes(kw) ||
      (item.author?.toLowerCase().includes(kw) ?? false);
    return platformMatch && categoryMatch && searchMatch;
  });

  // 排序
  items = sortTrends(items, sortBy);

  return { items, fetched_at, source, statuses };
}

export async function getMonthlyStats(): Promise<MonthlyStats> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/monthly`);
    if (!res.ok) throw new Error(`后端返回 ${res.status}`);
    return res.json();
  }
  return fetchMockMonthlyStats();
}
