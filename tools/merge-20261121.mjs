// 2026-11-21 本机合并：GHANEPS / 世界银行复核、DGMarket 会员公告新增、UNGM 新增、来源状态与运行状态。
import fs from 'node:fs';
import crypto from 'node:crypto';
const P = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/';
const m = JSON.parse(fs.readFileSync(P + 'master.json', 'utf8'));
const gh = JSON.parse(fs.readFileSync(P + 'ghaneps.json', 'utf8'));
const wb = JSON.parse(fs.readFileSync(P + 'wb-candidates.json', 'utf8'));
const dg = JSON.parse(fs.readFileSync(P + 'dgmarket.json', 'utf8'));
const STARTED = process.argv[2];
const TODAY = '2026-11-21';
const NOW = new Date().toISOString();
const log = { added: 0, verified: 0, dg_linked: 0, deadline_changed: [] };
const DGU = (id) => 'https://www.dgmarket.com/tenders/np-notice.do?keywords=&noticeId=' + id;

// 新增记录
const base = { amount: '未披露', verified_at: TODAY, terminal_at: null, added_at: NOW, ref_no: '', published_at: '' };
const DG = (id, o) => ({ ...base, url: DGU(id), dgmarket_url: DGU(id), dgmarket: true, origin: 'DGMarket', origin_type: '会员来源',
  discovery: 'DGMarket 会员公告', stage: '正式招标', funder: '',
  conditions: '具体资格、保证金与递交方式以采购方招标文件为准。',
  verified_note: TODAY + ' 本机用 ego 浏览器（DGMarket 会员会话）打开公告页读取摘要；未找到采购方原始公告页。',
  ...o, risk: '仅见于 DGMarket，需以采购方文件为准。' + (o.risk || '') });
