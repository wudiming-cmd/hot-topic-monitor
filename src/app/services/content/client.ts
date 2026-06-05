// 内容机会服务入口。默认 mock(本地分类引擎);设置 VITE_API_BASE_URL 后改走真实后端。
import { API_BASE_URL } from '../config';
import { classify } from './classify';
import { MOCK_RAW_OPPORTUNITIES } from './mockOpportunities';
import type { ClassifyRules, ContentOpportunity } from './types';

export interface OppFetchResult {
  items: ContentOpportunity[];
  excludedCount: number; // 命中排除词被过滤的数量(可观测)
  fetched_at: string;
  source: 'mock' | 'live';
}

/**
 * 拉取并分类内容机会。
 * mock 模式:对原始机会跑分类引擎,丢弃命中排除词的,产出可用列表。
 */
export async function getOpportunities(rules: ClassifyRules): Promise<OppFetchResult> {
  const fetched_at = new Date().toISOString();

  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/opportunities`);
    if (!res.ok) throw new Error(`后端返回 ${res.status}`);
    const data = await res.json();
    return { items: data.items ?? [], excludedCount: data.excludedCount ?? 0, fetched_at: data.fetched_at ?? fetched_at, source: 'live' };
  }

  await new Promise((r) => setTimeout(r, 300));

  let excludedCount = 0;
  const items: ContentOpportunity[] = [];
  for (const raw of MOCK_RAW_OPPORTUNITIES) {
    const c = classify(raw.name, raw.keywords, rules, raw.description);
    if (c.excluded) {
      excludedCount++;
      continue; // 泛新闻/政治等被排除词过滤(PRD 验收 §13)
    }
    items.push({
      ...raw,
      fetched_at,
      category: c.category,
      tags: c.tags,
      recommended_products: c.recommended_products,
      // 无法分类 → 待确认状态(PRD 验收 §7)
      status: c.category === 'pending' ? 'pending' : 'new',
      score: null,
      grade: null,
    });
  }
  items.sort((a, b) => b.heat_score - a.heat_score);
  return { items, excludedCount, fetched_at, source: 'mock' };
}
