// TikTok / Pinterest 无头浏览器适配器(可选)。
// 这两个平台无免 Key 接口(JS 渲染 + 反爬),需 Playwright。
// 默认未安装 Playwright 时优雅报错(不影响其它源)。
// 启用:cd server && npm i -D playwright && npx playwright install chromium

async function getBrowser() {
  let pw;
  try {
    pw = await import('playwright');
  } catch {
    throw new Error('未安装 playwright(npm i -D playwright && npx playwright install chromium)');
  }
  return pw.chromium.launch({ headless: true });
}

async function withPage(fn) {
  const browser = await getBrowser();
  try {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      locale: 'en-US',
    });
    const page = await ctx.newPage();
    return await fn(page);
  } finally {
    await browser.close();
  }
}

/** TikTok Creative Center — 热门话题标签(美区)。 */
export async function fetchTikTokTrendsHeadless(limit = 20) {
  return withPage(async (page) => {
    await page.goto('https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en?region=US', {
      waitUntil: 'networkidle', timeout: 45000,
    });
    await page.waitForTimeout(3500);
    const terms = await page.evaluate(() => {
      const set = new Set();
      document.querySelectorAll('span, a, h3').forEach((el) => {
        const t = (el.textContent || '').trim();
        if (/^#[\w一-龥]{2,30}$/.test(t)) set.add(t);
      });
      return [...set];
    });
    return terms.slice(0, limit).map((term) => ({
      term, url: `https://www.tiktok.com/tag/${encodeURIComponent(term.replace(/^#/, ''))}`,
    }));
  });
}

/** Pinterest Today / trends — 飙升视觉关键词(美区)。 */
export async function fetchPinterestTodayHeadless(limit = 20) {
  return withPage(async (page) => {
    await page.goto('https://www.pinterest.com/today/', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3500);
    const terms = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('[data-test-id] h1, [data-test-id] h2, h3, a[href*="/search/"]').forEach((el) => {
        const t = (el.textContent || '').trim();
        if (t.length >= 3 && t.length <= 40) out.push(t);
      });
      return [...new Set(out)];
    });
    return terms.slice(0, limit).map((term) => ({
      term, url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(term)}`,
    }));
  });
}
