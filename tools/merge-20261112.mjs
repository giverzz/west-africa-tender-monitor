// 2026-11-12 本机更新：翻译云端自动收录记录、并入今日新公告、刷新核验日期、更新 sources / meta。
import fs from 'node:fs';
import crypto from 'node:crypto';

const W = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily';
const STARTED = '2026-11-12T08:00:52Z';
const TODAY = '2026-11-12';
const NOW = new Date().toISOString();
const m = JSON.parse(fs.readFileSync(`${W}/data/master.json`, 'utf8'));
const gh = JSON.parse(fs.readFileSync(`${W}/data/ghaneps.json`, 'utf8'));
const wb = JSON.parse(fs.readFileSync(`${W}/data/wb-candidates.json`, 'utf8'));
const dg = JSON.parse(fs.readFileSync(`${W}/data/dgmarket.json`, 'utf8'));

const byId = Object.fromEntries(m.items.map((i) => [i.id, i]));
const byUrl = Object.fromEntries(m.items.map((i) => [i.url, i]));
const log = { translated: 0, added: 0, refreshed: 0 };

// ---------- 1.5 云端自动收录记录的中文复核 ----------
const TRANS = {
  '9ff36c2e0b20': {
    title: '阿苏蒂菲南区 Hwidiem 社区活动中心建设',
    sectors: ['建筑基础设施'],
    sector_raw: '建筑工程（Works）',
    location: '加纳布朗阿哈福地区阿苏蒂菲南区 Hwidiem',
    scope: '在 Hwidiem 建设 1 座社区活动中心（Social Center）。GHANEPS 公告仅列出合同名称，建筑规模与工程量须以招标文件为准。',
    action: '在 GHANEPS 平台登录下载招标文件，核实建筑面积、工程量清单、投标保证金与资格要求；2026-11-30 12:00（加纳时间）前投标。',
    risk: '公告未披露预算金额与详细工程量；区议会小型土建项目付款多依赖 DACF 拨款，需核实资金到位情况。',
  },
  '6b97d2322a69': {
    title: '阿蒂瓦西区 Kwabeng 货运站一期（含联合会办公室、收费站、餐厅、厨房、候车棚、10 位水厕及场地铺装）',
    sectors: ['道路桥梁', '建筑基础设施'],
    sector_raw: '建筑及场地工程（Works）',
    location: '加纳东部地区阿蒂瓦西区 Kwabeng',
    scope: '建设 1 座货运站（Lorry park）一期工程，含运输联合会办公室、收费站、餐厅、厨房、1 座候车棚、10 位水厕及场地铺装。',
    action: '在 GHANEPS 平台登录下载招标文件，核实场地面积、铺装做法与各单体工程量；2026-11-25 14:00（加纳时间）前投标。',
    risk: '公告未披露预算金额；一期范围与后续分期界面需向区议会核实；付款依赖区议会拨款。',
  },
  '3be2811bc9bd': {
    title: '卡诺州 L-PRES 项目 60 处太阳能水井、水塔及畜牧饮水点建设与牧草地开发',
    sectors: ['清洁能源/光伏', '水利灌溉'],
    sector_raw: 'Civil Works（太阳能提水与畜牧供水）',
    entity: '卡诺州农业与自然资源部 L-PRES 州项目实施单元（SPIU）',
    location: '尼日利亚卡诺州 30 个地点（畜牧通道沿线与牧民社区）',
    scope: '在卡诺州 30 个地点沿畜牧通道与牧民社区建设太阳能光伏提水井、高位水塔与畜牧饮水点共 60 处，并开展牧草地开发。',
    ref_no: 'KN/LPRES/WKS/RFB/BPD/15/2026',
    stage: '正式招标',
    stage_note: 'Request for Bids（一信封、无资格预审）；公告签发 2026-11-10，开标 2026-12-08 12:00（当地时间）',
    published_at: '2026-11-10',
    funder: '世界银行 IDA 70570-UNI 信贷（L-PRES 畜牧生产力与韧性支持项目）',
    action: '向卡诺州 SPIU（kano@lpresnigeria.gov.ng，Ministry of Agriculture & Natural Resources, No.1 Bidda Road, Kano）购领招标文件，核实 30 处点位分布、光伏水泵与水塔规格、投标保证金；2026-12-08 12:00 前投标。',
    risk: '公告未披露合同估价；点位分散于卡诺州 30 处，需核实运输与安保成本；以采购方发售的招标文件为准。',
  },
  '17340f70b727': {
    title: '卡诺州 L-PRES 项目基础设施建设与修复（新建屠宰场、3 座屠宰房、3 座活禽市场及 Bunkure、Dangora、Rano 畜牧育种中心）',
    sectors: ['建筑基础设施'],
    sector_raw: 'Civil Works（畜牧基础设施土建）',
    entity: '卡诺州农业与自然资源部 L-PRES 州项目实施单元（SPIU）',
    location: '尼日利亚卡诺州（含 Bunkure、Dangora、Rano）',
    scope: '在卡诺州新建 1 座屠宰场、3 座屠宰房、3 座活禽市场，并建设/修复 Bunkure、Dangora、Rano 三处畜牧育种中心基础设施。',
    ref_no: 'KN/LPRES/WKS/RFB/C.I/20/2026',
    stage: '正式招标',
    stage_note: 'Request for Bids（Construction and Rehabilitation of Infrastructure in Kano State）；公告签发 2026-11-10，开标 2026-12-08 12:00（当地时间）',
    published_at: '2026-11-10',
    funder: '世界银行 IDA 70570-UNI 信贷（L-PRES 畜牧生产力与韧性支持项目）',
    action: '向卡诺州 SPIU（kano@lpresnigeria.gov.ng）购领招标文件，核实各单体工程量、分标方式与投标保证金；2026-12-08 12:00 前投标。',
    risk: '公告未披露合同估价；多点位同时施工，需核实场地移交与材料运距；以采购方发售的招标文件为准。',
  },
};
for (const [id, patch] of Object.entries(TRANS)) {
  const it = byId[id];
  if (!it) { console.log('未找到自动收录记录 ' + id); continue; }
  Object.assign(it, patch);
  it.verified_at = TODAY;
  it.verified_note = `${TODAY} 本机核对原始公告后完成中文复核`;
  delete it.auto_ingested;
  log.translated++;
}

