// 规则化自动分类(与前端逻辑一致)。词边界匹配,避免 "cat" 命中 "category"、"ts" 命中 "widgets"。
const CATEGORY_PRIORITY = ['seasonal', 'entertainment', 'meme', 'identity', 'interest', 'aesthetic'];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 词边界匹配:term 作为独立词/短语出现才算命中。 */
function hasTerm(haystack, term) {
  if (!term) return false;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRe(term.toLowerCase())}([^a-z0-9]|$)`, 'i');
  return re.test(haystack);
}

function normalize(text, synonyms) {
  let s = ` ${text.toLowerCase()} `;
  for (const [alias, std] of Object.entries(synonyms)) {
    // 词边界替换,避免 alias 命中单词内部(如 ts → widgets)
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(alias.toLowerCase())}([^a-z0-9]|$)`, 'gi');
    s = s.replace(re, (_m, a, b) => `${a}${std.toLowerCase()}${b}`);
  }
  return s;
}

export function classify(name, keywords, rules, description = '') {
  const haystack = normalize([name, (keywords || []).join(' '), description].join(' '), rules.synonyms);

  const excluded = rules.globalExcludes.some((w) => hasTerm(haystack, w));
  if (excluded) return { category: 'pending', tags: [], recommended_products: [], excluded: true };

  let best = null;
  let bestHits = 0;
  for (const cat of CATEGORY_PRIORITY) {
    const kws = rules.categoryKeywords[cat] ?? [];
    const hits = kws.filter((kw) => hasTerm(haystack, kw)).length;
    if (hits > bestHits) { bestHits = hits; best = cat; }
  }

  const category = best ?? 'pending';
  const matchedKw = best ? (rules.categoryKeywords[best] ?? []).filter((kw) => hasTerm(haystack, kw)) : [];
  const lexHits = rules.tagLexicon.filter((t) => hasTerm(haystack, t));
  const tags = Array.from(new Set([...matchedKw, ...lexHits])).slice(0, 6);
  const recommended_products = best ? (rules.productAdaptation[best] ?? []) : [];

  return { category, tags, recommended_products, excluded: false };
}
