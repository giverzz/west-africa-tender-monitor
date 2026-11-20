import fs from 'node:fs';
import crypto from 'node:crypto';
const P = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/';
const m = JSON.parse(fs.readFileSync(P + 'master.json', 'utf8'));
const gh = JSON.parse(fs.readFileSync(P + 'ghaneps.json', 'utf8'));
const wb = JSON.parse(fs.readFileSync(P + 'wb-candidates.json', 'utf8'));
const STARTED = process.argv[2];
const TODAY = '2026-11-20';
const NOW = new Date().toISOString();
const ghByUrl = new Map(gh.rows.map((r) => [r.url, r]));
const log = { translated: 0, added: 0, verified: 0, deadline_changed: [] };

// 1.5 云端自动收录记录：已逐条打开 GHANEPS / 世界银行原始公告核实
const CN = {
  '4039973': { title: '卡拉加区议会（Karaga）区议会办公楼翻修', location: '加纳北部地区卡拉加区（Karaga）', scope: '翻修卡拉加区议会办公楼（APP 编号 NR/KAD/WKS/DACF/LOT22/26，DACF 资金）。', ref_no: 'NR/KAD/WKS/DACF/LOT22/26' },
  '4019748': { title: '南达伊区议会 Kpeve New Town 两栋两层 8 套单间教师宿舍建设', location: '加纳沃尔特地区南达伊区 Kpeve New Town', scope: '新建 2 栋两层、每栋 8 套“卧室+客厅”独立式教师宿舍；资金为区议会预算。', ref_no: 'VR/SDDA/WKS/016/26' },
  '4039718': { title: '卡拉加区议会 12 眼钻井及机械化供水（8 眼机械化、4 眼手压泵）', location: '加纳北部地区卡拉加区（Karaga）选定社区', scope: '在选定社区钻凿 12 眼水井，其中 8 眼配机械化供水系统、4 眼安装手压泵（APP 编号 NR/KDA/WKS/DACF/LOT21/26）。', ref_no: 'NR/KDA/WKS/DACF/LOT21/26' },
  '4038627': { title: '安洛加区议会 Anloga Low-Cost 3 套半独立式护士宿舍建设', location: '加纳沃尔特地区安洛加区 Anloga Low-Cost', scope: '新建 3 套“卧室+客厅”半独立式护士宿舍。', ref_no: 'VR/AnDA/DPAT/WKS/2026/027' },
  '4038242': { title: '安洛加区 Devegodo 跨 Deve 河木质人行桥建设', location: '加纳沃尔特地区安洛加区 Devegodo', scope: '在 Devegodo 跨 Deve 河新建（原题为修复）木质人行桥；资金来源 SIGRA。', ref_no: 'VR/AnDA/SIGRA/WKS/2026/070' },
  '4036573': { title: '阿克拉市议会 Soko 学校群 11 间两层教学楼建设', location: '加纳大阿克拉地区阿克拉市 Soko 学校群', scope: '为 Soko 学校群新建 1 栋两层 11 间教室教学楼（DACF 资金）。', ref_no: 'GAR/AMA/DACF/WKS/NCT/005/26' },
};
for (const it of m.items) {
  if (!it.auto_ingested) continue;
  const rid = (it.url.match(/resourceId=(\d+)/) || [])[1];
  if (rid && CN[rid]) {
    Object.assign(it, CN[rid]);
    it.sector_raw = 'GHANEPS 工程类（Works）';
    it.funder = /DACF/.test(it.ref_no) ? '加纳区议会共同基金（DACF）' : (/SIGRA/.test(it.ref_no) ? 'SIGRA 地方政府资金' : '区议会预算');
    it.conditions = '具体资格、标书费与投标保证金以 GHANEPS 公告文件为准。';
    it.action = '在 GHANEPS 平台登录后下载招标文件，核实资格要求、保证金、工程量清单与工期，评估是否参与。';
    it.risk = '地方议会小型土建工程，金额未披露，通常以加纳本地承包商为主（NCT），外资企业需核实资格限制。';
    it.verified_note = TODAY + ' 本机打开 GHANEPS 原始公告核实 APP 编号、描述与截止时间，并确认仍在当前招标列表；中文标题据原文翻译。';
  } else if (/OP00482349/.test(it.url)) {
    Object.assign(it, {
      title: '尼日尔州牲畜生产力与韧性支持项目（L-PRES）牲畜服务中心建设',
      location: '尼日利亚尼日尔州', entity: '尼日尔州 L-PRES 项目实施单元（Niger State PIU）',
      scope: '世界银行 IDA 信贷（70570-NG）资助，建设尼日尔州牲畜服务中心（LSC），采用国内招标 RFB。',
      sector_raw: '世界银行 Works / Request for Bids',
      conditions: '具体资格、保证金与工期以 RFB 文件为准。',
      action: '向尼日尔州 L-PRES PIU 索取招标文件，核实资格与工程量，2026-11-26 12:00（当地时间）前递交投标。',
      risk: '截止时间较近；中小型畜牧设施土建，金额未披露；截止时刻以公告正文为准（on or before 12:00noon on Thursday 26th November, 2026）。',
      verified_note: TODAY + ' 本机运行 wb-fetch，世界银行 API 仍列出该公告，核对编号与截止时间。',
    });
  } else continue;
  it.verified_at = TODAY;
  delete it.auto_ingested;
  log.translated++;
}

