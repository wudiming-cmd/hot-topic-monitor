import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useRef, useState } from 'react';
import { Calendar, TrendingUp, Award, Target, AlertCircle } from 'lucide-react';
import { useMonthlyStats } from '../hooks/useMonthlyStats';

export function MonthlyDashboard() {
  const { data: monthlyStats, loading, error } = useMonthlyStats();
  // 点击 KPI 卡时,平滑滚动到对应图表并短暂高亮
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focusSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlighted(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHighlighted(null), 1600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
        正在加载月度数据…
      </div>
    );
  }

  if (error || !monthlyStats) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
        <AlertCircle className="w-4 h-4" />
        月度数据加载失败:{error ?? '无数据'}
      </div>
    );
  }

  const { summary } = monthlyStats;
  const [year, month] = monthlyStats.month.split('-');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">月度汇总</h2>
          <p className="text-sm text-muted-foreground mt-1">{year}年{month}月 数据分析报告</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{monthlyStats.month}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MonthlyMetric
          label="本月总热点"
          value={summary.totalTrends.toLocaleString()}
          change={summary.totalTrendsChange}
          icon={<Target className="w-5 h-5" />}
          onClick={() => focusSection('chart-daily')}
        />
        <MonthlyMetric
          label="平均日活跃热点"
          value={String(summary.avgDailyActive)}
          change={summary.avgDailyActiveChange}
          icon={<TrendingUp className="w-5 h-5" />}
          onClick={() => focusSection('chart-daily')}
        />
        <MonthlyMetric
          label="最高热度话题"
          value={summary.topTopic}
          change={summary.topTopicScore}
          icon={<Award className="w-5 h-5" />}
          onClick={() => focusSection('chart-top')}
        />
        <MonthlyMetric
          label="新增梗图数"
          value={String(summary.newMemes)}
          change={summary.newMemesChange}
          icon={<Award className="w-5 h-5" />}
          onClick={() => focusSection('chart-category')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <ChartCard id="chart-daily" highlight={highlighted === 'chart-daily'} title="每日热点趋势" subtitle="过去30天">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyStats.dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#06b6d4"
                strokeWidth={2}
                name="总热点"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="rising"
                stroke="#10b981"
                strokeWidth={2}
                name="上升中"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="new"
                stroke="#f59e0b"
                strokeWidth={2}
                name="新冒出"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Platform Distribution */}
        <ChartCard title="平台分布" subtitle="热点来源占比">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={monthlyStats.platformDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {monthlyStats.platformDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Performance */}
        <ChartCard id="chart-category" highlight={highlighted === 'chart-category'} title="分类表现" subtitle="各分类热度对比">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyStats.categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="category"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar dataKey="count" fill="#06b6d4" name="数量" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgScore" fill="#8b5cf6" name="平均分" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Topics */}
        <ChartCard id="chart-top" highlight={highlighted === 'chart-top'} title="月度热门话题 Top 10" subtitle="综合评分排名">
          <div className="space-y-2">
            {monthlyStats.topTopics.map((topic, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all"
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-semibold text-sm ${
                    index < 3
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {topic.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{topic.platform}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-mono font-semibold text-primary">
                    {topic.score}
                  </p>
                  <p className="text-xs text-muted-foreground">{topic.views}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="最活跃时段"
          value="14:00-18:00"
          subtitle="占总热点的 34.2%"
        />
        <StatCard
          title="平均热点生命周期"
          value="18.5小时"
          subtitle="较上月减少 2.3小时"
        />
        <StatCard
          title="跨平台重复率"
          value="27.8%"
          subtitle="同一话题出现在多个平台"
        />
      </div>
    </div>
  );
}

function MonthlyMetric({
  label,
  value,
  change,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const isPositive = change.startsWith('+');
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full bg-card border border-border rounded-xl p-5 hover:border-primary/50 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <span
          className={`text-xs font-mono ${
            isPositive ? 'text-emerald-400' : 'text-muted-foreground'
          }`}
        >
          {change}
        </span>
      </div>
      <p className="text-2xl font-mono font-semibold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </button>
  );
}

function ChartCard({
  id,
  title,
  subtitle,
  highlight,
  children,
}: {
  id?: string;
  title: string;
  subtitle: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={`bg-card border rounded-xl p-6 scroll-mt-24 transition-all duration-500 ${
        highlight ? 'border-primary ring-2 ring-primary/40' : 'border-border'
      }`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className="text-3xl font-mono font-semibold text-primary mb-2">{value}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#e2e8f0"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: '12px', fontWeight: 600 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}
