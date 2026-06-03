const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
  LevelFormat, ExternalHyperlink, TabStopType, TabStopPosition,
} = require('docx');

const FONT = 'Microsoft YaHei';
const MONO = 'Consolas';
const CONTENT_W = 9026; // A4, 1" margins

// ---------- helpers ----------
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const HEAD_FILL = 'E8EEF5';
const CODE_FILL = 'F4F5F7';

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 300 },
    children: [new TextRun({ text, ...opts })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60, line: 300 },
    children: [new TextRun(text)],
  });
}
function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'nums', level: 0 },
    spacing: { after: 60, line: 300 },
    children: [new TextRun(text)],
  });
}
// rich bullet: array of {text, bold}
function bulletRich(runs) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60, line: 300 },
    children: runs.map((r) => new TextRun(r)),
  });
}

// code block: shaded single-cell table, each line a monospace paragraph
function codeBlock(code) {
  const lines = code.split('\n');
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: CONTENT_W, type: WidthType.DXA },
            shading: { fill: CODE_FILL, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: lines.map(
              (ln) =>
                new Paragraph({
                  spacing: { after: 0, line: 240 },
                  children: [new TextRun({ text: ln || ' ', font: MONO, size: 18 })],
                }),
            ),
          }),
        ],
      }),
    ],
  });
}

// table from header[] and rows[][], with column widths
function makeTable(headerCells, dataRows, widths) {
  const headRow = new TableRow({
    tableHeader: true,
    children: headerCells.map(
      (c, i) =>
        new TableCell({
          borders,
          width: { size: widths[i], type: WidthType.DXA },
          shading: { fill: HEAD_FILL, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20 })] })],
        }),
    ),
  });
  const rows = dataRows.map(
    (r) =>
      new TableRow({
        children: r.map(
          (c, i) =>
            new TableCell({
              borders,
              width: { size: widths[i], type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 20 })] })],
            }),
        ),
      }),
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headRow, ...rows],
  });
}
function spacer() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

// ---------- content ----------
const children = [];

// Cover
children.push(
  new Paragraph({ spacing: { before: 2600, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '多平台热点监测平台', bold: true, size: 56 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: '需求文档（实现版）', bold: true, size: 40, color: '2E5C8A' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: '版本 v2.0', size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: '日期：2026-06-03', size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: '用途：对照已实现的前端看板，明确功能范围、前后端接口契约与待办', size: 22, color: '666666' })] }),
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
    ['前端看板（React + Vite + Tailwind + shadcn/ui）', '✅ 已完成', '实时监控页 + 月度汇总页'],
    ['服务层（打分/去重/排序/导出，可切换数据源）', '✅ 已完成', 'src/app/services/，默认 mock'],
    ['内置 mock 后端', '✅ 已完成', '模拟多 Adapter 采集 + 单源故障隔离'],
    ['真实后端（采集/存储/调度）', '⬜ 待建', '实现 §5 接口契约即可对接，前端零改动'],
    ['外部数据源对接（各平台 API）', '⬜ 待申请/待接', '见 §6'],
  ],
  [4200, 1400, 3426],
));
children.push(p('切换方式：配置环境变量 VITE_API_BASE_URL 指向真实后端，前端自动改走真实 API。', { italics: true, color: '666666' }));

// 2
children.push(h1('2. 范围与合规边界（必读）'));
children.push(h2('2.1 范围内'));
children.push(bullet('采集公开的热点信号与元数据：标题、链接、作者、发布时间、热度指标（播放/赞/评论/转发/upvote 等）。'));
children.push(bullet('基于信号做热度计算、上升速度计算、跨平台综合排序、去重合并、变化追踪。'));
children.push(bullet('梗图发现：通过官方授权 API（Giphy/Tenor/Imgflip）获取 trending，仅保存元数据与官方允许的预览/嵌入。'));
children.push(h2('2.2 红线'));
children.push(bullet('不批量下载/存储/再分发受版权内容；展示媒体只用官方 API 允许的方式（缩略图/嵌入/授权调用）。'));
children.push(bullet('遵守各平台 ToS、robots、速率限制；限流要做指数退避（带 jitter）。'));
children.push(bullet('他人内容真实点击率是私有数据，无法获取。本平台用公开信号（绝对热度 + 上升速度 + 互动率）作为受欢迎程度的代理指标。'));

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
children.push(bulletRich([
  { text: '默认权重 ', bold: false },
  { text: 'velocity:popularity:engagement = 0.5 : 0.3 : 0.2', bold: true },
  { text: '（velocity 最高）。', bold: false },
]));
children.push(bullet('可通过环境变量覆盖：VITE_WEIGHT_VELOCITY / VITE_WEIGHT_POPULARITY / VITE_WEIGHT_ENGAGEMENT。'));
children.push(p('注：composite_score 与跨平台去重合并已在前端服务层实现；后端只需提供归一化后的三项原始指标，也可由后端算好直接返回。', { italics: true, color: '666666' }));