// ---------- 5 合并今日新公告 ----------
const mk = (o) => {
  const id = crypto.createHash('sha1').update(o.url).digest('hex').slice(0, 12);
  return {
    id, amount: '未披露', dgmarket_url: '', dgmarket: false, funder: '', conditions: '',
    location: '', ref_no: '', terminal_at: null, added_at: NOW, verified_at: TODAY, ...o,
  };
};

const GH_META = {
  3978210: {
    title: '西北地区 Aowin 市 Omanpe 6 间小学教学楼（含办公室、仓库及 6 位水厕）建设',
    location: '加纳西北地区（Western North）Aowin 市 Omanpe',
    sectors: ['建筑基础设施'],
  },
  3965965: {
    title: '塞凯雷东区 Asokore Trinity 初中 3 间教学楼及附属设施建设与家具配置',
    location: '加纳阿散蒂地区塞凯雷东区 Asokore',
    sectors: ['建筑基础设施'],
  },
  3965919: {
    title: '塞凯雷东区 Asokore Islamic Orientation 学校 3 间教学楼及附属设施建设与家具配置',
    location: '加纳阿散蒂地区塞凯雷东区 Asokore',
    sectors: ['建筑基础设施'],
  },
  3950014: {
    title: '阿夸佩姆南市 Otiakrom 6 间教学楼及附属设施建设',
    location: '加纳东部地区阿夸佩姆南市 Otiakrom',
    sectors: ['建筑基础设施'],
  },
  3949594: {
    title: '阿夸佩姆南市 Asuofum CHPS 社区诊所、职工宿舍及机械化水井建设',
    location: '加纳东部地区阿夸佩姆南市 Asuofum',
    sectors: ['建筑基础设施', '水利灌溉'],
  },
};
for (const row of gh.rows) {
  const meta = GH_META[row.resourceId];
  if (!meta) continue;
  if (byUrl[row.url]) continue;
  const it = mk({
    title: meta.title,
    title_original: row.title_original,
    country: 'GH',
    sectors: meta.sectors,
    sector_raw: '建筑工程（Works）',
    entity: row.entity,
    location: meta.location,
    scope: row.title_original,
    stage: '正式招标',
    stage_note: row.procedure + '；GHANEPS 状态 ' + row.status,
    published_at: row.published_at,
    deadline: row.deadline,
    url: row.url,
    origin: 'GHANEPS',
    origin_type: '政府官方',
    discovery: 'GHANEPS 当前招标列表（本机筛查）',
    action: `在 GHANEPS 平台登录下载招标文件，核实工程量清单、投标保证金与资格要求；${row.deadline}（加纳时间）前投标。`,
    risk: '公告未披露预算金额；地方议会土建项目付款多依赖 DACF/GETFund 拨款，需核实资金到位情况。',
    verified_note: `${TODAY} GHANEPS 官方当前招标列表读取`,
  });
  m.items.push(it); byUrl[it.url] = it; log.added++;
}

