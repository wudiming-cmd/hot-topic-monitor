// 默认分类/抓取规则 + 展示标签。规则可在配置页修改并持久化。
import type {
  ClassifyRules, ContentCategory, ContentPlatform, Country, CrawlRule, OppStatus, ProductType,
} from './types';

export const CATEGORY_LABEL: Record<ContentCategory, string> = {
  aesthetic: '审美风格', identity: '身份认同', interest: '兴趣爱好',
  seasonal: '时间节点', entertainment: '娱乐热点', meme: 'Meme/流行梗', pending: '待确认',
};

export const CATEGORY_CHIP: Record<ContentCategory, string> = {
  aesthetic: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  identity: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  interest: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  seasonal: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  entertainment: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  meme: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export const PLATFORM_LABEL: Record<ContentPlatform, string> = {
  google_trends: 'Google Trends', pinterest: 'Pinterest', reddit: 'Reddit',
  app_store: 'App Store 评论', google_play: 'Google Play 评论', x: 'X (Twitter)',
  tiktok: 'TikTok', holiday: '节日节点',
};

export const PRODUCT_LABEL: Record<ProductType, string> = {
  theme: 'Theme', keyboard: 'Keyboard', wallpaper: 'Wallpaper', sticker: 'Sticker',
};

export const COUNTRY_LABEL: Record<Country, string> = {
  US: '🇺🇸 美国', GB: '🇬🇧 英国', JP: '🇯🇵 日本', global: '🌐 全球',
};

export const STATUS_LABEL: Record<OppStatus, string> = {
  new: '新', favorited: '已收藏', ignored: '已忽略', pending: '待确认',
};

// —— 默认分类规则(关键词取自 PRD 六类示例) ——
export const DEFAULT_CLASSIFY_RULES: ClassifyRules = {
  categoryKeywords: {
    aesthetic: ['coquette', 'y2k', 'clean girl', 'dark academia', 'cottagecore', 'kawaii', 'old money', 'cybercore', 'soft girl', 'minimalist', 'aesthetic', 'aura'],
    identity: ['christian girl', 'gym girl', 'that girl', 'main character', 'soft life', 'girl boss', 'dark feminine', 'black girl magic', 'latina', 'book girl'],
    interest: ['anime', 'coffee', 'cat', 'travel', 'reading', 'astrology', 'plants', 'photography', 'gaming', 'taylor swift fan', 'zodiac'],
    seasonal: ['christmas', 'halloween', 'valentine', 'graduation', 'back to school', 'summer', 'thanksgiving', 'easter', 'new year', 'mother', 'pride'],
    entertainment: ['k-pop', 'kpop', 'netflix', 'disney', 'marvel', 'taylor swift', 'minecraft', 'roblox', 'genshin', 'fortnite', 'wednesday', 'squid game'],
    meme: ['girl math', 'delulu', 'brat summer', 'girl dinner', 'roman empire', 'lucky girl', 'corecore', 'pov', 'viral sound', 'reaction', 'meme'],
  },
  tagLexicon: [
    'pink', 'pastel', 'bow', 'cat', 'coffee', 'anime', 'minimal', 'dark', 'gradient',
    'retro', 'cute', 'gothic', 'floral', 'sparkle', 'neon', 'vintage', 'holiday',
  ],
  synonyms: {
    'kpop': 'k-pop', 'xmas': 'christmas', 'val day': "valentine's day", 'ts': 'taylor swift',
  },
  productAdaptation: {
    aesthetic: ['wallpaper', 'theme'],
    identity: ['wallpaper', 'theme'],
    interest: ['sticker', 'wallpaper'],
    seasonal: ['theme', 'wallpaper', 'sticker'],
    entertainment: ['theme', 'sticker'],
    meme: ['sticker'],
  },
  // 过滤泛新闻/政治/金融/犯罪等无关内容(PRD 验收 §13)
  globalExcludes: [
    'election', 'politics', 'president', 'war', 'shooting', 'crime', 'court', 'stock',
    'inflation', 'economy', 'bank', 'crypto crash', 'tariff', 'lawsuit', 'protest',
  ],
};

export const DEFAULT_CRAWL_RULES: CrawlRule[] = [
  {
    id: 'cr_reddit', platform: 'reddit', country: 'US', mode: 'auto',
    targets: ['r/iOSsetups', 'r/androidthemes', 'r/keyboards', 'r/aesthetics', 'r/Wallpapers', 'r/iphonewallpapers'],
    seed_keywords: ['aesthetic', 'wallpaper', 'theme', 'icon pack', 'setup'],
    exclude_keywords: ['news', 'politics', 'nsfw', 'drama'],
    product_types: ['theme', 'wallpaper', 'keyboard'],
    min_engagement: 200, top_comments: 50, frequency: 'hourly',
    note: '取 hot,Upvote>200 的帖 + Top50 评论挖需求', enabled: true,
  },
  {
    id: 'cr_gtrends', platform: 'google_trends', country: 'US', mode: 'auto',
    targets: ['aesthetic wallpaper', 'phone theme', 'icon pack ios', 'widget aesthetic', 'lock screen'],
    seed_keywords: ['aesthetic', 'wallpaper', 'theme', 'widget'],
    exclude_keywords: ['stock', 'election', 'crypto'],
    product_types: ['wallpaper', 'theme'],
    trend_window: '24h', frequency: 'daily',
    note: '美区实时热词 + 24h 上升 + 关键词对比', enabled: true,
  },
  {
    id: 'cr_pinterest', platform: 'pinterest', country: 'US', mode: 'auto',
    targets: ['Pinterest Today 飙升词', 'phone wallpaper', 'ios icons', 'aesthetic background'],
    seed_keywords: ['wallpaper', 'aesthetic', 'icons', 'background'],
    exclude_keywords: [],
    product_types: ['wallpaper', 'theme'],
    min_engagement: 5000, frequency: 'daily',
    note: '最直接的视觉审美趋势信号(女性用户为主)', enabled: true,
  },
  {
    id: 'cr_appstore', platform: 'app_store', country: 'US', mode: 'auto',
    targets: ['Themepack', 'iScreen', 'ThemeKit', 'Themify'],
    seed_keywords: ['theme', 'wallpaper', 'icon'],
    exclude_keywords: [],
    product_types: ['theme', 'wallpaper'],
    top_comments: 100, frequency: 'daily',
    note: '竞品美区评论,按正面/负面/需求三维度挖未满足需求', enabled: true,
  },
  {
    id: 'cr_gplay', platform: 'google_play', country: 'US', mode: 'auto',
    targets: ['Themepack', 'iScreen', 'ThemeKit', 'Themify'],
    seed_keywords: ['theme', 'wallpaper', 'keyboard'],
    exclude_keywords: [],
    product_types: ['theme', 'wallpaper', 'keyboard'],
    top_comments: 100, frequency: 'daily',
    note: '同 App Store,Android 竞品评论', enabled: true,
  },
  {
    id: 'cr_x', platform: 'x', country: 'US', mode: 'auto',
    targets: ['trends24.in/united-states'],
    seed_keywords: ['aesthetic', 'meme', 'viral'],
    exclude_keywords: ['politics', 'election'],
    product_types: ['sticker', 'wallpaper'],
    trend_window: 'realtime', frequency: 'daily',
    note: 'TikTok 梗常在 X 提前 1-2 天出现', enabled: true,
  },
  {
    id: 'cr_tiktok', platform: 'tiktok', country: 'US', mode: 'manual',
    targets: ['#homescreen', '#aestheticsetup', '#phoneaesthetic', '#widgetsmith'],
    seed_keywords: ['homescreen', 'aesthetic', 'setup'],
    exclude_keywords: [],
    product_types: ['theme', 'wallpaper'],
    frequency: 'daily',
    note: '无开放 API,人工监测;重点看评论区描述风格的高频词(或 Creative Center 无头渲染)', enabled: true,
  },
  {
    id: 'cr_holiday', platform: 'holiday', country: 'US', mode: 'auto',
    targets: ['Halloween', 'Christmas', 'Thanksgiving', "Valentine's Day", 'New Year', 'Super Bowl', 'Graduation', 'Black Friday', "Mother's Day", 'Pride Month'],
    seed_keywords: ['holiday', 'festive', 'seasonal'],
    exclude_keywords: [],
    product_types: ['theme', 'wallpaper', 'sticker'],
    frequency: 'weekly',
    note: '预置库:大型节日提前12周、中型8周、赛事6周预警', enabled: true,
  },
];

// ===== localStorage 持久化 =====
const CR_KEY = 'htm-crawl-rules-v2'; // 规则模型升级,换 key 使旧数据失效
const CL_KEY = 'htm-classify-rules';

export function loadCrawlRules(): CrawlRule[] {
  try {
    const raw = localStorage.getItem(CR_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CRAWL_RULES;
  } catch { return DEFAULT_CRAWL_RULES; }
}
export function saveCrawlRules(rules: CrawlRule[]) {
  localStorage.setItem(CR_KEY, JSON.stringify(rules));
}
export function loadClassifyRules(): ClassifyRules {
  try {
    const raw = localStorage.getItem(CL_KEY);
    return raw ? { ...DEFAULT_CLASSIFY_RULES, ...JSON.parse(raw) } : DEFAULT_CLASSIFY_RULES;
  } catch { return DEFAULT_CLASSIFY_RULES; }
}
export function saveClassifyRules(rules: ClassifyRules) {
  localStorage.setItem(CL_KEY, JSON.stringify(rules));
}
