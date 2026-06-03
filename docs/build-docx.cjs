const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
  LevelFormat,
} = require('docx');

const FONT = 'Microsoft YaHei';
const MONO = 'Consolas';
const CONTENT_W = 9026; // A4, 1" margins

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const HEAD_FILL = 'E8EEF5';
const CODE_FILL = 'F4F5F7';

const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const p = (t, opts = {}) =>
  new Paragraph({ spacing: { after: 120, line: 300 }, children: [new TextRun({ text: t, ...opts })] });
const bullet = (t) =>
  new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60, line: 300 }, children: [new TextRun(t)] });
const numbered = (t) =>
  new Paragraph({ numbering: { reference: 'nums', level: 0 }, spacing: { after: 60, line: 300 }, children: [new TextRun(t)] });

function codeBlock(code) {
  const lines = code.split('\n');
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      borders, width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill: CODE_FILL, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: lines.map((ln) => new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: ln || ' ', font: MONO, size: 18 })] })),
    })] })],
  });
}

function makeTable(headerCells, dataRows, widths) {
  const headRow = new TableRow({
    tableHeader: true,
    children: headerCells.map((c, i) => new TableCell({
      borders, width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: HEAD_FILL, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 }, verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20 })] })],
    })),
  });
  const rows = dataRows.map((r) => new TableRow({
    children: r.map((c, i) => new TableCell({
      borders, width: { size: widths[i], type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 }, verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 20 })] })],
    })),
  }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...rows] });
}
const spacer = () => new Paragraph({ spacing: { after: 80 }, children: [] });

const children = [];

// Cover
children.push(
  new Paragraph({ spacing: { before: 2600, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '多平台热点监测平台', bold: true, size: 56 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: '需求文档（实现版）', bold: true, size: 40, color: '2E5C8A' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: '版本 v3.0', size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: '日期：2026-06-03', size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: '在线预览：Vercel 自动部署（GitHub wudiming-cmd/hot-topic-monitor）', size: 20, color: '666666' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: '用途：对照已上线看板，明确功能范围、接口契约、部署与待办', size: 20, color: '666666' })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

// TOC
children.push(
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: '目录', bold: true, size: 32 })] }),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' }),
  new Paragraph({ children: [new PageBreak()] }),
);

// 1
children.push(h1('1. 项目概述'));
children.push(p('一个内部用的多平台热点监测看板，持续采集各平台“什么在火”，经统一打分、去重、变化追踪后产出排序榜单，辅助运营团队做选题判断。产出的是“情报/选题信号”，不直接面向终端用户。'));
children.push(p('核心回答三个问题：'));
children.push(numbered('各平台现在有哪些热点内容 / 话题 / 新闻 / 娱乐？'));
children.push(numbered('现在有哪些热门梗图（meme）？'));
children.push(numbered('哪个最受欢迎、涨得最快（跨平台综合排序）？'));
children.push(spacer());
children.push(h2('1.1 当前实现状态'));
children.push(makeTable(
  ['模块', '状态', '说明'],
  [
    ['前端看板（React + Vite + Tailwind + shadcn/ui）', '✅ 已完成', '实时监控 / 月度汇总 / 广告情报 三大视图'],
    ['服务层（打分/去重/排序/导出，可切换数据源）', '✅ 已完成', 'src/app/services/，默认 mock'],
    ['内置 mock 后端', '✅ 已完成', '模拟多 Adapter 采集 + 单源故障隔离'],
    ['主题/收藏/详情/自动刷新等体验功能', '✅ 已完成', '见 §4.4'],
    ['部署（Vercel + GitHub 自动部署）', '✅ 已完成', '见 §9'],
    ['真实后端（采集/存储/调度）', '⬜ 待建', '实现 §5 接口契约即可对接，前端零改动'],
    ['外部数据源对接（各平台 API）', '⬜ 待申请/待接', '见 §6'],
    ['历史快照 / velocity 趋势曲线', '⬜ 待建', '依赖后端存储'],
  ],
  [4000, 1400, 3626],
));
children.push(p('数据源切换：配置环境变量 VITE_API_BASE_URL 指向真实后端，前端自动改走真实 API。', { italics: true, color: '666666' }));