// 世界银行：SPIN 灌溉修复（3 标段）资格预审
const SPIN_URL = 'https://projects.worldbank.org/en/projects-operations/procurement-detail/OP00479463';
if (!byUrl[SPIN_URL]) {
  const r = (wb.candidates || wb.rows || wb.items || wb).find((x) => x.url === SPIN_URL);
  const it = mk({
    title: '尼日利亚 SPIN 项目 6 个灌溉区修复与现代化（设计建造，3 个标段）初选',
    title_original: r.title_original,
    country: 'NG',
    sectors: ['水利灌溉', '道路桥梁'],
    sector_raw: 'Works（Design and Build）—灌溉工程',
    entity: '尼日利亚联邦水资源与卫生部 SPIN 项目联邦项目管理单元（FPMU）',
    location: '标段1 纳萨拉瓦州 Doma、包奇州 Galala；标段2 科吉州 Kampe-Omi、夸拉州 Duku-Lade；标段3 埃努古州 Adani、埃邦伊州 Ndi-Eze',
    scope: '设计复核与升级（测量、勘察及含农户主导灌溉发展内容的现代化终版设计），以及取水口、衬砌渠道、水工与排水构筑物、进场道路等的修复与新建，直至竣工移交；现代化内容包括替换未衬砌渠道。分 3 个标段，采用设计建造（Design and Build）方式。',
    ref_no: 'FMWR&S/SPIN/D&B/RFP/2026/31',
    stage: '资格预审',
    stage_note: 'Invitation for Initial Selection（Works, Design and Build）；公告签发 2026-11-10',
    published_at: '2026-11-10',
    deadline: '2026-12-22 12:00',
    url: SPIN_URL,
    origin: '世界银行',
    origin_type: '国际机构官方',
    discovery: '世界银行采购公告（wb-fetch 脚本）',
    funder: '世界银行 IDA 信贷 76370NG（SPIN 尼日利亚可持续电力与灌溉项目）',
    conditions: '初选申请人须具备近期类似设计建造合同经验（标段1 至少 1600 万美元、标段2 至少 2400 万美元、标段3 至少 1600 万美元），并具备不少于 1 800 公顷灌溉工程、渠系与水工构筑物施工经验。',
    action: '向 FPMU（Plot 1402 Abba Kyari Street, Apo, Abuja）索取初选文件（ISD），核对标段划分与经验门槛；2026-12-22 12:00 前提交初选申请，必要时与尼日利亚本地土建企业组成联合体。',
    risk: '当前为初选（资格预审）阶段，通过后才获邀投标；公告未披露合同估价，所列金额为申请人经验门槛而非合同额；须以采购方发售的 ISD 文件为准。',
    verified_note: `${TODAY} 世界银行采购公告页读取`,
  });
  m.items.push(it); byUrl[it.url] = it; log.added++;
}

