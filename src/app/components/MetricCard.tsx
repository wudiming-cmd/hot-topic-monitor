interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'cyan' | 'emerald' | 'amber' | 'slate';
  onClick?: () => void;
  active?: boolean;
}

export function MetricCard({ label, value, icon, trend, trendUp, color = 'cyan', onClick, active }: MetricCardProps) {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    slate: 'text-slate-400 bg-slate-500/10',
  };

  const clickable = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      aria-pressed={clickable ? active : undefined}
      className={`text-left w-full bg-card border rounded-xl p-6 transition-all ${
        active ? 'border-primary ring-1 ring-primary/40' : 'border-border'
      } ${clickable ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-mono ${trendUp ? 'text-emerald-400' : 'text-slate-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-mono font-semibold text-foreground">{value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}
