// 由 master.json 生成网站数据 site/data.json：计算状态、终态时间、完整度，并清理终态满 72 小时的记录。
// 用法：node build.mjs <master.json> <site/data.json> [--now=ISO] [--dry]
// master.json 是唯一主存储；本脚本会把清理结果写回 master.json，并把被清理的记录追加到 purge-log.json。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [masterPath, outPath] = process.argv.slice(2);
const nowArg = process.argv.find((a) => a.startsWith('--now='));
const NOW = nowArg ? Date.parse(nowArg.slice(6)) : Date.now();
const H72 = 72 * 3600 * 1000;

export const STAGES = ['采购计划', '意向征集', '资格预审', '询价', '正式招标', '建议书征集', '开标/评审', '中标', '取消', '已截止'];
const OPEN_STAGES = ['意向征集', '资格预审', '询价', '正式招标', '建议书征集'];
export const SECTORS = ['清洁能源/光伏', '电力电气', '道路桥梁', '水利灌溉', '建筑基础设施', '工程咨询'];

const tzOffset = (c) => (c === 'NG' ? 1 : 0); // 尼日利亚 WAT UTC+1，加纳/多哥 UTC+0

// "YYYY-MM-DD[ HH:MM]" 按公告国当地时间解析为 UTC 毫秒；无时刻时按当日 23:59 处理
export function localMillis(raw, country) {
  const m = String(raw || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const h = m[4] === undefined ? 23 : +m[4], mi = m[5] === undefined ? 59 : +m[5];
  return Date.UTC(+m[1], +m[2] - 1, +m[3], h, mi) - tzOffset(country) * 3600000;
}

const EMPTY = /^(?:|未披露|尚未披露|公告未载明|待核实|未知|n\/a|—|-)$/i;
const filled = (v) => { const t = String(v ?? '').trim(); return !EMPTY.test(t) && !t.includes('待核实'); };

// 信息完整度：只计已核实的关键字段（满分 12）
export function completeness(x) {
  const checks = [x.title_original, x.entity, x.location, x.scope, x.ref_no, x.stage, x.published_at, x.deadline,
    x.amount, x.url, x.verified_at, x.conditions || x.risk];
  return checks.filter(filled).length;
}

function status(x) {
  const dl = localMillis(x.deadline, x.country);
  if (x.stage === '中标') return { status: '已授标', terminal: true };
  if (x.stage === '取消') return { status: '已取消', terminal: true };
  if (x.stage === '已截止') return { status: '已截止（待评审）', terminal: true };
  if (x.stage === '开标/评审') return { status: '评审中', terminal: false };
  if (x.stage === '采购计划') return { status: '计划阶段', terminal: false };
  if (OPEN_STAGES.includes(x.stage)) {
    if (dl === null) return { status: '开放中（截止待核实）', terminal: false };
    if (dl < NOW) return { status: '已截止（待评审）', terminal: true, auto: true };
    return { status: '开放中', terminal: false };
  }
  return { status: '待核实', terminal: false };
}

export function idFor(x) { return crypto.createHash('sha1').update(String(x.url || x.title_original || x.title)).digest('hex').slice(0, 12); }

const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const kept = [], purged = [];
for (const x of master.items) {
  x.id ||= idFor(x);
  if (!STAGES.includes(x.stage)) throw new Error(`未知采购阶段 "${x.stage}"：${x.title}`);
  const s = status(x);
  x.status = s.status;
  if (s.terminal) {
    // 终态发生时间：显式记录优先；截止类终态以截止时刻为准。
    // 授标/取消必须由任务写入公告确认的 terminal_at，否则不计时、不清理。
    if (!x.terminal_at && s.status.startsWith('已截止')) {
      const dl = localMillis(x.deadline, x.country);
      x.terminal_at = dl !== null ? new Date(dl).toISOString() : null;
    }
  } else x.terminal_at = null;
  const t = x.terminal_at ? Date.parse(x.terminal_at) : null;
  if (t !== null && NOW - t >= H72) { purged.push({ id: x.id, title: x.title, url: x.url, status: x.status, terminal_at: x.terminal_at, purged_at: new Date(NOW).toISOString() }); continue; }
  kept.push(x);
}
const DRY = process.argv.includes('--dry'); // 只预览，不写回主存储
master.items = kept;
if (!DRY) fs.writeFileSync(masterPath, JSON.stringify(master, null, 1));
if (purged.length && !DRY) {
  const logPath = path.join(path.dirname(masterPath), 'purge-log.json');
  const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
  fs.writeFileSync(logPath, JSON.stringify(log.concat(purged), null, 1));
}

const site = {
  meta: { ...master.meta, built_at: new Date(NOW).toISOString(), purge_rule: '终态（已授标/已取消/已截止）满 72 小时自动删除' },
  sources: master.sources,
  items: kept.map((x) => ({ ...x, completeness: completeness(x), deadline_ms: localMillis(x.deadline, x.country) })),
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(site, null, 1));
console.log(`保留 ${kept.length} 条，本次清理 ${purged.length} 条 → ${outPath}`);