const NEW = [
  DG('117970952', { title: '安洛加区 Woe Dekugbor 社区农民培训中心及配套设施建设（ActionAid 加纳）',
    title_original: 'Construction of 1No. Farmer Training Center with Ancillary Facilities at Woe Dekugbor Community, Anloga District, Volta Region, Ghana.',
    country: 'GH', sectors: ['建筑基础设施'], sector_raw: 'DGMarket Invitation for Bids', entity: 'ActionAid Ghana', location: '加纳沃尔特地区安洛加区 Woe Dekugbor 社区',
    scope: 'ActionAid 加纳在“科特迪瓦与加纳沿海社区韧性提升”项目下，招标建设 1 座农民培训中心及配套设施。',
    stage_note: 'DGMarket 收录日期 2026-11-17；原文抬头为 EXPRESSION OF INTEREST (EoI)，正文写“invites bids”，Closing date 22 November 2026',
    deadline: '2026-11-22', funder: 'ActionAid 项目资金（沿海社区韧性项目）',
    action: '截止时间为 2026-11-22，如有兴趣需立即在 DGMarket 下载招标文件并联系 ActionAid Ghana 确认递交方式。',
    risk: '非政府组织小型房建，截止在即，具体时刻未注明。' }),
  DG('118022689', { title: '卡诺州阿尔巴苏地方政府教育局总部全面翻修及家具配置', title_original: 'Albasu Local Government Council, Kano State-Invitation To Tender For General Renovation Of Albasu Local Government Education Authority Headquarters And Furnishing',
    country: 'NG', sectors: ['建筑基础设施'], sector_raw: 'Rehabilitation/Renovation', entity: 'Albasu Local Government Council, Kano State', location: '尼日利亚卡诺州阿尔巴苏（Albasu）',
    scope: '翻修阿尔巴苏地方政府教育局（LGEA）总部并配置家具。', stage_note: 'Invitation To Tender；DGMarket 收录日期 2026-11-18，原文日期 2026-11-17', deadline: '',
    action: '向阿尔巴苏地方政府委员会索取招标文件，确认截止时间。', risk: '原文截止日期为 N/A，DGMarket 列表显示 2026-12-02，未核实；地方小型翻修，以本地承包商为主。' }),
  DG('118022701', { title: '卡诺州加巴萨瓦地方政府教育局总部（Zakirai）全面翻修及家具配置', title_original: 'Gabasawa Local Government Council, Kano State-Invitation To Tender For General Renovation And Furnishing Of Local Government Education Authority(Lgea ) Headquaters Zakirai Gabasawa',
    country: 'NG', sectors: ['建筑基础设施'], sector_raw: 'Construction & Engineering', entity: 'Gabasawa Local Government Council, Kano State', location: '尼日利亚卡诺州加巴萨瓦（Gabasawa）Zakirai',
    scope: '翻修位于 Zakirai 的加巴萨瓦地方政府教育局（LGEA）总部并配置家具。', stage_note: 'Invitation To Tender；DGMarket 收录日期 2026-11-18，原文日期 2026-11-17', deadline: '',
    action: '向加巴萨瓦地方政府委员会索取招标文件，确认截止时间。', risk: '原文截止日期为 N/A，DGMarket 列表显示 2026-12-02，未核实；地方小型翻修。' }),
  DG('118082682', { title: '卡诺州马多比地方教育局总部翻修及办公室扩建', title_original: 'Madobi Local Government Council, Kano State-Invitation To Tender For General Renovation And Extension Offices At Local Education Authority (Lea) Headquarter Madobi Local Government',
    country: 'NG', sectors: ['建筑基础设施'], sector_raw: 'Rehabilitation/Renovation', entity: 'Madobi Local Government Council, Kano State', location: '尼日利亚卡诺州马多比（Madobi）',
    scope: '翻修马多比地方教育局（LEA）总部并扩建办公室。', stage_note: 'Invitation To Tender；DGMarket 收录日期 2026-11-19，原文日期 2026-11-18', deadline: '2026-12-01',
    action: '向马多比地方政府委员会索取招标文件，2026-12-01 前递交。', risk: '地方小型翻修扩建，以本地承包商为主。' }),
  DG('118082687', { title: '卡诺州明吉比尔地方政府教育局总部全面翻修及家具配置', title_original: 'Minjibir Local Government Council, Kano State-Invitation To Tender For General Renovation And Furnishing Of Minjibir Local Government Education Authority (L.E.A) Headquarters',
    country: 'NG', sectors: ['建筑基础设施'], sector_raw: 'Furniture & Furnishings, Rehabilitation/Renovation', entity: 'Minjibir Local Government Council, Kano State', location: '尼日利亚卡诺州明吉比尔（Minjibir）',
    scope: '翻修明吉比尔地方政府教育局（LEA）总部并配置家具。', stage_note: 'Invitation To Tender；DGMarket 收录日期 2026-11-19，原文日期 2026-11-18', deadline: '2026-12-01',
    action: '向明吉比尔地方政府委员会索取招标文件，2026-12-01 前递交。', risk: '翻修与家具混合采购，规模小。' }),
  DG('118161193', { title: '卡诺州加伦马拉姆地方政府教育局总部全面翻修及家具配置', title_original: 'Garun Malam Local Government Council, Kano State-Invitation To Tender For General Renovation And Furnishing Of Local Government Education Authority (Lgea) Headquarters, Garun Malam',
    country: 'NG', sectors: ['建筑基础设施'], sector_raw: 'Furniture & Furnishings, Rehabilitation/Renovation', entity: 'Garun Malam Local Government Council, Kano State', location: '尼日利亚卡诺州加伦马拉姆（Garun Malam）',
    scope: '翻修加伦马拉姆地方政府教育局（LGEA）总部并配置家具。', stage_note: 'Invitation To Tender；DGMarket 收录日期 2026-11-20，原文日期 2026-11-19', deadline: '',
    action: '向加伦马拉姆地方政府委员会索取招标文件，确认截止时间。', risk: '原文截止日期为 N/A，DGMarket 列表显示 2026-12-04，未核实；翻修与家具混合采购。' }),
  DG('117942141', { title: '埃基蒂州 NEWMAP-EIB 侵蚀与流域治理项目咨询服务意向征集', title_original: 'Ekiti State Newmap-Eib-Request For Expression Of Interest For Consultancy Services Under The Nigeria Climate Adaptation – Erosion And Watershed Project (Newmap-Eib) Ekiti State Project Management / Implementation Unit',
    country: 'NG', sectors: ['工程咨询', '水利灌溉'], sector_raw: 'Consultancy', entity: 'Ekiti State NEWMAP-EIB 项目管理/实施单元', location: '尼日利亚埃基蒂州',
    scope: '欧洲投资银行（EIB）资助的尼日利亚气候适应—侵蚀与流域治理项目（NEWMAP-EIB）埃基蒂州咨询服务意向征集；摘要未列具体咨询任务。',
    stage: '意向征集', stage_note: 'Request for Expression of Interest；DGMarket 收录日期 2026-11-16', deadline: '2026-11-30', funder: '欧洲投资银行（EIB）',
    action: '向埃基蒂州 NEWMAP-EIB 项目单元索取完整 EOI，确认咨询任务内容，2026-11-30 前递交意向书。', risk: '摘要未写明具体咨询任务（设计、监理或其他）。' }),
  DG('118022690', { title: '阿南布拉州 NEWMAP-EIB 侵蚀与流域治理项目工程咨询服务意向征集', title_original: 'Anambra State Newmap-Eibib-Request For Expression Of Interest For Consultancy Services Under The Nigeria Climate Adaptation – Erosion And Watershed Project (Newmap-Eib) Anambra State Project Management / Implementation Unit',
    country: 'NG', sectors: ['工程咨询', '水利灌溉'], sector_raw: 'Consultancy, Engineering Services', entity: 'Anambra State NEWMAP-EIB 项目管理/实施单元', location: '尼日利亚阿南布拉州',
    scope: 'EIB 资助的 NEWMAP-EIB 项目阿南布拉州咨询服务（DGMarket 分类为工程服务）意向征集；摘要未列具体任务。',
    stage: '意向征集', stage_note: 'Request for Expression of Interest；DGMarket 收录日期 2026-11-18，原文日期 2026-11-17', deadline: '2026-12-16', funder: '欧洲投资银行（EIB）',
    action: '向阿南布拉州 NEWMAP-EIB 项目单元索取完整 EOI，2026-12-16 前递交意向书。', risk: '摘要未写明具体咨询任务。' }),
  DG('118082685', { title: '阿比亚州乌穆阿希亚指定道路建设设计复核与施工监理咨询意向征集（伊斯兰开发银行）', title_original: 'Islamic Development Bank-Request For Expressions Of Interest For Consultancy Services For Design Review And Construction Supervision Of The Construction Of Designated Roads In Umuhia Abia State.',
    country: 'NG', sectors: ['道路桥梁', '工程咨询'], sector_raw: 'Construction & Engineering, Consultancy', entity: '伊斯兰开发银行（IsDB）资助项目 / 阿比亚州', location: '尼日利亚阿比亚州乌穆阿希亚（Umuahia）',
    scope: '为乌穆阿希亚指定道路建设提供设计复核与施工监理咨询服务。', stage: '意向征集', stage_note: 'Request for Expressions of Interest；DGMarket 收录日期 2026-11-19，原文日期 2026-11-18',
    deadline: '2026-12-02', funder: '伊斯兰开发银行（IsDB）', action: '索取完整 EOI，准备道路设计复核与监理业绩，2026-12-02 前递交。', risk: '与阿巴（Aba）道路监理为同批两个包，可同时关注。' }),
  DG('118082686', { title: '阿比亚州阿巴指定道路建设设计复核与施工监理咨询意向征集（伊斯兰开发银行）', title_original: 'Isdb Islamic Development Bank-Request For Expressions Of Interest For Consultancy Services For Design Review And Construction Supervision Of The Construction Of Designated Roads In Aba Abia State',
    country: 'NG', sectors: ['道路桥梁', '工程咨询'], sector_raw: 'Construction & Engineering, Consultancy', entity: '伊斯兰开发银行（IsDB）资助项目 / 阿比亚州', location: '尼日利亚阿比亚州阿巴（Aba）',
    scope: '为阿巴指定道路建设提供设计复核与施工监理咨询服务。', stage: '意向征集', stage_note: 'Request for Expressions of Interest；DGMarket 收录日期 2026-11-19，原文日期 2026-11-18',
    deadline: '2026-12-02', funder: '伊斯兰开发银行（IsDB）', action: '索取完整 EOI，准备道路设计复核与监理业绩，2026-12-02 前递交。', risk: '与乌穆阿希亚道路监理为同批两个包。' }),
  DG('118082683', { title: '阿比亚州乌穆阿希亚 Ohiya 货车中转停车场设计—建设—运营—移交（DBOT）PPP 意向征集与资格预审', title_original: 'Abia State Public Private Partnership & Investment Promotions Office (Ppp & Ip Office)-Invitation For Expressions Of Interest And Request For Prequalification For The Design, Build, Operate And Transfer (Dbot) Of The Ohiya Truck Transit Park, Umuahia',
    country: 'NG', sectors: ['建筑基础设施', '道路桥梁'], sector_raw: 'Management/Investment', entity: 'Abia State PPP & Investment Promotions Office', location: '尼日利亚阿比亚州乌穆阿希亚 Ohiya',
    scope: '以 PPP（DBOT）方式设计、建设、运营并移交 Ohiya 货车中转停车场，征集意向并资格预审。', stage: '资格预审', stage_note: 'Invitation for EOI and Request for Prequalification；DGMarket 收录日期 2026-11-19，原文日期 2026-11-18',
    deadline: '2026-11-23', action: '截止在即（2026-11-23），如有投资+建设意向立即联系阿比亚州 PPP 办公室。', risk: 'PPP 投资类项目，需承担融资与运营风险；截止时间极近。' }),
  DG('118147320', { title: '联邦石油资源大学（三角洲州）工程学院大楼建设及家具配置资格预审', title_original: 'Federal University Of Petroleum Resources, Delta State-Invitation For Pre-Qualification For Construction And Furnishing Of Engineering Building',
    country: 'NG', sectors: ['建筑基础设施'], sector_raw: 'Construction & Engineering, Furniture & Furnishings', entity: 'Federal University of Petroleum Resources, Effurun（FUPRE）', location: '尼日利亚三角洲州',
    scope: '建设并配置工程学院大楼，先行资格预审。', stage: '资格预审', stage_note: 'Invitation for Pre-Qualification；DGMarket 收录日期 2026-11-20，原文日期 2026-11-19',
    deadline: '2026-11-30', action: '准备尼日利亚本地注册与资质文件（CAC、税务、养老金、ITF、NSITF、BPP 等），2026-11-30 前递交资格预审文件。', risk: '尼日利亚联邦高校项目通常要求本地合规证书。' }),
  DG('118147323', { title: '贝努埃州农业科技大学（Ihugh）2026 年 TETFund 资助就业服务中心建设', title_original: 'University Of Agriculture, Science And Technology, Ihugh, Benue State-Invitation To Tender For 2026 Tetfund Intervention For The Construction Of Career Service Centre',
    country: 'NG', sectors: ['建筑基础设施'], sector_raw: 'Construction & Engineering', entity: 'University of Agriculture, Science and Technology, Ihugh', location: '尼日利亚贝努埃州 Ihugh',
    scope: '在 2026 年 TETFund 资助下建设就业服务中心大楼。', stage_note: 'Invitation To Tender；DGMarket 收录日期 2026-11-20，原文日期 2026-11-19', deadline: '2026-12-16', funder: '高等教育信托基金（TETFund）',
    action: '向大学采购处索取招标文件，2026-12-16 前递交。', risk: 'TETFund 项目一般要求尼日利亚本地合规证书。' }),
  DG('117942151', { title: '尼日利亚港口经济监管局（NPERA，拉各斯）货物与工程招标（含太阳能/可再生能源类）', title_original: 'Nigerian Ports Economic Regulatory Agency(Npera), Lagos-Invitation To Tender For Goods And Works',
    country: 'NG', sectors: ['清洁能源/光伏', '建筑基础设施'], sector_raw: 'General Supplies & Services, Solar and Renewable', entity: 'Nigerian Ports Economic Regulatory Agency（NPERA）', location: '尼日利亚拉各斯',
    scope: 'NPERA 货物与工程综合招标；DGMarket 分类含“太阳能与可再生能源”，摘要未列具体标段。', stage_note: 'Invitation To Tender；DGMarket 收录日期 2026-11-16', deadline: '2026-12-17',
    action: '获取完整招标公告，确认是否含光伏/电力工程标段，2026-12-17 前递交。', risk: '摘要未列标段内容，可能以货物为主。' }),
  { ...base, title: 'UNICEF 塔马利 NORRIP 大楼金属屋面修缮（为加装光伏做准备）', title_original: 'REPAIR OF THE METAL ROOF SHEETING, NORRIP BUILDING, TAMALE Repair of the deteriorated and sagging metal roof sheeting, purlins, ridge cap and parapet flashing, ahead of the installation of solar PV',
    country: 'GH', sectors: ['建筑基础设施', '清洁能源/光伏'], sector_raw: 'UNGM Request for proposal（UNICEF 工程）', entity: 'UNICEF 加纳', location: '加纳北部地区塔马利 NORRIP 大楼',
    scope: '修缮 NORRIP 大楼老化下垂的金属屋面板、檩条、屋脊盖板及女儿墙泛水，为后续安装屋顶光伏做准备。', ref_no: 'RFP No. 9207459', stage: '建议书征集', stage_note: 'Request for proposal（UNGM）',
    published_at: '2026-11-20', deadline: '2026-12-10 16:00', url: 'https://www.ungm.org/Public/Notice/323186', origin: 'UNGM', origin_type: '国际机构官方',
    discovery: 'UNGM / DGMarket 会员公告', dgmarket_url: DGU('118199790'), dgmarket: true, funder: 'UNICEF',
    conditions: '以 UNICEF RFP 文件为准。', action: '在 UNGM 注册并下载 RFP 文件，2026-12-10 16:00 前提交建议书；可关注后续光伏安装采购。',
    risk: '屋面修缮规模小，但为光伏安装前置工程，后续可能有光伏采购。',
    verified_note: TODAY + ' 本机用 ego 浏览器在 UNGM 按标题检索并打开公告页（Notice/323186）核实截止时间与编号；DGMarket 同步收录。' },
];
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
for (const n of NEW) {
  const dup = m.items.find((x) => x.url === n.url || (n.ref_no && x.ref_no === n.ref_no) || (n.dgmarket_url && x.dgmarket_url === n.dgmarket_url) || (x.entity === n.entity && norm(x.title_original) === norm(n.title_original)));
  if (dup) continue;
  n.id = crypto.createHash('sha1').update(n.url).digest('hex').slice(0, 12);
  m.items.push(n); log.added++;
}

