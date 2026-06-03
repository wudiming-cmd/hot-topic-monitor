import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Flame, Zap, TrendingDown, Activity, BarChart3, Radar, AlertCircle } from 'lucide-react';
import { MetricCard } from './components/MetricCard';
import { TrendList } from './components/TrendList';
import { PlatformTabs } from './components/PlatformTabs';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { Toolbar } from './components/Toolbar';
import { useTrends } from './hooks/useTrends';
import { exportTrendsCSV, exportTrendsJSON } from './services/export';
import type { Category, Platform, SortKey, TrendStatus } from './services/types';

type ViewMode = 'realtime' | 'monthly';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('realtime');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('composite_score');
  // 点击指标卡按状态筛选('all' 表示不筛选)
  const [selectedStatus, setSelectedStatus] = useState<TrendStatus | 'all'>('all');
  const [now, setNow] = useState(() => new Date());

  // 让顶部时间真正跳动(每秒刷新)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { items, loading, error, fetchedAt, dataSource, refresh } = useTrends({
    platform: selectedPlatform,
    category: selectedCategory,
    search,
    sortBy,
  });

  // 指标由真实数据计算,并给出各状态占比作为「趋势」标注
  const stats = useMemo(() => {
    const total = items.length;
    const rising = items.filter((t) => t.status === 'rising').length;
    const fresh = items.filter((t) => t.status === 'new').length;
    const declining = items.filter((t) => t.status === 'declining').length;
    const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
    return { total, rising, fresh, declining, pct };
  }, [items]);

  // 指标卡筛选后的实际展示列表(导出/计数都基于它)
  const displayedItems = useMemo(
    () =>
      selectedStatus === 'all'
        ? items
        : items.filter((t) => t.status === selectedStatus),
    [items, selectedStatus],
  );

  // 点击指标卡:再次点击同一状态则取消筛选
  const toggleStatus = (status: TrendStatus) =>
    setSelectedStatus((cur) => (cur === status ? 'all' : status));

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">热点监测平台</h1>
              <p className="text-sm text-muted-foreground mt-1">多平台趋势分析与追踪</p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('realtime')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'realtime'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Radar className="w-4 h-4" />
                  实时监控
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'monthly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  月度汇总
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Activity className={`w-5 h-5 text-primary ${loading ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-muted-foreground font-mono">
                  {dataSource === 'mock' ? '模拟数据' : dataSource === 'live' ? '实时数据' : '加载中'} ·{' '}
                  {now.toLocaleTimeString('zh-CN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {viewMode === 'realtime' ? (
          <>
            {/* 错误提示(单源/整体失败) */}
            {error && (
              <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                数据加载失败:{error}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                label="当前热点数"
                value={stats.total}
                icon={<Flame className="w-5 h-5" />}
                onClick={() => setSelectedStatus('all')}
                active={selectedStatus === 'all'}
              />
              <MetricCard
                label="快速上升"
                value={stats.rising}
                icon={<TrendingUp className="w-5 h-5" />}
                trend={`占 ${stats.pct(stats.rising)}`}
                trendUp={true}
                color="emerald"
                onClick={() => toggleStatus('rising')}
                active={selectedStatus === 'rising'}
              />
              <MetricCard
                label="新冒出"
                value={stats.fresh}
                icon={<Zap className="w-5 h-5" />}
                trend={`占 ${stats.pct(stats.fresh)}`}
                trendUp={true}
                color="amber"
                onClick={() => toggleStatus('new')}
                active={selectedStatus === 'new'}
              />
              <MetricCard
                label="已回落"
                value={stats.declining}
                icon={<TrendingDown className="w-5 h-5" />}
                trend={`占 ${stats.pct(stats.declining)}`}
                trendUp={false}
                color="slate"
                onClick={() => toggleStatus('declining')}
                active={selectedStatus === 'declining'}
              />
            </div>

            {/* 工具栏:搜索 / 排序 / 刷新 / 导出 */}
            <Toolbar
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onRefresh={refresh}
              onExportJSON={() => exportTrendsJSON(displayedItems)}
              onExportCSV={() => exportTrendsCSV(displayedItems)}
              loading={loading}
              resultCount={displayedItems.length}
            />

            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'news', 'tech', 'entertainment', 'social', 'meme'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                    }`}
                  >
                    {category === 'all' ? '全部分类' :
                     category === 'news' ? '新闻' :
                     category === 'tech' ? '科技' :
                     category === 'entertainment' ? '娱乐' :
                     category === 'social' ? '社交' : '梗图'}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Tabs & Trend List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <PlatformTabs
                selectedPlatform={selectedPlatform}
                onSelectPlatform={(p) => setSelectedPlatform(p as Platform | 'all')}
              />
              {loading ? (
                <TrendListSkeleton />
              ) : (
                <TrendList trends={displayedItems} />
              )}
            </div>

            {/* 采集时间 */}
            {fetchedAt && !loading && (
              <p className="text-xs text-muted-foreground font-mono mt-3 text-right">
                上次采集:{new Date(fetchedAt).toLocaleString('zh-CN')}
              </p>
            )}
          </>
        ) : (
          <MonthlyDashboard />
        )}
      </div>
    </div>
  );
}

function TrendListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 flex items-start gap-4 animate-pulse">
          <div className="w-12 h-6 bg-muted/40 rounded" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-muted/40 rounded w-3/4" />
            <div className="flex gap-2">
              <div className="h-4 w-16 bg-muted/30 rounded" />
              <div className="h-4 w-16 bg-muted/30 rounded" />
              <div className="h-4 w-12 bg-muted/30 rounded" />
            </div>
            <div className="h-4 bg-muted/20 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