// 2
children.push(h1('2. 范围与合规边界（必读）'));
children.push(h2('2.1 范围内'));
[
  '采集公开的热点信号与元数据：标题、链接、作者、发布时间、热度指标（播放/赞/评论/转发/upvote 等）。',
  '基于信号做热度计算、上升速度计算、跨平台综合排序、去重合并、变化追踪。',
  '梗图发现：通过官方授权 API（Giphy/Tenor/Imgflip）获取 trending，仅保存元数据与官方允许的预览/嵌入。',
  '广告情报：通过 Meta 广告资料库查询某品类正在投放的广告。',
].forEach((t) => children.push(bullet(t)));
children.push(h2('2.2 红线'));
[
  '不批量下载/存储/再分发受版权内容；展示媒体只用官方 API 允许的方式（缩略图/嵌入/授权调用）。',
  '遵守各平台 ToS、robots、速率限制；限流要做指数退避（带 jitter）。',
  '他人内容真实点击率是私有数据，无法获取。本平台用公开信号（绝对热度 + 上升速度 + 互动率）作为受欢迎程度的代理指标。',
].forEach((t) => children.push(bullet(t)));

// 3
children.push(h1('3. 核心指标定义'));
children.push(makeTable(
  ['指标', '含义', '计算方式', '实现位置'],
  [
    ['绝对热度 popularity', '累计热度', '各平台原始指标归一化到 0–1', '后端采集时归一化'],
    ['上升速度 velocity', '单位时间热度增量', '(本次热度 − 上次采集热度) / 时间间隔，归一化 0–1', '后端（依赖历史快照）'],
    ['互动率 engagement_rate', '单位曝光互动', '(赞+评论+转发) / 曝光或播放量，0–1', '后端采集时计算'],
    ['综合热度分 composite_score', '跨平台总分', '三项加权求和后映射 0–100', '前端服务层 scoring.ts（已实现）'],
  ],
  [2200, 1700, 3126, 2000],
));
children.push(spacer());
children.push(p('默认权重 velocity:popularity:engagement = 0.5 : 0.3 : 0.2（velocity 最高），可通过环境变量 VITE_WEIGHT_VELOCITY/POPULARITY/ENGAGEMENT 覆盖。'));

