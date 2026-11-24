import fs from 'fs';
const W='C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/';
const m=JSON.parse(fs.readFileSync(W+'data/master.json','utf8'));
const g=JSON.parse(fs.readFileSync(W+'data/ghaneps.json','utf8'));
const started='2026-11-24T08:00:45Z', now=new Date().toISOString(), today='2026-11-24';
const tr={
'5c3a82b65d5b':{title:'Ekumfi 区 Otabanadze 社区卫生服务站（CHPS）院落及3套住房建设、围墙与院落硬化、带高位水箱机械化钻井',sectors:['建筑基础设施','水利灌溉'],location:'加纳中部大区 Ekumfi 区 Otabanadze',scope:'建设1处 CHPS 院落及3套住房，围墙与院落混凝土硬化，钻凿并配套1口带高位水箱的机械化水井。'},
'f4b32ec2bcf8':{title:'Pokuase 卫理公会学校单层6间教室建设',sectors:['建筑基础设施'],location:'大阿克拉大区 Ga North 市 Pokuase',scope:'建设1栋单层6间教室。'}};
for(const i of m.items){const t=tr[i.id];if(!t)continue;Object.assign(i,t);delete i.auto_ingested;
 i.action='登录 GHANEPS 下载招标文件，核实资格、保证金与工程量，按截止时间准备国内竞争性招标文件。';
 i.risk='金额未披露；小型国内竞争性招标，通常要求加纳本地注册承包商资质。';
 i.verified_at=today;i.verified_note='2026-11-24 对照 GHANEPS 官方列表复核，标题与范围已翻译。';}
const add=(r,o)=>{if(m.items.some(i=>i.url===r.url))return;m.items.push({location:'',ref_no:'',amount:'未披露',dgmarket_url:'',dgmarket:false,funder:'',conditions:'',terminal_at:null,added_at:now,country:'GH',sector_raw:'GHANEPS 列表',stage:'正式招标',stage_note:r.procedure,origin:'GHANEPS',origin_type:'政府官方',discovery:'GHANEPS 当前招标列表（本机筛查）',verified_at:today,verified_note:'2026-11-24 GHANEPS 官方列表读取',url:r.url,title_original:r.title_original,entity:r.entity,published_at:r.published_at,deadline:r.deadline,id:r.resourceId,...o});};
const d=g.rows.find(r=>r.resourceId==='4073209');
add(d,{title:'Adansi North 区 Dadwen 卫生中心一层男女及儿童病房等配套设施建设（第一期）',sectors:['建筑基础设施'],location:'阿散蒂大区 Adansi North 区 Dadwen',scope:'建设1栋单层男、女及儿童病房及相关配套设施（第一期）。',action:'登录 GHANEPS 下载招标文件，核实资格、保证金与工程量。',risk:'金额未披露；国内竞争性招标，通常要求加纳本地承包商资质。'});
const S=m.sources;const set=(k,st,n)=>{const s=S.find(x=>x.name.includes(k));if(s){s.status=st;s.checked_at=now;s.note=n;}else console.log('no src',k)};
set('GHANEPS 加纳','已核验并更新','本机读取 8 页 80 行；新增 Dadwen 卫生中心病房建设 1 条，复核并翻译云端自动收录 2 条；其余为非工程类（IT、车辆、家具等）未收录。');
set('Business Opportunities','已核验无新增','wb-fetch：加纳/多哥/尼日利亚各扫描 80 条，开放候选 8 条，6 条已收录，2 条 IDEAS 项目职业培训工具包为货物采购未收录。');
set('Procurement Notices','已核验无新增','同 wb-fetch 结果，无新增工程类公告。');
for(const [k,n] of [['PPA','HTTP 200 可访问，未逐条筛查'],['道路与公路部','HTTP 200 可访问，未逐条筛查'],['DNCCP 公共采购','HTTP 200 可访问，未逐条筛查'],['CEET','HTTP 200 可访问，未逐条筛查（本次站点可打开）'],['REA','HTTP 200 可访问，未逐条筛查'],['BPP','HTTP 200 可访问，未逐条筛查'],['UNGM','HTTP 200 可访问，未逐条筛查']])set(k,'可访问，未逐条筛查',n);
set('非洲开发银行 Procurement','访问失败','HTTP 403 拒绝自动访问，不绕过；既有记录保持原样。');
set('DGMarket','未授权','ego 浏览器访问 DGMarket 时出现安全验证页面，不绕过、不输入账号；既有 DGMarket 记录及核验日期保持原样。');
m.meta.dgmarket_authorized=false;
m.meta.last_run={started_at:started,finished_at:now,result:'成功',runner:'本机任务',note:'GHANEPS 与世界银行读取成功；新增 1 条，复核翻译云端收录 2 条；DGMarket 遇安全验证未读取；AfDB 403。'};
m.meta.last_success_at=now;
fs.writeFileSync(W+'data/master.json',JSON.stringify(m,null,2));console.log(m.items.length);
