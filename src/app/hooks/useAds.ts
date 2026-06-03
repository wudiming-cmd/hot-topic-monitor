import { useEffect, useState } from 'react';
import { getAds } from '../services/ads';
import type { AdItem, AdQuery } from '../services/types';

export function useAds(query: AdQuery) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mock' | 'live' | null>(null);

  const { search, category, region } = query;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAds({ search, category, region })
      .then((res) => {
        if (cancelled) return;
        setAds(res.ads);
        setDataSource(res.source);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, category, region]);

  return { ads, loading, error, dataSource };
}
