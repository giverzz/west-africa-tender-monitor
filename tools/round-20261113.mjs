// 2026-11-13：其余来源用 ego 浏览器读取（curl 取不到前端渲染内容 / 被 Cloudflare 阻挡）。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/round-20261113.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-round-20261113');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), results: {} };

const grab = async (key, url, wait = 8000) => {
  try {
    await page.goto(url, { timeout: 90000 });
    await page.waitForTimeout(wait);
    const r = await page.evaluate(() => ({
      title: document.title,
      text: document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 16000),
      links: [...document.querySelectorAll('a')].map((a) => ({ t: a.textContent.trim().replace(/\s+/g, ' '), h: a.href })).filter((x) => x.t.length > 15).slice(0, 250),
    }));
    out.results[key] = { url, ok: true, ...r };
  } catch (e) {
    out.results[key] = { url, ok: false, error: String(e.message || e) };
  }
};

await grab('mrh', 'https://bids.mrh.gov.gh/bids');
await grab('ppa', 'https://ppa.gov.gh/');
await grab('dnccp', 'https://dnccp.gouv.tg/');
await grab('osmapt', 'https://osmapt.armp.tg/');
await grab('ceet', 'https://www.ceet.tg/tg/?cat=15');
await grab('intercom', 'https://intercom.tg/opportunites/appels-d-offres');
await grab('nocopo', 'https://bppweb.webhostingng.org/nigeria-open-contracting-portal/');
await grab('bpp', 'https://www.bpp.gov.ng/');
await grab('rea', 'https://www.rea.gov.ng/tenders');
await grab('nep', 'https://nep.rea.gov.ng/resource-hub.html');
await grab('nddc', 'https://eprocurement.nddc.gov.ng/');
await grab('afdb_pn', 'https://www.afdb.org/en/documents/category/procurement-notices');
await grab('afdb_gpn', 'https://www.afdb.org/en/documents/category/general-procurement-notices');
await grab('ungm', 'https://www.ungm.org/Public/Notice', 11000);

await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
for (const [k, v] of Object.entries(out.results)) console.log(k, v.ok ? 'ok title=' + v.title + ' textlen=' + v.text.length : 'FAIL ' + v.error);
await task.finish({ keep: [] });
