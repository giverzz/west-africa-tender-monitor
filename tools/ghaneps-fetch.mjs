// GHANEPS 当前招标列表抓取（官方电子采购系统，公开列表页，无需登录）。
// 用法：node ghaneps-fetch.mjs <输出文件.json> [页数=8]
// 输出每行：标题、采购方、截止时间、程序、状态、发布时间（GHANEPS 列表显示为 GMT，即加纳时间）、原始公告链接。
// 若证书校验失败，用 `node --use-system-ca` 运行以使用 Windows 证书库（不关闭校验）。
import fs from 'node:fs';

const BASE = 'https://www.ghaneps.gov.gh/epps/';
const pages = +(process.argv[3] || 8);
const MON = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
// GHANEPS 按请求语言输出 "Mon Nov 23 12:00:00 GMT 2026" 或 "23/11/2026 12:00:00"（均为 GMT）→ "2026-11-23 12:00"
const gmt = (s) => {
  let m = String(s).match(/\w{3} (\w{3}) (\d{2}) (\d{2}):(\d{2}):\d{2} GMT (\d{4})/);
  if (m) return `${m[5]}-${MON[m[1]]}-${m[2]} ${m[3]}:${m[4]}`;
  m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}` : null;
};
const txt = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

const out = { fetched_at: new Date().toISOString(), ok: true, pages_read: 0, rows: [] };
try {
  for (let p = 1; p <= pages; p++) {
    const url = `${BASE}quickSearchAction.do?searchSelect=1&selectedItem=quickSearchAction.do%3FsearchSelect%3D1&d-3680175-p=${p}`;
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 tender-monitor' } });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' page ' + p);
    const h = await r.text();
    const trs = [...h.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]).filter((t) => /resourceId=\d+/.test(t));
    if (!trs.length) break;
    for (const t of trs) {
      const tds = [...t.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
      const rid = (t.match(/resourceId=(\d+)/) || [])[1];
      out.rows.push({
        resourceId: rid,
        url: `${BASE}cft/prepareViewCfTWS.do?resourceId=${rid}`,
        title_original: txt(tds[1] || ''), entity: txt(tds[2] || ''),
        deadline: gmt(txt(tds[4] || '')), deadline_raw: txt(tds[4] || ''), procedure: txt(tds[5] || ''), status: txt(tds[6] || ''),
        published_at: gmt(txt(tds[8] || '')),
      });
    }
    out.pages_read = p;
  }
} catch (e) { out.ok = false; out.error = String(e.message || e); }
fs.writeFileSync(process.argv[2] || 'ghaneps.json', JSON.stringify(out, null, 1));
console.log(`GHANEPS ok=${out.ok} pages=${out.pages_read} rows=${out.rows.length}${out.error ? ' error=' + out.error : ''}`);
