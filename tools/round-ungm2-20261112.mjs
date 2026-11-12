// 2026-11-12 第二轮：直接操作 UNGM 页面的国家下拉框并读取渲染后的公告行。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/ungm-20261112.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-afdb-ungm-20261112');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), ok: true, countries: {} };
const IDS = { GH: '2370', TG: '2494', NG: '2443' };

try {
  for (const [code, id] of Object.entries(IDS)) {
    await page.goto('https://www.ungm.org/Public/Notice', { timeout: 90000 });
    await page.waitForTimeout(6000);
    await page.evaluate((cid) => {
      const s = document.querySelector('#selNoticeCountry');
      s.value = cid;
      s.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.jQuery) window.jQuery(s).trigger('change').trigger('chosen:updated');
      const btn = [...document.querySelectorAll('button, a, input[type=button], input[type=submit]')]
        .find((b) => /^(search|rechercher)$/i.test((b.textContent || b.value || '').trim()));
      if (btn) btn.click();
    }, id);
    await page.waitForTimeout(12000);
    const r = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.tableRow.dataRow, .tableRow')]
        .map((tr) => tr.innerText.replace(/\s*\n\s*/g, ' | ').trim())
        .filter((t) => t.length > 30);
      const link = [...document.querySelectorAll('.tableRow a[href*="Notice"]')].map((a) => a.href);
      return { total: (document.body.innerText.match(/Displaying results[^\n]*/) || [''])[0], rows: rows.slice(0, 60), links: link.slice(0, 60) };
    });
    out.countries[code] = r;
  }
} catch (e) { out.ok = false; out.error = String(e.message || e); }

await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
for (const [k, v] of Object.entries(out.countries)) {
  console.log('==== ' + k + ' ' + (v.total || ''));
  for (const r of v.rows || []) console.log('  - ' + r);
}
if (out.error) console.log('ERROR ' + out.error);
await task.finish({ keep: [] });