// ---------- 刷新本次仍在官方列表中的既有记录 ----------
const ghUrls = new Set(gh.rows.map((r) => r.url));
const wbUrls = new Set((wb.candidates || wb.rows || wb.items || wb).map((r) => r.url));
const NDDC_REFS = ['TND-2026-000015', 'TND-2026-000014', 'TND-2026-000013', 'TND-2026-000011'];
for (const it of m.items) {
  if (it.verified_at === TODAY) continue;
  let hit = '';
  if (ghUrls.has(it.url)) hit = 'GHANEPS 官方当前招标列表';
  else if (wbUrls.has(it.url)) hit = '世界银行采购公告';
  else if (it.origin === 'NDDC 电子采购门户' && NDDC_REFS.some((x) => (it.ref_no || '').includes(x))) hit = 'NDDC 电子采购门户 Latest Tender Notices（仍显示 ACTIVE）';
  if (!hit) continue;
  // GHANEPS 列表上的截止时间若有变化则更新
  if (hit.startsWith('GHANEPS')) {
    const row = gh.rows.find((r) => r.url === it.url);
    if (row && row.deadline && row.deadline !== it.deadline) {
      it.verified_note = `${TODAY} ${hit}核验：截止时间由 ${it.deadline} 变更为 ${row.deadline}`;
      it.deadline = row.deadline;
    } else {
      it.verified_note = `${TODAY} ${hit}核验，信息无变化`;
    }
  } else {
    it.verified_note = `${TODAY} ${hit}核验，信息无变化`;
  }
  it.verified_at = TODAY;
  log.refreshed++;
}

