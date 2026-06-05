// X (Twitter) 适配器:抓 trends24.in 美区热搜(免 Key,服务端渲染 HTML)。
// 注:X 热搜偏泛,交分类引擎后只保留内容相关项(与 Google Trends 同口径)。
import { fetchText } from '../util/rss.js';

export async function fetchXTrends(geo = 'united-states', limit = 25) {
  const html = await fetchText(`https://trends24.in/${geo}/`, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });
  // 第一个时间快照即"当前";页面含多份历史快照,去重后取前 limit 个
  const matches = [...html.matchAll(/<a[^>]+href="[^"]*search[^"]*"[^>]*class=trend-link[^>]*>\s*([^<]+?)\s*<\/a>/gi)];
  const seen = new Set();
  const out = [];
  for (const m of matches) {
    const term = decodeHtml(m[1].trim());
    if (!term || seen.has(term.toLowerCase())) continue;
    seen.add(term.toLowerCase());
    out.push({ term, url: `https://x.com/search?q=${encodeURIComponent(term)}` });
    if (out.length >= limit) break;
  }
  return out;
}

function decodeHtml(s) {
  return s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
