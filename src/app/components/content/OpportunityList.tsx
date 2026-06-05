import { useState } from 'react';
import { Search, Star, EyeOff, HelpCircle, ExternalLink, Inbox, Flame, MessageSquareQuote } from 'lucide-react';
import { useOpportunities } from '../../hooks/useOpportunities';
import { OpportunityDetail } from './OpportunityDetail';
import { AiAnalysisButton } from '../AiAnalysisButton';
import {
  CATEGORY_CHIP, CATEGORY_LABEL, COUNTRY_LABEL, PLATFORM_LABEL, PRODUCT_LABEL, STATUS_LABEL,
} from '../../services/content/rules';
import type {
  ClassifyRules, ContentCategory, ContentOpportunity, ContentPlatform, Country, OppQuery, OppStatus, ProductType,
} from '../../services/content/types';

const CATEGORIES: (ContentCategory | 'all')[] = ['all', 'aesthetic', 'identity', 'interest', 'seasonal', 'entertainment', 'meme', 'pending'];
const PLATFORMS: (ContentPlatform | 'all')[] = ['all', 'google_trends', 'pinterest', 'reddit', 'app_store', 'google_play', 'x', 'tiktok', 'holiday'];
const COUNTRIES: (Country | 'all')[] = ['all', 'US', 'GB', 'JP', 'global'];
const PRODUCTS: (ProductType | 'all')[] = ['all', 'theme', 'keyboard', 'wallpaper', 'sticker'];

