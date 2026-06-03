import { useState } from 'react';
import { Search, ExternalLink, Megaphone, AlertCircle, Inbox } from 'lucide-react';
import { useAds } from '../hooks/useAds';
import { AD_REGIONS } from '../services/ads';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { AdItem, Category } from '../services/types';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: '全部品类' },
  { value: 'tech', label: '科技' },
  { value: 'entertainment', label: '娱乐' },
  { value: 'commerce', label: '电商' },
  { value: 'news', label: '新闻' },
  { value: 'social', label: '社交' },
  { value: 'other', label: '其它' },
];

export function AdIntelligence() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');

  const { ads, loading, error, dataSource } = useAds({
    search,
    category: category as Category | 'commerce' | 'other' | 'all',
    region,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            广告情报
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            正在投放的广告 = 已被市场验证的信号（来源：Meta 广告资料库 · {dataSource === 'mock' ? '模拟数据' : '实时'}）
          </p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索广告主 / 文案…"
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-card">{c.label}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none cursor-pointer"
        >
          <option value="all" className="bg-card">全部地区</option>
          {AD_REGIONS.map((r) => (
            <option key={r} value={r} className="bg-card">{r}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          <AlertCircle className="w-4 h-4" /> 广告数据加载失败：{error}
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-muted/40" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted/40 rounded w-2/3" />
                <div className="h-3 bg-muted/30 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mb-3 opacity-50" />
          <p className="text-sm">没有匹配的在投广告</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdCard({ ad }: { ad: AdItem }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all flex flex-col">
      {ad.media_url && (
        <ImageWithFallback src={ad.media_url} alt={ad.headline} className="w-full h-40 object-cover" />
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">{ad.advertiser}</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 投放中
          </span>
        </div>
        <p className="text-sm font-medium text-foreground mb-1">{ad.headline}</p>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{ad.body}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {ad.platforms.map((p) => (
            <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/50 text-muted-foreground">{p}</span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>{ad.regions.join('/')} · {ad.started_at}</span>
          {ad.reach && <span className="font-mono">{ad.reach}</span>}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">{ad.cta}</span>
          {ad.link && (
            <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
