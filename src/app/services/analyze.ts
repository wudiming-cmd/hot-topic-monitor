// AI 分析服务:调后端 /analyze(后端用 DeepSeek)。Key 在后端,前端永不接触。
import { API_BASE_URL } from './config';

export type AnalyzeKind = 'trends' | 'opportunities' | 'reviews';

export interface AnalyzeResult {
  analysis: string;
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
}

export async function analyze(kind: AnalyzeKind, payload: unknown, question?: string): Promise<AnalyzeResult> {
  if (!API_BASE_URL) {
    throw new Error('AI 分析需连接后端:请设置 VITE_API_BASE_URL 指向后端,并在后端 server/.env 配置 DEEPSEEK_API_KEY。');
  }
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, payload, question }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error || `后端返回 ${res.status}`);
  }
  return res.json();
}
