import fs from 'node:fs';
import crypto from 'node:crypto';
const P = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/';
const m = JSON.parse(fs.readFileSync(P + 'master.json', 'utf8'));
const gh = JSON.parse(fs.readFileSync(P + 'ghaneps.json', 'utf8'));
const wb = JSON.parse(fs.readFileSync(P + 'wb-candidates.json', 'utf8'));
const STARTED = process.argv[2];
const TODAY = '2026-11-16';
const NOW = new Date().toISOString();
const byUrl = new Map(m.items.map((i) => [i.url, i]));
const ghByUrl = new Map(gh.rows.map((r) => [r.url, r]));
const log = { translated: 0, added: 0, verified: 0, deadline_changed: [] };
const GH_URL = (rid) => 'https://www.ghaneps.gov.gh/epps/cft/prepareViewCfTWS.do?resourceId=' + rid;

// 1.5 云端自动收录记录的中文化与复核
const CN = {
  '4002891': { title: '克罗沃市 Nungua Zongo 社区诊所建设', location: '加纳大阿克拉地区克罗沃市（Krowor）Nungua Zongo', scope: '新建 1 座社区诊所（UNSPSC 30222400 医院建筑）。', sectors: ['建筑基础设施'], ref_no: 'GAR/KroMA/WKS/23/DACF-RFG/26', funder: 'DACF-RFG（地方议会共同基金—绩效拨款）', conditions: 'GHANEPS 标书费 GHS 500；投标保证金为投标价的 2%；国内竞争性招标，Major 级工程。' },
};
for (const it of m.items) {
  if (!it.auto_ingested) continue;
  const rid = (it.url.match(/resourceId=(\d+)/) || [])[1];
  const cn = CN[rid];
  if (!cn) continue;
  const row = ghByUrl.get(it.url);
  Object.assign(it, cn);
  it.sector_raw = 'GHANEPS 工程类（Works）';
  it.action = '在 GHANEPS 平台登录后下载招标文件，核实资格要求、投标保证金、工程量清单与工期，评估是否参与。';
  it.risk = '地方议会小型土建工程，金额未披露，通常以加纳本地承包商为主，外资企业需核实资格限制。';
  it.verified_at = TODAY;
  it.verified_note = TODAY + ' 本机打开 GHANEPS 原始公告复核' + (row ? '，并在当前招标列表中复核到该公告' : '') + '；参考编号、标书费与保证金取自公告页，中文标题与工程范围据原文翻译。';
  delete it.auto_ingested;
  log.translated++;
}