// 4
children.push(h1('4. 功能需求'));
children.push(h2('4.1 实时监控页（✅ 已实现）'));
[
  '综合榜 + 分平台榜：平台 Tab 切换（综合/YouTube/Reddit/Hacker News/Google News/TMDb/Giphy）。',
  '分类筛选：全部/新闻/科技/娱乐/社交/梗图。',
  '关键词搜索：按标题/作者过滤。',
  '多维排序：综合分/绝对热度/上升速度/互动率/最新发布。',
  '状态筛选：点击指标卡（快速上升/新冒出/已回落）筛选榜单，再点取消。',
  '指标卡：当前热点数、快速上升、新冒出、已回落；数值与占比由实时数据计算。',
  '热点变化追踪：每条标注 新冒出/上升/持续/回落 四种状态。',
  '梗图预览：meme 类展示官方允许的缩略图（带加载失败兜底）。',
  '跨平台来源标记：去重合并后，同一话题出现在多平台时显示“N 平台”。',
  '导出：当前结果导出 JSON / CSV（CSV 带 BOM，Excel 正确识别中文）。',
  '手动刷新 + 采集时间 + 数据来源标记（模拟/实时）。',
  '加载骨架屏 / 空态 / 错误提示。',
].forEach((t) => children.push(bullet(t)));
children.push(h2('4.2 月度汇总页（✅ 已实现）'));
[
  'KPI 卡：本月总热点、平均日活跃热点、最高热度话题、新增梗图数（点击可定位到对应图表）。',
  '图表：每日热点趋势（折线）、平台分布（饼图）、分类表现（柱状）、Top 10 话题（榜单）。',
  '附加统计：最活跃时段、平均生命周期、跨平台重复率。',
].forEach((t) => children.push(bullet(t)));
children.push(h2('4.3 待建（后端 / 扩展）'));
[
  '多渠道采集（Adapter 架构）：每源一个 Adapter，统一 fetch(limit) -> List[TrendItem]；加新平台不改主流程；单源失败隔离 + 日志告警。',
  '去重合并：URL + 归一化标题（可加 pHash 辅助），合并保留多平台来源。',
  '历史快照与变化追踪：每次采集入库，供 velocity 与状态判定。',
  '调度：定时采集（可配频率，如每小时/30 分钟）+ 手动触发。',
  '存储：结构化数据入库（热点条目、历史快照、来源映射）；媒体仅存合规来源预览。',
  '（P3）以图搜图/语义检索：仅对合规素材库。',
].forEach((t) => children.push(bullet(t)));

// 5
children.push(h1('5. 接口契约（前后端对接）'));
children.push(p('前端服务层 client.ts 已按以下契约实现。后端实现这两个端点并设置 VITE_API_BASE_URL 即可对接，前端无需改动。'));
children.push(h2('5.1 GET /trends — 实时热点榜'));
children.push(p('响应：'));
children.push(codeBlock(`{
  "raw": [ /* TrendItem[]，见 5.3 */ ],
  "statuses": [
    { "source": "youtube", "ok": true,  "count": 12 },
    { "source": "reddit",  "ok": false, "count": 0, "error": "rate limited" }
  ],
  "fetched_at": "2026-06-03T10:00:00Z"
}`));
children.push(spacer());
children.push(h2('5.2 GET /monthly — 月度汇总'));
children.push(p('返回 MonthlyStats 结构（字段见 types.ts）：'));
children.push(codeBlock(`{ month, dailyTrends[], platformDistribution[],
  categoryPerformance[], topTopics[], summary{} }`));