// 新增记录
const base = { amount: '未披露', dgmarket_url: '', dgmarket: false, verified_at: TODAY, terminal_at: null, added_at: NOW };
const GHN = (o) => ({ ...base, country: 'GH', stage: '正式招标', stage_note: 'National Competitive Tendering（国内竞争性招标）', origin: 'GHANEPS', origin_type: '政府官方',
  discovery: 'GHANEPS 当前招标列表', sector_raw: 'GHANEPS 工程类（Works）', conditions: '具体资格、标书费与投标保证金以 GHANEPS 公告文件为准。',
  action: '在 GHANEPS 平台登录后下载招标文件，核实资格要求、保证金、工程量清单与工期，评估是否参与。',
  verified_note: TODAY + ' 本机抓取 GHANEPS 当前招标列表并打开原始公告核实。', ...o });
const UN = (o) => ({ ...base, origin: 'UNGM', origin_type: '国际机构官方', stage: '询价',
  verified_note: TODAY + ' 本机用 ego 浏览器按国家筛选 UNGM 近一周公告，并打开 UNGM 公告页核实截止时间与描述。', ...o });
const NEW = [
  GHN({ title: '北达伊区议会卫生与教育局两层办公综合楼建设', title_original: 'Construction of Office Building', sectors: ['建筑基础设施'],
    entity: 'NORTH DAYI DISTRICT ASSEMBLY', location: '加纳沃尔特地区北达伊区（North Dayi）',
    scope: '为北达伊区卫生与教育局新建 1 栋两层办公综合楼，含 1 间主会议室、2 间小会议室、2 间行政办公室、2 间秘书室、12 间其他办公室、库房及 8 间卫生间。',
    ref_no: 'VR/NDDA/DACF/DPAT/WKS/021', published_at: '2026-11-20 07:23', deadline: '2026-12-04 10:00',
    url: 'https://www.ghaneps.gov.gh/epps/cft/prepareViewCfTWS.do?resourceId=4050112', funder: '加纳区议会共同基金（DACF）/ DPAT',
    risk: '地方议会小型房建，金额未披露，以本地承包商为主；开标时间 2026-12-04 10:30。' }),
  GHN({ title: '多尔马中央市议会 Maasu/Kuren 社区卫生站（CHPS）及员工宿舍建设（含钻井与电力延伸）',
    title_original: 'Construction of 1No. Community-Based Health Planning and Services (CHPS) Compound and 1No. Staff Accommodation including Drilling and Mechanization of 1No. Borehole and extension of Electricity to the CHPS Compound at Maasu/Kuren including supply of medical equipment',
    sectors: ['建筑基础设施', '水利灌溉', '电力电气'], entity: 'Dormaa Central Municipal Assembly', location: '加纳博诺地区多尔马中央市 Maasu/Kuren',
    scope: '新建 1 座社区卫生规划与服务站（CHPS）及 1 栋员工宿舍，配套钻凿并机械化 1 眼水井、为 CHPS 延伸电力线路，并供应医疗设备。',
    ref_no: 'BR/DCMA/DACF-RFG/WKS/NCT/02B/26', published_at: '2026-11-18 19:07', deadline: '2026-12-03 10:00',
    url: 'https://www.ghaneps.gov.gh/epps/cft/prepareViewCfTWS.do?resourceId=4037783', funder: 'DACF-RFG（区议会共同基金-绩效拨款）',
    risk: '小型综合房建，含少量电力延伸与医疗设备供货，金额未披露，以本地承包商为主。' }),
  UN({ title: '多哥萨瓦纳区 Cinkassé 蔬菜种植基地铁丝网围栏工程（FAO）', title_original: 'Travaux d’aménagement et d’infrastructures maraichères dans les Régions des Savanes',
    country: 'TG', sectors: ['水利灌溉', '建筑基础设施'], sector_raw: 'UNGM Invitation to bid（FAO 工程）', entity: 'FAO 多哥代表处',
    location: '多哥萨瓦纳区 Cinkassé', scope: 'FAO 项目 GCP/TOG/024/EC 下，选择 1 家多哥本地企业实施 Cinkassé 蔬菜种植基地铁丝网围栏等配套设施工程。',
    ref_no: '2026/FRTOG/FRTOG/139097', stage: '正式招标', stage_note: 'Invitation to bid；面向多哥本地建筑及打井企业的咨询比选',
    published_at: '2026-11-19', deadline: '2026-12-02 23:47', url: 'https://www.ungm.org/Public/Notice/323094',
    discovery: 'UNGM / FAO 官方公告', funder: '欧盟资助的 FAO 项目（GCP/TOG/024/EC）', conditions: '仅限在多哥正式注册的本地建筑（BTP）及打井企业，须证明相关经验、人员与设备。',
    action: '如有多哥本地注册实体，在 UNGM 登录下载技术附件并在线提交。',
    risk: '仅限多哥本地企业；规模小。UNGM 截止时间显示 2026-12-02 23:47 GMT，而正文写“2026 年 12 月 3 日（周一）23:59”，日期与星期不符，以 UNGM 系统时间为准并向 FAO 确认。' }),
  UN({ title: '尼日利亚贝努埃州 Naka 水处理厂修复（仅服务与安装）询价（IOM）', title_original: 'Request for Quotation for Service & Installation Only for Water Treatment Plant',
    country: 'NG', sectors: ['水利灌溉', '建筑基础设施'], sector_raw: 'UNGM Request for quotation（IOM）', entity: '国际移民组织（IOM）尼日利亚',
    location: '尼日利亚贝努埃州 Naka', scope: '为 Naka 水处理厂修复提供服务与安装（不含设备供货），建议踏勘现场了解现有设施。',
    ref_no: '30000037147', stage_note: 'Request for quotation（询价）', published_at: '2026-11-18', deadline: '2026-11-23 13:09',
    url: 'https://www.ungm.org/Public/Notice/322941', discovery: 'UNGM / IOM 官方公告', funder: '国际移民组织（IOM）',
    conditions: '须在 IOM 供应商门户注册并按评选标准提交全部文件。', action: '截止时间很近：如有尼日利亚本地团队，立即在 IOM 供应商门户注册并提交报价。',
    risk: 'UNGM 截止时间 2026-11-23 12:09 GMT，已换算为尼日利亚当地时间（WAT）13:09；规模小，仅含安装服务。' }),
  UN({ title: '尼日利亚 UNICEF 光伏系统评估与新建光伏系统安装', title_original: 'RFP_9207280_ For the Solar PV Audit and New System Installation',
    country: 'NG', sectors: ['清洁能源/光伏', '电力电气'], sector_raw: 'UNGM Request for proposal（UNICEF）', entity: 'UNICEF 尼日利亚',
    location: '尼日利亚（具体站点见招标文件）', scope: '对现有光伏系统开展评估（审计），并安装新的光伏系统。',
    ref_no: 'RFP_9207280', stage: '建议书征集', stage_note: 'Request for proposal；通过 UNICEF e-submission 系统提交',
    published_at: '2026-11-16', deadline: '2026-12-08 12:30', url: 'https://www.ungm.org/Public/Notice/322681', discovery: 'UNGM / UNICEF 官方公告', funder: 'UNICEF',
    conditions: '须在 UNGM 以公司身份注册 UNICEF 并完成必填信息，点击 Express Interest 后获取文件。',
    action: '在 UNGM 点击 Express Interest，进入 UNICEF e-submission 系统下载文件，确认站点与规模后决定是否响应。',
    risk: '规模与站点未在公告中披露；截止时间为尼日利亚当地时间（GMT+1）。' }),
];
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
for (const n of NEW) {
  const dup = m.items.find((x) => x.url === n.url || (x.ref_no && x.ref_no === n.ref_no) || (x.entity === n.entity && norm(x.title_original) === norm(n.title_original) && n.title_original !== 'Construction of Office Building'));
  if (dup) continue;
  n.id = crypto.createHash('sha1').update(n.url).digest('hex').slice(0, 12);
  m.items.push(n); log.added++;
}

