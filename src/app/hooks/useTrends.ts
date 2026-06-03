import { useCallback, useEffect, useState } from 'react';
import { getTrends } from '../services/client';
import type { SourceStatus, TrendItem, TrendQuery } from '../services/types';

interface UseTrendsResult {
  items: TrendItem[];
  statuses: SourceStatus[];
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
  dataSource: 'mock' | 'live' | null;
  refresh: () => void;
}

/**
 * 拉取热点榜单。query 变化时自动重新请求;refresh() 手动触发(对应需求 §4.10)。
 */
export function useTrends(query: TrendQuery): UseTrendsResult {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [statuses, setStatuses] = useState<SourceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mock' | 'live' | null>(null);
  // 自增触发器,用于手动刷新
  const [nonce, setNonce] = useState(0);

  const { platform, category, search, sortBy } = query;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getTrends({ platform, category, search, sortBy })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setStatuses(res.statuses);
        setFetchedAt(res.fetched_at);
        setDataSource(res.source);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [platform, category, search, sortBy, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { items, statuses, loading, error, fetchedAt, dataSource, refresh };
}