children.push(spacer());
children.push(h2('5.3 TrendItem 数据结构（统一 Schema）'));
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
  extra?: Record<string, unknown>; // 各平台特有字段
}`));
children.push(p('说明：后端最少只需给 popularity / velocity / engagement_rate 三项归一化指标 + 基础元数据；composite_score、去重、排序前端服务层会处理。statuses 用于可观测性（展示单源采集成败）。', { italics: true, color: '666666' }));

// 6
children.push(h1('6. 外部数据源 API 清单（后端采集需申请）'));
children.push(p('优先级 A = 官方 API 好用且免费，优先做。当前看板的平台 Tab 正好对应 6 个 A 档源，为 MVP 必须项。'));
children.push(h2('6.1 MVP 必须（A 档）'));
children.push(makeTable(
  ['来源', '用途', '接口', '密钥', '费用', '字段映射'],
  [
    ['YouTube', '热门视频', 'Data API v3 videos?chart=mostPopular&part=snippet,statistics', '需', '免费/日1万配额', 'popularity←viewCount；engagement←(like+comment)/view'],
    ['Reddit', '社交/梗图', '/r/{sub}/hot（OAuth）或公开 .json（带 UA）', '需 OAuth', '免费层非商业', 'popularity←ups；engagement←comments/ups'],
    ['Hacker News', '科技热门', 'Firebase API topstories + item/{id}', '免', '免费', 'popularity←score；engagement←descendants'],
    ['Google News', '热点新闻', 'RSS news.google.com/rss?hl=&gl=&ceid=', '免', '免费', '无热度数字，popularity 用排名位次代理'],
    ['TMDb', '热点娱乐', '/3/trending/all/{day|week}', '需', '免费', 'popularity←popularity；media_url←poster'],
    ['Giphy', 'trending 梗图', '官方 trending endpoint', '需', '免费有限速', 'media_url←官方预览；排名作 popularity'],
  ],
  [1100, 900, 2526, 800, 1100, 2596],
));
children.push(spacer());
children.push(h2('6.2 扩展（B/C 档，后续按需）'));
children.push(bullet('Tenor（trending GIF，Google，免费 key）、Imgflip（梗图模板 get_memes，免 key）。'));
children.push(bullet('Meta 广告资料库（在投广告情报，需访问令牌）。'));
children.push(bullet('X/Twitter（API v2，按量付费 ~$0.005/条，慎用，需配额控制）。'));
children.push(bullet('Pinterest（OAuth，免费层有限）、TikTok（无官方公开 API，需第三方数据商）。'));
children.push(h2('6.3 密钥管理'));
children.push(p('所有 API key 走环境变量 / secret 管理，不进代码库。'));

// 7
children.push(h1('7. 关键实现要点（非 API，但必须）'));
children.push(numbered('velocity 与 status 依赖历史快照：需要后端存储每次采集结果（同一内容两次热度差/时间间隔），不是单个接口能给。'));
children.push(numbered('容错：单源失败隔离、超时控制、速率限制 + 指数退避（带 jitter）。'));
children.push(numbered('幂等：重复运行不产生脏数据（靠去重键 URL + 归一化标题）。'));
children.push(numbered('可观测：每源采集状态、成功条数、失败原因有日志，并通过 statuses 透传给前端。'));

// 8
children.push(h1('8. 非功能需求'));
children.push(bullet('可扩展：新增平台只需加 Adapter，主流程不改。'));
children.push(bullet('合规：遵守各平台 ToS/robots/速率；媒体处理遵守 §2 红线。'));
children.push(bullet('可配置：目标地区/语言、采集频率、关键词、权重走配置，不写死。'));
children.push(bullet('性能：前端首屏含加载态；后端采集异步 + 并发控制。'));

// 9
children.push(h1('9. 里程碑'));
children.push(makeTable(
  ['阶段', '内容', '状态'],
  [
    ['P0 前端', '看板 UI + 服务层 + mock 数据 + 打分/去重/排序/导出', '✅ 已完成'],
    ['P1 后端 MVP', 'A 档源 Adapter（先接免 key 的 Hacker News 跑通链路）+ 归一化 + 入库 + /trends /monthly', '⬜'],
    ['P2 调度与追踪', '定时调度 + 历史快照 + velocity/status 计算 + 梗图源（Giphy/Tenor/Imgflip）', '⬜'],
    ['P3 情报与扩展', 'Meta 广告资料库 + B/C 档（X 控量/Pinterest/TikTok）+ 以图搜图', '⬜'],
  ],
  [1600, 6126, 1300],
));

// 10
children.push(h1('10. 交付物'));
children.push(numbered('完整源码 + README（安装、配置、运行）。— 前端 ✅'));
children.push(numbered('后端服务实现 /trends、/monthly 两个接口（契约见 §5）。'));
children.push(numbered('数据库 schema / 迁移脚本（热点条目、历史快照、来源映射）。'));
children.push(numbered('各 API 申请与配置文档（怎么拿 key、放哪）。'));
children.push(numbered('各源 Adapter 的字段映射实现（§6 表格）。'));

// 11
children.push(h1('11. 验收标准'));
children.push(bullet('能稳定定时采集 A 档全部源，单源故障不影响整体。'));
children.push(bullet('总榜按 composite_score 正确排序，同一话题/梗跨平台已去重合并。'));
children.push(bullet('能区分 新冒出/持续/上升/回落 四种状态。'));
children.push(bullet('梗图模块返回当下 trending 的梗（经官方 API），仅用合规预览。'));
children.push(bullet('所有数据源遵守速率限制与使用条款；媒体处理符合 §2。'));
children.push(bullet('前端配置 VITE_API_BASE_URL 后，看板直接展示真实数据，无需改前端代码。'));

// ---------- doc ----------
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
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 280 } } } }] },
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 280 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
        children: [new TextRun({ text: '多平台热点监测平台 · 需求文档 v2.0', size: 16, color: '888888' })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: '第 ', size: 16, color: '888888' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
          new TextRun({ text: ' 页 / 共 ', size: 16, color: '888888' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '888888' }),
          new TextRun({ text: ' 页', size: 16, color: '888888' }),
        ],
      })] }),
    },
    children,
  }],
});

const out = path.join(__dirname, '平台需求文档.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('written:', out, buf.length, 'bytes');
});