// 既有记录：DGMarket 同步收录的官方记录补 dgmarket_url
const LINK = { '117889915': '500ca3a334b7', '118015901': '68bfdde6ee76', '118100749': '3be2811bc9bd', '118100755': 'fb66380fcc10', '118100767': '8d4ae68b0293',
  '118075135': 'cea91b6ec0b1', '118075139': '651d9c5b2668', '118075140': 'e5d859bac77c', '118075141': 'b11e34015dc6', '118139554': '3c123d6603c2',
  '118139555': '8c958bbbbc69', '118139556': 'c690fb087e36', '118206829': '3f3c043f901d' };
for (const [nid, iid] of Object.entries(LINK)) {
  const it = m.items.find((x) => x.id === iid);
  if (it && !it.dgmarket_url) { it.dgmarket_url = DGU(nid); it.dgmarket = true; log.dg_linked++; }
}
// DGMarket 既有会员记录：本次仍在近一周列表的，刷新核验日期
const dgSeen = new Set(dg.rows.map((r) => r.dgmarket_url));
for (const it of m.items) if (it.origin_type === '会员来源' && dgSeen.has(it.url) && it.verified_at !== TODAY) { it.verified_at = TODAY; log.verified++; }

// GHANEPS / 世界银行列表复核
const ghByUrl = new Map(gh.rows.map((r) => [r.url, r]));
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
// UNGM 本次仍在列表的既有记录
for (const it of m.items) if (/ungm\.org\/Public\/Notice\/(323094|322941|322681)$/.test(it.url) && it.verified_at !== TODAY) { it.verified_at = TODAY; log.verified++; }

