// 规则化自动分类引擎(第一阶段:关键词/同义词/排除词规则,非 AI)。
// 系统按业务规则执行;命中不了 → 待确认;命中排除词 → 过滤为无关。
import type { ClassifyRules, ContentCategory, ProductType } from './types';

export interface ClassifyResult {
  category: ContentCategory;
  tags: string[];
  recommended_products: ProductType[];
  excluded: boolean; // 命中全局排除词
}

// 分类优先级:平局时娱乐/节日/meme 等更具体的优先于审美
const CATEGORY_PRIORITY: Exclude<ContentCategory, 'pending'>[] = [
  'seasonal', 'entertainment', 'meme', 'identity', 'interest', 'aesthetic',
];

function normalize(text: string, synonyms: Record<string, string>): string {
  let s = ` ${text.toLowerCase()} `;
  for (const [alias, std] of Object.entries(synonyms)) {
    s = s.split(alias.toLowerCase()).join(std.toLowerCase());
  }
  return s;
}

/**
 * 对一条内容机会做分类。
 * @param name 名称
 * @param keywords 抓取到的原始关键词
 * @param rules 当前分类规则(可被配置页修改)
 * @param description 可选描述
 */
export function classify(
  name: string,
  keywords: string[],
  rules: ClassifyRules,
  description = '',
): ClassifyResult {
  const haystack = normalize([name, keywords.join(' '), description].join(' '), rules.synonyms);

  // 1) 全局排除词
  const excluded = rules.globalExcludes.some((w) => w && haystack.includes(w.toLowerCase()));
  if (excluded) {
    return { category: 'pending', tags: [], recommended_products: [], excluded: true };
  }

  // 2) 各分类命中计数
  let best: Exclude<ContentCategory, 'pending'> | null = null;
  let bestHits = 0;
  for (const cat of CATEGORY_PRIORITY) {
    const kws = rules.categoryKeywords[cat] ?? [];
    const hits = kws.filter((kw) => kw && haystack.includes(kw.toLowerCase())).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = cat;
    }
  }

  const category: ContentCategory = best ?? 'pending';

  // 3) 标签:命中的分类关键词 + 词库命中
  const matchedKw = best
    ? (rules.categoryKeywords[best] ?? []).filter((kw) => haystack.includes(kw.toLowerCase()))
    : [];
  const lexHits = rules.tagLexicon.filter((t) => t && haystack.includes(t.toLowerCase()));
  const tags = Array.from(new Set([...matchedKw, ...lexHits])).slice(0, 6);

  // 4) 产品推荐
  const recommended_products = best ? (rules.productAdaptation[best] ?? []) : [];

  return { category, tags, recommended_products, excluded: false };
}
