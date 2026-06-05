// App Store 评论适配器(iTunes 公开接口,免 Key)+ 需求聚合提炼。
// 把零散评论里的"用户想要什么"归并成有频次的需求主题(正面/负面/需求中的"需求"维度)。
const COMPETITORS = ['ScreenKit app icons widgets', 'aesthetic kit widgets themes', 'Widgetsmith', 'Color Widgets'];

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'hot-topic-monitor' }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function resolveApp(term, country = 'us') {
  const data = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&country=${country}&limit=1`);
  const app = data.results?.[0];
  return app ? { id: app.trackId, name: app.trackName } : null;
}

async function fetchReviews(appId, country = 'us', pages = 2) {
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

// 需求触发语:用户在"想要/希望/缺少"
const REQUEST_RE = /\b(wish|want|need|please add|add (a|more|the|some)|would love|hope|hoping|request|missing|should (have|add|include)|bring back|let us|allow|able to|why (isn'?t|can'?t|no)|more)\b/i;

// 需求主题词库(提炼用):规范标签 + 命中词 + 推荐产品。这是"提炼"的核心。
const DEMAND_TOPICS = [
  { label: '更多壁纸 / 动态壁纸', terms: ['wallpaper', 'wallpapers', 'background', 'live wallpaper', 'animated wallpaper'], products: ['wallpaper'] },
  { label: '更多主题 / 配色', terms: ['theme', 'themes', 'color scheme', 'palette'], products: ['theme'] },
  { label: '更多图标包 / 自定义图标', terms: ['icon', 'icons', 'icon pack', 'app icon'], products: ['theme'] },
  { label: '小组件 / Widget 增强', terms: ['widget', 'widgets'], products: ['theme', 'wallpaper'] },
  { label: '锁屏定制', terms: ['lock screen', 'lockscreen', 'lock-screen'], products: ['wallpaper', 'theme'] },
  { label: '字体 / 键盘外观', terms: ['font', 'fonts', 'keyboard theme', 'keyboard'], products: ['keyboard'] },
  { label: '贴纸 / 表情', terms: ['sticker', 'stickers', 'emoji'], products: ['sticker'] },
  { label: '暗色模式', terms: ['dark mode', 'dark theme', 'night mode'], products: ['theme'] },
  { label: 'Anime / 动漫风', terms: ['anime', 'manga'], products: ['theme', 'wallpaper', 'sticker'] },
  { label: '审美风格(coquette/y2k 等)', terms: ['aesthetic', 'coquette', 'y2k', 'cottagecore', 'kawaii'], products: ['wallpaper', 'theme'] },
  { label: '更多免费内容 / 降价', terms: ['free', 'cheaper', 'too expensive', 'subscription', 'paywall'], products: ['theme', 'wallpaper'] },
  { label: '更多定制选项', terms: ['customize', 'customization', 'more options', 'customizable'], products: ['theme'] },
];

const hasTerm = (text, term) =>
  new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(text);

const snippet = (s, n = 90) => String(s).replace(/\s+/g, ' ').trim().slice(0, n);

/**
 * 跨竞品聚合"需求型"评论 → 需求主题(带频次/示例/来源/平均分)。
 * @returns [{ label, count, products, apps:[], examples:[], avgRating }]
 */
export async function fetchAppStoreDemands({ pages = 2 } = {}) {
  const agg = new Map(); // label -> { label, products, count, apps:Set, examples:[], ratings:[] }

  for (const term of COMPETITORS) {
    const app = await resolveApp(term).catch(() => null);
    if (!app) continue;
    const reviews = await fetchReviews(app.id, 'us', pages).catch(() => []);
    for (const r of reviews) {
      const text = `${r.title} ${r.content}`;
      if (!REQUEST_RE.test(text)) continue; // 只看需求型评论
      for (const topic of DEMAND_TOPICS) {
        if (!topic.terms.some((t) => hasTerm(text, t))) continue;
        if (!agg.has(topic.label)) agg.set(topic.label, { label: topic.label, products: topic.products, count: 0, apps: new Set(), examples: [], ratings: [] });
        const a = agg.get(topic.label);
        a.count++;
        a.apps.add(app.name);
        a.ratings.push(r.rating);
        if (a.examples.length < 3) a.examples.push(snippet(r.content || r.title));
      }
    }
  }

  return [...agg.values()]
    .map((a) => ({
      label: a.label, count: a.count, products: a.products,
      apps: [...a.apps], examples: a.examples,
      avgRating: a.ratings.length ? Math.round((a.ratings.reduce((x, y) => x + y, 0) / a.ratings.length) * 10) / 10 : 0,
    }))
    .filter((a) => a.count >= 2) // 至少 2 条评论提及才算"信号"
    .sort((a, b) => b.count - a.count);
}
