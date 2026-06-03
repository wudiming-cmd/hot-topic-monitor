// 服务层配置。对应需求 §7「可配置」:权重、目标地区等走配置,不写死。

/**
 * 综合热度分权重。默认 velocity:popularity:engagement = 0.5:0.3:0.2
 * (需求 §3 建议,velocity 权重最高)。可通过环境变量覆盖。
 */
export const SCORE_WEIGHTS = {
  velocity: Number(import.meta.env.VITE_WEIGHT_VELOCITY ?? 0.5),
  popularity: Number(import.meta.env.VITE_WEIGHT_POPULARITY ?? 0.3),
  engagement: Number(import.meta.env.VITE_WEIGHT_ENGAGEMENT ?? 0.2),
};

/**
 * 真实后端地址。设置后服务层会改为请求真实 API;
 * 未设置(默认)时使用内置 mock 后端。
 * 例:VITE_API_BASE_URL=https://api.example.com
 */
export const API_BASE_URL: string | undefined =
  import.meta.env.VITE_API_BASE_URL || undefined;

// mock 后端模拟的网络延迟范围(毫秒),让前端的 loading 态可见。
export const MOCK_LATENCY_MS = { min: 250, max: 700 };
