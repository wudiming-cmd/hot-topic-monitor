// App Store 评论(iTunes 公开 RSS,免 Key)。按 App id 拉最近评论。
async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'hot-topic-monitor' }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/** 拉某 iOS App 的最近评论。 */
export async function fetchAppStoreReviews(appId, country = 'us', pages = 3) {
  const all = [];
  for (let p = 1; p <= pages; p++) {
    try {
      const data = await getJson(`https://itunes.apple.com/${country}/rss/customerreviews/page=${p}/id=${appId}/sortby=mostrecent/json`);
      const entries = data.feed?.entry;
      if (!Array.isArray(entries)) break;
      for (const e of entries) {
        if (!e['im:rating']) continue;
        all.push({ title: e.title?.label ?? '', content: e.content?.label ?? '', rating: Number(e['im:rating']?.label ?? 0) });
      }
    } catch { break; }
  }
  return all;
}
