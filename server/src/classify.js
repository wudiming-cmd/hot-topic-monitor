// 规则化自动分类(与前端逻辑一致)。
const CATEGORY_PRIORITY = ['seasonal', 'entertainment', 'meme', 'identity', 'interest', 'aesthetic'];

function normalize(text, synonyms) {
  let s = ` ${text.toLowerCase()} `;
  for (const [alias, std] of Object.entries(synonyms)) {
    s = s.split(alias.toLowerCase()).join(std.toLowerCase());
  }
  return s;
}

export function classify(name, keywords, rules, description = '') {
  const haystack = normalize([name, (keywords || []).join(' '), description].join(' '), rules.synonyms);

  const excluded = rules.globalExcludes.some((w) => w && haystack.includes(w.toLowerCase()));
  if (excluded) return { category: 'pending', tags: [], recommended_products: [], excluded: true };

  let best = null;
  let bestHits = 0;
  for (const cat of CATEGORY_PRIORITY) {
    const kws = rules.categoryKeywords[cat] ?? [];
    const hits = kws.filter((kw) => kw && haystack.includes(kw.toLowerCase())).length;
    if (hits > bestHits) { bestHits = hits; best = cat; }
  }

  const category = best ?? 'pending';
  const matchedKw = best ? (rules.categoryKeywords[best] ?? []).filter((kw) => haystack.includes(kw.toLowerCase())) : [];
  const lexHits = rules.tagLexicon.filter((t) => t && haystack.includes(t.toLowerCase()));
  const tags = Array.from(new Set([...matchedKw, ...lexHits])).slice(0, 6);
  const recommended_products = best ? (rules.productAdaptation[best] ?? []) : [];

  return { category, tags, recommended_products, excluded: false };
}
