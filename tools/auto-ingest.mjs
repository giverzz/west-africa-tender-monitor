// 云端每日自动收录（GitHub Actions 运行，无需 Claude）：
// 读取 ghaneps-fetch / wb-fetch 的输出，把新的工程类公告并入 data/master.json，刷新仍在官方列表中的既有记录，并写入来源状态与运行记录。
// 自动收录的记录保留英文原题，标注"中文标题待翻译"，由本机 Claude 任务后续补译与复核。
// 用法：node tools/auto-ingest.mjs <ghaneps.json> <wb-candidates.json>
import fs from 'node:fs';
import crypto from 'node:crypto';

const [ghPath, wbPath] = process.argv.slice(2);
const MASTER = new URL('../data/master.json', import.meta.url);
const master = JSON.parse(fs.readFileSync(MASTER, 'utf8'));
const NOW = new Date().toISOString(), TODAY = NOW.slice(0, 10);
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const gh = read(ghPath), wb = read(wbPath);

const WORKS = /construct|rehab|renovat|road|bridge|culvert|drain|borehole|water|irrigat|\bdam\b|electri|power|solar|photovolt|mini.?grid|street ?light|transformer|substation|building|block|works|fence|asphalt|pavement|toilet|clinic|chps|classroom|hostel|housing|market|supervision|design review|travaux|énergie|route|forage/i;
const NOT_WORKS = /furniture|desk|chair|table|vehicle|\bbus\b|station wagon|laptop|computer|software|rice|cooking oil|uniform|security services|cleaning|catering|printing|stationery|drug|consumable|equipment\b(?!.*install)|satellite remote sensing|verification system|vocational|skills kit|resource materials|training materials/i;
const sectorsOf = (t) => {
  const s = [];
  if (/solar|photovolt|mini.?grid|renewable|énergie renouvelable/i.test(t)) s.push('清洁能源/光伏');
  if (/electri|power|transformer|substation|street ?light|grid/i.test(t)) s.push('电力电气');
  if (/road|bridge|culvert|asphalt|pavement|route/i.test(t)) s.push('道路桥梁');
  if (/water|borehole|irrigat|\bdam\b|drain|forage/i.test(t)) s.push('水利灌溉');
  if (/construct|building|block|classroom|clinic|chps|hostel|housing|market|toilet|fence|renovat|rehab|works|travaux/i.test(t)) s.push('建筑基础设施');
  if (/consult|supervision|design|study|étude/i.test(t)) s.push('工程咨询');
  return s.length ? [...new Set(s)] : ['建筑基础设施'];
};
const id = (u) => crypto.createHash('sha1').update(u).digest('hex').slice(0, 12);
const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
const byUrl = new Map(master.items.map((x) => [x.url, x]));
const titles = new Set(master.items.map((x) => norm(x.title_original)));
const src = (sid) => master.sources.find((s) => s.id === sid);
const base = (o) => ({
  location: '', ref_no: '', amount: '未披露', dgmarket_url: '', dgmarket: false, funder: '', conditions: '',
  action: '自动收录：登录官方平台下载招标文件，核实资格、保证金与工程量。',
  risk: '云端自动收录，中文标题与工程范围待人工复核；金额未披露。',
  verified_at: TODAY, terminal_at: null, added_at: NOW, auto_ingested: true, ...o,
});

