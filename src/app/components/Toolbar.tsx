import { Search, RefreshCw, Download, ArrowDownWideNarrow, Clock } from 'lucide-react';
import { useState } from 'react';
import type { SortKey } from '../services/types';

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortKey;
  onSortChange: (value: SortKey) => void;
  onRefresh: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  loading: boolean;
  resultCount: number;
  autoRefresh: number; // 秒,0=关闭
  onAutoRefreshChange: (seconds: number) => void;
}

const AUTO_REFRESH_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '手动' },
  { value: 30, label: '30秒' },
  { value: 60, label: '1分钟' },
  { value: 300, label: '5分钟' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'composite_score', label: '综合分' },
  { value: 'popularity', label: '绝对热度' },
  { value: 'velocity', label: '上升速度' },
  { value: 'engagement_rate', label: '互动率' },
  { value: 'published_at', label: '最新发布' },
];

export function Toolbar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  onRefresh,
  onExportJSON,
  onExportCSV,
  loading,
  resultCount,
  autoRefresh,
  onAutoRefreshChange,
}: ToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 flex-wrap mb-6">
      {/* 搜索框 */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索标题 / 作者…"
          className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* 排序 */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
        <ArrowDownWideNarrow className="w-4 h-4 text-muted-foreground" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-foreground">
              按{opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 刷新 */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        title="手动重新采集"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        刷新
      </button>

      {/* 自动刷新间隔 */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2" title="自动刷新间隔">
        <Clock className={`w-4 h-4 ${autoRefresh > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
        <select
          value={autoRefresh}
          onChange={(e) => onAutoRefreshChange(Number(e.target.value))}
          className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer"
        >
          {AUTO_REFRESH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 导出 */}
      <div className="relative">
        <button
          onClick={() => setExportOpen((v) => !v)}
          disabled={resultCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          导出 ({resultCount})
        </button>
        {exportOpen && (
          <>
            {/* 点击外部关闭 */}
            <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
            <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={() => { onExportJSON(); setExportOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                JSON
              </button>
              <button
                onClick={() => { onExportCSV(); setExportOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