// ---------- 6 sources ----------
const SRC = {
  'GHANEPS 加纳电子采购系统': ['已核验并更新', '本机读取当前招标列表 8 页（80 条）：新增 5 条工程类招标（学校、CHPS 诊所及水井），刷新既有记录核验日期；IT、家具、车辆、办公与矿产勘探类排除。'],
  '加纳公共采购局 PPA': ['可访问，未逐条筛查', '站点可打开（HTTP 200）；公告栏目指向 tenders.ppa.gov.gh 子站，本次该子站 HTTP/HTTPS 均连接失败（code 000），PPA 公告内容与 GHANEPS 重合，已由 GHANEPS 覆盖。'],
  '加纳道路与公路部电子投标门户': ['已核验无新增', 'bids.mrh.gov.gh 可打开（HTTP 200）；/bids 列表仅有 2017 年占位测试条目，/bids/browse 无任何公告，无新道路工程公告。'],
  '多哥 DNCCP 公共采购': ['已核验无新增', 'dnccp.gouv.tg 可打开；/avis-dappel-doffre/ 公告列表本次显示「1-10/0」即 0 条，/avis-dappel-doffres/ 仅为 2025-05-09 单份旧公告，无新增。'],
  'ARMP 采购监测工具 OSMAPT': ['访问失败', 'osmapt.armp.tg 本次 curl 返回 code 000，ego 浏览器打开报 ERR_CERT_COMMON_NAME_INVALID（证书域名不匹配），未读取，既有记录保持原样。'],
  'CEET 多哥电力公司招标公告': ['已核验无新增', 'www.ceet.tg/tg/?cat=15 在 ego 浏览器中跳转至公司首页，站内无招标公告栏目；CEET 公告经 InterCom 转载核对，无新增。'],
  'InterCom Togo 招标信息': ['已核验无新增', 'intercom.tg/opportunites/appels-d-offres 读取 24 条公告，全部显示「Clôturé」（已截止），最新一条为 CEET 洛美 B 电厂中压开关柜（2026-11-09 截止，已在库）。'],
  'BPP / NOCOPO 开放合同门户': ['可访问，未逐条筛查', 'nocopo.bpp.gov.ng 可打开（HTTP 200），但开放招标需进入 Suppliers/Contractors 仪表盘后才能逐条查看，静态页面只有门户介绍，本次未逐条筛查。'],
  '尼日利亚公共采购局 BPP': ['已核验无新增', 'bpp.gov.ng/advertisement/ 可打开；当前仅 2026-09-30 的 MAPS 采购体系评估个人咨询 REOI（非工程/能源范围），无新增。'],
  '农村电气化局 REA 招标页': ['已核验无新增', 'www.rea.gov.ng/tenders 返回 HTTP 200，页面显示「0 opportunities found / No opportunities found」。'],
  'NEP 资源中心': ['已核验无新增', '通过 public-api/resource-hub.php 读到 Procurement Notices 共 18 条，与 2026-11-11 相同（DARES、EEP/EEP II 等），无新条目且公告本身不带日期，未新增。'],
  'NDDC 电子采购门户': ['已核验并更新', 'eprocurement.nddc.gov.ng 在 ego 浏览器中读取 Latest Tender Notices：TND-2026-000015/14/13/11 四条仍显示 ACTIVE 且截止时间与库内一致，已刷新核验日期；TND-2026-000016 标题为无意义测试字符，未收录。'],
  '世界银行 Business Opportunities': ['已核验并更新', '按加纳/多哥/尼日利亚读取采购公告：扫描各 80 条，开放工程类候选 8 条，新增 1 条（尼日利亚 SPIN 6 个灌溉区设计建造初选），其余已在库。'],
  '世界银行 Procurement Notices': ['已核验并更新', '同上：GH 匹配 12 条/开放 1 条，TG 匹配 6 条/开放 0 条，NG 匹配 7 条/开放 7 条，新增 1 条并刷新既有记录核验日期。'],
  '非洲开发银行 Procurement Notices': ['已核验无新增', 'curl 被 Cloudflare 拦截（403），改用 ego 浏览器读取成功；该栏目第 1 页最新条目为 2025-01-23，内容陈旧且无加纳/多哥/尼日利亚新公告。'],
  '非洲开发银行 General Procurement Notices': ['已核验无新增', 'ego 浏览器读取成功，最新条目 2026-11-10（厄立特里亚 WASH、冈比亚 AFLDC-2）；加纳/尼日利亚无新公告，多哥仅 2026-11-06 的 AFLDC-2 化学品公约履约（非工程能源范围），排除。'],
  '联合国全球采购系统 UNGM': ['已核验无新增', 'ego 浏览器按国家筛选并限定发布日期：2026-11-10 起加纳 8 条、多哥 7 条、尼日利亚 12 条，全部为咨询、家具、话费、会务、WASH 数据分析等非工程类；UNDP-NGA-01541「installation and preventive maintenance services」标题过于笼统、无法判定范围，未收录。'],
  'DGMarket 会员公告': ['未获授权', 'dgmarket-fetch 脚本在 ego 浏览器中打开列表页时页面停在安全验证（security verification），按规定未尝试通过或绕过、未输入任何账号信息，本次记为未获授权；19 条既有 DGMarket 记录及其核验日期保持原样。'],
};
for (const s of m.sources) {
  const v = SRC[s.name];
  if (!v) continue;
  s.status = v[0]; s.note = v[1]; s.checked_at = NOW;
}
m.meta.dgmarket_authorized = !!(dg.ok && dg.logged_in);

// ---------- 7 meta.last_run ----------
const coreOk = gh.ok && gh.rows.length > 0 && (wb.candidates || wb.rows || wb.items || wb).length > 0;
const result = coreOk ? '成功' : '失败';
m.meta.last_run = {
  started_at: STARTED,
  finished_at: NOW,
  result,
  runner: '本机 scheduled-task',
  note: `本机更新：GHANEPS 新增 5、世界银行新增 1，云端自动收录 4 条完成中文复核；DGMarket 停在安全验证页面，记为未获授权。`,
};
if (coreOk) m.meta.last_success_at = NOW;

fs.writeFileSync(`${W}/data/master.json`, JSON.stringify(m, null, 1));
console.log(JSON.stringify({ ...log, result, items: m.items.length, dgmarket_authorized: m.meta.dgmarket_authorized }));