let ghAdded = 0, ghRefreshed = 0, wbAdded = 0;
// GHANEPS
if (gh && gh.ok && gh.rows.length) {
  for (const r of gh.rows) {
    const ex = byUrl.get(r.url);
    if (ex) {
      if (ex.verified_at !== TODAY) { ex.verified_at = TODAY; ex.verified_note = `GHANEPS 官方列表 ${TODAY} 仍显示为投标阶段`; ghRefreshed++; }
      if (r.deadline && ex.deadline && r.deadline !== ex.deadline.slice(0, 16)) { ex.risk = `${ex.risk}；GHANEPS 列表显示截止改为 ${r.deadline}（原 ${ex.deadline}）`; ex.deadline = r.deadline; }
      if (!ex.published_at && r.published_at) ex.published_at = r.published_at;
      continue;
    }
    if (!WORKS.test(r.title_original) || NOT_WORKS.test(r.title_original) || titles.has(norm(r.title_original))) continue;
    const stage = /EOI|Expression/i.test(r.procedure) ? '意向征集' : /Quotation/i.test(r.procedure) ? '询价' : /Pre.?qual/i.test(r.procedure) ? '资格预审' : '正式招标';
    master.items.push(base({
      id: id(r.url), title: `${r.title_original}（中文标题待翻译）`, title_original: r.title_original, country: 'GH',
      sectors: sectorsOf(r.title_original), sector_raw: '自动分类', entity: r.entity, scope: r.title_original,
      stage, stage_note: r.procedure, published_at: r.published_at || '', deadline: r.deadline || '', url: r.url,
      origin: 'GHANEPS', origin_type: '政府官方', discovery: 'GHANEPS 当前招标列表（云端自动收录）',
      verified_note: `${TODAY} GHANEPS 官方列表读取`,
    }));
    ghAdded++;
  }
  Object.assign(src('ghaneps'), { status: ghAdded || ghRefreshed ? '已核验并更新' : '已核验无新增', checked_at: NOW, note: `云端读取当前招标列表 ${gh.pages_read} 页（${gh.rows.length} 条）：自动新增 ${ghAdded} 条工程类招标，刷新 ${ghRefreshed} 条既有记录核验日期。` });
} else if (gh) {
  Object.assign(src('ghaneps'), { status: '访问失败', checked_at: NOW, note: `云端读取失败：${gh.error || '无数据'}；保留既有记录。` });
}
// 世界银行
if (wb) {
  const okAll = Object.values(wb.status || {}).every((s) => s.ok);
  for (const c of wb.candidates || []) {
    if (master.items.some((x) => x.url.includes(c.id))) continue;
    if (c.notice_type !== 'Invitation for Bids' && c.notice_type !== 'Request for Expression of Interest') continue;
    if (!WORKS.test(c.title_original) || NOT_WORKS.test(c.title_original)) continue;
    const time = c.deadline_time && c.deadline_time !== '00:00' ? ' ' + c.deadline_time : '';
    master.items.push(base({
      id: id(c.url), title: `${c.title_original}（中文标题待翻译）`, title_original: c.title_original, country: c.country,
      sectors: sectorsOf(c.title_original + ' ' + c.project_name), sector_raw: '自动分类', entity: c.entity || '',
      scope: c.excerpt ? c.excerpt.slice(0, 400) : c.title_original, ref_no: c.bid_reference_no || c.id,
      stage: c.notice_type === 'Invitation for Bids' ? '正式招标' : '意向征集', stage_note: `${c.notice_type}；${c.method || ''}`,
      published_at: c.submission_date ? c.submission_date.slice(0, 10) : '', deadline: c.deadline_date ? c.deadline_date.slice(0, 10) + time : '',
      url: c.url, origin: '世界银行', origin_type: '国际机构官方', discovery: '世界银行采购公告 API（云端自动收录）',
      funder: `世界银行（项目 ${c.project_id}）`, verified_note: `${TODAY} 世界银行 API 读取`,
      risk: `云端自动收录，中文标题待复核；截止时刻以公告正文为准（${c.deadline_sentence || '未提取到'}）`,
    }));
    wbAdded++;
  }
  for (const sid of ['wb-opps', 'wb-proc']) Object.assign(src(sid), {
    status: !okAll ? '访问失败' : wbAdded ? '已核验并更新' : '已核验无新增', checked_at: NOW,
    note: okAll ? `云端按加纳/多哥/尼日利亚读取世界银行采购公告 API，开放工程类候选 ${wb.candidates.length} 条，自动新增 ${wbAdded} 条。` : `API 读取失败：${JSON.stringify(wb.status)}`,
  });
}

const coreOk = gh && gh.ok && wb && Object.values(wb.status || {}).every((s) => s.ok);
master.meta.last_run = { started_at: process.env.RUN_STARTED_AT || NOW, finished_at: NOW, result: coreOk ? '成功' : '失败', runner: 'GitHub Actions 云端',
  note: coreOk ? `云端更新：GHANEPS 新增 ${ghAdded}、世界银行新增 ${wbAdded}；DGMarket 与其他来源由本机任务读取。` : '核心来源（GHANEPS / 世界银行）读取失败，保留既有数据。' };
if (coreOk) master.meta.last_success_at = NOW;
fs.writeFileSync(MASTER, JSON.stringify(master, null, 1));
console.log(JSON.stringify({ coreOk, ghAdded, ghRefreshed, wbAdded, total: master.items.length }));
if (!coreOk) process.exitCode = 0; // 失败状态写入数据并照常发布，让网站显示真实运行状态
