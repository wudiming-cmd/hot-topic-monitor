// 内容机会雷达 — 数据模型(第一阶段)
// 定位:从内容相关平台定向抓趋势,自动分类成内容同学看得懂、用得上的内容机会。

// 内容平台(区别于泛热点的平台)
export type ContentPlatform =
  | 'google_trends'
  | 'pinterest'
  | 'reddit'
  | 'app_store'
  | 'google_play'
  | 'x'
  | 'tiktok'
  | 'holiday'; // 节日节点预置库

// 目标国家(以美区为主,可扩展)
export type Country = 'US' | 'GB' | 'JP' | 'global';

// 六大内容分类(业务方定义)
export type ContentCategory =
  | 'aesthetic' // 审美风格
  | 'identity' // 身份认同
  | 'interest' // 兴趣爱好
  | 'seasonal' // 时间节点
  | 'entertainment' // 娱乐热点
  | 'meme' // Meme/流行梗
  | 'pending'; // 待确认(无法判断)

// 产品类型
export type ProductType = 'theme' | 'keyboard' | 'wallpaper' | 'sticker';

// 机会状态(运营操作)
export type OppStatus = 'new' | 'favorited' | 'ignored' | 'pending';

/** 一条"内容机会" */
export interface ContentOpportunity {
  id: string;
  name: string; // 热点/趋势名称,如 "Coquette aesthetic"
  platform: ContentPlatform;
  country: Country;
  // 热度信号(各平台口径不同,统一存原始描述 + 一个 0–1 强度供排序)
  heat_signal: string; // 如 "搜索 +320%"、"Upvotes 2.4k"
  heat_score: number; // 0–1
  url: string;
  description?: string;
  keywords: string[]; // 抓取到的原始关键词/标签(分类引擎输入)
  fetched_at: string; // ISO

  // —— 以下由分类引擎产出,可人工修改 ——
  category: ContentCategory;
  tags: string[];
  recommended_products: ProductType[];
  status: OppStatus;
  // 后续阶段评分预留字段(第一阶段不计算)
  score?: number | null;
  grade?: 'S' | 'A' | 'B' | 'none' | null;
}

// ===== 配置:抓取规则(重新规划版) =====
export type CrawlMode = 'auto' | 'manual'; // 自动抓取 / 人工监测
export type CrawlFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';
export type TrendWindow = 'realtime' | '24h' | '7d';

export interface CrawlRule {
  id: string;
  platform: ContentPlatform;
  country: Country;
  mode: CrawlMode; // 自动 / 人工(如 TikTok 无开放 API)
  targets: string[]; // 抓取目标:版块/标签/应用/查询词/节日(平台语义不同)
  seed_keywords: string[]; // 内容方向约束词(保证相关性,避免泛抓)
  exclude_keywords: string[]; // 排除词
  product_types: ProductType[]; // 关注产品
  min_engagement?: number; // 热度门槛(如 Upvote/收藏 > N)
  top_comments?: number; // 取前 N 条评论挖需求
  trend_window?: TrendWindow; // 趋势时间窗
  frequency: CrawlFrequency; // 抓取频率
  note?: string; // 备注/人工说明
  enabled: boolean;
}

// ===== 配置:分类规则 =====
export interface ClassifyRules {
  // 每个分类的命中关键词
  categoryKeywords: Record<Exclude<ContentCategory, 'pending'>, string[]>;
  // 标签词库(用于自动打标签)
  tagLexicon: string[];
  // 同义词:把别名归一到标准词
  synonyms: Record<string, string>;
  // 产品适配:分类 → 推荐产品类型
  productAdaptation: Record<Exclude<ContentCategory, 'pending'>, ProductType[]>;
  // 全局排除词(命中则过滤为无关)
  globalExcludes: string[];
}

export interface OppQuery {
  country?: Country | 'all';
  platform?: ContentPlatform | 'all';
  category?: ContentCategory | 'all';
  product?: ProductType | 'all';
  tag?: string | 'all';
  status?: OppStatus | 'all' | 'active'; // active = 排除已忽略
  search?: string;
}
