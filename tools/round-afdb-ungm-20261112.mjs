// 本次（2026-11-12）用 ego 浏览器读取 AfDB 与 UNGM 列表页（curl 被 Cloudflare / 前端脚本阻挡）。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/afdb-ungm-20261112.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-afdb-ungm-20261112');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), results: {} };

const grab = async (key, url) => {
  try {
    await page.goto(url, { timeout: 90000 });
    await page.waitForTimeout(8000);
    const r = await page.evaluate(() => ({
      title: document.title,
      text: document.body.innerText.slice(0, 20000),
      links: [...document.querySelectorAll('a')].map((a) => ({ t: a.textContent.trim().replace(/\s+/g, ' '), h: a.href })).filter((x) => x.t.length > 15).slice(0, 300),
    }));
    out.results[key] = { url, ok: true, ...r };
  } catch (e) {
    out.results[key] = { url, ok: false, error: String(e.message || e) };
  }
};

await grab('afdb_pn', 'https://www.afdb.org/en/documents/category/procurement-notices');
await grab('afdb_gpn', 'https://www.afdb.org/en/documents/category/general-procurement-notices');
await grab('ungm', 'https://www.ungm.org/Public/Notice');

await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
for (const [k, v] of Object.entries(out.results)) console.log(k, v.ok ? 'ok title=' + v.title + ' textlen=' + v.text.length : 'FAIL ' + v.error);
await task.finish({ keep: [] });
