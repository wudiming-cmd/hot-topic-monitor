import { useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp, Flame, Zap, TrendingDown, Activity, BarChart3, Radar,
  AlertCircle, Megaphone, Sun, Moon, Star,
} from 'lucide-react';
import { MetricCard } from './components/MetricCard';
import { TrendList } from './components/TrendList';
import { PlatformTabs } from './components/PlatformTabs';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { Toolbar } from './components/Toolbar';
import { TrendDetail } from './components/TrendDetail';
import { FavoritesPanel } from './components/FavoritesPanel';
import { SourceStatusBar } from './components/SourceStatusBar';
import { AdIntelligence } from './components/AdIntelligence';
import { useTrends } from './hooks/useTrends';
import { useTheme } from './hooks/useTheme';
import { useFavorites } from './hooks/useFavorites';
import { exportTrendsCSV, exportTrendsJSON } from './services/export';
import type { Category, Platform, SortKey, TrendItem, TrendStatus } from './services/types';

type ViewMode = 'realtime' | 'monthly' | 'ads';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('realtime');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('composite_score');
  const [selectedStatus, setSelectedStatus] = useState<TrendStatus | 'all'>('all');
  const [now, setNow] = useState(() => new Date());
  const [autoRefresh, setAutoRefresh] = useState(0); // 秒,0=关
  const [detail, setDetail] = useState<TrendItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);

  const { theme, toggle: toggleTheme } = useTheme();
  const {
    favorites, isFavorite, toggle: toggleFavorite,
    remove: removeFavorite, setNote: setFavoriteNote, clear: clearFavorites,
  } = useFavorites();

  // 顶部时间每秒跳动
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { items, statuses, loading, error, fetchedAt, dataSource, refresh } = useTrends({
    platform: selectedPlatform,
    category: selectedCategory,
    search,
    sortBy,
  });

  // 自动刷新轮询(仅实时页)
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (autoRefresh <= 0 || viewMode !== 'realtime') return;
    const id = setInterval(() => refreshRef.current(), autoRefresh * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, viewMode]);

  const stats = useMemo(() => {
    const total = items.length;
    const rising = items.filter((t) => t.status === 'rising').length;
    const fresh = items.filter((t) => t.status === 'new').length;
    const declining = items.filter((t) => t.status === 'declining').length;
    const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
    return { total, rising, fresh, declining, pct };
  }, [items]);

  const displayedItems = useMemo(
    () =>
      selectedStatus === 'all' ? items : items.filter((t) => t.status === selectedStatus),
    [items, selectedStatus],
  );

  const toggleStatus = (status: TrendStatus) =>
    setSelectedStatus((cur) => (cur === status ? 'all' : status));

  const openDetail = (t: TrendItem) => {
    setDetail(t);
    setDetailOpen(true);
  };

  const navItems: { id: ViewMode; label: string; icon: typeof Radar }[] = [
    { id: 'realtime', label: '实时监控', icon: Radar },
    { id: 'monthly', label: '月度汇总', icon: BarChart3 },
    { id: 'ads', label: '广告情报', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">热点监测平台</h1>
              <p className="text-sm text-muted-foreground mt-1">多平台趋势分析与追踪</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* 选题清单 */}
              <button
                onClick={() => setFavOpen(true)}
                className="relative flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/50 transition-all"
                title="选题清单"
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">选题</span>
                {favorites.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[10px] font-bold text-black flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>

              {/* 主题切换 */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 bg-card border border-border rounded-lg text-foreground hover:border-primary/50 transition-all"
                title={theme === 'dark' ? '切换到亮色' : '切换到暗色'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <div className="hidden md:flex items-center gap-2">
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

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {viewMode === 'realtime' && (
          <>
            {error && (
              <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                数据加载失败：{error}
              </div>
            )}

            {/* 数据源采集状态 */}
            <SourceStatusBar statuses={statuses} />

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <MetricCard
                label="当前热点数" value={stats.total} icon={<Flame className="w-5 h-5" />}
                onClick={() => setSelectedStatus('all')} active={selectedStatus === 'all'}
              />
              <MetricCard
                label="快速上升" value={stats.rising} icon={<TrendingUp className="w-5 h-5" />}
                trend={`占 ${stats.pct(stats.rising)}`} trendUp color="emerald"
                onClick={() => toggleStatus('rising')} active={selectedStatus === 'rising'}
              />
              <MetricCard
                label="新冒出" value={stats.fresh} icon={<Zap className="w-5 h-5" />}
                trend={`占 ${stats.pct(stats.fresh)}`} trendUp color="amber"
                onClick={() => toggleStatus('new')} active={selectedStatus === 'new'}
              />
              <MetricCard
                label="已回落" value={stats.declining} icon={<TrendingDown className="w-5 h-5" />}
                trend={`占 ${stats.pct(stats.declining)}`} trendUp={false} color="slate"
                onClick={() => toggleStatus('declining')} active={selectedStatus === 'declining'}
              />
            </div>

            <Toolbar
              search={search} onSearchChange={setSearch}
              sortBy={sortBy} onSortChange={setSortBy}
              onRefresh={refresh}
              onExportJSON={() => exportTrendsJSON(displayedItems)}
              onExportCSV={() => exportTrendsCSV(displayedItems)}
              loading={loading} resultCount={displayedItems.length}
              autoRefresh={autoRefresh} onAutoRefreshChange={setAutoRefresh}
            />

            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'news', 'tech', 'entertainment', 'social', 'meme'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <PlatformTabs
                selectedPlatform={selectedPlatform}
                onSelectPlatform={(p) => setSelectedPlatform(p as Platform | 'all')}
              />
              {loading ? (
                <TrendListSkeleton />
              ) : (
                <TrendList
                  trends={displayedItems}
                  onSelect={openDetail}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                />
              )}
            </div>

            {fetchedAt && !loading && (
              <p className="text-xs text-muted-foreground font-mono mt-3 text-right">
                上次采集：{new Date(fetchedAt).toLocaleString('zh-CN')}
                {autoRefresh > 0 && ` · 每 ${autoRefresh < 60 ? `${autoRefresh}秒` : `${autoRefresh / 60}分钟`}自动刷新`}
              </p>
            )}
          </>
        )}

        {viewMode === 'monthly' && <MonthlyDashboard />}
        {viewMode === 'ads' && <AdIntelligence />}
      </div>

      {/* 详情抽屉 */}
      <TrendDetail
        trend={detail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isFavorite={detail ? isFavorite(detail) : false}
        onToggleFavorite={toggleFavorite}
      />

      {/* 选题清单抽屉 */}
      <FavoritesPanel
        open={favOpen}
        onOpenChange={setFavOpen}
        favorites={favorites}
        onRemove={removeFavorite}
        onSetNote={setFavoriteNote}
        onClear={clearFavorites}
      />
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
