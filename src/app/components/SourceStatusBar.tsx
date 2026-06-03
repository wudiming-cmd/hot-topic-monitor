import { CheckCircle2, XCircle } from 'lucide-react';
import type { SourceStatus } from '../services/types';

interface SourceStatusBarProps {
  statuses: SourceStatus[];
}

/** 各数据源采集状态(对应需求 §8 可观测性):成功显示条数,失败明确标红。 */
export function SourceStatusBar({ statuses }: SourceStatusBarProps) {
  if (!statuses.length) return null;
  const failed = statuses.filter((s) => !s.ok);

  return (
    <div className="mb-6 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">数据源：</span>
      {statuses.map((s) => (
        <span
          key={s.source}
          title={s.ok ? `${s.count} 条` : s.error ?? '采集失败'}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
            s.ok
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {s.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {s.source}
          {s.ok ? ` ${s.count}` : ' 失败'}
        </span>
      ))}
      {failed.length > 0 && (
        <span className="text-xs text-destructive ml-1">
          {failed.length} 个源采集失败,已自动跳过
        </span>
      )}
    </div>
  );
}
