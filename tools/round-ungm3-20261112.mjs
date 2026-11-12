// 2026-11-12 第三轮：UNGM 按国家筛选后翻完所有页，收集全部行，供本地按发布日期与领域筛查。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/ungm-rows-20261112.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-afdb-ungm-20261112');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), ok: true, countries: {} };
const IDS = { GH: '2370', TG: '2494', NG: '2443' };

const read = () => page.evaluate(() => ({
  total: (document.body.innerText.match(/Displaying results[^\n]*/) || [''])[0],
  rows: [...document.querySelectorAll('.tableRow')].map((tr) => ({
    t: tr.innerText.replace(/\s*\n\s*/g, ' ~ ').replace(/\t/g, ' ~ ').trim(),
    href: (tr.querySelector('a') || {}).href || '',
  })).filter((r) => r.t.length > 40 && !/^Title ~ Deadline/.test(r.t)),
}));

try {
  for (const [code, id] of Object.entries(IDS)) {
    await page.goto('https://www.ungm.org/Public/Notice', { timeout: 90000 });
    await page.waitForTimeout(6000);
    await page.evaluate((cid) => {
      const s = document.querySelector('#selNoticeCountry');
      s.value = cid;
      if (window.jQuery) window.jQuery(s).trigger('change').trigger('chosen:updated');
      else s.dispatchEvent(new Event('change', { bubbles: true }));
      const btn = [...document.querySelectorAll('button, a, input[type=button], input[type=submit]')]
        .find((b) => /^(search|rechercher)$/i.test((b.textContent || b.value || '').trim()));
      if (btn) btn.click();
    }, id);
    await page.waitForTimeout(12000);

    const all = []; const seen = new Set();
    for (let p = 0; p < 8; p++) {
      const r = await read();
      for (const row of r.rows) if (!seen.has(row.t)) { seen.add(row.t); all.push(row); }
      out.countries[code] = { total: r.total, rows: all };
      const more = await page.evaluate(() => {
        const n = [...document.querySelectorAll('a, button, span, li')]
          .find((e) => /^(next|›|>)$/i.test((e.textContent || '').trim()) && !/disabled/i.test(e.className));
        if (n) { n.click(); return true; }
        return false;
      });
      if (!more) break;
      await page.waitForTimeout(9000);
    }
  }
} catch (e) { out.ok = false; out.error = String(e.message || e); }

await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log(JSON.stringify({ ok: out.ok, error: out.error,
  counts: Object.fromEntries(Object.entries(out.countries).map(([k, v]) => [k, { total: v.total, got: v.rows.length }])) }));
await task.finish({ keep: [] });
