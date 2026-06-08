// YouTube 热门视频适配器。Data API v3,免费配额(每日 10000 单位)。
// 申请:Google Cloud Console → 启用 YouTube Data API v3 → 创建 API Key
import { config } from '../config.js';
import { clamp01, engagementRate, estimateVelocity, hoursSince, logNorm } from '../scoring.js';

// YouTube categoryId → 我们的分类
const CAT = { '10': 'entertainment', '24': 'entertainment', '20': 'entertainment', '25': 'news', '28': 'tech', '17': 'social' };

export async function fetchYouTubeTrending(limit = 20) {
  if (!config.youtube.enabled) throw new Error('未配置 YOUTUBE_API_KEY');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=${limit}&regionCode=${config.youtube.region}&key=${config.youtube.apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`YouTube ${res.status}: ${t.slice(0, 120)}`);
  }
  const data = await res.json();
  const fetched_at = new Date().toISOString();

  return (data.items ?? []).map((v) => {
    const s = v.snippet ?? {};
    const st = v.statistics ?? {};
    const views = Number(st.viewCount ?? 0);
    const ageH = hoursSince(Date.parse(s.publishedAt ?? '') / 1000 || Date.now() / 1000);
    return {
      source: 'youtube',
      category: CAT[s.categoryId] ?? 'entertainment',
      title: s.title ?? '(untitled)',
      url: `https://www.youtube.com/watch?v=${v.id}`,
      media_url: s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url ?? null,
      popularity: logNorm(views, 5_000_000),
      velocity: estimateVelocity(views / 1000, ageH),
      engagement_rate: engagementRate(Number(st.likeCount ?? 0) + Number(st.commentCount ?? 0), views),
      author: s.channelTitle,
      published_at: `${Math.round(ageH)}h ago`,
      fetched_at,
      status: ageH < 24 ? 'rising' : 'stable',
    };
  });
}
