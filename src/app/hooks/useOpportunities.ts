import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOpportunities } from '../services/content/client';
import type {
  ClassifyRules, ContentOpportunity, OppQuery, OppStatus,
} from '../services/content/types';

const STATUS_KEY = 'htm-opp-status';

function loadStatusMap(): Record<string, OppStatus> {
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/**
 * 内容机会列表。基于当前分类规则拉取并分类,合并用户的状态操作(收藏/忽略/待确认),
 * 再按查询条件筛选。规则变化会自动重新分类。
 */
export function useOpportunities(query: OppQuery, classifyRules: ClassifyRules) {
  const [base, setBase] = useState<ContentOpportunity[]>([]);
  const [excludedCount, setExcludedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, OppStatus>>(loadStatusMap);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOpportunities(classifyRules)
      .then((res) => {
        if (cancelled) return;
        setBase(res.items);
        setExcludedCount(res.excludedCount);
        setFetchedAt(res.fetched_at);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [classifyRules]);

  const setStatus = useCallback((id: string, status: OppStatus) => {
    setStatusMap((cur) => {
      const next = { ...cur, [id]: status };
      localStorage.setItem(STATUS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // 合并用户状态覆盖
  const merged = useMemo(
    () => base.map((o) => ({ ...o, status: statusMap[o.id] ?? o.status })),
    [base, statusMap],
  );

  // 统计(基于忽略以外的"在榜"机会)
  const counts = useMemo(() => {
    const active = merged.filter((o) => o.status !== 'ignored');
    return {
      total: active.length,
      favorited: merged.filter((o) => o.status === 'favorited').length,
      pending: merged.filter((o) => o.status === 'pending').length,
      ignored: merged.filter((o) => o.status === 'ignored').length,
      excluded: excludedCount,
    };
  }, [merged, excludedCount]);

  // 查询筛选
  const items = useMemo(() => {
    const kw = (query.search ?? '').trim().toLowerCase();
    return merged.filter((o) => {
      if (query.country && query.country !== 'all' && o.country !== query.country) return false;
      if (query.platform && query.platform !== 'all' && o.platform !== query.platform) return false;
      if (query.category && query.category !== 'all' && o.category !== query.category) return false;
      if (query.product && query.product !== 'all' && !o.recommended_products.includes(query.product)) return false;
      if (query.tag && query.tag !== 'all' && !o.tags.includes(query.tag)) return false;
      if (query.status === 'active') { if (o.status === 'ignored') return false; }
      else if (query.status && query.status !== 'all' && o.status !== query.status) return false;
      if (kw && !o.name.toLowerCase().includes(kw) && !o.keywords.join(' ').toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [merged, query]);

  // 当前结果集涉及的标签(供标签筛选下拉)
  const allTags = useMemo(
    () => Array.from(new Set(base.flatMap((o) => o.tags))).sort(),
    [base],
  );

  return { items, counts, allTags, loading, error, fetchedAt, setStatus };
}
