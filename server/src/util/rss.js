// 极简 RSS/XML 解析(免依赖,正则实现,够用于 Google News/Trends 这类规整 feed)。

export function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

/** 拆出所有 <item>…</item> 的内部文本块 */
export function splitItems(xml) {
  const out = [];
  const parts = xml.split(/<item[\s>]/i).slice(1);
  for (const part of parts) {
    out.push(part.split(/<\/item>/i)[0]);
  }
  return out;
}

/** 取某个标签的文本(支持命名空间如 ht:approx_traffic) */
export function tagText(xml, name) {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i');
  const m = xml.match(re);
  return m ? decodeEntities(m[1]) : '';
}

/** 取某个标签的属性值,如 <ht:news_item_url url="...">  → attr 'url' */
export function tagAttr(xml, name, attr) {
  const re = new RegExp(`<${name}[^>]*\\b${attr}=["']([^"']+)["']`, 'i');
  const m = xml.match(re);
  return m ? decodeEntities(m[1]) : '';
}

export async function fetchText(url, headers = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 hot-topic-monitor', ...headers },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.text();
}
