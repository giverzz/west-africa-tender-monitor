import fs from 'fs';
const f='data/master.json';const m=JSON.parse(fs.readFileSync(f,'utf8'));
const T={
d79bdec12c80:['塔诺北市政议会：Subriso 标准社区卫生服务站（CHPS）及1套单间职工宿舍建设与配套','Subriso','建设标准CHPS站点院落及1栋一居室职工宿舍并配置家具'],
aaeef5c8dd88:['阿达东区议会：Kasseh 1座诊所建设','Ada East 区 Kasseh','建设1座诊所设施'],
'15e32a105b92':['阿丹坦市政议会：Adjiringanor 3层诊所及配套设施（第三期末层完工）','Adjiringanor','1座3层诊所及配套设施第三期（最后一层）完工'],
'9d8f36d61842':['阿丹西北区议会：Asare Bediako 高中12间教室单层教学楼及配套建设','Asare Bediako SHS','建设1栋单层12间教室教学楼及配套设施'],
cd2a45e24d8a:['阿丹坦市政议会：Otanor 社区小学3层18间教室楼（第二期末层6间教室）分段完工','Otanor 社区小学','3层18间教室楼第二期（最后一层6间教室）分段完工'],
'11fd9a1c4b0e':['阿丹坦市政议会：New Legon（动物研究区）3层18间教室楼及配套设施建设','New Legon','建设1栋3层18间教室教学楼及配套设施'],
'2eb7845fe7bb':['阿丹坦市政议会：Sraha 2层警察局及围墙建设','Sraha','建设1座2层警察局及围墙']};
let n=0;
for(const i of m.items){const t=T[i.id];if(!t)continue;
i.title=t[0];i.location=t[1];i.scope=t[2]+'（据 GHANEPS 官方列表标题译）';
i.risk='资质、保证金与工程量需下载招标文件核实；金额未披露。';delete i.auto_ingested;i.verified_at='2026-11-25';i.verified_note='2026-11-25 GHANEPS 官方列表再次读取，本机复核翻译';n++;}
const now=new Date().toISOString();
const S=(k,st,note)=>{const s=m.sources.find(s=>s.name.includes(k));if(s){s.status=st;s.checked_at=now;s.note=note;}};
S('GHANEPS','已核验并更新','读取8页80条，无新增工程/能源类公告；翻译并复核云端自动收录的7条。');
S('世界银行 Business','已核验无新增','wb-fetch 读取：GH/TG/NG各80条，NG开放候选8条，均已收录或为货物采购（IDEAS 教培套件，排除）。');
S('世界银行 Procurement','已核验无新增','同上。');
for(const k of ['PPA','道路与公路部','DNCCP 公共采购','CEET','InterCom','BPP','REA','NEP','NDDC','AfDB','非洲开发银行 Procurement'])S(k,'可访问，未逐条筛查','2026-11-25 站点可打开(HTTP 200)，本次未逐条筛查，既有记录保持原样。');
S('OSMAPT','访问失败','2026-11-25 连接失败。');
S('UNGM','访问失败','2026-11-25 返回 HTTP 403。');
S('DGMarket','未授权','2026-11-25 ego 浏览器读取 DGMarket 时出现安全验证页面，按规则未绕过，保留既有 DGMarket 记录。');
m.meta.dgmarket_authorized=false;
m.meta.last_success_at=now;
m.meta.last_run={started_at:'2026-11-25T08:00:37Z',finished_at:now,result:'成功',runner:'本机定时任务',note:'GHANEPS 与世界银行读取成功；翻译复核7条云端收录；DGMarket 遇安全验证未读取；其余来源仅探测可访问性。'};
fs.writeFileSync(f,JSON.stringify(m,null,2));console.log('translated',n);
