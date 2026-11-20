// 2026-11-20：取 UNGM 三条候选的公告编号与详情。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/ungm-detail-20261120.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-ungm-detail-20261120');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), rows: [] };
const Q = [['2494', '139097'], ['2443', '30000037147'], ['2443', '9207280']];
try {
  for (const [cid, key] of Q) {
    await page.goto('https://www.ungm.org/Public/Notice', { timeout: 90000 });
    await page.waitForTimeout(6000);
    await page.evaluate((cid) => {
      const s = document.querySelector('#selNoticeCountry'); s.value = cid;
      if (window.jQuery) window.jQuery(s).trigger('change').trigger('chosen:updated');
      const d = document.querySelector('#txtNoticePublishedFrom'); d.value = '13-Nov-2026';
      if (window.jQuery) window.jQuery(d).trigger('change');
      [...document.querySelectorAll('button, a, input[type=button], input[type=submit]')].find((b) => /^(search|rechercher)$/i.test((b.textContent || b.value || '').trim())).click();
    }, cid);
    await page.waitForTimeout(13000);
    const id = await page.evaluate((key) => {
      const tr = [...document.querySelectorAll('.tableRow')].find((t) => t.innerText.includes(key));
      if (!tr) return null;
      const m = tr.outerHTML.match(/data-noticeid="(\d+)"|Notice\/(\d+)/i);
      return m ? (m[1] || m[2]) : tr.outerHTML.slice(0, 600);
    }, key);
    const row = { key, id };
    if (id && /^\d+$/.test(id)) {
      await page.goto('https://www.ungm.org/Public/Notice/' + id, { timeout: 90000 });
      await page.waitForTimeout(6000);
      row.text = await page.evaluate(() => document.body.innerText.slice(0, 6000));
    }
    out.rows.push(row);
  }
} catch (e) { out.error = String(e.message || e); }
await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
for (const r of out.rows) console.log('==== ' + r.key + ' id=' + r.id + '\n' + (r.text || '').replace(/\n\s*\n/g, '\n').slice(0, 2500));
if (out.error) console.log('ERR', out.error);
await task.finish({ keep: [] });
