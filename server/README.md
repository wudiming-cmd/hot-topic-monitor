# 热点监测 / 内容机会雷达 — 后端 (MVP)

Node + Express 的最小后端,实现前端约定的接口契约,并接入真实数据。
- `GET /trends` — Hacker News(免 Key) + Reddit,返回归一化 TrendItem
- `GET /opportunities` — Reddit 内容版块(r/iOSsetups 等)→ 自动分类成内容机会
- `GET /monthly` — 占位(真实月度需历史快照存储)
- `GET /ads` — Meta 广告资料库(需 token,未配置返回空)
- `GET /health` — 健康检查

## 运行

```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
# 可选:在 .env 填 Reddit client_id/secret(不填则用公开 .json 兜底)
npm start                   # → http://localhost:8787
```

## 接入前端

在**前端项目根目录**建 `.env.local`:

```
VITE_API_BASE_URL=http://localhost:8787
```

重启前端 `npm run dev`,实时监控页与内容机会页即显示**真实数据**(前端代码无需改动)。

## 申请 Reddit Key(可选,建议)

1. https://www.reddit.com/prefs/apps → create another app → 选 **script**
2. redirect 填 `http://localhost`
3. 拿到 **client_id**(应用名下那串)和 **secret**,填入 `.env`

不填也能跑:回退到 `www.reddit.com/*.json` 公开接口(限流更严,云服务器 IP 可能被限)。

## 数据来源与可行性

| 端点 | 数据源 | Key | 说明 |
|---|---|---|---|
| /trends | Hacker News | 免 | 开箱即用 |
| /trends, /opportunities | Reddit | 可选 OAuth | 内容版块 hot,Upvote>200 |
| /opportunities | (分类引擎) | — | 关键词/排除词规则,无命中→待确认 |
| /monthly | — | — | 占位,需历史存储 |
| /ads | Meta Ad Library | 需 token | 未配置返回空 |

## 下一步可扩展

- Google Trends(pytrends 思路)、App Store/Play 评论(公开 RSS / scraper)、X(trends24)、TikTok(Creative Center 无头渲染)适配器。
- 历史快照存储(SQLite/Postgres)→ 真实 velocity / 变化追踪 / 月度聚合。
- 分类规则改为读数据库,与前端配置页打通。
