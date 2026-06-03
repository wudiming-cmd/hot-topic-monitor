import { ArrowUp, ArrowDown, Minus, Sparkles, ExternalLink, Inbox, Star } from 'lucide-react';
import type { TrendItem } from '../services/types';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface TrendListProps {
  trends: TrendItem[];
  onSelect?: (trend: TrendItem) => void;
  isFavorite?: (trend: TrendItem) => boolean;
  onToggleFavorite?: (trend: TrendItem) => void;
}

export function TrendList({ trends, onSelect, isFavorite, onToggleFavorite }: TrendListProps) {
  // 列表已由服务层排序;这里仅按当前顺序展示并标注名次。
  if (trends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-sm">没有匹配的热点</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {trends.map((trend, index) => (
        <TrendRow
          key={`${trend.source}-${trend.url}-${index}`}
          trend={trend}
          rank={index + 1}
          onSelect={onSelect}
          favorite={isFavorite?.(trend) ?? false}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

function TrendRow({
  trend,
  rank,
  onSelect,
  favorite,
  onToggleFavorite,
}: {
  trend: TrendItem;
  rank: number;
  onSelect?: (t: TrendItem) => void;
  favorite?: boolean;
  onToggleFavorite?: (t: TrendItem) => void;
}) {
  const statusConfig = {
    new: { icon: Sparkles, color: 'text-amber-400 bg-amber-500/10', label: '新' },
    rising: { icon: ArrowUp, color: 'text-emerald-400 bg-emerald-500/10', label: '升' },
    stable: { icon: Minus, color: 'text-cyan-400 bg-cyan-500/10', label: '稳' },
    declining: { icon: ArrowDown, color: 'text-slate-400 bg-slate-500/10', label: '降' },
  };

  const categoryColors = {
    news: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    tech: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    social: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    meme: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const platformColors = {
    youtube: 'bg-red-500/10 text-red-400',
    reddit: 'bg-orange-500/10 text-orange-400',
    hackernews: 'bg-orange-600/10 text-orange-300',
    google_news: 'bg-blue-500/10 text-blue-400',
    tmdb: 'bg-yellow-500/10 text-yellow-400',
    giphy: 'bg-green-500/10 text-green-400',
  };

  const StatusIcon = statusConfig[trend.status].icon;

  return (
    <div className="p-4 hover:bg-muted/30 transition-all group">
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-12 text-right">
          <span className={`text-lg font-mono font-semibold ${
            rank <= 3 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            #{rank}
          </span>
        </div>

        {/* 梗图缩略图(仅 meme 且有合规预览时) */}
        {trend.category === 'meme' && trend.media_url && (
          <a
            href={trend.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <ImageWithFallback
              src={trend.media_url}
              alt={trend.title}
              className="w-20 h-16 object-cover rounded-lg border border-border"
            />
          </a>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <button
              type="button"
              onClick={() => onSelect?.(trend)}
              className="text-left text-base font-medium text-foreground group-hover:text-primary transition-colors flex-1 cursor-pointer"
            >
              {trend.title}
            </button>
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(trend)}
                title={favorite ? '取消收藏' : '加入选题'}
                className="flex-shrink-0"
              >
                <Star className={`w-4 h-4 transition-colors ${
                  favorite ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground hover:text-amber-400'
                }`} />
              </button>
            )}
            <a
              href={trend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-3">
            {/* Platform Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${platformColors[trend.source]}`}>
              {trend.source}
            </span>

            {/* Category Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${categoryColors[trend.category]}`}>
              {trend.category}
            </span>

            {/* Status Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${statusConfig[trend.status].color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig[trend.status].label}
            </span>

            {/* 跨平台来源(去重合并后出现在多个平台时显示) */}
            {trend.sources && trend.sources.length > 1 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                {trend.sources.length} 平台
              </span>
            )}

            {/* Author */}
            {trend.author && (
              <span className="text-xs text-muted-foreground">
                by {trend.author}
              </span>
            )}

            {/* Time */}
            <span className="text-xs text-muted-foreground font-mono">
              {trend.published_at}
            </span>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-6">
            <Metric label="热度" value={trend.popularity.toFixed(2)} />
            <Metric label="速度" value={trend.velocity.toFixed(2)} trend />
            <Metric label="互动率" value={`${(trend.engagement_rate * 100).toFixed(1)}%`} />
            <Metric label="综合分" value={trend.composite_score.toFixed(1)} highlight />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  trend,
  highlight
}: {
  label: string;
  value: string;
  trend?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono font-semibold ${
        highlight ? 'text-primary' : 'text-foreground'
      }`}>
        {value}
      </span>
      {trend && parseFloat(value) > 0 && (
        <ArrowUp className="w-3 h-3 text-emerald-400" />
      )}
    </div>
  );
}
