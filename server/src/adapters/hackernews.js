// Hacker News 适配器(Firebase 官方 API,免 Key)。
import { engagementRate, estimateVelocity, hoursSince, logNorm } from '../scoring.js';

const API = 'https://hacker-news.firebaseio.com/v0';

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HN ${res.status}`);
  return res.json();
}

/** 返回归一化后的 TrendItem 数组(category=tech)。 */
export async function fetchHackerNews(limit = 20) {
  const ids = await getJson(`${API}/topstories.json`);
  const top = ids.slice(0, limit);
  const items = await Promise.all(
    top.map((id) => getJson(`${API}/item/${id}.json`).catch(() => null)),
  );

  const fetched_at = new Date().toISOString();
  return items
    .filter((it) => it && it.title)
    .map((it) => {
      const ageH = hoursSince(it.time ?? Date.now() / 1000);
      const velocity = estimateVelocity(it.score ?? 0, ageH);
      return {
        source: 'hackernews',
        category: 'tech',
        title: it.title,
        url: it.url || `https://news.ycombinator.com/item?id=${it.id}`,
        popularity: logNorm(it.score ?? 0, 1000),
        velocity,
        engagement_rate: engagementRate(it.descendants ?? 0, it.score ?? 0),
        author: it.by,
        published_at: `${Math.round(ageH)}h ago`,
        fetched_at,
        status: velocity > 0.6 ? 'rising' : ageH < 3 ? 'new' : 'stable',
      };
    });
}