export function OpportunityList({ classifyRules }: { classifyRules: ClassifyRules }) {
  const [query, setQuery] = useState<OppQuery>({ status: 'active' });
  const { items, counts, allTags, loading, error, fetchedAt, setStatus } = useOpportunities(query, classifyRules);
  const [detail, setDetail] = useState<ContentOpportunity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const set = (patch: Partial<OppQuery>) => setQuery((q) => ({ ...q, ...patch }));
  const openDetail = (o: ContentOpportunity) => { setDetail(o); setDetailOpen(true); };

  return (
    <div className="space-y-5">
      {/* 统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="在榜机会" value={counts.total} icon={<Flame className="w-4 h-4" />} />
        <Stat label="已收藏" value={counts.favorited} color="text-amber-400" />
        <Stat label="待确认" value={counts.pending} color="text-slate-400" />
        <Stat label="排除词过滤" value={counts.excluded} color="text-muted-foreground" hint="泛新闻/政治等已自动剔除" />
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query.search ?? ''}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="搜索机会 / 关键词…"
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>
        <Select value={query.country ?? 'all'} onChange={(v) => set({ country: v as Country | 'all' })}
          options={COUNTRIES.map((c) => ({ value: c, label: c === 'all' ? '全部国家' : COUNTRY_LABEL[c as Country] }))} />
        <Select value={query.platform ?? 'all'} onChange={(v) => set({ platform: v as ContentPlatform | 'all' })}
          options={PLATFORMS.map((p) => ({ value: p, label: p === 'all' ? '全部平台' : PLATFORM_LABEL[p as ContentPlatform] }))} />
        <Select value={query.product ?? 'all'} onChange={(v) => set({ product: v as ProductType | 'all' })}
          options={PRODUCTS.map((p) => ({ value: p, label: p === 'all' ? '全部产品' : PRODUCT_LABEL[p as ProductType] }))} />
        <Select value={query.tag ?? 'all'} onChange={(v) => set({ tag: v })}
          options={[{ value: 'all', label: '全部标签' }, ...allTags.map((t) => ({ value: t, label: `#${t}` }))]} />
        <Select value={query.status ?? 'active'} onChange={(v) => set({ status: v as OppQuery['status'] })}
          options={[
            { value: 'active', label: '在榜(隐藏忽略)' },
            { value: 'all', label: '全部状态' },
            { value: 'new', label: '新' },
            { value: 'favorited', label: '已收藏' },
            { value: 'pending', label: '待确认' },
            { value: 'ignored', label: '已忽略' },
          ]} />
      </div>

      {/* 内容分类快捷筛选 + AI 分析 */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => set({ category: c })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              (query.category ?? 'all') === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
            }`}
          >
            {c === 'all' ? '全部分类' : CATEGORY_LABEL[c as ContentCategory]}
          </button>
        ))}
      </div>
        <AiAnalysisButton
          kind="opportunities"
          title="AI 内容机会分析"
          label="AI 分析机会"
          buildPayload={() => ({
            items: items.slice(0, 30).map((o) => ({
              name: o.name, platform: o.platform, category: o.category,
              recommended_products: o.recommended_products, heat_signal: o.heat_signal, tags: o.tags,
            })),
          })}
        />
      </div>

      {error && <div className="px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">加载失败：{error}</div>}

      {/* 列表 */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">正在抓取并分类…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Inbox className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">没有匹配的内容机会</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((o) => <Row key={o.id} o={o} onStatus={setStatus} onOpen={openDetail} />)}
          </div>
        )}
      </div>

      {fetchedAt && !loading && (
        <p className="text-xs text-muted-foreground font-mono text-right">
          上次抓取：{new Date(fetchedAt).toLocaleString('zh-CN')} · 共 {items.length} 条
        </p>
      )}

      <OpportunityDetail opp={detail} open={detailOpen} onOpenChange={setDetailOpen} onStatus={setStatus} />
    </div>
  );
}

function Row({ o, onStatus, onOpen }: { o: ContentOpportunity; onStatus: (id: string, s: OppStatus) => void; onOpen: (o: ContentOpportunity) => void }) {
  const fav = o.status === 'favorited';
  const ignored = o.status === 'ignored';
  return (
    <div className={`p-4 hover:bg-muted/30 transition-all ${ignored ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <button type="button" onClick={() => onOpen(o)}
              className="text-left text-base font-medium text-foreground flex-1 hover:text-primary transition-colors cursor-pointer">
              {o.name}
            </button>
            {o.extra?.examples?.length ? (
              <span className="flex items-center gap-1 text-xs text-primary flex-shrink-0" title="含需求示例摘录">
                <MessageSquareQuote className="w-3.5 h-3.5" />{o.extra.mentions ?? o.extra.examples.length}
              </span>
            ) : null}
            <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary flex-shrink-0" title="来源链接">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted/50 text-foreground">{PLATFORM_LABEL[o.platform]}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted/40 text-muted-foreground">{COUNTRY_LABEL[o.country]}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_CHIP[o.category]}`}>{CATEGORY_LABEL[o.category]}</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
              <Flame className="w-3 h-3" />{o.heat_signal}
            </span>
            {o.status !== 'new' && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{STATUS_LABEL[o.status]}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 推荐产品 */}
            {o.recommended_products.length > 0 && (
              <span className="text-xs text-muted-foreground">推荐：</span>
            )}
            {o.recommended_products.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400">{PRODUCT_LABEL[p]}</span>
            ))}
            {/* 标签 */}
            {o.tags.map((t) => (
              <span key={t} className="text-xs text-muted-foreground">#{t}</span>
            ))}
          </div>
        </div>

        {/* 操作 */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <IconBtn active={fav} title={fav ? '取消收藏' : '收藏'} onClick={() => onStatus(o.id, fav ? 'new' : 'favorited')}
            cls={fav ? 'text-amber-400' : ''}><Star className={`w-4 h-4 ${fav ? 'fill-amber-400' : ''}`} /></IconBtn>
          <IconBtn active={o.status === 'pending'} title="标记待确认" onClick={() => onStatus(o.id, 'pending')}><HelpCircle className="w-4 h-4" /></IconBtn>
          <IconBtn active={ignored} title={ignored ? '取消忽略' : '忽略'} onClick={() => onStatus(o.id, ignored ? 'new' : 'ignored')}><EyeOff className="w-4 h-4" /></IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick, active, cls }: { children: React.ReactNode; title: string; onClick: () => void; active?: boolean; cls?: string }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all ${
        active ? 'border-primary/50 bg-primary/10' : 'border-border hover:border-primary/50'
      } ${cls ?? 'text-muted-foreground hover:text-foreground'}`}>
      {children}
    </button>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none cursor-pointer">
      {options.map((o) => <option key={o.value} value={o.value} className="bg-card">{o.label}</option>)}
    </select>
  );
}

function Stat({ label, value, icon, color, hint }: { label: string; value: number; icon?: React.ReactNode; color?: string; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4" title={hint}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs">{label}</span></div>
      <p className={`text-2xl font-mono font-semibold ${color ?? 'text-foreground'}`}>{value}</p>
    </div>
  );
}
