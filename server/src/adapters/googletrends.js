// Google Trends 每日热搜适配器(RSS,免 Key)。产出"内容机会"原始项,交分类引擎处理。
import { fetchText, splitItems, tagAttr, tagText } from '../util/rss.js';

/** 解析 "50,000+" → 50000 */
function parseTraffic(s) {
  const m = String(s).replace(/[,+\s]/g, '').match(/\d+/);
  return m ? Number(m[0]) : 0;
}

export async function fetchGoogleTrends(geo = 'US', limit = 20) {
  const xml = await fetchText(`https://trends.google.com/trending/rss?geo=${geo}`);
  const items = splitItems(xml).slice(0, limit);

  return items.map((it) => {
    const term = tagText(it, 'title');
    const traffic = parseTraffic(tagText(it, 'ht:approx_traffic'));
    const newsUrl = tagAttr(it, 'ht:news_item_url', 'url') || tagText(it, 'ht:news_item_url');
    return {
      term,
      traffic,
      url: newsUrl || `https://www.google.com/search?q=${encodeURIComponent(term)}`,
    };
  }).filter((x) => x.term);
}