// 既有记录：GHANEPS / 世界银行列表复核
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

const S = {
  ghaneps: ['已核验并更新', '本机抓取 8 页共 80 条当前招标并逐条筛查：新增 2 条（北达伊区办公楼、多尔马 CHPS 卫生站）；复核并中文化云端自动收录 6 条（逐条打开原始公告核实 APP 编号）；其余 22 条未收录公告为家具、车辆、IT/网络、餐饮、矿产勘探等，已排除；截止时间变化 0 条。'],
  'wb-opps': ['已核验并更新', '本机运行 wb-fetch：开放工程类候选 8 条，6 条已收录并复核（含中文化云端收录的尼日尔州 L-PRES 牲畜服务中心）；另 2 条 IDEAS 项目职业培训工具包为货物采购，未收录。'],
  'wb-proc': ['已核验并更新', '同世界银行 Business Opportunities：候选 8 条，6 条已收录并复核，2 条培训工具包货物采购未收录。'],
  ungm: ['已核验并更新', 'ego 浏览器按加纳/多哥/尼日利亚筛选 2026-11-13 以来发布的公告（加纳 15、多哥 13、尼日利亚 15 条，含多国公告）；新增 3 条：FAO 多哥 Cinkassé 蔬菜基地围栏工程、IOM 贝努埃州水处理厂安装、UNICEF 尼日利亚光伏评估与安装；其余为餐饮、会议、种子化肥、IT 及总部服务，未收录。'],
  afdb: ['已核验无新增', 'ego 浏览器读取列表第一页：与加纳/多哥/尼日利亚相关仅 1 条多国 Fintech Hub GPN（非工程），乍得湖区域道路 PPM 不涉三国，无新增。'],
  'afdb-gpn': ['已核验无新增', 'ego 浏览器读取列表第一页：仅见多哥 1 条技术转让与能力建设 AGPM（总体采购通告，非工程招标），未收录。'],
  rea: ['已核验无新增', '招标页显示“There are currently no tenders matching your search criteria”，无开放招标。'],
  intercom: ['已核验无新增', '列表最新发布为 2026-09-22；CEET Lomé B 电厂 HTA 开关柜更换（AOI 017/2026）已于 2026-11-09 截止，其余为早期公告或非工程采购，无新增。'],
  dnccp: ['可访问，未逐条筛查', '首页可打开（HTTP 200），仅显示 2026 年采购计划（PPM）文件，未逐条打开招标公告页，既有记录保持原样。'],
  ppa: ['可访问，未逐条筛查', '站点可打开（HTTP 200），本次仅做可达性检查，未逐条筛查公告，既有记录保持原样。'],
  mrh: ['可访问，未逐条筛查', '首页可打开（HTTP 200），招标列表由前端脚本加载，curl 未读取到具体公告，既有记录保持原样。'],
  nocopo: ['可访问，未逐条筛查', '站点可打开（HTTP 200），本次仅做可达性检查，未逐条筛查公告，既有记录保持原样。'],
  bpp: ['可访问，未逐条筛查', '站点可打开（HTTP 200），本次仅做可达性检查，未逐条筛查公告，既有记录保持原样。'],
  nep: ['可访问，未逐条筛查', '页面可打开（HTTP 200，内容由脚本加载），未逐条筛查，既有记录保持原样。'],
  nddc: ['可访问，未逐条筛查', '门户可打开（HTTP 200，仅返回前端外壳），未逐条筛查，既有记录保持原样。'],
  osmapt: ['访问失败', 'curl 连接超时（25 秒无响应），未读取。'],
  ceet: ['访问失败', 'curl 连接超时（25 秒无响应），未读取；已通过 InterCom 辅助确认 CEET Lomé B HTA 招标已截止。'],
  dgmarket: ['未获授权', '2026-11-20 运行 dgmarket-fetch：ego 浏览器显示 DGMarket 安全验证页面（ok=false、logged_in=false），未读取，不绕过验证、未输入账号密码；保留既有 DGMarket 记录及其核验日期。'],
};
for (const s of m.sources) {
  const v = S[s.id]; if (!v) continue;
  s.status = v[0]; s.checked_at = NOW; s.note = v[1].replace('截止时间变化 0 条', '截止时间变化 ' + log.deadline_changed.length + ' 条');
}
m.meta.dgmarket_authorized = false;
const FIN = new Date().toISOString();
m.meta.last_run = { started_at: STARTED, finished_at: FIN, result: '成功', runner: '本机任务',
  note: '本机更新：GHANEPS、世界银行、UNGM、AfDB 读取成功；新增 ' + log.added + ' 条，中文化云端记录 ' + log.translated + ' 条，刷新核验日期 ' + log.verified + ' 条；DGMarket 停在安全验证页，未获授权；OSMAPT、CEET 连接超时。' };
m.meta.last_success_at = FIN;
fs.writeFileSync(P + 'master.json', JSON.stringify(m, null, 2), 'utf8');
console.log(JSON.stringify(log, null, 1));
