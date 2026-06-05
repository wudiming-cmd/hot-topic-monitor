// 贴合产品方向(Theme/Keyboard/Wallpaper/Sticker)的内容机会 mock。
// 覆盖 Google Trends / Pinterest / Reddit / App Store / Google Play / X / TikTok / 节日库,以美区为主。
// 字段 name/keywords 供分类引擎判定;category/tags/products 由引擎产出(不在此写死)。
import type { ContentPlatform, Country } from './types';

export interface RawOpportunity {
  id: string;
  name: string;
  platform: ContentPlatform;
  country: Country;
  heat_signal: string;
  heat_score: number; // 0–1
  url: string;
  description?: string;
  keywords: string[];
}

export const MOCK_RAW_OPPORTUNITIES: RawOpportunity[] = [
  { id: 'o1', name: 'Coquette aesthetic 飙升', platform: 'pinterest', country: 'US', heat_signal: '搜索 +320%', heat_score: 0.95, url: 'https://www.pinterest.com/today', keywords: ['coquette', 'bow', 'pink', 'pastel'], description: 'pink bows ribbons soft girl' },
  { id: 'o2', name: 'Clean Girl aesthetic', platform: 'google_trends', country: 'US', heat_signal: '24h 上升 +180%', heat_score: 0.88, url: 'https://trends.google.com', keywords: ['clean girl', 'minimalist', 'aesthetic'] },
  { id: 'o3', name: 'Y2K icon pack 需求', platform: 'pinterest', country: 'US', heat_signal: '收藏 48k', heat_score: 0.84, url: 'https://www.pinterest.com', keywords: ['y2k', 'retro', 'neon', 'icons'] },
  { id: 'o4', name: 'Dark Academia setup', platform: 'reddit', country: 'US', heat_signal: 'Upvotes 2.4k · r/aesthetics', heat_score: 0.8, url: 'https://reddit.com/r/aesthetics', keywords: ['dark academia', 'vintage', 'brown'] },
  { id: 'o5', name: 'Cottagecore wallpaper', platform: 'pinterest', country: 'US', heat_signal: '搜索 +140%', heat_score: 0.72, url: 'https://www.pinterest.com', keywords: ['cottagecore', 'floral', 'cozy'] },
  { id: 'o6', name: '"That Girl" morning routine', platform: 'tiktok', country: 'US', heat_signal: '#thatgirl 2.1B views', heat_score: 0.86, url: 'https://www.tiktok.com', keywords: ['that girl', 'aesthetic', 'routine'] },
  { id: 'o7', name: 'Gym Girl 身份风潮', platform: 'x', country: 'US', heat_signal: '热搜上升', heat_score: 0.7, url: 'https://x.com', keywords: ['gym girl', 'fitness'] },
  { id: 'o8', name: 'Cat lover sticker 需求', platform: 'reddit', country: 'US', heat_signal: 'Upvotes 1.1k', heat_score: 0.66, url: 'https://reddit.com', keywords: ['cat', 'cute', 'sticker'] },
  { id: 'o9', name: 'Coffee aesthetic 桌面', platform: 'pinterest', country: 'US', heat_signal: '收藏 22k', heat_score: 0.63, url: 'https://www.pinterest.com', keywords: ['coffee', 'beige', 'aesthetic'] },
  { id: 'o10', name: 'Anime homescreen 配置', platform: 'reddit', country: 'US', heat_signal: 'Upvotes 3.2k · r/iOSsetups', heat_score: 0.83, url: 'https://reddit.com/r/iOSsetups', keywords: ['anime', 'icons', 'wallpaper'] },
  { id: 'o11', name: 'Halloween wallpaper 提前预热', platform: 'google_trends', country: 'US', heat_signal: '季节性上升', heat_score: 0.6, url: 'https://trends.google.com', keywords: ['halloween', 'spooky', 'dark'] },
  { id: 'o12', name: 'Christmas 主题倒计时', platform: 'holiday', country: 'US', heat_signal: '节点预警 (提前12周)', heat_score: 0.55, url: '#', keywords: ['christmas', 'holiday', 'festive'] },
  { id: 'o13', name: 'Taylor Swift Eras 视觉', platform: 'x', country: 'US', heat_signal: '热搜 Top5', heat_score: 0.9, url: 'https://x.com', keywords: ['taylor swift', 'eras', 'sparkle'] },
  { id: 'o14', name: 'Wednesday Season 2 上线', platform: 'tiktok', country: 'US', heat_signal: '#wednesday 强势', heat_score: 0.82, url: 'https://www.tiktok.com', keywords: ['wednesday', 'netflix', 'gothic'] },
  { id: 'o15', name: 'Stranger Things 复古主题', platform: 'app_store', country: 'US', heat_signal: '评论高频需求', heat_score: 0.68, url: 'https://apps.apple.com', keywords: ['netflix', 'stranger things', 'retro', '80s'] },
  { id: 'o16', name: 'Girl Math 梗', platform: 'x', country: 'US', heat_signal: '热搜爆发', heat_score: 0.78, url: 'https://x.com', keywords: ['girl math', 'meme', 'viral'] },
  { id: 'o17', name: 'Delulu 流行梗', platform: 'tiktok', country: 'US', heat_signal: '#delulu 上升', heat_score: 0.74, url: 'https://www.tiktok.com', keywords: ['delulu', 'meme', 'pov'] },
  { id: 'o18', name: 'Brat Summer 绿色美学', platform: 'x', country: 'US', heat_signal: '社媒刷屏', heat_score: 0.76, url: 'https://x.com', keywords: ['brat summer', 'green', 'meme'] },
  { id: 'o19', name: 'Liminal spaces 视觉', platform: 'reddit', country: 'US', heat_signal: 'Upvotes 900', heat_score: 0.5, url: 'https://reddit.com', keywords: ['liminal', 'backrooms'] }, // 预期:无命中→待确认
  { id: 'o20', name: 'US Election 2026 polls', platform: 'google_trends', country: 'US', heat_signal: '搜索激增', heat_score: 0.99, url: 'https://trends.google.com', keywords: ['election', 'politics', 'vote'] }, // 预期:命中排除词→过滤
];
