import { useState } from 'react';
import { Apple, Smartphone, Star, MessageSquareQuote, AlertCircle, TrendingUp } from 'lucide-react';
import { useReviewInsights } from '../../hooks/useReviewInsights';
import { PRODUCT_LABEL } from '../../services/content/rules';
import type { AppInsight, DemandTheme, OS } from '../../services/content/reviews';

export function ReviewInsights() {
  const { data, loading, error } = useReviewInsights();
  const [os, setOs] = useState<OS | 'all'>('all');

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">正在拉取竞品评论…</div>;
  if (error || !data) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
        <AlertCircle className="w-4 h-4" />评论数据加载失败：{error ?? '无数据'}
      </div>
    );
  }

  const apps = data.apps.filter((a) => os === 'all' || a.os === os);
  const aggregated: DemandTheme[] =
    os === 'iOS' ? data.aggregated.iOS
    : os === 'Android' ? data.aggregated.Android
    : [...data.aggregated.iOS, ...data.aggregated.Android].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          从竞品 App 评论里提炼"用户想要什么"(需求维度),区分 iOS / Android · {data.source === 'mock' ? '模拟数据' : '实时'}
        </p>
        {/* 平台筛选 */}
        <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
          {(['all', 'iOS', 'Android'] as const).map((v) => (
            <button key={v} onClick={() => setOs(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                os === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {v === 'iOS' && <Apple className="w-3.5 h-3.5" />}
              {v === 'Android' && <Smartphone className="w-3.5 h-3.5" />}
              {v === 'all' ? '全部' : v}
            </button>
          ))}
        </div>
      </div>

      {/* 需求总览(跨 App 聚合) */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />需求总览(按提及频次)
        </h3>
        {aggregated.length === 0 ? (
          <p className="text-sm text-muted-foreground">该平台暂无聚合到的明确需求。</p>
        ) : (
          <div className="space-y-2">
            {aggregated.map((d) => <DemandBar key={d.label} d={d} max={aggregated[0].count} />)}
          </div>
        )}
      </div>

      {/* 各 App 卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.map((a) => <AppCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

function DemandBar({ d, max }: { d: DemandTheme; max: number }) {
  const pct = Math.round((d.count / Math.max(max, 1)) * 100);
  return (
    <div className="group">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-foreground truncate">{d.label}</span>
            <span className="text-xs font-mono text-muted-foreground ml-2 shrink-0">
              {d.count} 次{d.apps?.length ? ` · ${d.apps.join('/')}` : ''}
            </span>
          </div>
          <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {d.products.map((p) => (
            <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400">{PRODUCT_LABEL[p]}</span>
          ))}
        </div>
      </div>
      {d.examples[0] && (
        <p className="text-xs text-muted-foreground/80 mt-1 pl-0.5 italic truncate" title={d.examples[0]}>“{d.examples[0]}”</p>
      )}
    </div>
  );
}

function AppCard({ a }: { a: AppInsight }) {
  const total = a.positive + a.negative + a.neutral || 1;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {a.os === 'iOS' ? <Apple className="w-4 h-4 text-muted-foreground" /> : <Smartphone className="w-4 h-4 text-emerald-400" />}
          <span className="text-sm font-semibold text-foreground">{a.name}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${a.os === 'iOS' ? 'bg-slate-500/10 text-slate-300' : 'bg-emerald-500/10 text-emerald-400'}`}>{a.os}</span>
        </div>
        <span className="flex items-center gap-1 text-sm font-mono text-amber-400">
          <Star className="w-3.5 h-3.5 fill-amber-400" />{a.avgRating || '-'}
        </span>
      </div>

      {a.ok ? (
        <>
          {/* 情感条 */}
          <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
            <span>{a.reviewCount} 条评论</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden mb-3" title={`正面 ${a.positive} / 中性 ${a.neutral} / 负面 ${a.negative}`}>
            <div className="bg-emerald-500" style={{ width: `${(a.positive / total) * 100}%` }} />
            <div className="bg-slate-500" style={{ width: `${(a.neutral / total) * 100}%` }} />
            <div className="bg-rose-500" style={{ width: `${(a.negative / total) * 100}%` }} />
          </div>

          {a.demands.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquareQuote className="w-3.5 h-3.5" />主要需求</p>
              {a.demands.slice(0, 3).map((d) => (
                <div key={d.label} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate">{d.label}</span>
                  <span className="font-mono text-primary ml-2 shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">近期评论无明确需求信号(多为好评/泛吐槽)。</p>
          )}
        </>
      ) : (
        <p className="text-xs text-destructive">抓取失败：{a.error}</p>
      )}
    </div>
  );
}
