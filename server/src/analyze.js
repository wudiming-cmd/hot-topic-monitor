// 构造 DeepSeek 分析提示词。面向内容运营,产品为 Theme/Keyboard/Wallpaper/Sticker,市场美区。

const SYSTEM = `你是资深内容运营分析师,服务一个做手机个性化内容的团队,产品类型包括 Theme(主题)、Keyboard(键盘)、Wallpaper(壁纸)、Sticker(贴纸),目标市场美国,目标用户以年轻女性为主。
你的任务是把数据转成"可执行的内容选题判断"。要求:
- 用简体中文,结构化输出(用小标题 + 要点列表)。
- 聚焦"我们能不能做成 Theme/Keyboard/Wallpaper/Sticker",给出理由。
- 标注优先级(强烈建议/可做/观望),并说明依据。
- 务实、具体,避免空话;能给出具体设计方向/风格关键词更好。
- 控制在 400 字以内。`;

function clip(arr, n) { return Array.isArray(arr) ? arr.slice(0, n) : []; }

export function buildMessages(kind, payload = {}, question = '') {
  let user = '';

  if (kind === 'trends') {
    const items = clip(payload.items, 25).map((t) =>
      `- [${t.source}/${t.category}] ${t.title} (综合分${t.composite_score ?? '-'}, ${t.status})`).join('\n');
    user = `下面是跨平台实时热点榜(已按综合分排序):\n${items}\n\n请分析:哪些热点适合我们做成内容(Theme/Keyboard/Wallpaper/Sticker)?给出 3-6 个最值得跟进的选题方向,每个含:对应产品、风格/元素关键词、优先级与理由。`;
  } else if (kind === 'opportunities') {
    const items = clip(payload.items, 30).map((o) =>
      `- [${o.platform}/${o.category}] ${o.name} (热度${o.heat_signal ?? ''}; 推荐${(o.recommended_products || []).join('/')}; 标签${(o.tags || []).join(',')})`).join('\n');
    user = `下面是已分类的内容机会列表:\n${items}\n\n请提炼出最值得做的内容主题机会,按 强烈建议/可做/观望 三档粗排,每条说明对应产品类型与设计方向。`;
  } else if (kind === 'reviews') {
    const fmt = (list) => clip(list, 8).map((d) => `${d.label}(${d.count}次)`).join('、');
    const ag = payload.aggregated || {};
    const appLines = clip(payload.apps, 12).map((a) => `- [${a.os}] ${a.name}: ${a.avgRating}★, 正${a.positive}/负${a.negative}`).join('\n');
    user = `竞品 App 评论洞察(区分 iOS/Android):\n各 App:\n${appLines}\n\niOS 需求:${fmt(ag.iOS?.demands)}\niOS 好评点:${fmt(ag.iOS?.praises)}\niOS 差评点:${fmt(ag.iOS?.complaints)}\nAndroid 需求:${fmt(ag.Android?.demands)}\nAndroid 好评点:${fmt(ag.Android?.praises)}\nAndroid 差评点:${fmt(ag.Android?.complaints)}\n\n请分析:1) 竞品共同优势(我们要追平的);2) 竞品普遍差评/未满足需求(我们的差异化机会);3) 给我们 3-5 条具体的内容/产品行动建议,标优先级。`;
  } else {
    user = `数据:\n${JSON.stringify(payload).slice(0, 4000)}`;
  }

  if (question) user += `\n\n补充要求:${question}`;

  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: user },
  ];
}
