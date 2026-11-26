import fs from 'fs';
const f='data/master.json';const m=JSON.parse(fs.readFileSync(f,'utf8'));
const T=[
['Construction of Education Office complex','法恩提亚夸南区教育办公综合楼建设','加纳 Fanteakwa South 区教育办公综合楼施工（NCT 国内竞争性招标）。'],
['45. Construction of Medical Block','Lartebiokoshie 综合诊所医疗楼建设','Lartebiokoshie 综合诊所医疗楼施工。'],
['68. Construction of Three Storey','Shukura 三层市场综合体建设（12 摊位、6 商铺、4 办公室、6 厕所）','Shukura 三层市场综合体施工，含摊位、商铺、办公室与厕所。'],
['48. Construction of 1No. 6 Unit','A O 基础学校 6 间教室楼建设','A O 基础学校 1 栋 6 间教室楼施工。'],
['Continuation and Completion of Ground Floor','Mampong-Ashanti Kofiase 综合诊所一层续建与竣工（一期）','Kofiase 综合诊所一层续建及竣工（一期）。'],
['Construction of 2-Unit KG','Woraso 2 间幼儿园教室楼及配套设施与机械钻井建设','Woraso 2 间幼儿园教室楼、配套设施及 1 口机械钻井施工。'],
['Construction of 1 NO. 6 Unit','Bunuso 小学 6 间教室楼及配套设施与机械钻井建设','Bunuso 小学 1 栋 6 间教室楼、配套设施及 1 口机械钻井施工。'],
['Consulting Services for the Design Review, Construction Supervision and Monitoring of Performance Based Contracts for Western North','西北部与阿汉福地区绩效合同设计审查、施工监理与监测咨询（4B 标段）','世行加纳市场通达与连通项目（GMACP）支线公路绩效合同的设计审查、施工监理与监测咨询，意向征集。'],
['Consulting Services for the Design Review, Construction Supervision and Monitoring of Performance Based Contracts for Western &','西部与中部地区绩效合同设计审查、施工监理与监测咨询（4A 标段）','世行 GMACP 项目绩效合同的设计审查、施工监理与监测咨询，意向征集。'],
['Consulting Services for the Design Review, Construction Supervision and Monitoring of Performance Based Contracts for Ashanti','阿散蒂、博诺与东博诺地区绩效合同设计审查、施工监理与监测咨询（3B 标段）','世行 GMACP 项目绩效合同的设计审查、施工监理与监测咨询，意向征集。'],
['Consulting Services for the Design Review, Construction Supervision and Monitoring of Performance Based Contracts for Eastern','东部地区绩效合同设计审查、施工监理与监测咨询（3A 标段）','世行 GMACP 项目绩效合同的设计审查、施工监理与监测咨询，意向征集。'],
['Supply and Installation of 10KVA Solar','阿达马瓦州 50 所中学 10kVA 太阳能供电系统供货与安装（二期）','阿达马瓦州 50 所中学 10kVA 光伏供电系统供货与安装（二期）。']];
let n=0,loc;
for(const i of m.items){ if(!i.auto_ingested)continue;
 const t=T.find(x=>(i.title_original||'').startsWith(x[0])); if(!t){console.log('NO',i.title_original);continue}
 i.title=t[1];i.scope=t[2];
 if(/Solar/.test(t[0])){i.sectors=['清洁能源/光伏','电力电气'];i.location='尼日利亚阿达马瓦州'}
 else if(/Consulting/.test(t[0])){i.location='加纳'}
 else i.location='加纳';
 i.action='登录官方平台下载招标文件，核实资格、保证金、工程量与截止时间后决定是否投标。';
 i.risk=(/Consulting/.test(t[0])?'意向征集阶段，需提交公司资质与经验；':'')+'金额未披露；以采购方正式文件为准。'+(/教室|诊所|市场|办公/.test(t[1])?'属一般建筑工程，与公司清洁能源主业关联度较低。':'');
 i.verified_note='2026-11-26 对照官方列表复核标题、截止时间与采购方';
 i.verified_at='2026-11-26'; delete i.auto_ingested;n++}
fs.writeFileSync(f,JSON.stringify(m,null,2));console.log('done',n);