// 4
children.push(h1('4. 功能需求'));
children.push(h2('4.1 实时监控页（✅ 已实现）'));
[
  '综合榜 + 分平台榜：平台 Tab（综合/YouTube/Reddit/Hacker News/Google News/TMDb/Giphy/TikTok/Facebook）。TikTok/Facebook 已就绪,真实数据 TikTok 需第三方、Facebook 以广告资料库为主(见 §6.2)。',
  '分类筛选：全部/新闻/科技/娱乐/社交/梗图。',
  '关键词搜索：按标题/作者过滤。',
  '多维排序：综合分/绝对热度/上升速度/互动率/最新发布。',
  '状态筛选：点击指标卡（快速上升/新冒出/已回落）筛选榜单，再点取消；选中态高亮。',
  '指标卡：当前热点数、快速上升、新冒出、已回落；数值与占比由实时数据计算。',
  '热点变化追踪：每条标注 新冒出/上升/持续/回落 四种状态。',
  '跨平台去重可视化：同一话题被多平台收录时合并，用彩色平台标签展示“N 平台在火”。',
  '梗图画廊：分类选“梗图”时切换为网格大图卡片（综合分/速度角标、收藏、详情），仅用合规预览。',
  '热点详情抽屉：点条目弹出侧栏，展示完整指标、跨平台来源、作者/时间、原文链接、收藏按钮。',
  '自动刷新：可选 手动/30秒/1分钟/5分钟 轮询采集。',
  '导出：当前结果导出 JSON / CSV（CSV 带 BOM，Excel 正确识别中文）。',
  '数据源状态条：展示各源成功/失败与条数，单源失败明确标红并提示已跳过。',
  '加载骨架屏 / 空态 / 错误提示。',
].forEach((t) => children.push(bullet(t)));
children.push(h2('4.2 月度汇总页（✅ 已实现）'));
[
  '月份选择：可切换月份（当前 mock 提供多月数据），切换时数据联动。',
  'KPI 卡：本月总热点、平均日活跃热点、最高热度话题、新增梗图数（点击定位到对应图表）。',
  '图表：每日热点趋势（折线）、平台分布（饼图）、分类表现（柱状）、Top 10 话题（榜单）。',
  '附加统计：最活跃时段、平均生命周期、跨平台重复率。',
].forEach((t) => children.push(bullet(t)));
children.push(h2('4.3 广告情报页（✅ 已实现）'));
[
  '调用 Meta 广告资料库口径，展示正在投放的广告作为“已被市场验证”的信号。',
  '筛选：关键词（广告主/文案）+ 品类 + 投放地区。',
  '广告卡片：广告主、投放中状态、标题/文案、版位、地区、起投时间、触达量级、CTA、合规预览图、广告库链接。',
].forEach((t) => children.push(bullet(t)));
children.push(h2('4.4 通用 / 体验（✅ 已实现）'));
[
  '明暗主题切换：一键切换，记忆偏好，默认跟随系统。',
  '选题清单：行内/详情加星收藏；右上角入口带计数；清单支持加备注、导出 JSON/CSV、移除、清空（本地持久化）。',
  '响应式适配：手机宽度下导航变图标、指标卡两列、工具栏换行，无横向滚动。',
  '首屏性能：重型视图（含 recharts）懒加载 + 代码分割，首屏 JS 约 103KB（gzip 33KB）。',
].forEach((t) => children.push(bullet(t)));
children.push(h2('4.5 待建（后端 / 扩展）'));
[
  '多渠道采集（Adapter 架构）：每源一个 Adapter，统一 fetch(limit) -> List[TrendItem]；加新平台不改主流程；单源失败隔离 + 日志告警。',
  '历史快照与变化追踪：每次采集入库，供 velocity 计算与“新/升/稳/降”判定，并支撑单条热点的历史趋势曲线。',
  '调度：定时采集（可配频率）+ 手动触发。',
  '存储：结构化数据入库（热点条目、历史快照、来源映射）；媒体仅存合规来源预览。',
  '日期区间筛选（月度页，在按月之上）。',
  '（P3）以图搜图/语义检索：仅对合规素材库。',
].forEach((t) => children.push(bullet(t)));

// 5
children.push(h1('5. 接口契约（前后端对接）'));
children.push(p('前端服务层 client.ts、ads.ts 已按以下契约实现。后端实现这些端点并设置 VITE_API_BASE_URL 即可对接，前端无需改动。'));
children.push(h2('5.1 GET /trends — 实时热点榜'));
children.push(codeBlock(`{
  "raw": [ /* TrendItem[]，见 5.4 */ ],
  "statuses": [
    { "source": "youtube", "ok": true,  "count": 12 },
    { "source": "reddit",  "ok": false, "count": 0, "error": "rate limited" }
  ],
  "fetched_at": "2026-06-03T10:00:00Z"
}`));
children.push(spacer());
children.push(h2('5.2 GET /monthly?month=YYYY-MM — 月度汇总'));
children.push(p('返回 MonthlyStats：{ month, dailyTrends[], platformDistribution[], categoryPerformance[], topTopics[], summary{} }'));
children.push(h2('5.3 GET /ads?q=&category=&region= — 广告情报'));
children.push(codeBlock(`{
  "ads": [ /* AdItem[]，见 5.5 */ ],
  "fetched_at": "2026-06-03T10:00:00Z"
}`));
children.push(spacer());
children.push(h2('5.4 TrendItem 数据结构'));
children.push(codeBlock(`interface TrendItem {
  source: 'youtube' | 'reddit' | 'hackernews'
        | 'google_news' | 'tmdb' | 'giphy';
  category: 'news' | 'tech' | 'entertainment' | 'social' | 'meme';
  title: string;
  url: string;
  media_url?: string | null;       // 仅合规来源的图/封面/预览
  popularity: number;              // 归一化绝对热度 0–1
  velocity: number;                // 上升速度 0–1
  engagement_rate: number;         // 互动率 0–1
  composite_score: number;         // 综合分 0–100（可后端算或留空由前端算）
  author?: string;
  published_at: string;            // 相对时间或 ISO
  fetched_at?: string;             // 本次采集 ISO（算 velocity 用）
  sources?: Platform[];            // 去重合并后出现过的平台
  status: 'new' | 'rising' | 'stable' | 'declining';
  extra?: Record<string, unknown>;
}`));
children.push(spacer());
children.push(h2('5.5 AdItem 数据结构'));
children.push(codeBlock(`interface AdItem {
  id: string;
  advertiser: string;              // 投放主体/主页名
  category: Category | 'commerce' | 'other';
  platforms: ('facebook'|'instagram'|'messenger'|'audience_network')[];
  headline: string;
  body: string;
  cta: string;                     // 如 "Shop Now"
  media_url?: string | null;       // 合规预览图
  link?: string;                   // 广告库/落地页链接
  status: 'active' | 'inactive';
  started_at: string;
  regions: string[];               // 如 ["US","JP"]
  reach?: string;                  // 触达量级区间
}`));

