// DeepSeek(OpenAI 兼容)聊天补全。Key 来自后端环境变量,绝不下发前端。
import { config } from '../config.js';

export async function deepseekChat(messages, { temperature = 0.4, maxTokens = 1200 } = {}) {
  if (!config.deepseek.enabled) {
    throw new Error('未配置 DEEPSEEK_API_KEY(请在 server/.env 设置)');
  }
  const res = await fetch(`${config.deepseek.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.deepseek.apiKey}`,
      // OpenRouter 建议带的来源标识(非必需)
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Hot Topic Monitor',
    },
    body: JSON.stringify({
      model: config.deepseek.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`DeepSeek ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    usage: data.usage ?? null,
    model: data.model ?? config.deepseek.model,
  };
}
