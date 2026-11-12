// 2026-11-12 第四轮：UNGM 按国家 + 发布日期（近一周）筛选，先探测表单字段再查询。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/ungm-rows-20261112.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-afdb-ungm-20261112');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), ok: true, countries: {} };
const IDS = { GH: '2370', TG: '2494', NG: '2443' };

try {
  await page.goto('https://www.ungm.org/Public/Notice', { timeout: 90000 });
  await page.waitForTimeout(6000);
  out.inputs = await page.evaluate(() => [...document.querySelectorAll('input, select')]
    .map((e) => ({ tag: e.tagName, id: e.id, name: e.name, type: e.type, ph: e.placeholder || '' }))
    .filter((e) => e.id || e.name));

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
        dateIn[0].value = '05-Nov-2026';
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
    out.countries[code] = { applied, ...r };
  }
} catch (e) { out.ok = false; out.error = String(e.message || e); }

await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log(JSON.stringify({ ok: out.ok, error: out.error, inputs: (out.inputs || []).slice(0, 40) }, null, 1));
for (const [k, v] of Object.entries(out.countries)) {
  console.log('==== ' + k + ' ' + (v.total || '') + ' ' + JSON.stringify(v.applied));
  for (const r of v.rows || []) console.log('  - ' + r.t);
}
await task.finish({ keep: [] });
