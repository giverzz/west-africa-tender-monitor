// 2026-11-21：在 UNGM 按标题关键词查找公告编号与详情（只读）。
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-ungm-find-20261121');
const page = task.page('p1');
const out = {};
await page.goto('https://www.ungm.org/Public/Notice', { timeout: 90000 });
await page.waitForTimeout(6000);
await page.evaluate(() => { const i = document.querySelector('#txtNoticeFilterTitle'); i.value = 'NORRIP'; i.dispatchEvent(new Event('input', { bubbles: true })); const b = [...document.querySelectorAll('button,input[type=button]')].find((x) => /^search$/i.test((x.textContent || x.value || '').trim())); b && b.click(); });
await page.waitForTimeout(10000);
out.rows = await page.evaluate(() => [...document.querySelectorAll('.tableRow')].map((r) => ({ t: r.innerText.slice(0, 300), id: r.getAttribute('data-noticeid'), html: r.outerHTML.match(/Notice\/\d+/g) })));
const id = (out.rows.find((r) => r.id) || {}).id || ((out.rows.find((r) => r.html) || {}).html || [''])[0].replace('Notice/', '');
if (id) { await page.goto('https://www.ungm.org/Public/Notice/' + id, { timeout: 90000 }); await page.waitForTimeout(6000); out.id = id; out.detail = await page.evaluate(() => document.body.innerText.slice(0, 5000)); }
await fs.writeFile('C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/ungm-find-20261121.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.rows).slice(0, 600)); console.log(out.id, (out.detail || '').slice(0, 3500));
await task.finish({ keep: [] });
