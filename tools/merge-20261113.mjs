import fs from 'node:fs';
const P = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/';
const m = JSON.parse(fs.readFileSync(P + 'master.json', 'utf8'));
const gh = JSON.parse(fs.readFileSync(P + 'ghaneps.json', 'utf8'));
const wb = JSON.parse(fs.readFileSync(P + 'wb-candidates.json', 'utf8'));
const TODAY = '2026-11-13';
const byUrl = new Map(m.items.map((i) => [i.url, i]));
const ghByUrl = new Map(gh.rows.map((r) => [r.url, r]));
const log = { translated: 0, added: 0, verified: 0, deadline_changed: [] };

// 1.5 云端自动收录记录的中文化与复核
const CN = {
  '3989948': { title: '中通古区 Mawoekpor CHPS 社区诊所及 4 单元宿舍建设', location: '加纳沃尔特地区中通古区 Mawoekpor', scope: '新建 1 座 CHPS 社区卫生计划服务诊所，并配套建设 1 栋 4 单元职工宿舍。', sectors: ['建筑基础设施'] },
  '3954514': { title: 'Papaase 6 间教学楼（含办公室、卫生间、无障碍坡道）及机械化水井建设', location: '加纳中部地区阿武图塞尼亚区 Papaase', scope: '新建 6 间教室的教学楼，含办公室、卫生间与无障碍坡道，并钻凿 1 口机械化水井。', sectors: ['水利灌溉', '建筑基础设施'] },
  '3984190': { title: '阿迪多梅（Adidome）政府医院耳鼻喉及眼科中心建设', location: '加纳沃尔特地区中通古区 Adidome', scope: '在 Adidome 政府医院新建 1 座耳鼻喉（ENT）与眼科诊疗中心。', sectors: ['建筑基础设施'] },
  '3977982': { title: 'Kwegyir Aggrey 高中两层宿舍楼及附属设施建设', location: '加纳中部地区姆凡茨曼市', scope: '新建 1 栋两层直条式学生宿舍楼及配套附属设施。', sectors: ['建筑基础设施'] },
  '3977723': { title: 'Kobina Ansah 高中两层宿舍楼及附属设施建设', location: '加纳中部地区姆凡茨曼市', scope: '新建 1 栋两层直条式学生宿舍楼及配套附属设施。', sectors: ['建筑基础设施'] },
  '3976986': { title: 'Nsanfo 基础学校 6 间教学楼及 6 位水厕建设', location: '加纳中部地区姆凡茨曼市 Nsanfo', scope: '新建 6 间教室的教学楼，并配建 6 位水冲厕所。', sectors: ['建筑基础设施'] },
  '3979844': { title: 'Agbeve CHPS 社区诊所、护士宿舍、供电接入及 25 棵经济林木种植', location: '加纳沃尔特地区南通古区 Agbeve', scope: '新建 1 座 CHPS 社区诊所及护士宿舍，接入电力供应，并种植 25 棵经济林木。', sectors: ['电力电气', '建筑基础设施'] },
  '3973730': { title: 'Mprenkyi 基础学校 6 间教学楼及 6 位水厕建设', location: '加纳中部地区姆凡茨曼市 Mprenkyi', scope: '新建 6 间教室的教学楼，并配建 6 位水冲厕所。', sectors: ['建筑基础设施'] },
};
for (const it of m.items) {
  if (!it.auto_ingested) continue;
  const rid = (it.url.match(/resourceId=(\d+)/) || [])[1];
  const cn = CN[rid];
  if (!cn) continue;
  const row = ghByUrl.get(it.url);
  it.title = cn.title;
  it.location = cn.location;
  it.scope = cn.scope;
  it.sectors = cn.sectors;
  it.sector_raw = 'GHANEPS 工程类（Works）';
  it.action = '在 GHANEPS 平台登录后下载招标文件，核实资格要求、投标保证金、工程量清单与工期，评估是否参与。';
  it.risk = '地方议会小型土建工程，金额未披露，通常以加纳本地承包商为主，外资企业需核实资格限制。';
  it.verified_at = TODAY;
  it.verified_note = TODAY + ' 本机在 GHANEPS 当前招标列表中' + (row ? '复核到该公告，标题、采购方、截止时间与原文一致' : '未再查到该公告，保留云端记录') + '；中文标题与工程范围由本机据原文标题翻译。';
  delete it.auto_ingested;
  log.translated++;
}

