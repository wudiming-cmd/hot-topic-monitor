# 平台搭建 — 多平台热点监测看板

多平台热点监测工具的前端看板（React + Vite + Tailwind + shadcn/ui）。
需求详见 [src/imports/pasted_text/hot-topic-monitor-reqs.md](src/imports/pasted_text/hot-topic-monitor-reqs.md)。

原始设计：https://www.figma.com/design/Rc12ZeBtI1TRR4QhG4Ouup/%E5%B9%B3%E5%8F%B0%E6%90%AD%E5%BB%BA

## 运行

```bash
npm i        # 安装依赖
npm run dev  # 启动开发服务器 (http://localhost:5173)
npm run build
```

## 架构

数据通过 **可切换的服务层** 获取，前端组件不直接接触数据源：

```
组件 → hooks (useTrends / useMonthlyStats)
     → services/client.ts        统一入口（mock 或真实后端）
        ├─ services/mockBackend   内置 mock 采集（模拟多 Adapter + 单源故障隔离）
        ├─ services/scoring       打分流水线：归一化打分 → 跨平台去重合并 → 排序
        └─ services/export        导出 JSON / CSV
```

- **打分**：`composite_score` 由 popularity/velocity/engagement 按权重计算（默认
  velocity:popularity:engagement = 0.5:0.3:0.2，对应需求 §3），不依赖写死的分值。
- **去重**：按归一化标题跨平台合并，保留最高分并累计来源平台（需求 §4.3）。
- **变化追踪**：每条标注 新冒出 / 上升 / 持续 / 回落 状态（需求 §4.5）。

## 切换到真实后端

服务层默认用内置 mock 数据。配置环境变量即可切到真实 API，**前端代码无需改动**：

```bash
# .env.local
VITE_API_BASE_URL=https://your-api.example.com   # 需提供 GET /trends 和 GET /monthly
```

可选权重覆盖：`VITE_WEIGHT_VELOCITY` / `VITE_WEIGHT_POPULARITY` / `VITE_WEIGHT_ENGAGEMENT`。

真实后端的 `GET /trends` 期望返回 `{ raw: TrendItem[], statuses: SourceStatus[], fetched_at: string }`，
`GET /monthly` 返回 `MonthlyStats`（结构见 [src/app/services/types.ts](src/app/services/types.ts)）。

## 功能

- **实时监控**：综合榜 + 分平台 / 分类筛选、关键词搜索、多维排序（综合分/热度/速度/互动率/时间）、
  手动刷新、导出 JSON/CSV、加载骨架屏与空态、梗图缩略图预览、跨平台来源标记。
- **月度汇总**：每日趋势、平台分布、分类表现、Top 10 话题等图表。
