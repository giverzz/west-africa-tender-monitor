// 2026-11-16：其余来源用 ego 浏览器读取（curl 取不到前端渲染内容 / 被 Cloudflare 阻挡）。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/round-20261116.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-round-20261116');
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

await grab('dnccp', 'https://dnccp.gouv.tg/avis-dappel-doffre/');
await grab('osmapt', 'https://osmapt.armp.tg/');
await grab('ceet', 'https://www.ceet.tg/tg/?cat=15');
await grab('nocopo', 'https://bppweb.webhostingng.org/nigeria-open-contracting-portal/');
await grab('bpp', 'https://www.bpp.gov.ng/');
await grab('rea', 'https://www.rea.gov.ng/tenders');
await grab('nep', 'https://nep.rea.gov.ng/resource-hub.html?category=procurement-notices');
await grab('nddc', 'https://eprocurement.nddc.gov.ng/', 10000);

await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
for (const [k, v] of Object.entries(out.results)) console.log(k, v.ok ? 'ok title=' + v.title + ' textlen=' + v.text.length : 'FAIL ' + v.error);
// UNGM
out.ungm={};
const IDS = { GH: '2370', TG: '2494', NG: '2443' };
try {
  for (const [code, id] of Object.entries(IDS)) {
    await page.goto('https://www.ungm.org/Public/Notice', { timeout: 90000 });
    await page.waitForTimeout(6000);
    const applied = await page.evaluate((cid) => {
      const log = {};
      const s = document.querySelector('#selNoticeCountry');
      s.value = cid;
      if (window.jQuery) window.jQuery(s).trigger('change').trigger('chosen:updated');
      else s.dispatchEvent(new Event('change', { bubbles: true }));
      const dateIn = [...document.querySelectorAll('input')]
        .filter((i) => /publish/i.test(i.id + i.name + (i.placeholder || '') + (i.getAttribute('data-field') || '')));
      log.dateInputs = dateIn.map((i) => i.id || i.name);
      if (dateIn[0]) {
        dateIn[0].value = '11-Nov-2026';
        dateIn[0].dispatchEvent(new Event('input', { bubbles: true }));
        dateIn[0].dispatchEvent(new Event('change', { bubbles: true }));
        if (window.jQuery) window.jQuery(dateIn[0]).trigger('change');
      }
      const btn = [...document.querySelectorAll('button, a, input[type=button], input[type=submit]')]
        .find((b) => /^(search|rechercher)$/i.test((b.textContent || b.value || '').trim()));
      log.btn = !!btn;
      if (btn) btn.click();
      return log;
    }, id);
    await page.waitForTimeout(13000);
    const r = await page.evaluate(() => ({
      total: (document.body.innerText.match(/Displaying results[^\n]*/) || [''])[0],
      rows: [...document.querySelectorAll('.tableRow')].map((tr) => ({
        t: tr.innerText.replace(/\s*\n\s*/g, ' ~ ').replace(/\t/g, ' ~ ').trim(),
        href: (tr.querySelector('a') || {}).href || '',
      })).filter((r) => r.t.length > 40 && !/^Title ~ Deadline/.test(r.t)),
    }));
    out.ungm[code] = { applied, ...r };
  }
} catch (e) { out.ungm_error = String(e.message || e); }
await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
for (const [k, v] of Object.entries(out.ungm)) { console.log('==== ' + k + ' ' + v.total); for (const r of v.rows || []) console.log('  - ' + r.t.slice(0,260)); }
await task.finish({ keep: [] });
