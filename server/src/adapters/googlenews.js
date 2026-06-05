// Google News 适配器(RSS,免 Key)。RSS 无热度数字 → popularity 用排名位次代理。
import { clamp01 } from '../scoring.js';
import { fetchText, splitItems, tagText } from '../util/rss.js';

export async function fetchGoogleNews(limit = 20, { hl = 'en-US', gl = 'US', ceid = 'US:en' } = {}) {
  const xml = await fetchText(`https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${encodeURIComponent(ceid)}`);
  const items = splitItems(xml).slice(0, limit);
  const fetched_at = new Date().toISOString();
  const n = items.length || 1;

  return items.map((it, i) => {
    let title = tagText(it, 'title');
    // Google News 标题常带 " - 媒体名" 后缀,去掉
    title = title.replace(/\s+-\s+[^-]+$/, '').trim();
    const rank = (n - i) / n; // 越靠前越高
    return {
      source: 'google_news',
      category: 'news',
      title,
      url: tagText(it, 'link'),
      popularity: clamp01(rank),
      velocity: clamp01(rank * 0.6),
      engagement_rate: 0.2,
      published_at: relTime(tagText(it, 'pubDate')),
      fetched_at,
      status: i < 5 ? 'rising' : 'stable',
    };
  });
}

function relTime(pubDate) {
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return 'recent';
  const h = Math.max(0, Math.round((Date.now() - t) / 3600000));
  return h < 1 ? '刚刚' : `${h}h ago`;
}
