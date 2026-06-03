// 打分 / 去重 / 排序流水线。对应需求 §3、§4.3、§4.4。
import { SCORE_WEIGHTS } from './config';
import type { SortKey, TrendItem } from './types';

/**
 * 计算综合热度分(0–100)。
 * 三项已是归一化的 0–1 值,按权重求和后映射到百分制。
 * 对应需求 §3 composite_score。
 */
export function computeCompositeScore(item: {
  popularity: number;
  velocity: number;
  engagement_rate: number;
}): number {
  const { velocity, popularity, engagement } = SCORE_WEIGHTS;
  const total = velocity + popularity + engagement || 1; // 防止权重和为 0
  const score =
    (item.velocity * velocity +
      item.popularity * popularity +
      item.engagement_rate * engagement) /
    total;
  return Math.round(score * 1000) / 10; // 0–100,保留一位小数
}

/**
 * 归一化标题:用于去重(URL + 归一化标题)。对应需求 §4.3。
 * 去掉大小写、标点、多余空白。
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 跨平台去重合并:同一话题(归一化标题相同)合并,保留综合分最高者,
 * 并在 sources 中累计所有出现过的平台。对应需求 §4.3。
 */
export function dedupeTrends(items: TrendItem[]): TrendItem[] {
  const byKey = new Map<string, TrendItem>();

  for (const item of items) {
    const key = normalizeTitle(item.title);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { ...item, sources: [item.source] });
      continue;
    }

    // 合并来源平台
    const sources = Array.from(
      new Set([...(existing.sources ?? [existing.source]), item.source]),
    );

    // 保留综合分更高的作为主条目
    const winner =
      item.composite_score > existing.composite_score ? item : existing;
    byKey.set(key, { ...winner, sources });
  }

  return Array.from(byKey.values());
}

/**
 * 按指定维度排序(默认综合分降序)。对应需求 §4.4。
 * published_at 为相对时间字符串(如 "2h ago"),用解析后的小时数升序(越新越靠前)。
 */
export function sortTrends(items: TrendItem[], sortBy: SortKey = 'composite_score'): TrendItem[] {
  const sorted = [...items];

  if (sortBy === 'published_at') {
    sorted.sort((a, b) => parseRelativeHours(a.published_at) - parseRelativeHours(b.published_at));
  } else {
    sorted.sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  }

  return sorted;
}

/** 解析 "2h ago" / "3 天前" 之类的相对时间为小时数,用于排序。无法解析时排到最后。 */
export function parseRelativeHours(value: string): number {
  const match = value.match(/(\d+(?:\.\d+)?)\s*([hdm])/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const n = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'm') return n / 60;
  if (unit === 'h') return n;
  if (unit === 'd') return n * 24;
  return n;
}

/**
 * 重新计算每个条目的 composite_score(用配置的权重),保证打分逻辑统一,
 * 不依赖原始数据里预先写死的分值。
 */
export function rescore(items: TrendItem[]): TrendItem[] {
  return items.map((item) => ({
    ...item,
    composite_score: computeCompositeScore(item),
  }));
}
