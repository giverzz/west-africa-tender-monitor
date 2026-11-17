import fs from 'node:fs';
import crypto from 'node:crypto';
const P = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/';
const m = JSON.parse(fs.readFileSync(P + 'master.json', 'utf8'));
const gh = JSON.parse(fs.readFileSync(P + 'ghaneps.json', 'utf8'));
const wb = JSON.parse(fs.readFileSync(P + 'wb-candidates.json', 'utf8'));
const dg = JSON.parse(fs.readFileSync(P + 'dgmarket.json', 'utf8'));
const STARTED = process.argv[2];
const TODAY = '2026-11-17';
const NOW = new Date().toISOString();
const ghByUrl = new Map(gh.rows.map((r) => [r.url, r]));
const log = { translated: 0, added: 0, verified: 0, deadline_changed: [] };

const CN = {
  '4011556': { title: '诺兰扎南市政议会 Nkoranza 两层警察分区总部办公楼建设', location: '加纳博诺东部地区 Nkoranza', scope: '新建 1 栋两层警察分区总部办公综合楼。' },
  '4008962': { title: '霍霍市政议会 Hohoe 市场 28 间可上锁商铺建设', location: '加纳沃尔特地区霍霍市（Hohoe）市场', scope: '在 Hohoe 市场新建 28 间可上锁商铺。' },
};
for (const it of m.items) {
  if (!it.auto_ingested) continue;
  const rid = (it.url.match(/resourceId=(\d+)/) || [])[1];
  const cn = CN[rid]; if (!cn) continue;
  const row = ghByUrl.get(it.url);
  Object.assign(it, cn);
  it.sector_raw = 'GHANEPS 工程类（Works）';
  it.funder = '未披露'; it.conditions = '具体资格、标书费与保证金以 GHANEPS 公告文件为准。';
  it.action = '在 GHANEPS 平台登录后下载招标文件，核实资格要求、保证金、工程量清单与工期，评估是否参与。';
  it.risk = '地方议会小型土建工程，金额未披露，通常以加纳本地承包商为主，外资企业需核实资格限制。';
  it.verified_at = TODAY;
  it.verified_note = TODAY + ' 本机核对 GHANEPS 当前招标列表' + (row ? '（仍在列表中）' : '') + '，并在 DGMarket 会员公告中交叉核对到同一项目；中文标题据原文翻译，详细文件需登录 GHANEPS 下载。';
  delete it.auto_ingested;
  log.translated++;
}
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const dgTitle = new Map(dg.rows.map((r) => [norm(r.title), r]));
for (const it of m.items) {
  if (it.dgmarket_url) continue;
  const r = dgTitle.get(norm(it.title_original));
  if (r && it.verified_at === TODAY && /DGMarket/.test(it.verified_note || '')) { it.dgmarket_url = r.dgmarket_url; it.dgmarket = true; }
}

