import { Star, Trash2, ExternalLink, Download, Inbox } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import type { FavoriteItem } from '../hooks/useFavorites';
import { favKey } from '../hooks/useFavorites';
import { exportFavoritesCSV, exportFavoritesJSON } from '../services/export';

interface FavoritesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favorites: FavoriteItem[];
  onRemove: (key: string) => void;
  onSetNote: (key: string, note: string) => void;
  onClear: () => void;
}

export function FavoritesPanel({ open, onOpenChange, favorites, onRemove, onSetNote, onClear }: FavoritesPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            选题清单 ({favorites.length})
          </SheetTitle>
          <SheetDescription>收藏的热点会保存在本地浏览器,可加备注并导出。</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm">还没有收藏。点热点详情里的“加入选题”。</p>
            </div>
          ) : (
            <>
              {/* 工具行 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => exportFavoritesJSON(favorites)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-foreground hover:border-primary/50 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> JSON
                </button>
                <button
                  onClick={() => exportFavoritesCSV(favorites)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-foreground hover:border-primary/50 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  onClick={onClear}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 清空
                </button>
              </div>

              <div className="space-y-3">
                {favorites.map((f) => {
                  const k = favKey(f.item);
                  return (
                    <div key={k} className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <p className="text-sm font-medium text-foreground flex-1">{f.item.title}</p>
                        <a href={f.item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => onRemove(k)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground font-mono">
                        <span>{f.item.source}</span>
                        <span>·</span>
                        <span className="text-primary">综合分 {f.item.composite_score.toFixed(1)}</span>
                      </div>
                      <textarea
                        value={f.note}
                        onChange={(e) => onSetNote(k, e.target.value)}
                        placeholder="备注:为什么选它 / 怎么用…"
                        rows={2}
                        className="w-full text-xs bg-muted/30 border border-border rounded-md px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
