// 导出 JSON / CSV。对应需求 §4.11 输出。
import type { TrendItem } from './types';

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function timestamp(): string {
  // 用本地时间生成 YYYYMMDD-HHmm 作文件名
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function exportTrendsJSON(items: TrendItem[]) {
  triggerDownload(
    JSON.stringify(items, null, 2),
    `trends-${timestamp()}.json`,
    'application/json',
  );
}

const CSV_COLUMNS: (keyof TrendItem)[] = [
  'source', 'category', 'title', 'url', 'author',
  'popularity', 'velocity', 'engagement_rate', 'composite_score',
  'status', 'published_at', 'fetched_at',
];

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // 含逗号 / 引号 / 换行时用双引号包裹并转义内部引号
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 选题清单导出(含备注)
export function exportFavoritesJSON(
  favorites: { item: TrendItem; note: string; saved_at: string }[],
) {
  triggerDownload(
    JSON.stringify(favorites, null, 2),
    `favorites-${timestamp()}.json`,
    'application/json',
  );
}

export function exportFavoritesCSV(
  favorites: { item: TrendItem; note: string; saved_at: string }[],
) {
  const header = ['title', 'source', 'category', 'composite_score', 'url', 'note', 'saved_at'].join(',');
  const rows = favorites.map((f) =>
    [f.item.title, f.item.source, f.item.category, f.item.composite_score, f.item.url, f.note, f.saved_at]
      .map(escapeCsv)
      .join(','),
  );
  const content = '﻿' + [header, ...rows].join('\n');
  triggerDownload(content, `favorites-${timestamp()}.csv`, 'text/csv');
}

export function exportTrendsCSV(items: TrendItem[]) {
  const header = CSV_COLUMNS.join(',');
  const rows = items.map((item) =>
    CSV_COLUMNS.map((col) => escapeCsv(item[col])).join(','),
  );
  // 加 BOM,保证 Excel 正确识别 UTF-8 中文
  const content = '﻿' + [header, ...rows].join('\n');
  triggerDownload(content, `trends-${timestamp()}.csv`, 'text/csv');
}
