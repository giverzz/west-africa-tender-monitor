// DGMarket 会员公告抓取（使用用户在 ego 浏览器中已登录的会员会话，不处理验证码、不输入账号密码）。
// 运行：ego-browser nodejs -e "await import('file:///C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/tools/dgmarket-fetch.mjs')"
// 输出：W/data/dgmarket.json —— 加纳 / 多哥 / 尼日利亚近一周公告列表（标题、类型、采购方、发布日期、截止日期、公告页）。
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/dgmarket.json';
const COUNTRIES = { GH: 'gh', TG: 'tg', NG: 'ng' };
const MAX_PAGES = 12;
const fs = await import('node:fs/promises');

const task = await taskSpace('dgmarket-fetch');
const page = task.page('p1');
const out = { fetched_at: new Date().toISOString(), ok: true, logged_in: false, status: {}, rows: [] };

const MON = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const iso = (s) => { const m = String(s || '').match(/([A-Z][a-z]{2}) (\d{1,2}), (\d{4})/); return m ? `${m[3]}-${MON[m[1]]}-${m[2].padStart(2, '0')}` : ''; };

try {
  for (const [code, loc] of Object.entries(COUNTRIES)) {
    let got = 0, total = '';
    for (let p = 1; p <= MAX_PAGES; p++) {
      const url = `https://www.dgmarket.com/tenders/list.do?sub=tenders-in-Africa&locationISO=${loc}&updatedId=1w&d-446978-p=${p}`;
      await page.goto(url, { timeout: 60000 });
      const r = await page.evaluate(() => {
        const body = document.body.innerText;
        const blocked = /security verification|正在进行安全验证|Just a moment|请稍候/i.test(document.title + ' ' + body.slice(0, 400));
        const loggedIn = /\(Logout\)/.test(body.slice(0, 2000));
        const rows = [...document.querySelectorAll('tr')].filter((tr) => tr.querySelector('input[name=noticeId]')).map((tr) => {
          const field = (name) => { const t = [...tr.querySelectorAll('p')].find((x) => x.innerText.trim().startsWith(name)); return t ? t.innerText.replace(name, '').trim() : ''; };
          const txt = tr.innerText.replace(/\s+/g, ' ');
          const a = tr.querySelector('.ln_notice_title a');
          return {
            noticeId: tr.querySelector('input[name=noticeId]').value, title: a ? a.textContent.trim() : '', dgmarket_url: a ? a.href : '',
            country: field('Country:'), type: field('Type:'), buyer: field('Buyer:'),
            published_raw: (txt.match(/Published ([A-Z][a-z]{2} \d{1,2}, \d{4})/) || [])[1] || '',
            deadline_raw: (txt.match(/Deadline ([A-Z][a-z]{2} \d{1,2}, \d{4})/) || [])[1] || '',
          };
        });
        return { blocked, loggedIn, rows, total: (body.match(/[\d,]+\s+results/i) || [''])[0] };
      });
      if (r.blocked) throw new Error('DGMarket 显示安全验证页面，未读取（不绕过验证）');
      out.logged_in ||= r.loggedIn;
      total = r.total;
      for (const x of r.rows) out.rows.push({ ...x, country_code: code, published: iso(x.published_raw), deadline: iso(x.deadline_raw) });
      got += r.rows.length;
      if (r.rows.length < 20) break;
    }
    out.status[code] = { ok: true, rows: got, total };
  }
} catch (e) {
  out.ok = false; out.error = String(e.message || e);
}
out.rows = Object.values(Object.fromEntries(out.rows.map((x) => [x.noticeId, x]))); // 翻页可能重复，按公告号去重
if (!out.logged_in) { out.ok = false; out.error ||= '未检测到 DGMarket 登录状态（页面无 Logout），未获授权'; }
await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log(JSON.stringify({ ok: out.ok, logged_in: out.logged_in, status: out.status, error: out.error }));
await task.finish({ keep: [] });
