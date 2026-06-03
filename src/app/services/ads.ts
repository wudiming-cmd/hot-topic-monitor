// 广告情报服务。对应需求 §4.7:经 Meta 广告资料库查"正在投放"的广告,
// 作为"已被市场验证"的信号。默认 mock,设置 VITE_API_BASE_URL 后改走真实后端。
import { API_BASE_URL, MOCK_LATENCY_MS } from './config';
import type { AdItem, AdQuery, AdsResponse } from './types';

const MOCK_ADS: AdItem[] = [
  {
    id: 'ad_1001', advertiser: 'Anthropic', category: 'tech',
    platforms: ['facebook', 'instagram'],
    headline: 'Build with Claude', body: '体验更强推理的 AI 助手,免费开始。',
    cta: 'Sign Up', media_url: 'https://picsum.photos/seed/ad-claude/480/270',
    link: 'https://www.facebook.com/ads/library/', status: 'active',
    started_at: '12 天前', regions: ['US', 'JP', 'SG'], reach: '100k–500k',
  },
  {
    id: 'ad_1002', advertiser: 'Apple', category: 'tech',
    platforms: ['instagram', 'facebook', 'audience_network'],
    headline: 'Meet Vision Pro 2', body: '空间计算,重新定义。',
    cta: 'Learn More', media_url: 'https://picsum.photos/seed/ad-vision/480/270',
    link: 'https://www.facebook.com/ads/library/', status: 'active',
    started_at: '5 天前', regions: ['US', 'EU'], reach: '1M+',
  },
  {
    id: 'ad_1003', advertiser: 'Netflix', category: 'entertainment',
    platforms: ['facebook', 'instagram', 'messenger'],
    headline: 'Stranger Things 最终季', body: '现在仅在 Netflix 观看。',
    cta: 'Watch Now', media_url: 'https://picsum.photos/seed/ad-netflix/480/270',
    link: 'https://www.facebook.com/ads/library/', status: 'active',
    started_at: '3 天前', regions: ['Global'], reach: '5M+',
  },
  {
    id: 'ad_1004', advertiser: 'Shopify', category: 'commerce',
    platforms: ['facebook', 'instagram'],
    headline: '开店从未如此简单', body: '3 分钟搭建你的在线商店,首月 $1。',
    cta: 'Start Free Trial', media_url: 'https://picsum.photos/seed/ad-shopify/480/270',
    link: 'https://www.facebook.com/ads/library/', status: 'active',
    started_at: '20 天前', regions: ['US', 'UK', 'CA'], reach: '500k–1M',
  },
  {
    id: 'ad_1005', advertiser: 'Duolingo', category: 'other',
    platforms: ['instagram', 'audience_network'],
    headline: '每天 5 分钟学一门语言', body: '免费、有趣、上瘾。',
    cta: 'Install Now', media_url: 'https://picsum.photos/seed/ad-duo/480/270',
    link: 'https://www.facebook.com/ads/library/', status: 'active',
    started_at: '8 天前', regions: ['Global'], reach: '1M+',
  },
  {
    id: 'ad_1006', advertiser: 'Spotify', category: 'entertainment',
    platforms: ['facebook', 'instagram', 'messenger'],
    headline: 'Premium 三个月免费', body: '无广告畅听,随时取消。',
    cta: 'Try Premium', media_url: 'https://picsum.photos/seed/ad-spotify/480/270',
    link: 'https://www.facebook.com/ads/library/', status: 'active',
    started_at: '15 天前', regions: ['US', 'EU', 'JP'], reach: '1M+',
  },
  {
    id: 'ad_1007', advertiser: 'Notion', category: 'tech',
    platforms: ['facebook', 'instagram'],
    headline: 'AI 加持的全能工作区', body: '文档、知识库、项目,一处搞定。',
    cta: 'Get Started', media_url: 'https://picsum.photos/seed/ad-notion/480/270',
    link: 'https://www.facebook.com/ads/library/', status: 'active',
    started_at: '2 天前', regions: ['US', 'SG'], reach: '100k–500k',
  },
  {
    id: 'ad_1008', advertiser: 'Temu', category: 'commerce',
    platforms: ['facebook', 'instagram', 'audience_network', 'messenger'],
    headline: 'Shop Like a Billionaire', body: '海量商品,超低价格,包邮到家。',
    cta: 'Shop Now', media_url: 'https://picsum.photos/seed/ad-temu/480/270',
    link: 'https://www.facebook.com/ads/library/', status: 'active',
    started_at: '1 天前', regions: ['Global'], reach: '5M+',
  },
];

function delay(): Promise<void> {
  const { min, max } = MOCK_LATENCY_MS;
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

/** 所有 mock 广告涉及的地区(去重),供筛选下拉用 */
export const AD_REGIONS = Array.from(
  new Set(MOCK_ADS.flatMap((a) => a.regions)),
).sort();

export async function getAds(query: AdQuery = {}): Promise<AdsResponse> {
  const { search = '', category = 'all', region = 'all' } = query;

  if (API_BASE_URL) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (category !== 'all') params.set('category', category);
    if (region !== 'all') params.set('region', region);
    const res = await fetch(`${API_BASE_URL}/ads?${params.toString()}`);
    if (!res.ok) throw new Error(`后端返回 ${res.status}`);
    const data = await res.json();
    return { ads: data.ads ?? [], fetched_at: data.fetched_at ?? new Date().toISOString(), source: 'live' };
  }

  await delay();
  const kw = search.trim().toLowerCase();
  const ads = MOCK_ADS.filter((ad) => {
    const kwMatch =
      !kw ||
      ad.advertiser.toLowerCase().includes(kw) ||
      ad.headline.toLowerCase().includes(kw) ||
      ad.body.toLowerCase().includes(kw);
    const catMatch = category === 'all' || ad.category === category;
    const regionMatch =
      region === 'all' || ad.regions.includes(region) || ad.regions.includes('Global');
    return kwMatch && catMatch && regionMatch;
  });

  return { ads, fetched_at: new Date().toISOString(), source: 'mock' };
}
