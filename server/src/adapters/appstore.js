// App Store 评论适配器(iTunes 公开接口,免 Key)。
// 用 iTunes Search 解析竞品 appId,再读公开评论 RSS,挖"用户需求"信号。
// 竞品/同类 App(经验证在美区有可读评论)。可按需替换为你的真实竞品。
const COMPETITORS = ['ScreenKit app icons widgets', 'aesthetic kit widgets themes', 'Widgetsmith'];

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'hot-topic-monitor' }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function resolveAppId(term, country = 'us') {
  const data = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&country=${country}&limit=1`);
  const app = data.results?.[0];
  return app ? { id: app.trackId, name: app.trackName } : null;
}

// 需求型评论的语言特征(用户在"想要/希望/缺少某类内容")——这才是内容机会信号,
// 而不是 "Ripoff/Terrible" 这类纯吐槽。
const REQUEST_RE = /\b(wish|want|need|please add|add (a|more|the|some)|would love|hope|hoping|request|missing|should (have|add|include)|bring back|let us|more (themes|widgets|wallpapers|icons|stickers|options))\b/i;

async function fetchReviews(appId, country = 'us', limit = 20) {
  const data = await getJson(`https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${appId}/sortby=mostrecent/json`);
  const entries = data.feed?.entry;
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e) => e['im:rating'])
    .map((e) => ({
      title: e.title?.label ?? '',
      content: e.content?.label ?? '',
      rating: Number(e['im:rating']?.label ?? 0),
    }))
    .filter((r) => REQUEST_RE.test(`${r.title} ${r.content}`)) // 只保留"需求型"评论
    .slice(0, limit);
}

/** 返回评论型机会候选:{ name, app, rating, content } */
export async function fetchAppStoreReviewSignals({ perApp = 8 } = {}) {
  const out = [];
  for (const term of COMPETITORS) {
    const app = await resolveAppId(term).catch(() => null);
    if (!app) continue;
    const reviews = await fetchReviews(app.id, 'us', perApp).catch(() => []);
    for (const r of reviews) {
      out.push({ name: r.title, app: app.name, appId: app.id, rating: r.rating, content: r.content });
    }
  }
  return out;
}
