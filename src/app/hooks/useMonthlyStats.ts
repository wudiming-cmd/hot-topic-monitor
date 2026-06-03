import { useEffect, useState } from 'react';
import { getMonthlyStats } from '../services/client';
import type { MonthlyStats } from '../services/types';

export function useMonthlyStats(month?: string) {
  const [data, setData] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMonthlyStats(month)
      .then((res) => {
        if (!cancelled) setData(res);
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
  }, [month]);

  return { data, loading, error };
}
