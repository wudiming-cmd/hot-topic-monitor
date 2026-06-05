// Reddit 适配器。有 client_id/secret 走官方 OAuth(application-only);
// 否则回退到公开 .json(需 User-Agent,限流更严)。
import { config } from '../config.js';
import { engagementRate, estimateVelocity, hoursSince, logNorm } from '../scoring.js';

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (!config.reddit.hasCreds) return null;
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const basic = Buffer.from(`${config.reddit.clientId}:${config.reddit.clientSecret}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.reddit.userAgent,
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Reddit token ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000 - 60000;
  return cachedToken;
}

async function fetchSubreddit(sub, limit, token) {
  const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const res = await fetch(`${base}/r/${sub}/hot.json?limit=${limit}&raw_json=1`, {
    headers: {
      'User-Agent': config.reddit.userAgent,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Reddit r/${sub} ${res.status}`);
  const data = await res.json();
  return (data?.data?.children ?? []).map((c) => c.data).filter(Boolean);
}

/**
 * 抓多个版块的 hot 帖。
 * @returns 原始帖数组(含 subreddit/ups/num_comments/title/permalink/created_utc/preview)
 */
export async function fetchRedditHot(subs, limit = 25) {
  const token = await getToken();
  const all = [];
  for (const sub of subs) {
    const posts = await fetchSubreddit(sub, limit, token);
    all.push(...posts);
  }
  return all;
}

/** 把 Reddit 帖映射为 TrendItem(用于 /trends,category=social)。 */
export function toTrendItems(posts, fetched_at) {
  return posts.map((p) => {
    const ageH = hoursSince(p.created_utc ?? Date.now() / 1000);
    const velocity = estimateVelocity(p.ups ?? 0, ageH);
    return {
      source: 'reddit',
      category: 'social',
      title: p.title,
      url: `https://www.reddit.com${p.permalink}`,
      media_url: p.preview?.images?.[0]?.source?.url ?? null,
      popularity: logNorm(p.ups ?? 0, 50000),
      velocity,
      engagement_rate: engagementRate(p.num_comments ?? 0, p.ups ?? 0),
      author: p.author ? `u/${p.author}` : undefined,
      published_at: `${Math.round(ageH)}h ago`,
      fetched_at,
      status: velocity > 0.6 ? 'rising' : ageH < 3 ? 'new' : 'stable',
    };
  });
}
