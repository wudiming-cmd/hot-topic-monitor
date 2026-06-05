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

// 好评点词库(用户喜欢什么):在正面评论里命中
export const POSITIVE_ASPECTS = [
  { label: '设计美观 / 好看', terms: ['beautiful', 'cute', 'gorgeous', 'pretty', 'aesthetic', 'love the design', 'so pretty'] },
  { label: '内容丰富 / 选择多', terms: ['variety', 'selection', 'so many', 'tons of', 'lots of', 'options', 'plenty'] },
  { label: '易用 / 上手简单', terms: ['easy', 'simple', 'user friendly', 'intuitive', 'easy to use'] },
  { label: '小组件好用', terms: ['widget', 'widgets'] },
  { label: '免费 / 划算', terms: ['free', 'worth it', 'worth the', 'affordable'] },
  { label: '主题 / 壁纸质量好', terms: ['theme', 'themes', 'wallpaper', 'wallpapers'] },
];

// 差评点词库(用户抱怨什么):在负面评论里命中
export const NEGATIVE_ASPECTS = [
  { label: '闪退 / Bug / 不工作', terms: ['crash', 'bug', 'glitch', 'broken', "doesn't work", "won't work", 'not working', 'freezes', 'stopped working'] },
  { label: '广告太多', terms: ['ads', 'too many ads', 'advertisement', 'popup', 'pop-up', 'ad every'] },
  { label: '价格贵 / 订阅 / 套路', terms: ['expensive', 'overpriced', 'subscription', 'paywall', 'scam', 'refund', 'rip off', 'ripoff', 'money'] },
  { label: '小组件失效', terms: ['widget', 'widgets'] },
  { label: '内容少 / 重复', terms: ['not enough', 'limited', 'repetitive', 'few options', 'nothing good'] },
  { label: '卡顿 / 慢', terms: ['slow', 'lag', 'laggy', 'buggy'] },
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

/** 通用聚合:在满足 predicate 的评论里,统计命中 lexicon 主题的次数 + 示例。 */
function aggregateAspects(reviews, lexicon, predicate, minCount) {
  const agg = new Map();
  for (const r of reviews) {
    if (!predicate(r)) continue;
    const text = `${r.title} ${r.content}`;
    for (const topic of lexicon) {
      if (!topic.terms.some((t) => hasTerm(text, t))) continue;
      if (!agg.has(topic.label)) agg.set(topic.label, { label: topic.label, products: topic.products ?? [], count: 0, examples: [] });
      const a = agg.get(topic.label);
      a.count++;
      if (a.examples.length < 3) a.examples.push(snippet(r.content || r.title));
    }
  }
  return [...agg.values()].filter((a) => a.count >= minCount).sort((a, b) => b.count - a.count);
}

/** 需求:需求型评论命中需求主题。 */
export const aggregateDemands = (reviews, minCount = 2) =>
  aggregateAspects(reviews, DEMAND_TOPICS, (r) => REQUEST_RE.test(`${r.title} ${r.content}`), minCount);

/** 好评点:正面评论(>=4★)命中的好评维度。 */
export const aggregatePraises = (reviews, minCount = 2) =>
  aggregateAspects(reviews, POSITIVE_ASPECTS, (r) => (r.rating || 0) >= 4, minCount);

/** 差评点:负面评论(<=2★)命中的差评维度。 */
export const aggregateComplaints = (reviews, minCount = 2) =>
  aggregateAspects(reviews, NEGATIVE_ASPECTS, (r) => (r.rating || 0) <= 2, minCount);
