import { RotateCcw } from 'lucide-react';
import {
  CATEGORY_LABEL, DEFAULT_CLASSIFY_RULES, PRODUCT_LABEL,
} from '../../services/content/rules';
import type { ClassifyRules, ContentCategory, ProductType } from '../../services/content/types';

const CATS = ['aesthetic', 'identity', 'interest', 'seasonal', 'entertainment', 'meme'] as Exclude<ContentCategory, 'pending'>[];
const PRODUCTS: ProductType[] = ['theme', 'keyboard', 'wallpaper', 'sticker'];

const toList = (s: string) => s.split(/[,，\n]/).map((x) => x.trim()).filter(Boolean);

export function ClassifyRulesConfig({ rules, onChange }: { rules: ClassifyRules; onChange: (r: ClassifyRules) => void }) {
  const setCatKw = (cat: Exclude<ContentCategory, 'pending'>, list: string[]) =>
    onChange({ ...rules, categoryKeywords: { ...rules.categoryKeywords, [cat]: list } });
  const toggleProduct = (cat: Exclude<ContentCategory, 'pending'>, p: ProductType) => {
    const cur = rules.productAdaptation[cat] ?? [];
    const next = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p];
    onChange({ ...rules, productAdaptation: { ...rules.productAdaptation, [cat]: next } });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">维护分类关键词、标签词库、同义词与产品适配。改动会即时影响机会列表的自动分类。</p>
        <button onClick={() => onChange(DEFAULT_CLASSIFY_RULES)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-card border border-border text-foreground hover:border-primary/50">
          <RotateCcw className="w-4 h-4" />恢复默认
        </button>
      </div>

      {/* 分类关键词 + 产品适配 */}
      <div className="space-y-3">
        {CATS.map((cat) => (
          <div key={cat} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="text-sm font-semibold text-foreground">{CATEGORY_LABEL[cat]}</span>
              <div>
                <span className="text-xs text-muted-foreground mr-2">推荐产品:</span>
                {PRODUCTS.map((p) => {
                  const on = (rules.productAdaptation[cat] ?? []).includes(p);
                  return (
                    <button key={p} onClick={() => toggleProduct(cat, p)}
                      className={`mr-2 px-2 py-0.5 rounded text-xs font-medium border ${on ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-border text-muted-foreground'}`}>
                      {PRODUCT_LABEL[p]}
                    </button>
                  );
                })}
              </div>
            </div>
            <textarea defaultValue={(rules.categoryKeywords[cat] ?? []).join(', ')}
              onBlur={(e) => setCatKw(cat, toList(e.target.value))}
              rows={2}
              className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none"
              placeholder="该分类的命中关键词,逗号分隔" />
          </div>
        ))}
      </div>

      {/* 标签词库 / 同义词 / 全局排除词 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Block title="标签词库" hint="自动打标签用">
          <textarea defaultValue={rules.tagLexicon.join(', ')} onBlur={(e) => onChange({ ...rules, tagLexicon: toList(e.target.value) })}
            rows={5} className="ta" placeholder="pink, pastel, cat…" />
        </Block>
        <Block title="同义词" hint="每行 alias=标准词">
          <textarea defaultValue={Object.entries(rules.synonyms).map(([k, v]) => `${k}=${v}`).join('\n')}
            onBlur={(e) => {
              const syn: Record<string, string> = {};
              e.target.value.split('\n').forEach((line) => {
                const [k, v] = line.split('=').map((x) => x.trim());
                if (k && v) syn[k] = v;
              });
              onChange({ ...rules, synonyms: syn });
            }}
            rows={5} className="ta" placeholder={'kpop=k-pop\nxmas=christmas'} />
        </Block>
        <Block title="全局排除词" hint="命中即过滤(泛新闻/政治等)">
          <textarea defaultValue={rules.globalExcludes.join(', ')} onBlur={(e) => onChange({ ...rules, globalExcludes: toList(e.target.value) })}
            rows={5} className="ta" placeholder="election, politics, crime…" />
        </Block>
      </div>

      <style>{`.ta{width:100%;background:rgba(148,163,184,.08);border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;color:var(--foreground);outline:none;resize:none}`}</style>
    </div>
  );
}

function Block({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}
