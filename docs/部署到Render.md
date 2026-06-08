# 后端部署到 Render（让任何电脑都能看到真实数据）

目标:把 `server/` 部署成一个**公网后端**,再让 Vercel 前端连它。完成后所有人/所有电脑打开网站都是真实数据。

---

## 一、部署后端到 Render

1. 打开 https://render.com → 用 GitHub 登录 → 授权访问仓库 `wudiming-cmd/hot-topic-monitor`。
2. 点 **New +** → **Blueprint**。
3. 选仓库 `hot-topic-monitor`。Render 会读到根目录的 `render.yaml`,自动识别出一个 Web 服务 `hot-topic-monitor-api`。
4. 它会提示你填那几个 **sync:false** 的密钥(在控制台填,不进 git):
   | 变量 | 填什么 |
   |---|---|
   | `GIPHY_API_KEY` | 你的 Giphy key |
   | `TMDB_API_KEY` | 你的 TMDb key |
   | `YOUTUBE_API_KEY` | 有就填,没有留空 |
   | `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | 有就填(云上 IP 更可能抓到 Reddit) |
   | `DEEPSEEK_API_KEY` | AI 分析用,有就填(OpenRouter 则同时改 MODEL/BASE_URL) |
   | `META_ADLIB_TOKEN` | 一般留空 |
   > 不填的留空即可,对应源会自动跳过。
5. 点 **Apply / Create** → 等待构建(2–4 分钟)。
6. 成功后拿到公网地址,形如 `https://hot-topic-monitor-api.onrender.com`。
   - 验证:浏览器打开 `https://...onrender.com/health` 应返回 `{"ok":true,...}`。

> 说明:免费档闲置一会儿会休眠,首次访问有 ~30 秒冷启动;之后正常。

---

## 二、让 Vercel 前端连这个后端

1. 打开 Vercel → 项目 `hot-topic-monitor` → **Settings → Environment Variables**。
2. 新增:
   ```
   VITE_API_BASE_URL = https://hot-topic-monitor-api.onrender.com
   ```
   (换成你实际的 Render 地址,**结尾不要带斜杠**)
3. 回到 **Deployments** → 对最新部署点 **Redeploy**(让新环境变量生效)。
4. 打开 Vercel 网址 → 顶部应显示「实时数据」,任何电脑都能看到真实热点/梗图/娱乐等。

---

## 三、注意事项

- **CORS**:已默认放开(`CORS_ORIGIN=*`)。要收紧可在 Render 把它改成你的 Vercel 域名。
- **历史数据**:Render 免费档磁盘是临时的,重启后 SQLite 历史会清空 → velocity/月度会重新积累。要持久化可挂 Render 的 Persistent Disk(付费)或换数据库。
- **Reddit**:云服务器 IP 比本机更可能抓到(本机此前被 403)。
- **TikTok/Pinterest 无头源**:Render 默认环境没有浏览器,保持 `ENABLE_HEADLESS=false`。
- **定时采集**:想让 velocity/月度自然积累,可在 Render 环境变量加 `COLLECT_INTERVAL_MIN=60`。

---

## 备选托管

Railway / Fly.io / 自己的云服务器(Nginx + pm2)同理:根目录 `server`、`npm install`、`npm start`、设环境变量、暴露 `PORT`。
