// Google Play 评论(google-play-scraper,免 Key)。按包名拉最近评论。
// 依赖:server/package.json 已含 google-play-scraper。该库为非官方抓取,注意 ToS 与频率。
export async function fetchGooglePlayReviews(appId, num = 80) {
  let gplay;
  try {
    const mod = await import('google-play-scraper');
    gplay = mod.default ?? mod;
  } catch {
    throw new Error('未安装 google-play-scraper(npm i)');
  }
  const res = await gplay.reviews({
    appId, country: 'us', lang: 'en',
    sort: gplay.sort?.NEWEST ?? 2, num,
  });
  const list = Array.isArray(res) ? res : (res.data ?? []);
  return list.map((r) => ({ title: r.title ?? '', content: r.text ?? '', rating: r.score ?? 0 }));
}
