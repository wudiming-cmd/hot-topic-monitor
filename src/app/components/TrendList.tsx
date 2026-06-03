import { ArrowUp, ArrowDown, Minus, Sparkles, ExternalLink, Inbox, Star, Layers } from 'lucide-react';
import type { TrendItem } from '../services/types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { CATEGORY_META, PLATFORM_META, STATUS_META } from '../lib/display';

const STATUS_ICON = { new: Sparkles, rising: ArrowUp, stable: Minus, declining: ArrowDown } as const;

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
  const StatusIcon = STATUS_ICON[trend.status];
  const multiPlatform = (trend.sources?.length ?? 0) > 1;

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
            {/* 平台:单平台显示自身;多平台(去重合并)显示所有来源彩色标签 */}
            {multiPlatform ? (
              <span className="flex items-center gap-1 flex-wrap">
                <Layers className="w-3.5 h-3.5 text-primary" />
                {trend.sources!.map((s) => (
                  <span key={s} className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_META[s].chip}`}>
                    {PLATFORM_META[s].label}
                  </span>
                ))}
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                  {trend.sources!.length} 平台在火
                </span>
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_META[trend.source].chip}`}>
                {PLATFORM_META[trend.source].label}
              </span>
            )}

            {/* Category Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_META[trend.category].chip}`}>
              {CATEGORY_META[trend.category].label}
            </span>

            {/* Status Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${STATUS_META[trend.status].color}`}>
              <StatusIcon className="w-3 h-3" />
              {STATUS_META[trend.status].label}
            </span>

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
