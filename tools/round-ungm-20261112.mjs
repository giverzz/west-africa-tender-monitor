// 2026-11-12：在 ego 浏览器中按加纳/多哥/尼日利亚筛选 UNGM 公告列表。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/ungm-20261112.json';
const fs = await import('node:fs/promises');
const task = await taskSpace('wat-afdb-ungm-20261112');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), ok: true, countries: {} };

// UNGM 的公告列表由前端向 /Public/Notice/Search 发 POST 获取，这里在页面上下文内按国家查询。
const CODES = { GH: 79, TG: 219, NG: 160 }; // UNGM 国家 id，下面会先从页面下拉框核对
try {
  await page.goto('https://www.ungm.org/Public/Notice', { timeout: 90000 });
  await page.waitForTimeout(6000);

  const opts = await page.evaluate(() => {
    const res = {};
    for (const el of document.querySelectorAll('select, .chosen-results li, [data-value]')) {
      const t = (el.textContent || '').trim();
      if (/^(Ghana|Togo|Nigeria)$/.test(t)) res[t] = el.getAttribute('data-value') || el.value || '';
    }
    const sels = [...document.querySelectorAll('select')].map((s) => ({ name: s.name || s.id, n: s.options.length,
      hits: [...s.options].filter((o) => /^(Ghana|Togo|Nigeria)$/.test(o.text.trim())).map((o) => o.text.trim() + '=' + o.value) }));
    return { res, sels };
  });
  out.option_probe = opts;

  for (const [code, id] of Object.entries(CODES)) {
    const r = await page.evaluate(async (cid) => {
      const body = {
        PageIndex: 0, PageSize: 100, Title: '', Description: '', Reference: '', PublishedFrom: '', PublishedTo: '',
        DeadlineFrom: '', DeadlineTo: '', Countries: [cid], Agencies: [], UNSPSCs: [], NoticeTypes: [], SortField: 'DatePublished',
        SortAscending: false, isPicker: false, NoticeDisplayType: '', NoticeSearchTotalLabelId: 'noticeSearchTotal',
        TypeOfCompetitions: [], Status: [],
      };
      const res = await fetch('/Public/Notice/Search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      const div = document.createElement('div');
      div.innerHTML = text;
      const rows = [...div.querySelectorAll('.tableRow')].map((tr) => {
        const c = [...tr.querySelectorAll('.tableCell, div')].map((d) => d.textContent.trim().replace(/\s+/g, ' '));
        return { text: tr.textContent.replace(/\s+/g, ' ').trim().slice(0, 400), href: (tr.querySelector('a') || {}).href || '', id: tr.getAttribute('data-noticeid') || '' };
      });
      return { status: res.status, len: text.length, rows, raw: rows.length ? '' : text.slice(0, 1500) };
    }, id);
    out.countries[code] = r;
  }
} catch (e) { out.ok = false; out.error = String(e.message || e); }

await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log(JSON.stringify({ ok: out.ok, error: out.error, probe: out.option_probe && out.option_probe.sels,
  counts: Object.fromEntries(Object.entries(out.countries).map(([k, v]) => [k, { status: v.status, rows: v.rows && v.rows.length }])) }, null, 1));
await task.finish({ keep: [] });
