import fs from 'node:fs';
const P = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/master.json';
const m = JSON.parse(fs.readFileSync(P, 'utf8'));
const NOW = m.meta.last_run.finished_at;
const S = (id, name, country, kind, url, status, note) => ({ id, name, country, kind, url, status, checked_at: NOW, note });
m.sources = [
  S('ghaneps', 'GHANEPS 加纳电子采购系统', 'GH', '官方', 'https://www.ghaneps.gov.gh/epps/home.do', '已核验并更新',
    '本机抓取当前招标列表 8 页共 80 条并逐条筛查工程/能源类：新增 1 条（塞孔迪 West Ridge 初中两层 6 间教学楼），云端自动收录的 8 条已完成中文标题与工程范围复核，其余已收录记录截止时间无变化。'),
  S('ppa', '加纳公共采购局 PPA', 'GH', '官方', 'https://ppa.gov.gh/', '已核验无新增',
    '首页可打开；招标信息统一指向 GHANEPS，PPA 自身最新公告为 2026 年 5 月的培训与年度评估类通知，无新增工程公告。'),
  S('mrh', '加纳道路与公路部电子投标门户', 'GH', '官方', 'https://bids.mrh.gov.gh/', '已核验无新增',
    '站点可打开；/bids 列表仍只显示 2017 年的占位演示条目（“Web Designer Meeded”等），无真实道路工程公告。'),
  S('dnccp', '多哥 DNCCP 公共采购', 'TG', '官方', 'https://dnccp.gouv.tg/', '已核验无新增',
    '/avis-dappel-doffre/ 栏目共 40 条，最新一条为 2025 年 11 月 15 日（Société du Patrimoine Eau et Assainissement），2026 年无新增招标公告。'),
  S('osmapt', 'ARMP 采购监测工具 OSMAPT', 'TG', '官方', 'https://osmapt.armp.tg/', '访问失败',
    'curl 返回 code 000，ego 浏览器报 ERR_CERT_COMMON_NAME_INVALID（HTTPS 证书域名不匹配）。未绕过证书校验，既有记录保持原样。'),
  S('ceet', 'CEET 多哥电力公司招标公告', 'TG', '官方', 'https://www.ceet.tg/tg/?cat=15', '已核验无新增',
    '站点改版，?cat=15 跳转至公司首页；最新内容为 11 月 11—12 日的停电与故障通告（COMMUNIQUE N° 039/DRC/CEET/2026 等），无新招标公告。'),
  S('intercom', 'InterCom Togo 招标信息', 'TG', '辅助', 'https://intercom.tg/opportunites/appels-d-offres', '已核验无新增',
    '读取 24 条公告，全部标注「Clôturé」（已截止），最晚截止为 2026 年 11 月 9 日的 CEET 洛美 B 电厂中压开关柜更换（已在库），无开放中的多哥工程/能源公告。'),
  S('nocopo', 'BPP / NOCOPO 开放合同门户', 'NG', '官方', 'https://bppweb.webhostingng.org/nigeria-open-contracting-portal/', '可访问，未逐条筛查',
    '页面可打开，但仅为门户介绍，公告须进入「View System」子系统（需注册登录）才能逐条查看，本次未逐条筛查。'),
  S('bpp', '尼日利亚公共采购局 BPP', 'NG', '官方', 'https://www.bpp.gov.ng/', '已核验无新增',
    '首页与「News & Advertisements」可打开，内容以制度文件、标准招标文件与承包商注册服务为主，无新增工程招标公告。'),
  S('rea', '农村电气化局 REA 招标页', 'NG', '官方', 'https://www.rea.gov.ng/tenders', '已核验无新增',
    '「Current Opportunities」显示「0 opportunities found」，当前无开放招标。'),
  S('nep', 'NEP 资源中心', 'NG', '官方', 'https://nep.rea.gov.ng/resource-hub.html', '已核验无新增',
    '采购公告栏为档案式 PDF 列表（含 2024 年 12 月的 ISD 补遗），条目不标注发布日期与截止日期；PDF 链接返回查看器页面，无法确认哪些仍在开放，故未收录，避免把档案公告当成开放招标。'),
  S('nddc', 'NDDC 电子采购门户', 'NG', '官方', 'https://eprocurement.nddc.gov.ng/', '已核验无新增',
    '门户列出 5 条 ACTIVE 公告，其中 4 条工程类（TND-2026-000011/13/14/15：办公设施、供水设施、行政办公楼、农村道路与排水）均已收录，截止时间无变化，已更新核验日期。'),
  S('wb-opps', '世界银行 Business Opportunities', 'MULTI', '国际机构', 'https://projects.worldbank.org/en/projects-operations/opportunities', '已核验无新增',
    '与 Procurement Notices 同源，按加纳、多哥、尼日利亚各读取 80 条，无另行发现的工程/能源公告。'),
  S('wb-proc', '世界银行 Procurement Notices', 'MULTI', '国际机构', 'https://projects.worldbank.org/en/projects-operations/procurement', '已核验无新增',
    '按国别各读取 80 条，筛出 9 条候选：7 条工程/能源类（Abbosey Okai 桥、SPIN 灌溉区初选、卡诺与塔拉巴 L-PRES 工程、两项 SPIN 咨询）均已收录并更新核验日期；2 条 IDEAS-TVET 职业培训工具包属货物采购，不在关注范围。'),
  S('afdb', '非洲开发银行 Procurement Notices', 'MULTI', '国际机构', 'https://www.afdb.org/en/documents/category/procurement-notices', '已核验无新增',
    '列表最新条目仍为 2025 年 1 月（佛得角技术援助），无加纳/多哥/尼日利亚的新工程或能源公告。'),
  S('afdb-gpn', '非洲开发银行 General Procurement Notices', 'MULTI', '国际机构', 'https://www.afdb.org/en/documents/category/general-procurement-notices', '已核验无新增',
    '最新为 2026 年 11 月 10 日的塞内加尔、厄立特里亚、冈比亚公告与 11 月 6 日多哥 AFLDC-2（斯德哥尔摩与水俣公约履约）项目，均非加纳/多哥/尼日利亚的工程或能源采购。'),
  S('ungm', '联合国全球采购系统 UNGM', 'MULTI', '国际机构', 'https://www.ungm.org/Public/Notice', '已核验无新增',
    '按加纳、多哥、尼日利亚分别筛选，各 15 条临近截止公告全部为会议场地、住宿、文具、家具、机票、个人顾问等非工程采购，无新增工程/能源公告。'),
  S('dgmarket', 'DGMarket 会员公告', 'MULTI', '会员', 'https://www.dgmarket.com/tenders/list.do?sub=tenders-in-Africa&locationISO=_s&updatedId=1w', '未获授权',
    '本次用 ego 浏览器读取时页面停在站点安全验证页，脚本返回 ok=false、logged_in=false。按规则未尝试通过或绕过验证，也未输入任何账号信息；既有 19 条 DGMarket 记录及其核验日期保持原样。'),
];
m.meta.dgmarket_authorized = false;
fs.writeFileSync(P, JSON.stringify(m, null, 1), 'utf8');
console.log('sources:', m.sources.length);
