import { useEffect, useState } from 'react';
import { getReviewInsights } from '../services/content/reviews';
import type { ReviewInsights } from '../services/content/reviews';

export function useReviewInsights() {
  const [data, setData] = useState<ReviewInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getReviewInsights()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : '加载失败'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
