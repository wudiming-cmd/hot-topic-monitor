// 评论洞察:需求聚合(正面/负面/需求三维度中的"需求")+ 情感分布。竞品评论模块复用。

// 需求触发语:用户在"想要/希望/缺少"
const REQUEST_RE = /\b(wish|want|need|please add|add (a|more|the|some)|would love|hope|hoping|request|missing|should (have|add|include)|bring back|let us|allow|able to|why (isn'?t|can'?t|no)|more)\b/i;

// 需求主题词库:规范标签 + 命中词 + 推荐产品(提炼核心)
export const DEMAND_TOPICS = [
  { label: '更多壁纸 / 动态壁纸', terms: ['wallpaper', 'wallpapers', 'background', 'live wallpaper', 'animated wallpaper'], products: ['wallpaper'] },
  { label: '更多主题 / 配色', terms: ['theme', 'themes', 'color scheme', 'palette'], products: ['theme'] },
  { label: '更多图标包 / 自定义图标', terms: ['icon', 'icons', 'icon pack', 'app icon'], products: ['theme'] },
  { label: '小组件 / Widget 增强', terms: ['widget', 'widgets'], products: ['theme', 'wallpaper'] },
  { label: '锁屏定制', terms: ['lock screen', 'lockscreen', 'lock-screen'], products: ['wallpaper', 'theme'] },
  { label: '键盘主题 / 字体', terms: ['keyboard', 'keyboard theme', 'font', 'fonts'], products: ['keyboard'] },
  { label: '贴纸 / 表情', terms: ['sticker', 'stickers', 'emoji'], products: ['sticker'] },
  { label: '暗色模式', terms: ['dark mode', 'dark theme', 'night mode'], products: ['theme'] },
  { label: 'Anime / 动漫风', terms: ['anime', 'manga'], products: ['theme', 'wallpaper', 'sticker'] },
  { label: '审美风格(coquette/y2k 等)', terms: ['aesthetic', 'coquette', 'y2k', 'cottagecore', 'kawaii'], products: ['wallpaper', 'theme'] },
  { label: '更多免费内容 / 降价', terms: ['free', 'cheaper', 'too expensive', 'subscription', 'paywall'], products: ['theme', 'wallpaper'] },
  { label: '更多定制选项', terms: ['customize', 'customization', 'more options', 'customizable'], products: ['theme'] },
];

const hasTerm = (text, term) =>
  new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(text);
const snippet = (s, n = 100) => String(s).replace(/\s+/g, ' ').trim().slice(0, n);

/** 情感分布(按评分):>=4 正面,<=2 负面,=3 中性。 */
export function sentiment(reviews) {
  let positive = 0, negative = 0, neutral = 0, sum = 0;
  for (const r of reviews) {
    const s = r.rating || 0;
    sum += s;
    if (s >= 4) positive++; else if (s <= 2) negative++; else neutral++;
  }
  return {
    positive, negative, neutral,
    avgRating: reviews.length ? Math.round((sum / reviews.length) * 10) / 10 : 0,
  };
}

/** 聚合需求主题:仅统计需求型评论命中主题的次数。 */
export function aggregateDemands(reviews, minCount = 2) {
  const agg = new Map();
  for (const r of reviews) {
    const text = `${r.title} ${r.content}`;
    if (!REQUEST_RE.test(text)) continue;
    for (const topic of DEMAND_TOPICS) {
      if (!topic.terms.some((t) => hasTerm(text, t))) continue;
      if (!agg.has(topic.label)) agg.set(topic.label, { label: topic.label, products: topic.products, count: 0, examples: [] });
      const a = agg.get(topic.label);
      a.count++;
      if (a.examples.length < 3) a.examples.push(snippet(r.content || r.title));
    }
  }
  return [...agg.values()].filter((a) => a.count >= minCount).sort((a, b) => b.count - a.count);
}
