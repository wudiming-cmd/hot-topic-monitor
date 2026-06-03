import { ExternalLink, Star } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from './ui/sheet';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { TrendItem } from '../services/types';

const CATEGORY_LABEL: Record<string, string> = {
  news: '新闻', tech: '科技', entertainment: '娱乐', social: '社交', meme: '梗图',
};
const STATUS_LABEL: Record<string, string> = {
  new: '新冒出', rising: '快速上升', stable: '持续在榜', declining: '已回落',
};

interface TrendDetailProps {
  trend: TrendItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: (t: TrendItem) => void;
}

export function TrendDetail({ trend, open, onOpenChange, isFavorite, onToggleFavorite }: TrendDetailProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {trend && (
          <>
            <SheetHeader>
              <SheetDescription className="font-mono">
                {trend.source} · {CATEGORY_LABEL[trend.category] ?? trend.category} · {STATUS_LABEL[trend.status]}
              </SheetDescription>
              <SheetTitle className="text-lg leading-snug">{trend.title}</SheetTitle>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-5">
              {/* 媒体预览 */}
              {trend.media_url && (
                <ImageWithFallback
                  src={trend.media_url}
                  alt={trend.title}
                  className="w-full h-44 object-cover rounded-lg border border-border"
                />
              )}

              {/* 操作 */}
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleFavorite(trend)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    isFavorite
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
                  {isFavorite ? '已收藏' : '加入选题'}
                </button>
                <a
                  href={trend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-card border border-border text-foreground hover:border-primary/50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  打开原文
                </a>
              </div>

              {/* 指标 */}
              <div className="grid grid-cols-2 gap-3">
                <Stat label="综合分" value={trend.composite_score.toFixed(1)} highlight />
                <Stat label="绝对热度" value={trend.popularity.toFixed(2)} />
                <Stat label="上升速度" value={trend.velocity.toFixed(2)} />
                <Stat label="互动率" value={`${(trend.engagement_rate * 100).toFixed(1)}%`} />
              </div>

              {/* 跨平台来源 */}
              {trend.sources && trend.sources.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">出现平台</p>
                  <div className="flex flex-wrap gap-2">
                    {trend.sources.map((s) => (
                      <span key={s} className="px-2 py-1 rounded text-xs font-medium bg-muted/50 text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 元信息 */}
              <div className="space-y-1.5 text-sm">
                {trend.author && <Meta label="作者" value={trend.author} />}
                <Meta label="发布" value={trend.published_at} />
                {trend.fetched_at && (
                  <Meta label="采集" value={new Date(trend.fetched_at).toLocaleString('zh-CN')} />
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-mono font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-mono text-right">{value}</span>
    </div>
  );
}