const mk = (o) => ({
  country: 'NG', amount: '未披露', origin: 'IsDB 伊斯兰开发银行', origin_type: '国际机构官方',
  discovery: 'DGMarket 会员公告', dgmarket: true, verified_at: TODAY,
  verified_note: TODAY + ' 本机在 DGMarket 会员公告读取，并打开 IsDB 官网原始公告核实参考编号与截止日期。DGMarket 日期为其收录日期，原公告日期以 IsDB 页面为准。',
  terminal_at: null, added_at: NOW, stage: '意向征集', ...o,
});
const NEW = [
  mk({ title: '尼日尔州 100MW 光伏电站（EPC）及并网送出工程设计审查与施工监理咨询（意向征集）',
    title_original: 'Consultancy Services for the Design Review and supervision of construction and installation of solar PV power generation (100MW) including grid interconnection and evacuation infrastructure (EPC) in Niger State',
    sectors: ['清洁能源/光伏', '工程咨询'], sector_raw: 'IsDB 咨询服务（Consulting Services – Firms Selection）', entity: '新尼日尔发展项目（NNDP，尼日尔州）',
    location: '尼日利亚尼日尔州', scope: '对尼日尔州太阳能开发项目 100MW 光伏发电 EPC 工程（含并网与送出基础设施）进行设计审查与施工安装监理。',
    ref_no: 'NSSEDP/CON/QCBS-MC/26/01', stage_note: 'QCBS-MC（成员国质量与费用评选），意向征集；IsDB 融资编号 NGA-1063；发布日期 2026-11-11',
    deadline: '2026-12-03 12:00', url: 'https://www.isdb.org/project-procurement/tenders/2026/eoi/consultancy-services-design-review-and-supervision-construction-and-installation',
    dgmarket_url: 'https://www.dgmarket.com/tenders/np-notice.do?keywords=&noticeId=117685319', funder: '伊斯兰开发银行（IsDB）', conditions: '“成员国”选择方式（QCBS-MC），投标人须来自 IsDB 成员国；以原公告为准。',
    action: '核实本公司是否符合 IsDB 成员国资格，如符合则准备光伏 EPC 监理类业绩与意向书，2026-12-03 12:00（当地时间）前提交。',
    risk: '咨询监理类项目，需 IsDB 成员国身份与大型光伏监理业绩；EPC 承包招标另行发布，建议同步跟踪。', published_at: '2026-11-11' }),
  mk({ title: '阿比亚州综合基础设施发展项目（ABSIIDP）阿巴市（Aba）道路设计审查与施工监理咨询（意向征集）',
    title_original: 'Consultancy Services for Design Review and Construction Supervision of the Construction of Designated Roads in ABA ABIA State',
    sectors: ['道路桥梁', '工程咨询'], sector_raw: 'IsDB 咨询服务意向征集', entity: '阿比亚州综合基础设施发展项目州项目实施单元（SPIU）',
    location: '尼日利亚阿比亚州阿巴市（Aba）', scope: '对阿巴市指定道路的施工开展设计审查与施工监理，监理期 36 个月。',
    ref_no: 'ABSIIDP/CON/QCBS/01', stage_note: '咨询服务意向征集（REOI）；融资方式分期付款销售，IsDB 融资编号 NGA 1047；发布日期 2026-11-17',
    deadline: '2026-12-02', url: 'https://www.isdb.org/project-procurement/tenders/2026/eoi/consultancy-services-design-review-and-construction-supervision-construction',
    dgmarket_url: 'https://www.dgmarket.com/tenders/np-notice.do?keywords=&noticeId=117948698', funder: '伊斯兰开发银行（IsDB），分期付款销售', conditions: '意向书可书面、邮件或当面递交至 SPIU；TOR 需向采购方索取。',
    action: '向 SPIU 索取 TOR，评估道路监理业绩匹配度，2026-12-02 前递交意向书。', risk: '咨询监理项目；原公告称“预计 2026 年第一季度启动”与发布日期不符，需向采购方确认；金额未披露。', published_at: '2026-11-17' }),
  mk({ title: '阿比亚州综合基础设施发展项目（ABSIIDP）乌穆阿希亚市（Umuahia）道路设计审查与施工监理咨询（意向征集）',
    title_original: 'Consultancy Services for Design Review and Construction Supervision of the Construction of Designated Roads in UMUHIA ABIA State',
    sectors: ['道路桥梁', '工程咨询'], sector_raw: 'IsDB 咨询服务意向征集', entity: '阿比亚州综合基础设施发展项目州项目实施单元（SPIU）',
    location: '尼日利亚阿比亚州乌穆阿希亚市（Umuahia）', scope: '对乌穆阿希亚市指定道路的施工开展设计审查与施工监理，监理期 36 个月。',
    ref_no: 'ABSIIDP/CON/QCBS/L2', stage_note: '咨询服务意向征集（REOI）；融资方式分期付款销售，IsDB 融资编号 NGA 1047；发布日期 2026-11-17',
    deadline: '2026-12-02', url: 'https://www.isdb.org/project-procurement/tenders/2026/eoi/consultancy-services-design-review-and-construction-supervision-construction-0',
    dgmarket_url: 'https://www.dgmarket.com/tenders/np-notice.do?keywords=&noticeId=117948701', funder: '伊斯兰开发银行（IsDB），分期付款销售', conditions: '意向书可书面、邮件或当面递交至 SPIU；TOR 需向采购方索取。',
    action: '向 SPIU 索取 TOR，评估道路监理业绩匹配度，2026-12-02 前递交意向书。', risk: '咨询监理项目；原公告称“预计 2026 年第一季度启动”与发布日期不符，需向采购方确认；金额未披露。', published_at: '2026-11-17' }),
];
const byUrl = new Map(m.items.map((i) => [i.url, i]));
for (const n of NEW) {
  if (byUrl.has(n.url) || m.items.some((x) => x.ref_no && x.ref_no === n.ref_no)) continue;
  n.id = crypto.createHash('sha1').update(n.url).digest('hex').slice(0, 12);
  m.items.push(n); log.added++;
}

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
const wbIds = new Set(wb.candidates.map((c) => c.id));
for (const it of m.items) {
  const id = (it.url.match(/procurement-detail\/(OP\d+)/) || [])[1];
  if (id && wbIds.has(id) && it.verified_at !== TODAY) { it.verified_at = TODAY; log.verified++; }
}
const dgIds = new Set(dg.rows.map((r) => r.noticeId));
for (const it of m.items) {
  const id = (it.dgmarket_url || '').match(/noticeId=(\d+)/)?.[1];
  if (id && dgIds.has(id) && it.verified_at !== TODAY) { it.verified_at = TODAY; log.verified++; }
}

