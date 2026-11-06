// 世界银行采购公告抓取：加纳 / 多哥 / 尼日利亚，筛选工程与能源相关、仍在截止前的公告。
// 用法：node wb-fetch.mjs <输出文件.json>
// 输出候选清单（含原文摘录），由每日任务判断是否并入 data/master.json。
import fs from 'node:fs';

const API = 'https://search.worldbank.org/api/v2/procnotices';
const COUNTRIES = { GH: 'Ghana', TG: 'Togo', NG: 'Nigeria' };
const SECTOR_RE = /solar|photovoltaic|mini.?grid|renewable|electri|power|grid|transformer|substation|transmission|distribution|road|bridge|culvert|highway|drain|water|irrigation|borehole|dam|pump|construction|rehabilitation|building|works|civil|infrastructure|supervision|design review|énergie|électri|route|pont|eau|travaux|construction|réhabilitation|poste/i;
const now = Date.now();
const out = { fetched_at: new Date().toISOString(), status: {}, candidates: [] };

const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&rsquo;|&lsquo;/g, "'").replace(/&ndash;|&mdash;/g, '-').replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è')
  .replace(/&agrave;/g, 'à').replace(/&deg;/g, '°').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

async function getJson(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 tender-monitor' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

for (const [code, name] of Object.entries(COUNTRIES)) {
  try {
    const fl = 'id,project_id,project_name,bid_description,notice_type,noticedate,submission_deadline_date,procurement_method_name,project_ctry_name';
    const j = await getJson(`${API}?format=json&rows=80&srt=submission_date&order=desc&project_ctry_code=${code}&fl=${fl}`);
    const list = Object.values(j.procnotices || {}).filter((x) =>
      x.notice_type !== 'Contract Award' && SECTOR_RE.test((x.bid_description || '') + ' ' + (x.project_name || '')));
    let kept = 0;
    for (const x of list) {
      const d = await getJson(`${API}?format=json&id=${x.id}`);
      const n = Object.values(d.procnotices || {})[0] || {};
      const dl = n.submission_deadline_date ? Date.parse(n.submission_deadline_date) : null;
      if (dl !== null && dl + 86400000 < now) continue; // 已过截止日，不作为开放机会
      const text = strip(n.notice_text);
      const dlSentence = (text.match(/(?:deadline|later than|on or before|au plus tard|avant le)[^.]{0,180}/i) || [''])[0];
      out.candidates.push({
        id: x.id, country: code, url: `https://projects.worldbank.org/en/projects-operations/procurement-detail/${x.id}`,
        notice_type: n.notice_type, method: n.procurement_method_name, noticedate: n.noticedate,
        submission_date: n.submission_date, deadline_date: n.submission_deadline_date || null,
        deadline_time: n.submission_deadline_time || null, deadline_sentence: dlSentence,
        bid_reference_no: n.bid_reference_no || null, project_id: n.project_id, project_name: n.project_name,
        title_original: n.bid_description, entity: n.contact_organization, contact_address: n.contact_address,
        excerpt: text.slice(0, 1800),
      });
      kept++;
    }
    out.status[code] = { ok: true, scanned: Object.keys(j.procnotices || {}).length, sector_matched: list.length, open_candidates: kept };
  } catch (e) {
    out.status[code] = { ok: false, error: String(e.message || e) };
  }
}
fs.writeFileSync(process.argv[2] || 'wb-candidates.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.status), 'candidates:', out.candidates.length);
