import { Plus, Trash2, Power } from 'lucide-react';
import { PLATFORM_LABEL, PRODUCT_LABEL } from '../../services/content/rules';
import type { ContentPlatform, Country, CrawlRule, ProductType } from '../../services/content/types';

const PLATFORMS: ContentPlatform[] = ['google_trends', 'pinterest', 'reddit', 'app_store', 'google_play', 'x', 'tiktok', 'holiday'];
const COUNTRIES: Country[] = ['US', 'GB', 'JP', 'global'];
const PRODUCTS: ProductType[] = ['theme', 'keyboard', 'wallpaper', 'sticker'];
const FREQS: CrawlRule['frequency'][] = ['realtime', 'hourly', 'daily', 'weekly'];
const FREQ_LABEL: Record<CrawlRule['frequency'], string> = { realtime: '实时', hourly: '每小时', daily: '每天', weekly: '每周' };

const toList = (s: string) => s.split(/[,，\n]/).map((x) => x.trim()).filter(Boolean);

export function CrawlRulesConfig({ rules, onChange }: { rules: CrawlRule[]; onChange: (r: CrawlRule[]) => void }) {
  const update = (id: string, patch: Partial<CrawlRule>) =>
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => onChange(rules.filter((r) => r.id !== id));
  const add = () =>
    onChange([
      ...rules,
      { id: `cr_${rules.length}_${rules.reduce((a, r) => a + r.id.length, 0)}`, platform: 'reddit', country: 'US', seed_keywords: [], exclude_keywords: [], product_types: ['wallpaper'], frequency: 'daily', enabled: true },
    ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">配置各平台/国家的抓取规则:种子关键词、排除词、关注产品、频率与开关。</p>
        <button onClick={add} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground">
          <Plus className="w-4 h-4" />新增规则
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.id} className={`bg-card border rounded-xl p-4 ${r.enabled ? 'border-border' : 'border-border opacity-60'}`}>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Field label="平台">
                <select value={r.platform} onChange={(e) => update(r.id, { platform: e.target.value as ContentPlatform })} className="select">
                  {PLATFORMS.map((p) => <option key={p} value={p} className="bg-card">{PLATFORM_LABEL[p]}</option>)}
                </select>
              </Field>
              <Field label="国家">
                <select value={r.country} onChange={(e) => update(r.id, { country: e.target.value as Country })} className="select">
                  {COUNTRIES.map((c) => <option key={c} value={c} className="bg-card">{c}</option>)}
                </select>
              </Field>
              <Field label="频率">
                <select value={r.frequency} onChange={(e) => update(r.id, { frequency: e.target.value as CrawlRule['frequency'] })} className="select">
                  {FREQS.map((f) => <option key={f} value={f} className="bg-card">{FREQ_LABEL[f]}</option>)}
                </select>
              </Field>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => update(r.id, { enabled: !r.enabled })} title={r.enabled ? '已启用' : '已停用'}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border ${r.enabled ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-border text-muted-foreground'}`}>
                  <Power className="w-3.5 h-3.5" />{r.enabled ? '启用' : '停用'}
                </button>
                <button onClick={() => remove(r.id)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="种子关键词(逗号分隔)" full>
                <input defaultValue={r.seed_keywords.join(', ')} onBlur={(e) => update(r.id, { seed_keywords: toList(e.target.value) })} className="inp" placeholder="aesthetic, wallpaper…" />
              </Field>
              <Field label="排除词(逗号分隔)" full>
                <input defaultValue={r.exclude_keywords.join(', ')} onBlur={(e) => update(r.id, { exclude_keywords: toList(e.target.value) })} className="inp" placeholder="news, politics…" />
              </Field>
            </div>

            <div className="mt-3">
              <span className="text-xs text-muted-foreground mr-2">关注产品:</span>
              {PRODUCTS.map((p) => {
                const on = r.product_types.includes(p);
                return (
                  <button key={p} onClick={() => update(r.id, { product_types: on ? r.product_types.filter((x) => x !== p) : [...r.product_types, p] })}
                    className={`mr-2 px-2 py-0.5 rounded text-xs font-medium border ${on ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-border text-muted-foreground'}`}>
                    {PRODUCT_LABEL[p]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <style>{`.select{background:rgba(148,163,184,.06);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;color:var(--foreground);outline:none;cursor:pointer}.inp{width:100%;background:rgba(148,163,184,.06);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;color:var(--foreground);outline:none}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