// 5 新增：GHANEPS 本次逐条筛查发现的工程/能源类新公告（家具、车辆、IT、会议服务、勘探类已排除）
const base = (rid) => {
  const r = ghByUrl.get(GH_URL(rid));
  return {
    url: r.url, title_original: r.title_original, country: 'GH', entity: r.entity,
    published_at: r.published_at, deadline: r.deadline, amount: '未披露', origin: 'GHANEPS', origin_type: '政府官方',
    discovery: 'GHANEPS 当前招标列表（本机逐条筛查）', dgmarket_url: '', dgmarket: false,
    verified_at: TODAY, verified_note: TODAY + ' 本机在 GHANEPS 当前招标列表与原始公告页读取，标题、采购方、发布与截止时间取自官方页面。',
    terminal_at: null, added_at: NOW,
  };
};
const NEW = [
  { ...base('4005458'),
    title: '安洛加区 10 个未通水社区饮用水管网延伸工程',
    sectors: ['水利灌溉'], sector_raw: 'GHANEPS 工程类（Works），UNSPSC 47100000 水与污水处理',
    location: '加纳沃尔特地区安洛加区（Anloga）Penyito、Awadzagblidzi、Sakome、Kegbi、Bikor、Demekope、Akplorfudzi、Anumukope、Anyanakope、Kpordui 等社区',
    scope: '向 10 个未通水社区延伸饮用水供水管网，分 2 个标段（标段 1 为 Sakome 等 8 个社区）。',
    ref_no: 'VR/AnDA/DACF/WKS/2026/078', stage: '正式招标',
    stage_note: 'National Competitive Tendering（国内竞争性招标），GHANEPS 状态 Bid Submission，Medium 级工程，分 2 个标段',
    funder: 'DACF（地方议会共同基金，据参考编号）', conditions: '投标保证金为投标价的 2%；须在 GHANEPS 登录下载招标文件。',
    action: '登录 GHANEPS 下载招标文件，核实两个标段的管线长度、资格要求与保证金，2026-11-30 11:00 前投标。',
    risk: '地方议会小型供水工程，金额未披露，通常以加纳本地承包商为主，外资企业需核实资格限制。' },
  { ...base('4005822'),
    title: '安洛加区 Akplorfudzi CHPS 社区诊所及一室一厅半独立式宿舍建设',
    sectors: ['建筑基础设施'], sector_raw: 'GHANEPS 工程类（Works）',
    location: '加纳沃尔特地区安洛加区 Akplorfudzi',
    scope: '新建 1 座 CHPS 社区卫生计划服务诊所，并配套 1 栋一室一厅半独立式平房宿舍。',
    ref_no: 'VR/AnDA/DACF/WKS/2026/077', stage: '正式招标',
    stage_note: 'National Competitive Tendering（国内竞争性招标），GHANEPS 状态 Bid Submission，Medium 级工程',
    funder: 'DACF（地方议会共同基金，据参考编号）', conditions: 'GHANEPS 标书费 GHS 300；投标保证金为投标价的 2%。',
    action: '登录 GHANEPS 下载招标文件，核实资格要求、保证金与工程量清单，2026-11-30 11:00 前投标。',
    risk: '地方议会小型土建工程，金额未披露，通常以加纳本地承包商为主，外资企业需核实资格限制。' },
  { ...base('3966840'),
    title: '库马西技术大学 Adako-Jachie 校区六层教学楼及办公楼建设（一期，GETFund-FAST 项目）',
    sectors: ['建筑基础设施'], sector_raw: 'GHANEPS 工程类（Works），UNSPSC 72130000 一般房屋建筑',
    location: '加纳阿散蒂地区库马西，库马西技术大学 Adako-Jachie 校区',
    scope: '新建六层教学楼及办公用房（一期工程）。',
    ref_no: 'AR/KsTU/WK/003/26', stage: '正式招标',
    stage_note: 'National Competitive Tendering（国内竞争性招标），Invitation for Tenders，单阶段，最低评标价（LERT），设资格后审；GHANEPS 状态 Bid Submission，Major 级工程',
    funder: 'GETFund（加纳教育信托基金，据公告标题）', conditions: 'GHANEPS 标书费 GHS 500；投标保证金为投标价的 2%；资格后审。',
    action: '登录 GHANEPS 下载招标文件，核实建筑面积、工期与资格要求，2026-11-30 10:00 前投标。',
    risk: '公告标题仅为“GETFUND-FAST PROJECT”，工程内容取自公告描述栏；金额未披露；GETFund 项目付款周期需评估。' },
  { ...base('3993572'),
    title: '加纳电网公司（GRIDCo）监管审计（技术与运营审计）咨询服务选聘',
    sectors: ['电力电气', '工程咨询'], sector_raw: 'GHANEPS 咨询服务，UNSPSC 84111600 审计服务',
    location: '加纳全国（GRIDCo 输电系统）',
    scope: '由公用事业监管委员会（PURC）选聘咨询机构，对加纳电网公司开展监管审计，含技术审计与运营审计。',
    ref_no: 'GR/PURC/CS/02/26', stage: '意向征集',
    stage_note: 'Quality-Cost Based Selection with EOI（基于质量和费用的选择，先征集意向），GHANEPS 状态 Bid Submission',
    funder: '未披露', conditions: '具体资格要求以 GHANEPS 公告文件为准。',
    action: '登录 GHANEPS 下载意向征集文件，核实对输电系统技术审计经验的要求，2026-12-11 13:00 前递交。',
    risk: '属监管审计类咨询服务，非施工项目；需具备输电系统技术与运营审计业绩。' },
];
for (const n of NEW) {
  if (byUrl.has(n.url) || m.items.some((x) => x.ref_no && x.ref_no === n.ref_no)) continue;
  n.id = crypto.createHash('sha1').update(n.url).digest('hex').slice(0, 12);
  m.items.push(n);
  byUrl.set(n.url, n);
  log.added++;
}

// 5 既有记录复核：GHANEPS 当前列表
for (const it of m.items) {
  const row = ghByUrl.get(it.url);
  if (!row) continue;
  if (row.deadline && it.deadline !== row.deadline) {
    log.deadline_changed.push(it.title + '：' + it.deadline + ' → ' + row.deadline);
    it.verified_note = TODAY + ' GHANEPS 官方列表显示截止时间由 ' + it.deadline + ' 变更为 ' + row.deadline + '。' + (it.verified_note || '');
    it.deadline = row.deadline;
  }
  if (it.verified_at !== TODAY) { it.verified_at = TODAY; log.verified++; }
}
// 世界银行复核
const wbIds = new Set(wb.candidates.map((c) => c.id));
for (const it of m.items) {
  const id = (it.url.match(/procurement-detail\/(OP\d+)/) || [])[1];
  if (id && wbIds.has(id) && it.verified_at !== TODAY) { it.verified_at = TODAY; log.verified++; }
}
// NDDC 复核（本次门户仍列出 TND-2026-000011/13/14/15，截止日期不变）
for (const it of m.items) {
  if (/^TND-2026-0000(11|13|14|15)$/.test(it.ref_no || '') && it.verified_at !== TODAY) { it.verified_at = TODAY; log.verified++; }
}

