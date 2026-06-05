// 竞品评论洞察服务。默认 mock;设 VITE_API_BASE_URL 后走后端 /review-insights。
import { API_BASE_URL } from '../config';
import type { ProductType } from './types';

export type OS = 'iOS' | 'Android';

export interface DemandTheme {
  label: string;
  count: number;
  products: ProductType[];
  apps?: string[];
  examples: string[];
}

export interface AppInsight {
  name: string;
  os: OS;
  platform: 'app_store' | 'google_play';
  id: string;
  ok: boolean;
  reviewCount: number;
  avgRating: number;
  positive: number;
  negative: number;
  neutral: number;
  demands: DemandTheme[];
  error?: string;
}

export interface ReviewInsights {
  fetched_at: string;
  source: 'mock' | 'live';
  apps: AppInsight[];
  aggregated: { iOS: DemandTheme[]; Android: DemandTheme[] };
}

export async function getReviewInsights(): Promise<ReviewInsights> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/review-insights`);
    if (!res.ok) throw new Error(`后端返回 ${res.status}`);
    const data = await res.json();
    return { ...data, source: 'live' };
  }
  await new Promise((r) => setTimeout(r, 300));
  return MOCK;
}

// —— mock(贴近真实结构,便于纯前端线上演示)——
const MOCK: ReviewInsights = {
  fetched_at: new Date().toISOString(),
  source: 'mock',
  apps: [
    {
      name: 'Kika Keyboard', os: 'iOS', platform: 'app_store', id: '1035199024',
      ok: true, reviewCount: 50, avgRating: 4.3, positive: 41, negative: 5, neutral: 4,
      demands: [
        { label: '键盘主题 / 字体', count: 3, products: ['keyboard'], examples: ['Please add more keyboard fonts and themes', 'Wish there were more cute keyboard themes'] },
      ],
    },
    {
      name: 'ThemePack', os: 'iOS', platform: 'app_store', id: '1616629991',
      ok: true, reviewCount: 50, avgRating: 3.7, positive: 31, negative: 11, neutral: 8,
      demands: [
        { label: '小组件 / Widget 增强', count: 4, products: ['theme', 'wallpaper'], examples: ['Widgets keep not working, please fix and add more', 'Need more widget styles'] },
        { label: '更多主题 / 配色', count: 2, products: ['theme'], examples: ['Want more aesthetic themes'] },
      ],
    },
    {
      name: 'Themely', os: 'iOS', platform: 'app_store', id: '6755416540',
      ok: true, reviewCount: 49, avgRating: 4.3, positive: 38, negative: 7, neutral: 4, demands: [],
    },
    {
      name: 'iScreen', os: 'iOS', platform: 'app_store', id: '1534704608',
      ok: true, reviewCount: 50, avgRating: 3.6, positive: 32, negative: 16, neutral: 2,
      demands: [
        { label: '更多免费内容 / 降价', count: 5, products: ['theme', 'wallpaper'], examples: ['Nothing good for free, too expensive', 'Please make more free wallpapers'] },
        { label: 'Anime / 动漫风', count: 2, products: ['theme', 'wallpaper', 'sticker'], examples: ['Add more anime themes please'] },
      ],
    },
    {
      name: 'Neon Love Keyboard', os: 'Android', platform: 'google_play', id: 'com.ikeyboard.theme.neon.love',
      ok: true, reviewCount: 80, avgRating: 4.5, positive: 69, negative: 8, neutral: 3,
      demands: [
        { label: '键盘主题 / 字体', count: 3, products: ['keyboard'], examples: ['Want more neon keyboard themes', 'Please add custom font colors'] },
      ],
    },
    {
      name: 'IconChanger Widget', os: 'Android', platform: 'google_play', id: 'com.iconchanger.widget.theme.shortcut',
      ok: true, reviewCount: 80, avgRating: 4.8, positive: 75, negative: 3, neutral: 2,
      demands: [
        { label: '更多图标包 / 自定义图标', count: 4, products: ['theme'], examples: ['Need more icon packs', 'Add more aesthetic icon styles please'] },
      ],
    },
  ],
  aggregated: {
    iOS: [
      { label: '小组件 / Widget 增强', count: 4, products: ['theme', 'wallpaper'], apps: ['ThemePack'], examples: ['Widgets keep not working, please fix and add more'] },
      { label: '更多免费内容 / 降价', count: 5, products: ['theme', 'wallpaper'], apps: ['iScreen'], examples: ['Nothing good for free, too expensive'] },
      { label: '键盘主题 / 字体', count: 3, products: ['keyboard'], apps: ['Kika Keyboard'], examples: ['Please add more keyboard fonts and themes'] },
      { label: 'Anime / 动漫风', count: 2, products: ['theme', 'wallpaper', 'sticker'], apps: ['iScreen'], examples: ['Add more anime themes please'] },
    ],
    Android: [
      { label: '更多图标包 / 自定义图标', count: 4, products: ['theme'], apps: ['IconChanger Widget'], examples: ['Need more icon packs'] },
      { label: '键盘主题 / 字体', count: 3, products: ['keyboard'], apps: ['Neon Love Keyboard'], examples: ['Want more neon keyboard themes'] },
    ],
  },
};
