// 竞品评论洞察服务。默认 mock;设 VITE_API_BASE_URL 后走后端 /review-insights。
import { API_BASE_URL } from '../config';
import type { ProductType } from './types';

export type OS = 'iOS' | 'Android';
export type Dimension = 'demands' | 'praises' | 'complaints';

export interface DemandTheme {
  label: string;
  count: number;
  products?: ProductType[];
  apps?: string[];
  examples: string[];
}

export interface DimBundle {
  demands: DemandTheme[];
  praises: DemandTheme[];
  complaints: DemandTheme[];
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
  praises: DemandTheme[];
  complaints: DemandTheme[];
  error?: string;
}

export interface ReviewInsights {
  fetched_at: string;
  source: 'mock' | 'live';
  apps: AppInsight[];
  aggregated: { iOS: DimBundle; Android: DimBundle };
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

const d = (label: string, count: number, examples: string[], products?: ProductType[], apps?: string[]): DemandTheme =>
  ({ label, count, examples, products, apps });

const MOCK: ReviewInsights = {
  fetched_at: new Date().toISOString(),
  source: 'mock',
  apps: [
    {
      name: 'Kika Keyboard', os: 'iOS', platform: 'app_store', id: '1035199024',
      ok: true, reviewCount: 50, avgRating: 4.3, positive: 41, negative: 5, neutral: 4,
      demands: [d('键盘主题 / 字体', 3, ['Please add more keyboard fonts and themes'], ['keyboard'])],
      praises: [d('设计美观 / 好看', 14, ['So cute, love the keyboard designs']), d('内容丰富 / 选择多', 5, ['So many themes to choose from'])],
      complaints: [d('广告太多', 4, ['Way too many ads']), d('价格贵 / 订阅 / 套路', 2, ['Subscription is too expensive'])],
    },
    {
      name: 'ThemePack', os: 'iOS', platform: 'app_store', id: '1616629991',
      ok: true, reviewCount: 50, avgRating: 3.7, positive: 31, negative: 11, neutral: 8,
      demands: [d('小组件 / Widget 增强', 4, ['Widgets keep not working, please fix and add more'], ['theme', 'wallpaper']), d('更多主题 / 配色', 2, ['Want more aesthetic themes'], ['theme'])],
      praises: [d('主题 / 壁纸质量好', 12, ['The themes are gorgeous'])],
      complaints: [d('小组件失效', 5, ['Widgets stopped working after update']), d('广告太多', 3, ['Too many ads now'])],
    },
    {
      name: 'Themely', os: 'iOS', platform: 'app_store', id: '6755416540',
      ok: true, reviewCount: 49, avgRating: 4.3, positive: 38, negative: 7, neutral: 4,
      demands: [], praises: [d('设计美观 / 好看', 10, ['Beautiful and easy to use'])], complaints: [d('价格贵 / 订阅 / 套路', 3, ['Paywall everywhere'])],
    },
    {
      name: 'iScreen', os: 'iOS', platform: 'app_store', id: '1534704608',
      ok: true, reviewCount: 50, avgRating: 3.6, positive: 32, negative: 16, neutral: 2,
      demands: [d('更多免费内容 / 降价', 5, ['Nothing good for free, too expensive'], ['theme', 'wallpaper']), d('Anime / 动漫风', 2, ['Add more anime themes please'], ['theme', 'wallpaper', 'sticker'])],
      praises: [d('内容丰富 / 选择多', 6, ['Tons of widgets and wallpapers'])],
      complaints: [d('广告太多', 6, ['An ad every time I open it']), d('小组件失效', 4, ['Widgets don\'t work']), d('价格贵 / 订阅 / 套路', 3, ['Feels like a scam'])],
    },
    {
      name: 'Neon Love Keyboard', os: 'Android', platform: 'google_play', id: 'com.ikeyboard.theme.neon.love',
      ok: true, reviewCount: 80, avgRating: 4.5, positive: 69, negative: 8, neutral: 3,
      demands: [d('键盘主题 / 字体', 3, ['Want more neon keyboard themes'], ['keyboard'])],
      praises: [d('设计美观 / 好看', 22, ['Love the neon look']), d('内容丰富 / 选择多', 8, ['So many themes'])],
      complaints: [d('广告太多', 5, ['Too many ads'])],
    },
    {
      name: 'IconChanger Widget', os: 'Android', platform: 'google_play', id: 'com.iconchanger.widget.theme.shortcut',
      ok: true, reviewCount: 80, avgRating: 4.8, positive: 75, negative: 3, neutral: 2,
      demands: [d('更多图标包 / 自定义图标', 4, ['Need more icon packs'], ['theme'])],
      praises: [d('易用 / 上手简单', 14, ['So easy to change icons']), d('内容丰富 / 选择多', 9, ['Lots of icon styles'])],
      complaints: [d('价格贵 / 订阅 / 套路', 2, ['Premium is pricey'])],
    },
  ],
  aggregated: {
    iOS: {
      demands: [d('更多免费内容 / 降价', 5, ['Nothing good for free, too expensive'], ['theme', 'wallpaper'], ['iScreen']), d('小组件 / Widget 增强', 4, ['Widgets keep not working'], ['theme', 'wallpaper'], ['ThemePack']), d('键盘主题 / 字体', 3, ['Add more keyboard fonts'], ['keyboard'], ['Kika Keyboard']), d('Anime / 动漫风', 2, ['Add more anime themes'], ['theme', 'wallpaper', 'sticker'], ['iScreen'])],
      praises: [d('设计美观 / 好看', 24, ['So cute, love the designs'], [], ['Kika Keyboard', 'Themely']), d('主题 / 壁纸质量好', 12, ['The themes are gorgeous'], [], ['ThemePack']), d('内容丰富 / 选择多', 11, ['Tons of widgets'], [], ['iScreen'])],
      complaints: [d('广告太多', 13, ['An ad every time I open it'], [], ['iScreen', 'ThemePack']), d('小组件失效', 9, ['Widgets stopped working'], [], ['ThemePack', 'iScreen']), d('价格贵 / 订阅 / 套路', 8, ['Feels like a scam'], [], ['iScreen', 'Themely'])],
    },
    Android: {
      demands: [d('更多图标包 / 自定义图标', 4, ['Need more icon packs'], ['theme'], ['IconChanger Widget']), d('键盘主题 / 字体', 3, ['Want more neon themes'], ['keyboard'], ['Neon Love Keyboard'])],
      praises: [d('设计美观 / 好看', 22, ['Love the neon look'], [], ['Neon Love Keyboard']), d('内容丰富 / 选择多', 17, ['So many themes'], [], ['Neon Love Keyboard', 'IconChanger Widget']), d('易用 / 上手简单', 14, ['So easy to change icons'], [], ['IconChanger Widget'])],
      complaints: [d('广告太多', 5, ['Too many ads'], [], ['Neon Love Keyboard']), d('价格贵 / 订阅 / 套路', 2, ['Premium is pricey'], [], ['IconChanger Widget'])],
    },
  },
};
