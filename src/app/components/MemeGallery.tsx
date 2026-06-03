import { Star, ExternalLink, Inbox, ArrowUp } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PLATFORM_META } from '../lib/display';
import type { TrendItem } from '../services/types';

interface MemeGalleryProps {
  memes: TrendItem[];
  onSelect?: (t: TrendItem) => void;
  isFavorite?: (t: TrendItem) => boolean;
  onToggleFavorite?: (t: TrendItem) => void;
}

/** 梗图专属画廊:网格大缩略图,比列表更直观地"看梗"。 */
export function MemeGallery({ memes, onSelect, isFavorite, onToggleFavorite }: MemeGalleryProps) {
  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-sm">暂无 trending 梗图</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {memes.map((meme, i) => {
        const fav = isFavorite?.(meme) ?? false;
        return (
          <div
            key={`${meme.source}-${meme.url}-${i}`}
            className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all flex flex-col"
          >
            {/* 缩略图(点击看详情) */}
            <button
              type="button"
              onClick={() => onSelect?.(meme)}
              className="relative block aspect-video bg-muted/30 overflow-hidden cursor-pointer"
            >
              <ImageWithFallback
                src={meme.media_url ?? ''}
                alt={meme.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* 综合分角标 */}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-mono font-semibold backdrop-blur-sm">
                {meme.composite_score.toFixed(1)}
              </span>
              {/* 速度角标 */}
              <span className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/80 text-white text-xs font-mono backdrop-blur-sm">
                <ArrowUp className="w-3 h-3" />
                {meme.velocity.toFixed(2)}
              </span>
            </button>

            {/* 信息 */}
            <div className="p-3 flex flex-col flex-1">
              <button
                type="button"
                onClick={() => onSelect?.(meme)}
                className="text-left text-sm font-medium text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors"
              >
                {meme.title}
              </button>
              <div className="mt-auto flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_META[meme.source].chip}`}>
                  {PLATFORM_META[meme.source].label}
                </span>
                <div className="flex items-center gap-2">
                  {onToggleFavorite && (
                    <button type="button" onClick={() => onToggleFavorite(meme)} title={fav ? '取消收藏' : '加入选题'}>
                      <Star className={`w-4 h-4 transition-colors ${fav ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground hover:text-amber-400'}`} />
                    </button>
                  )}
                  <a href={meme.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