const S = {
  ghaneps: ['已核验并更新', '本机抓取 8 页共 80 条当前招标并逐条筛查：新增 0 条（17 条未收录公告均为家具、车辆、IT、会议服务、铁矿勘探类，已排除）；复核并中文化云端自动收录 ' + log.translated + ' 条（Nkoranza 警察分局办公楼、Hohoe 市场商铺）；截止时间变化 0 条。'],
  'wb-opps': ['已核验无新增', '本机运行 wb-fetch：开放工程类候选 8 条，6 条已收录并复核；另 2 条 IDEAS 项目职业培训工具包为货物采购，不属工程范围，未收录。'],
  'wb-proc': ['已核验无新增', '同世界银行 Business Opportunities：候选 8 条，6 条已收录并复核，2 条培训工具包货物采购未收录。'],
  dgmarket: ['已核验并更新', 'ego 浏览器已登录会员会话读取近一周公告：加纳 42 条、多哥 2 条、尼日利亚 70 条（唯一 114 条）；新增 3 条 IsDB 咨询（尼日尔州 100MW 光伏监理、阿巴与乌穆阿希亚道路监理），均已核对 IsDB 原公告；其余为已收录项目、货物/服务、UN/NGO 采购，或范围不明的联邦院校“项目执行”招标，未收录。'],
};
for (const s of m.sources) {
  const v = S[s.id]; if (!v) continue;
  s.status = v[0]; s.checked_at = NOW; s.note = v[1].replace('截止时间变化 0 条', '截止时间变化 ' + log.deadline_changed.length + ' 条');
}
m.meta.dgmarket_authorized = true;
const FIN = new Date().toISOString();
m.meta.last_run = { started_at: STARTED, finished_at: FIN, result: '成功', runner: '本机任务',
  note: '本机更新：GHANEPS、世界银行、DGMarket 读取成功；新增 ' + log.added + ' 条，中文化云端记录 ' + log.translated + ' 条，刷新核验日期 ' + log.verified + ' 条；其余来源沿用上次核验状态（OSMAPT 等此前访问失败，本次未重试）。' };
m.meta.last_success_at = FIN;
fs.writeFileSync(P + 'master.json', JSON.stringify(m, null, 2), 'utf8');
console.log(JSON.stringify(log, null, 1));