// 6
children.push(h1('6. 外部数据源 API 清单（后端采集需申请）'));
children.push(h2('6.1 MVP 必须（A 档，对应看板 6 个平台 Tab）'));
children.push(makeTable(
  ['来源', '用途', '接口', '密钥', '费用', '字段映射'],
  [
    ['YouTube', '热门视频', 'Data API v3 videos?chart=mostPopular', '需', '免费/日1万', 'popularity←viewCount；engagement←(like+comment)/view'],
    ['Reddit', '社交/梗图', '/r/{sub}/hot（OAuth）或公开 .json', '需 OAuth', '免费层非商业', 'popularity←ups；engagement←comments/ups'],
    ['Hacker News', '科技热门', 'Firebase topstories + item/{id}', '免', '免费', 'popularity←score；engagement←descendants'],
    ['Google News', '热点新闻', 'RSS news.google.com/rss', '免', '免费', '无热度数字，用排名位次代理'],
    ['TMDb', '热点娱乐', '/3/trending/all/{day|week}', '需', '免费', 'popularity←popularity；media_url←poster'],
    ['Giphy', 'trending 梗图', '官方 trending endpoint', '需', '免费有限速', 'media_url←官方预览；排名作 popularity'],
  ],
  [1100, 900, 2426, 700, 1100, 2696],
));
children.push(spacer());
children.push(h2('6.2 广告情报 & 扩展（B/C 档）'));
children.push(bullet('Meta 广告资料库（广告情报页数据源，需访问令牌）。'));
children.push(bullet('TikTok（前端已就绪）：推荐用官方 TikTok Creative Center（ads.tiktok.com/creative/creativeCenter → Trends），免费免登录，提供热门话题/音乐/视频/Top Ads。后端可复刻匿名令牌握手调用其 creative_radar_api 接口，或用无头浏览器渲染抓取；遵守 ToS 与频率限制。第三方数据商为备选。'));
children.push(bullet('Facebook（前端已就绪）：自然内容无官方热榜 API，FB 侧公开数据以广告资料库为主。'));
children.push(bullet('Tenor、Imgflip（梗图，免费/免 key）。'));
children.push(bullet('X/Twitter（API v2，按量付费，慎用）、Pinterest。'));
children.push(h2('6.3 密钥管理'));
children.push(p('所有 API key 走环境变量 / secret 管理，不进代码库。'));

// 7
children.push(h1('7. 关键实现要点（非 API，但必须）'));
children.push(numbered('velocity / status / 历史趋势曲线依赖历史快照：需要后端存储每次采集结果，不是单个接口能给。'));
children.push(numbered('容错：单源失败隔离、超时控制、速率限制 + 指数退避（带 jitter）。'));
children.push(numbered('幂等：重复运行不产生脏数据（去重键 URL + 归一化标题）。'));
children.push(numbered('可观测：每源采集状态、成功条数、失败原因有日志，并通过 statuses 透传给前端。'));