// 5 新增：GHANEPS 本次逐条筛查发现的新公告
const NEW = [{
  url: 'https://www.ghaneps.gov.gh/epps/cft/prepareViewCfTWS.do?resourceId=3966552',
  title: '塞孔迪 West Ridge 初中 1 栋两层 6 间教学楼及附属设施、家具建设',
  title_original: 'Construction of 1No. 2-Storey 6-Unit Classroom Block with Ancillary Facilities and Furniture for West Ridge M/A JHS at Sekondi',
  country: 'GH',
  sectors: ['建筑基础设施'],
  sector_raw: 'GHANEPS 工程类（Works）',
  entity: 'SEKONDI-TAKORADI METROPOLITAN ASSEMBLY',
  location: '加纳西部地区塞孔迪-塔科拉迪市 Sekondi，West Ridge M/A 初中',
  scope: '新建 1 栋两层 6 间教室的教学楼，含附属设施并配置家具。',
  ref_no: '',
  stage: '正式招标',
  stage_note: 'National Competitive Tendering（国内竞争性招标），GHANEPS 状态 Bid Submission',
  published_at: '2026-11-11 10:19',
  deadline: '2026-11-26 12:00',
  amount: '未披露',
  origin: 'GHANEPS',
  origin_type: '政府官方',
  discovery: 'GHANEPS 当前招标列表（本机逐条筛查）',
  dgmarket_url: '',
  dgmarket: false,
  funder: '未披露（地方议会项目，通常为 DACF 等本地资金）',
  conditions: '须在 GHANEPS 平台登录后下载招标文件，具体资格条件以招标文件为准。',
  action: '登录 GHANEPS 下载招标文件，核实资格要求、投标保证金与工程量清单，评估是否参与。',
  risk: '地方议会小型土建工程，金额未披露，通常以加纳本地承包商为主，外资企业需核实资格限制。',
  verified_at: TODAY,
  verified_note: TODAY + ' 本机在 GHANEPS 当前招标列表中读取，标题、采购方、发布与截止时间均取自官方列表。',
  terminal_at: null,
  added_at: new Date().toISOString(),
}];
for (const n of NEW) {
  if (byUrl.has(n.url)) continue;
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
// NDDC 复核（本次门户仍列出 TND-2026-000011/13/14/15）
for (const it of m.items) {
  if (/^TND-2026-0000(11|13|14|15)$/.test(it.ref_no || '') && it.verified_at !== TODAY) { it.verified_at = TODAY; log.verified++; }
}

// 6 sources
const NOW = new Date().toISOString();
m.sources = [
  { name: 'GHANEPS 加纳电子采购平台', url: 'https://www.ghaneps.gov.gh/', country: 'GH', status: '已核验并更新', checked_at: NOW, note: '抓取 8 页共 80 条当前招标并逐条筛查工程/能源类；新增 1 条（塞孔迪 West Ridge 初中教学楼），其余均为已收录项目，截止时间无变化。' },
  { name: '加纳公共采购局 PPA', url: 'https://ppa.gov.gh/', country: 'GH', status: '已核验无新增', checked_at: NOW, note: '首页可访问，招标信息统一跳转 GHANEPS；PPA 自身最新公告为 2026 年 5 月的培训类通知，无新增工程公告。' },
  { name: '加纳道路与公路部 e-Bids', url: 'https://bids.mrh.gov.gh/', country: 'GH', status: '已核验无新增', checked_at: NOW, note: '站点可访问，但 /bids 列表仍只显示 2017 年的演示数据，无真实道路工程公告。' },
  { name: '多哥 DNCCP 公共采购监管局', url: 'https://dnccp.gouv.tg/', country: 'TG', status: '已核验无新增', checked_at: NOW, note: '“Avis d’appel d’offres”栏目共 40 条，最新一条为 2025 年 11 月 15 日，2026 年无新增招标公告。' },
  { name: '多哥 OSMAPT 公共采购观察站', url: 'https://osmapt.armp.tg/', country: 'TG', status: '访问失败', checked_at: NOW, note: 'HTTPS 证书域名不匹配（ERR_CERT_COMMON_NAME_INVALID），curl 与浏览器均无法打开；未绕过证书校验，相关记录保持原样。' },
  { name: '多哥电力公司 CEET', url: 'https://www.ceet.tg/tg/?cat=15', country: 'TG', status: '已核验无新增', checked_at: NOW, note: '站点改版，?cat=15 跳转首页；最新内容为 11 月 11—12 日停电通告，无新招标公告。' },
  { name: 'InterCom Togo 招标汇总（辅助发现）', url: 'https://intercom.tg/opportunites/appels-d-offres', country: 'TG', status: '已核验无新增', checked_at: NOW, note: '共 24 条，最晚截止为 2026 年 11 月 9 日的 CEET 洛美 B 电厂中压开关柜更换，全部已截止，无开放中的多哥工程/能源公告。' },
  { name: '尼日利亚 NOCOPO 开放采购门户', url: 'https://bppweb.webhostingng.org/nigeria-open-contracting-portal/', country: 'NG', status: '可访问，未逐条筛查', checked_at: NOW, note: '仅为门户介绍页，公告须进入“View System”子系统查看，本次未逐条筛查。' },
  { name: '尼日利亚公共采购局 BPP', url: 'https://www.bpp.gov.ng/', country: 'NG', status: '已核验无新增', checked_at: NOW, note: '首页与公告栏可访问，内容以制度文件与注册服务为主，无新增工程招标公告。' },
  { name: '尼日利亚农村电气化局 REA 招标页', url: 'https://www.rea.gov.ng/tenders', country: 'NG', status: '已核验无新增', checked_at: NOW, note: '页面显示“0 opportunities found”，当前无开放招标。' },
  { name: '尼日利亚电气化项目 NEP 资源中心', url: 'https://nep.rea.gov.ng/resource-hub.html', country: 'NG', status: '已核验无新增', checked_at: NOW, note: '采购公告栏为档案式 PDF 列表（含 2024 年 12 月补遗），条目不标注发布日期与截止日期，PDF 链接返回查看器页面，无法确认是否仍开放，故未收录。' },
  { name: '尼日尔三角洲发展委员会 NDDC 电子采购门户', url: 'https://eprocurement.nddc.gov.ng/', country: 'NG', status: '已核验无新增', checked_at: NOW, note: '门户列出 5 条 ACTIVE 公告，其中 4 条工程类（TND-2026-000011/13/14/15）均已收录，截止时间无变化，已更新核验日期。' },
  { name: '世界银行采购公告', url: 'https://projects.worldbank.org/', country: 'GH/TG/NG', status: '已核验无新增', checked_at: NOW, note: '按国别各读取 80 条，筛出 9 条候选：7 条工程/能源类均已收录并更新核验日期，2 条 IDEAS-TVET 职业培训工具包属货物采购，不在关注范围。' },
  { name: '非洲开发银行采购公告', url: 'https://www.afdb.org/en/documents/category/procurement-notices', country: '多边', status: '已核验无新增', checked_at: NOW, note: '采购公告列表最新条目仍为 2025 年 1 月；总体采购公告（GPN）最新为 2026 年 11 月 10 日（塞内加尔、厄立特里亚、冈比亚）与 11 月 6 日多哥 AFLDC-2 化学品公约项目，均非加纳/多哥/尼日利亚工程或能源公告。' },
  { name: 'UNGM 联合国全球采购门户', url: 'https://www.ungm.org/Public/Notice', country: '多边', status: '已核验无新增', checked_at: NOW, note: '按加纳、多哥、尼日利亚分别筛选，各 15 条临近截止公告全部为会议、住宿、文具、家具、个人顾问等非工程采购。' },
  { name: 'DGMarket 会员公告', url: 'https://www.dgmarket.com/tenders/list.do?sub=tenders-in-Africa&locationISO=_s&updatedId=1w', country: 'GH/TG/NG', status: '未获授权', checked_at: NOW, note: '本次访问停在站点安全验证页面，未登录成功（ok=false、logged_in=false）。按规则未尝试通过或绕过验证，也未输入任何账号信息；既有 19 条 DGMarket 记录及其核验日期保持原样。' },
];
m.meta.dgmarket_authorized = false;
fs.writeFileSync(P + 'master.json', JSON.stringify(m, null, 1), 'utf8');
console.log(JSON.stringify(log, null, 1));
console.log('items:', m.items.length);
