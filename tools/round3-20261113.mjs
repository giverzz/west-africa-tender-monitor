const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/round3-20261113.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-round3-20261113');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), results: {} };
const txt = async (key, url, wait = 9000) => {
  try {
    await page.goto(url, { timeout: 90000 });
    await page.waitForTimeout(wait);
    out.results[key] = { url, ok: true,
      text: await page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 14000)) };
  } catch (e) { out.results[key] = { url, ok: false, error: String(e.message || e) }; }
};
await txt('dnccp_ao', 'https://dnccp.gouv.tg/avis-dappel-doffre/');
await txt('dnccp_attrib', 'https://dnccp.gouv.tg/avis-dattribution-provisoire/');
await txt('osmapt', 'https://osmapt.armp.tg/');

// UNGM：筛国家后抓结果表
const IDS = { GH: '2370', TG: '2494', NG: '2443' };
for (const [code, cid] of Object.entries(IDS)) {
  try {
    await page.goto('https://www.ungm.org/Public/Notice', { timeout: 90000 });
    await page.waitForTimeout(7000);
    await page.evaluate((id) => {
      const s = document.querySelector('#selNoticeCountry');
      if (s) { s.value = id; if (window.jQuery) window.jQuery(s).trigger('change').trigger('chosen:updated'); else s.dispatchEvent(new Event('change', { bubbles: true })); }
      const btn = [...document.querySelectorAll('button, a, input[type=button], input[type=submit]')]
        .find((b) => /^(search)$/i.test((b.textContent || b.value || '').trim()));
      if (btn) btn.click();
    }, cid);
    await page.waitForTimeout(14000);
    out.results['ungm_' + code] = { ok: true, rows: await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.tableRow, .tableRow.dataRow, [class*=tableRow]')];
      return rows.map((r) => r.innerText.replace(/\s*\n\s*/g, ' | ').trim()).filter((t) => t.length > 20).slice(0, 60);
    }) };
  } catch (e) { out.results['ungm_' + code] = { ok: false, error: String(e.message || e) }; }
}
await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
for (const [k, v] of Object.entries(out.results)) console.log(k, v.ok ? 'ok ' + (v.rows ? v.rows.length + ' rows' : 'len=' + v.text.length) : 'FAIL ' + v.error);
await task.finish({ keep: [] });