// 8
children.push(h1('8. 非功能需求'));
[
  '可扩展：新增平台只需加 Adapter，主流程不改。',
  '合规：遵守各平台 ToS/robots/速率；媒体处理遵守 §2 红线。',
  '可配置：目标地区/语言、采集频率、关键词、权重走配置，不写死。',
  '性能：前端代码分割 + 懒加载；后端采集异步 + 并发控制。',
  '可用性：响应式适配，支持移动端查看；明暗主题。',
].forEach((t) => children.push(bullet(t)));

// 9
children.push(h1('9. 部署与运维（✅ 前端已上线）'));
[
  '前端：纯静态站，npm run build 产出 dist/。',
  '托管：GitHub 仓库 wudiming-cmd/hot-topic-monitor → Vercel 自动部署（vercel.json 已配置构建命令与 SPA 重写）；每次 git push 自动重新发布。',
  '配置：netlify.toml / vercel.json 已就位；真实后端就绪后在托管平台设置 VITE_API_BASE_URL 环境变量即可切换。',
  '访问控制：如需公开访问，关闭 Vercel 的 Deployment Protection。',
  '后端（待建）：建议独立服务（Python/Node），提供 §5 接口；媒体走对象存储；数据库 PostgreSQL（MVP 可 SQLite）。',
].forEach((t) => children.push(bullet(t)));

// 10
children.push(h1('10. 里程碑'));
children.push(makeTable(
  ['阶段', '内容', '状态'],
  [
    ['P0 前端', '看板 UI + 服务层 + mock + 打分/去重/排序/导出 + 三大视图 + 体验功能 + 部署', '✅ 已完成'],
    ['P1 后端 MVP', 'A 档源 Adapter（先接免 key 的 Hacker News）+ 归一化 + 入库 + /trends /monthly', '⬜'],
    ['P2 调度与追踪', '定时调度 + 历史快照 + velocity/status + 趋势曲线 + 梗图源 + /ads（Meta）', '⬜'],
    ['P3 情报与扩展', 'B/C 档（X 控量/Pinterest/TikTok）+ 日期区间 + 以图搜图', '⬜'],
  ],
  [1600, 6126, 1300],
));

// 11
children.push(h1('11. 交付物'));
children.push(numbered('前端源码 + README（安装、配置、运行、部署）。— ✅'));
children.push(numbered('后端服务实现 /trends、/monthly、/ads（契约见 §5）。'));
children.push(numbered('数据库 schema / 迁移脚本（热点条目、历史快照、来源映射）。'));
children.push(numbered('各 API 申请与配置文档（怎么拿 key、放哪）。'));
children.push(numbered('各源 Adapter 的字段映射实现（§6 表格）。'));

// 12
children.push(h1('12. 验收标准'));
[
  '能稳定定时采集 A 档全部源，单源故障不影响整体。',
  '总榜按 composite_score 正确排序，同一话题/梗跨平台已去重合并并可视化。',
  '能区分 新冒出/持续/上升/回落 四种状态。',
  '梗图模块返回当下 trending 的梗（经官方 API），仅用合规预览。',
  '广告情报页能按关键词/品类/地区返回在投广告。',
  '所有数据源遵守速率限制与使用条款；媒体处理符合 §2。',
  '前端配置 VITE_API_BASE_URL 后，看板直接展示真实数据，无需改前端代码。',
].forEach((t) => children.push(bullet(t)));

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: '1F3D5C' },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: '2E5C8A' },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 280 } } } }] },
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 280 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
      children: [new TextRun({ text: '多平台热点监测平台 · 需求文档 v3.0', size: 16, color: '888888' })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '第 ', size: 16, color: '888888' }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
        new TextRun({ text: ' 页 / 共 ', size: 16, color: '888888' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '888888' }),
        new TextRun({ text: ' 页', size: 16, color: '888888' }),
      ],
    })] }) },
    children,
  }],
});

const out = path.join(__dirname, '平台需求文档.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('written:', out, buf.length, 'bytes');
});
