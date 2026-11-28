import fs from 'fs';
const f='data/master.json';const m=JSON.parse(fs.readFileSync(f,'utf8'));
const g=JSON.parse(fs.readFileSync('data/ghaneps.json','utf8'));
const w=JSON.parse(fs.readFileSync('data/wb-candidates.json','utf8'));
const now=new Date().toISOString();const today=now.slice(0,10);
// 1.5 自动收录：删除家具类；翻译太阳能养禽场
const before=m.items.length;
m.items=m.items.filter(i=>!(i.auto_ingested&&/Furnishing/i.test(i.title_original||'')));
const removed=before-m.items.length;
const p=m.items.find(i=>i.id==='ba65ca657fc1');
if(p){Object.assign(p,{title:'尼日尔州太阳能供电家禽养殖园区建设（L-PRES 项目）',entity:'Niger State Project Implementation Unit（L-PRES 项目）',location:'尼日尔州（Niger State）',scope:'世界银行 IDA 贷款（Credit No. IDA 70570-NG）资助的牲畜生产力与韧性支持项目（L-PRES）下，建设一座太阳能供电的家禽养殖园区，含土建与太阳能供电系统。',sectors:['清洁能源/光伏','电力电气','建筑基础设施'],sector_raw:'世界银行公告：Civil Works（RFB）',action:'向尼日尔州项目实施单位索取招标文件，核实资格、投标保证金与工程量；截止仅剩数日，需尽快决定。',risk:'截止时间为 2026-12-03 12:00（WAT，原文 on or before 12:00noon on Thursday 3rd December, 2026）；距截止不足一周；金额未披露。',verified_at:today,verified_note:today+' 世界银行采购公告复核，中文标题已翻译'});delete p.auto_ingested;}
// 新增 GHANEPS 工程类
const add=(o)=>{if(!m.items.some(i=>i.url===o.url))m.items.push(o);};
const row=id=>g.rows.find(r=>String(r.resourceId)===id);
const base={country:'GH',sector_raw:'GHANEPS 官方列表',ref_no:'',amount:'未披露',origin:'GHANEPS',origin_type:'政府官方',discovery:'GHANEPS 当前招标列表',dgmarket_url:'',dgmarket:false,funder:'',conditions:'',terminal_at:null,added_at:now,verified_at:today,verified_note:today+' GHANEPS 官方列表读取'};
let r=row('4127789');
add({...base,id:'4127789gh28',title:'Bankuman 消防站器械库及办公用房建设',title_original:r.title_original,sectors:['建筑基础设施'],entity:r.entity,location:'Bankuman（Tema，大阿克拉）',scope:'为加纳消防局在 Bankuman 建设器械库（Appliance Bay）及办公用房。',stage:'正式招标',stage_note:r.procedure+'；状态 '+r.status,published_at:r.published_at,deadline:r.deadline,url:r.url,action:'登录 GHANEPS 下载招标文件，核对图纸、工程量、资质与保证金要求。',risk:'国内竞争性招标；金额未披露；招标文件细节未逐项核实。'});
r=row('4117955');
add({...base,id:'4117955gh28',title:'Tema 市议会建筑设计支持服务采购',title_original:r.title_original,sectors:['工程咨询','建筑基础设施'],entity:r.entity,location:'Tema（大阿克拉）',scope:'为 Tema 市议会提供建筑设计相关支持服务（咨询类）。',stage:'意向征集',stage_note:r.procedure+'；状态 '+r.status,published_at:r.published_at,deadline:r.deadline,url:r.url,action:'登录 GHANEPS 查看意向征集文件，核对服务范围与对本地注册咨询公司的要求。',risk:'咨询服务，服务范围与是否限国内公司未核实；金额未披露。'});
// 刷新核验日期
const live=new Set([...g.rows.map(r=>r.url),...(w.candidates||w.items||w).map(r=>r.url)]);let ref=0;
for(const i of m.items) if(live.has(i.url)&&i.verified_at!==today){i.verified_at=today;ref++;}
const S=(id,status,note)=>{const s=m.sources.find(x=>x.id===id);if(s){s.status=status;s.checked_at=now;s.note=note;}};
S('ghaneps','已核验并更新',`本机读取当前招标列表 8 页（80 条）：新增 2 条（Bankuman 消防站器械库及办公用房、Tema 建筑设计支持服务），删除 1 条非工程自动收录（Nungua 诊所家具），刷新 ${ref} 条在列记录核验日期；车辆、IT、设备、餐饮等非工程公告不收录。`);
S('wb-proc','已核验并更新','读取加纳、多哥、尼日利亚采购公告：开放候选 12 条（GH 4、NG 8、TG 0）；工程/能源类均已在库，复核并翻译云端收录的尼日尔州太阳能家禽园区（RFB，12-03 截止）；新增候选 3 条为货物类（数字设备、职业培训工具包）未收录。');
S('wb-opps','已核验无新增','由 wb-fetch.mjs 同批读取，无新增工程类机会。');
for(const id of ['ppa','dnccp','nocopo','bpp','nep','ungm']) S(id,'可访问，未逐条筛查','本次站点可打开（HTTP 200），未逐条筛查。');
S('mrh','已核验无新增','本次站点可打开（HTTP 200），首页未列出可解析的新公告。');
S('rea','已核验无新增','本次站点可打开，招标页显示“There are currently no tenders matching your search criteria”。');
S('nddc','可访问，未逐条筛查','本次站点返回极简页面（HTTP 200，约 0.8 KB，脚本渲染），未逐条筛查。');
S('osmapt','访问失败','本次请求 25 秒内无响应，既有记录保持原样。');
S('ceet','访问失败','本次请求 25 秒内无响应，既有记录保持原样。');
S('afdb','访问失败','本次请求返回 HTTP 403（拒绝自动访问），既有记录保持原样。');
S('afdb-gpn','访问失败','本次请求返回 HTTP 403（拒绝自动访问），既有记录保持原样。');
S('intercom','已核验无新增','本次读取列表：多哥 AT2ER 光伏电站（Agoè-Nyivé 资格预审、Awandjelo 监理/评估）、PER 172 评估、PRIMA-TOGO 乡村道路监理/设计等均为 2026 年 6–8 月发布、无明确截止日期的旧公告，AT2ER 来源此前已核实未确认开放，本次未新增。');
m.meta.dgmarket_authorized=false;
S('dgmarket','未获授权','ego 浏览器打开 DGMarket 时显示安全验证页面，未读取（不绕过验证、不输入账号密码）；既有 DGMarket 记录及其核验日期保持不变。');
m.meta.last_run={started_at:'2026-11-28T08:01:05Z',finished_at:now,result:'成功',runner:'本机任务',note:'GHANEPS 与世界银行读取成功；新增 2、删除 1（非工程自动收录）、翻译复核 1；DGMarket 遇安全验证未读取；AfDB 403、OSMAPT/CEET 无响应；其余站点仅确认可访问。'};
m.meta.last_success_at=now;
fs.writeFileSync(f,JSON.stringify(m,null,1));
console.log('ok items',m.items.length,'removed',removed,'refreshed',ref);
