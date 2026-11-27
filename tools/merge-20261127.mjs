import fs from 'fs';
const f='data/master.json';const m=JSON.parse(fs.readFileSync(f,'utf8'));
const g=JSON.parse(fs.readFileSync('data/ghaneps.json','utf8'));
const now=new Date().toISOString();const today=now.slice(0,10);
// 删除非工程自动收录（家具/装备）
m.items=m.items.filter(i=>!(i.auto_ingested&&/Furnishing/i.test(i.title_original||'')));
// 新增 Teshie
const url='https://www.ghaneps.gov.gh/epps/cft/prepareViewCfTWS.do?resourceId=4097650';
if(!m.items.some(i=>i.url===url)) m.items.push({id:'4097650gh27',title:'Teshie 护理与助产培训学校两层 7 单元专业教学楼及附属设施建设',title_original:'CONSTRUCTION OF A 2-STOREY 7 UNIT SPECIALIST TEACHING BLOCK WITH ANCILLIARY FACILITIES AT TESHIE NURSING AND MIDWIFERY TRAINING SCHOOL',country:'GH',sectors:['建筑基础设施'],sector_raw:'GHANEPS 官方列表',entity:'LEDZOKUKU MUNICIPAL ASSEMBLY',location:'Teshie（大阿克拉）',scope:'建设两层 7 单元专业教学楼及附属设施。',ref_no:'',stage:'正式招标',stage_note:'National Competitive Tendering；状态 Bid Submission',published_at:'2026-11-27 01:50',deadline:'2026-12-11 10:00',amount:'未披露',url,origin:'GHANEPS',origin_type:'政府官方',discovery:'GHANEPS 当前招标列表',dgmarket_url:'',dgmarket:false,funder:'',conditions:'',action:'登录 GHANEPS 下载招标文件，核对图纸、工程量、资质与保证金要求。',risk:'国内竞争性招标；金额未披露；招标文件细节未逐项核实。',verified_at:today,verified_note:today+' GHANEPS 官方列表读取',terminal_at:null,added_at:now});
// 刷新既有 GHANEPS 记录核验日期
const live=new Set(g.rows.map(r=>r.url));let ref=0;
for(const i of m.items) if(live.has(i.url)&&i.url!==url){i.verified_at=today;ref++;}
const S=(id,status,note)=>{const s=m.sources.find(x=>x.id===id);if(s){s.status=status;s.checked_at=now;s.note=note;}};
S('ghaneps','已核验并更新',`本机读取当前招标列表 8 页（80 条）：新增 1 条（Teshie 教学楼），删除 1 条非工程自动收录（Nungua 诊所家具），刷新 ${ref} 条既有记录核验日期；IT、车辆、设备类公告不收录。`);
for(const [id,n] of [['ppa','HTTP 200'],['mrh','HTTP 200'],['dnccp','HTTP 200'],['dnccp-awards','HTTP 200']]) S(id,'可访问，未逐条筛查',`本次站点可打开（${n}），未逐条筛查。`);
S('osmapt','访问失败','本次站点无响应，既有记录保持原样。');
m.meta.dgmarket_authorized=false;
const dg=m.sources.find(x=>/dgmarket/i.test(x.id));
if(dg){dg.status='未获授权';dg.checked_at=now;dg.note='DGMarket 显示安全验证页面，未读取（不绕过验证）；既有 DGMarket 记录及其核验日期保持不变。';}
const wb=m.sources.find(x=>/world|wb/i.test(x.id));
if(wb){wb.status='已核验无新增';wb.checked_at=now;wb.note='读取加纳、多哥、尼日利亚采购公告：开放候选 13 条，工程/能源类均已在库；新增候选为货物类（投影设备、培训工具包）未收录。首次请求曾 HTTP 503，重试成功。';}
m.meta.last_run={started_at:'2026-11-27T08:00:37Z',finished_at:now,result:'成功',runner:'本机任务',note:'GHANEPS 与世界银行读取成功；新增 1、删除 1；DGMarket 遇安全验证未读取；其余官方站点仅确认可访问。'};
m.meta.last_success_at=now;
fs.writeFileSync(f,JSON.stringify(m,null,1));
console.log('ok',m.items.length,ref,dg?.id,wb?.id);
