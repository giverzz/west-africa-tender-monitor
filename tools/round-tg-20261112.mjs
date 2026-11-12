// 2026-11-12：多哥来源（CEET / OSMAPT / InterCom）与 NDDC 门户用 ego 浏览器读取（curl 取不到前端渲染内容）。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/tg-20261112.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-afdb-ungm-20261112');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), results: {} };

const grab = async (key, url) => {
  try {
    await page.goto(url, { timeout: 90000 });
    await page.waitForTimeout(9000);
    const r = await page.evaluate(() => ({
      title: document.title,
      text: document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 9000),
    }));
    out.results[key] = { url, ok: true, ...r };
  } catch (e) {
    out.results[key] = { url, ok: false, error: String(e.message || e) };
  }
};

await grab('ceet', 'https://www.ceet.tg/tg/?cat=15');
await grab('osmapt', 'https://osmapt.armp.tg/');
await grab('intercom', 'https://intercom.tg/opportunites/appels-d-offres');
await grab('nddc', 'https://eprocurement.nddc.gov.ng/');

await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
for (const [k, v] of Object.entries(out.results)) {
  console.log('######## ' + k + ' ' + (v.ok ? 'ok ' + v.title : 'FAIL ' + v.error));
  if (v.ok) console.log(v.text.slice(0, 3500));
}
await task.finish({ keep: [] });
