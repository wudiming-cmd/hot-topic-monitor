// TMDb 热点娱乐(影视)适配器。官方 API,免费 key。
// 申请:https://www.themoviedb.org/settings/api (拿 API Key v3)
import { config } from '../config.js';
import { clamp01, logNorm } from '../scoring.js';

export async function fetchTmdbTrending(limit = 20) {
  if (!config.tmdb.enabled) throw new Error('未配置 TMDB_API_KEY');
  const url = `https://api.themoviedb.org/3/trending/all/day?api_key=${config.tmdb.apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`TMDb ${res.status}`);
  const data = await res.json();
  const fetched_at = new Date().toISOString();
  const list = (data.results ?? []).filter((r) => r.media_type !== 'person').slice(0, limit);
  const n = list.length || 1;

  return list.map((r, i) => ({
    source: 'tmdb',
    category: 'entertainment',
    title: r.title || r.name || '(untitled)',
    url: `https://www.themoviedb.org/${r.media_type}/${r.id}`,
    media_url: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    popularity: logNorm(r.popularity ?? 0, 1000),
    velocity: clamp01(((n - i) / n) * 0.7),
    engagement_rate: clamp01((r.vote_average ?? 0) / 10),
    published_at: r.release_date || r.first_air_date || 'trending',
    fetched_at,
    status: i < 5 ? 'rising' : 'stable',
  }));
}
