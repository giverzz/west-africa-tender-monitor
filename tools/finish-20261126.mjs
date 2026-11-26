import fs from 'fs';
const f='data/master.json';const m=JSON.parse(fs.readFileSync(f,'utf8'));
const now=new Date().toISOString();
const fail={'osmapt':'站点 curl 无响应','ungm':'HTTP 403 拒绝自动访问'};
for(const s of m.sources){
 if(/GHANEPS/.test(s.name)){s.status='已核验并更新';s.checked_at=now;s.note='读取 8 页 80 条；云端自动收录 7 条已翻译复核，本次无新增。'}
 else if(/世界银行/.test(s.name)){s.status='已核验并更新';s.checked_at=now;s.note='API 读取 GH/TG/NG 各 80 条；开放候选 14 条，5 条已收录并复核，另 3 条尼日利亚为货物类（数码设备、职训工具包）不收录。'}
 else if(/OSMAPT/.test(s.name)){s.status='访问失败';s.checked_at=now;s.note='本次站点无响应，既有记录保持原样。'}
 else if(/UNGM/.test(s.name)){s.status='访问失败';s.checked_at=now;s.note='本次 HTTP 403，既有记录保持原样。'}
 else if(/DGMarket/.test(s.name)){s.status='未获授权';s.checked_at=now;s.note='ego 浏览器读取超时（page.goto 60 秒），未能确认登录状态；未尝试绕过，保留既有 DGMarket 记录。'}
 else if(/可访问/.test(s.status)){s.checked_at=now;s.note='本次站点可打开（HTTP 200），未逐条筛查。'}
}
m.meta.dgmarket_authorized=false;
m.meta.last_success_at=now;
m.meta.last_run={started_at:process.argv[2],finished_at:now,result:'成功',runner:'本机任务',note:'GHANEPS 与世界银行读取成功；复核翻译云端收录 12 条；DGMarket 读取超时未更新。'};
fs.writeFileSync(f,JSON.stringify(m,null,2));
