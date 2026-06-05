// Giphy trending 梗图/GIF 适配器(官方 API,免费 key)。提供合规预览图(media_url)。
// 申请 key:https://developers.giphy.com/ → Create App。
import { config } from '../config.js';
import { clamp01 } from '../scoring.js';

export async function fetchGiphyTrending(limit = 20) {
  if (!config.giphy.enabled) throw new Error('未配置 GIPHY_API_KEY');
  const url = `https://api.giphy.com/v1/gifs/trending?api_key=${config.giphy.apiKey}&limit=${limit}&rating=pg-13`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Giphy ${res.status}`);
  const data = await res.json();
  const fetched_at = new Date().toISOString();
  const list = data.data ?? [];
  const n = list.length || 1;

  return list.map((g, i) => ({
    source: 'giphy',
    category: 'meme',
    title: g.title?.trim() || g.slug || 'Trending GIF',
    url: g.url,
    media_url: g.images?.fixed_height?.url || g.images?.downsized?.url || g.images?.original?.url || null,
    popularity: clamp01((n - i) / n),
    velocity: clamp01(((n - i) / n) * 0.7),
    engagement_rate: 0.5,
    author: g.username || undefined,
    published_at: 'trending',
    fetched_at,
    status: 'rising',
  }));
}
