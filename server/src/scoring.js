// 归一化辅助。/trends 的 composite_score、去重、排序由前端服务层完成,
// 后端只需提供归一化到 0–1 的 popularity / velocity / engagement_rate。

export const clamp01 = (n) => Math.max(0, Math.min(1, n));

/** 对数归一化:适合点赞/播放这类长尾分布。value 相对 cap 归一到 0–1。 */
export function logNorm(value, cap) {
  if (!value || value <= 0) return 0;
  return clamp01(Math.log10(1 + value) / Math.log10(1 + cap));
}

/** 由热度与"年龄(小时)"估算上升速度(无历史快照时的近似)。 */
export function estimateVelocity(heat, ageHours) {
  const h = Math.max(0, heat);
  const age = Math.max(0.5, ageHours);
  // 新且热 → 速度高;随时间衰减
  return clamp01(Math.log10(1 + h) / Math.log10(1 + 5000) * (6 / (age + 6)) * 1.6);
}

/** 互动率:评论/点赞,夹到 0–1。 */
export function engagementRate(comments, ups) {
  if (!ups || ups <= 0) return 0;
  return clamp01(comments / ups);
}

export const hoursSince = (epochSeconds) =>
  (Date.now() / 1000 - epochSeconds) / 3600;