// 6 sources
const S = {
  ghaneps: ['已核验并更新', `本机抓取 8 页共 80 条当前招标并逐条筛查：新增 4 条（安洛加区供水管网延伸、Akplorfudzi CHPS 诊所、库马西技术大学六层教学楼、PURC 对 GRIDCo 技术与运营审计咨询），复核并中文化云端自动收录 1 条（Nungua Zongo 社区诊所）；家具、车辆、IT、会议服务与铁矿勘探类已排除。截止时间变化 ${0} 条。`],
  ppa: ['可访问，未逐条筛查', 'ppa.gov.gh 首页可访问，招标入口指向 GHANEPS（已由 GHANEPS 来源覆盖）；tenders.ppa.gov.gh 招标列表本次连接失败，未能逐条筛查。'],
  mrh: ['已核验无新增', '站点可访问，/bids 列表仍只显示 2017 年 11 月的演示数据，无真实道路工程公告。'],
  dnccp: ['已核验无新增', '用 ego 浏览器读取“Avis d’appel d’offres”栏目：共 40 条，最新一条为 2025-11-15（城市供水与卫生资产公司 SPEA），2026 年无新增招标公告。'],
  osmapt: ['访问失败', 'HTTPS 证书域名不匹配（ERR_CERT_COMMON_NAME_INVALID），curl 与 ego 浏览器均无法打开；未绕过证书校验，相关记录保持原样。'],
  ceet: ['已核验无新增', '?cat=15 跳转官网首页；最新内容为 2026-11-14 Tabligbo 停电通告，无新招标公告。'],
  intercom: ['已核验无新增', '列表共 21 条机会，最新为 CEET 洛美 B 电厂中压开关柜更换（已于 2026-11-09 截止）、BOAD 信息耗材等，无新的开放中多哥工程/能源公告。'],
  nocopo: ['可访问，未逐条筛查', '门户首页可访问，仅有入口与说明，招标数据需进入“View System”子系统，本次未逐条筛查。'],
  bpp: ['可访问，未逐条筛查', '官网首页可访问，内容为法规、证书与入口链接，无招标公告列表，本次未逐条筛查。'],
  rea: ['已核验无新增', '招标页显示“0 opportunities found”，当前无开放招标。'],
  nep: ['可访问，未逐条筛查', '资源中心可访问，但采购公告分类未在页面直接列出（仅显示文章），本次未逐条筛查；既有记录保持原样。'],
  nddc: ['已核验无新增', '门户首页列出 4 条有效招标 TND-2026-000011/13/14/15（办公设施、供水设施、行政办公楼、乡村道路与排水），均已收录，截止日期无变化，已更新核验日期。'],
  'wb-opps': ['已核验无新增', '本机运行 wb-fetch 读取加纳/多哥/尼日利亚采购公告：开放工程类候选 8 条，其中 6 条已收录并复核；另 2 条为尼日利亚 IDEAS 项目职业培训工具包采购（货物），不属工程范围，未收录。'],
  'wb-proc': ['已核验无新增', '同世界银行 Business Opportunities：候选 8 条，6 条已收录并复核，2 条 IDEAS 培训工具包货物采购未收录。'],
  afdb: ['已核验无新增', '本次页面可访问（HTTP 200），但列表排序停留在旧数据（最新 2025-01-23），未见加纳/多哥/尼日利亚的开放工程或能源公告。'],
  'afdb-gpn': ['已核验无新增', '最新为 2026-11-10 塞内加尔、厄立特里亚、冈比亚公告与 2026-11-06 多哥 AFLDC-2（斯德哥尔摩与水俣公约履约）项目，均非加纳/多哥/尼日利亚工程或能源采购。'],
  ungm: ['已核验无新增', '用 ego 浏览器按国家与发布日期（2026-11-11 起）筛选：加纳 10 条、多哥 6 条，均为会议、印刷、咨询等非工程采购；尼日利亚无结果。'],
  dgmarket: ['未获授权', 'ego 浏览器访问 DGMarket 显示安全验证页面（dgmarket-fetch 返回 ok=false、logged_in=false），未读取、未绕过、未输入任何账号信息；保留既有 DGMarket 记录及核验日期。'],
};
for (const s of m.sources) {
  const v = S[s.id];
  if (!v) continue;
  s.status = v[0]; s.checked_at = NOW; s.note = v[1].replace('截止时间变化 0 条', '截止时间变化 ' + log.deadline_changed.length + ' 条');
}
m.meta.dgmarket_authorized = false;
const FIN = new Date().toISOString();
m.meta.last_run = {
  started_at: STARTED, finished_at: FIN, result: '成功', runner: '本机任务',
  note: `本机更新：GHANEPS 与世界银行读取成功；新增 ${log.added} 条，复核中文化云端记录 ${log.translated} 条，刷新核验日期 ${log.verified} 条；DGMarket 因安全验证未获授权；OSMAPT 证书错误访问失败。`,
};
m.meta.last_success_at = FIN;
fs.writeFileSync(P + 'master.json', JSON.stringify(m, null, 2), 'utf8');
console.log(JSON.stringify(log, null, 1));
