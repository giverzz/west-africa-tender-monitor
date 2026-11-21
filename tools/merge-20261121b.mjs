import fs from 'fs';
const W='C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/';
const m=JSON.parse(fs.readFileSync(W+'data/master.json','utf8'));
const g=JSON.parse(fs.readFileSync(W+'data/ghaneps.json','utf8'));
const w=JSON.parse(fs.readFileSync(W+'data/wb-candidates.json','utf8'));
const d=JSON.parse(fs.readFileSync(W+'data/dgmarket.json','utf8'));
const started=process.argv[2]; const now=new Date().toISOString(); const today=now.slice(0,10);
const gUrls=new Set(g.rows.map(r=>r.url)); const wUrls=new Set((w.candidates||w.items||w).map(c=>c.url));
const dIds=new Set(d.rows.map(r=>String(r.noticeId)));
let ref=0;
for(const i of m.items){
  const hit=gUrls.has(i.url)||wUrls.has(i.url)||(i.dgmarket_url&&[...dIds].some(id=>i.dgmarket_url.includes('noticeId='+id)));
  if(hit&&i.verified_at!==today){i.verified_at=today;ref++;}
}
const S=m.sources;
S[0].status='已核验无新增';S[0].checked_at=now;S[0].note='当日第二次本机运行：抓取 8 页共 80 条当前招标，58 条已收录，截止时间变化 0 条；其余 22 条为 IT/网络设备、车辆、家具、餐饮、纪念品、矿产勘探等非工程采购，无新增。';
for(const k of [21,22]){S[k].status='已核验无新增';S[k].checked_at=now;S[k].note='当日第二次本机运行 wb-fetch：开放工程类候选 7 条，5 条已收录并复核；另 2 条 IDEAS 项目职业培训工具包（OP00480649/OP00480650）为货物采购，未收录。';}
S[6].status='可访问，未逐条筛查';S[6].checked_at=now;S[6].note='osmapt.armp.tg 仍连接超时；新域名 osmapt.arcop.tg 可打开（HTTP 200），首页仅为登录界面，未读到公告列表，既有记录保持原样。';
S[28].status='已核验无新增';S[28].checked_at=now;S[28].note=`ego 浏览器会员会话已登录（CWE Renewable Energy），当日第二次读取近一周列表：加纳 ${d.status.GH.total}、多哥 ${d.status.TG.total}、尼日利亚 ${d.status.NG.total}（去重 ${new Set(d.rows.map(r=>r.noticeId)).size} 条），与当日 07:39 运行相比无新公告。`;
m.meta.dgmarket_authorized=true;
m.meta.last_run={started_at:started,finished_at:now,result:'成功',runner:'本机任务',note:`当日第二次本机运行：GHANEPS、世界银行、DGMarket（会员会话已登录）重新读取成功，与 07:39 运行相比无新增、无截止时间变化；刷新核验日期 ${ref} 条。其余来源沿用当日 07:39 运行的筛查结果；OSMAPT 旧域名仍超时，新域名仅登录页。`};
m.meta.last_success_at=now;
fs.writeFileSync(W+'data/master.json',JSON.stringify(m,null,2));
console.log('refreshed',ref,'items',m.items.length);