const ghTotal = gh.rows.length, ghNew = gh.rows.filter((r) => !m.items.some((x) => x.url === r.url)).length;
const S = {
  ghaneps: ['已核验无新增', `本机抓取 8 页共 ${ghTotal} 条当前招标并逐条筛查：未收录的 ${ghNew} 条均为 IT/网络设备、车辆、家具、餐饮、纪念品、矿产勘探等非工程采购，无新增；既有记录截止时间变化 0 条。`],
  'wb-opps': ['已核验无新增', '本机运行 wb-fetch：开放工程类候选 7 条，5 条已收录并复核；另 2 条 IDEAS 项目职业培训工具包为货物采购，未收录。'],
  'wb-proc': ['已核验无新增', '同世界银行 Business Opportunities：候选 7 条，5 条已收录并复核，2 条培训工具包货物采购未收录。'],
  ungm: ['已核验并更新', 'ego 浏览器按加纳/多哥/尼日利亚筛选 2026-11-14 以来发布的公告（加纳 15、多哥 14、尼日利亚 15 条，含多国公告）；新增 1 条：UNICEF 塔马利 NORRIP 大楼屋面修缮（光伏前置，Notice/323186）；FAO 多哥围栏、IOM 水处理厂、UNICEF 尼日利亚光伏 3 条既有记录仍在列表；其余为餐饮、会议、种子化肥、IT 与总部服务，未收录。'],
  afdb: ['已核验无新增', 'ego 浏览器读取列表第一页：与三国相关仅多国 Fintech Hub GPN（非工程）与乍得湖区域道路 PPM（不涉三国），与昨日相同，无新增。'],
  'afdb-gpn': ['已核验无新增', 'ego 浏览器读取列表第一页：仅见多哥技术转让与能力建设 AGPM（总体采购通告，非工程招标），无新增。'],
  rea: ['已核验无新增', '招标页显示“There are currently no tenders matching your search criteria”，无开放招标。'],
  intercom: ['已核验无新增', '列表最新发布仍为 2026-09-22（CEET Lomé B HTA 开关柜、CEET 智能计量），均为早期公告，无新增。'],
  dnccp: ['可访问，未逐条筛查', '首页可打开（HTTP 200），首页仅显示 2026 年采购计划（PPM）文件，未逐条打开招标公告页，既有记录保持原样。'],
  ppa: ['可访问，未逐条筛查', '站点可打开（HTTP 200），本次仅做可达性检查，未逐条筛查公告，既有记录保持原样。'],
  mrh: ['可访问，未逐条筛查', '首页可打开（HTTP 200），招标列表由前端脚本加载，curl 未读取到具体公告，既有记录保持原样。'],
  nocopo: ['可访问，未逐条筛查', '站点可打开（HTTP 200），本次仅做可达性检查，未逐条筛查公告，既有记录保持原样。'],
  bpp: ['可访问，未逐条筛查', '站点可打开（HTTP 200），本次仅做可达性检查，未逐条筛查公告，既有记录保持原样。'],
  nep: ['可访问，未逐条筛查', '页面可打开（HTTP 200，内容由脚本加载），未逐条筛查，既有记录保持原样。'],
  nddc: ['可访问，未逐条筛查', '门户可打开（HTTP 200，仅返回前端外壳），未逐条筛查，既有记录保持原样。'],
  osmapt: ['访问失败', 'curl 连接超时（25 秒无响应），未读取。'],
  ceet: ['可访问，未逐条筛查', '页面可打开（HTTP 200），但 curl 只取到标题外壳，未读取到公告列表，既有记录保持原样。'],
};
const dgCount = new Set(dg.rows.map((r) => r.noticeId)).size;
S.dgmarket = ['已核验并更新', `ego 浏览器会员会话已登录（CWE Renewable Energy），读取近一周列表：加纳 ${dg.status.GH.total}、多哥 ${dg.status.TG.total}、尼日利亚 ${dg.status.NG.total}（去重 ${dgCount} 条）。工程/能源类候选 65 条：13 条与既有 GHANEPS/世行记录相同（补 DGMarket 链接），新增 ${NEW.length - 1} 条会员来源记录（卡诺州 5 个教育局翻修、IsDB 阿比亚两条道路监理 EOI、NEWMAP-EIB 两州咨询 EOI、FUPRE 工程楼资格预审、贝努埃 TETFund 就业中心、Abia DBOT 停车场、NPERA 货物与工程、ActionAid 农民培训中心）及 UNICEF 塔马利屋面（已找到 UNGM 原始公告）；世行授标公告 20 条均不对应既有记录，其余为货物、个人咨询、采购计划等，未收录。`];
for (const s of m.sources) {
  const v = S[s.id]; if (!v) continue;
  s.status = v[0]; s.checked_at = NOW; s.note = v[1].replace('截止时间变化 0 条', '截止时间变化 ' + log.deadline_changed.length + ' 条');
}
m.meta.dgmarket_authorized = true;
const FIN = new Date().toISOString();
m.meta.last_run = { started_at: STARTED, finished_at: FIN, result: '成功', runner: '本机任务',
  note: '本机更新：GHANEPS、世界银行、DGMarket（会员会话已登录）、UNGM、AfDB 读取成功；新增 ' + log.added + ' 条，补 DGMarket 链接 ' + log.dg_linked + ' 条，刷新核验日期 ' + log.verified + ' 条；OSMAPT 连接超时。' };
m.meta.last_success_at = FIN;
fs.writeFileSync(P + 'master.json', JSON.stringify(m, null, 2), 'utf8');
console.log(JSON.stringify(log, null, 1));
