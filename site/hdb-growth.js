(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const n = value => new Intl.NumberFormat('en-SG',{maximumFractionDigits:0}).format(value);
  const pct = value => (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
  const e = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link = (url,label='官方来源 ↗') => `<a href="${e(url)}" target="_blank" rel="noopener">${label}</a>`;
  const colors = ['#285e49','#ae602e','#577c9d','#8b6798'];
  const sources = {
    north:'https://www.hdb.gov.sg/cs/infoweb/-/media/doc/PressReleases/corporate-pr-14022017-annex-a.ashx',
    emerald:'https://assets.hdb.gov.sg/residential/buying-a-flat/finding-a-flat/sales-brochure/25JULBTO_pdf_selection/clementi_emerald.pdf',
    green:'https://www.hdb.gov.sg/-/media/hdb-pulse/reports/green-finance-framework-and-reports/Green-Finance-Report-2024.pdf',
    vista:'https://assets.hdb.gov.sg/residential/buying-a-flat/finding-a-flat/sales-brochure/23DECBTO_pdf_selection/ulu_pandan_vista.pdf',
    ascent:'https://www.hdb.gov.sg/-/media/hdb-pulse/news/2022/hdb-launches-6535-flats-in-may-2022-bto-and-sbf-exercises/27052022-AnnexA.pdf',
    courtyard:'https://assets.hdb.gov.sg/residential/buying-a-flat/finding-a-flat/sales-brochure/24FEBBTO_pdf_selection/tanglin_halt_courtyard.pdf',
    arc:'https://www.hdb.gov.sg/-/media/doc/SCEG/11082021-Annexes/Annex-A1.pdf',
    moe:'https://www.moe.gov.sg/primary/p1-registration/past-vacancies-and-balloting-data',
    cna:'https://www.channelnewsasia.com/singapore/primary-1-registration-p1-phase-2c-ballots-schools-moe-6300706'
  };
  const projects = [
    ['Clementi NorthArc','1,179','2017-02 推出','位于 Clementi Ave 6 / Commonwealth Ave West。观察 Clementi 小学西段迁入家庭；项目总体位置不能代替逐栋官方距离。',sources.north],
    ['Clementi Peaks','1,104 总套数','2017 项目说明','其中 424 套公开 BTO，680 套用于 SERS 安置。安置家庭包含既有居民，不可把 1,104 套全部视为新增家庭。',sources.north],
    ['Clementi Emerald','753','2025-07 推出','Clementi 小学周边重点项目。含 222 套两房 Flexi、111 套三房、420 套四房，不能假定每户都有适龄儿童。',sources.emerald],
    ['Ulu Pandan Banks / Glades / Vista','1,330 + 732 + 890 = 2,952','2022–2023 推出','Dover 一带集中供给，适合优先跟踪 Henry Park 与 Fairfield 的地址分布、交付和年龄结构。三项目应逐栋核验，不统一认定为任何学校 1km 内。',sources.green,sources.vista],
    ['Ghim Moh Ascent / Natura','867 + 991 = 1,858','2022 推出','Buona Vista / Ghim Moh 的局部家庭增量线索。与 Ulu Pandan 合计 4,810 套为推出口径，不是已入住数或两校共同招生池。',sources.ascent,sources.green],
    ['Tanglin Halt Cascadia / Courtyard','973 + 251 = 1,224','2023–2024 推出','旧区更新中的新增供给，需结合旧住房退出和居民迁移。Queenstown、Fairfield 及其他附近学校的选择分流尚无量化证据。',sources.green,sources.courtyard],
    ['Queen’s Arc / Queensway Canopy','610 / 996','2021 / 2022 推出','Arc 的 610 为销售单位，另有租赁楼；Canopy 的 996 含 Community Care Apartments。靠近 Queenstown 一端，但不能把全部单位当作年轻育儿家庭。',sources.arc,sources.green]
  ];
  const commentary = {
    clementi:{label:'CLEMENTI · 西段',headline:'2C 仍有余量，补充阶段开始承压',text:'2026 年 2C 申请从 86 增至 100（+14），学额从 231 降至 165（−66），因此竞争比明显上升。2C(S) 达 75 / 67；它属于不同阶段，不能与 2C 混算，也不足以推断哪个公民／距离组需要抽签。',housing:'NorthArc、Peaks 与 Emerald 是重点跟踪对象；Peaks 的 SERS 安置和 Emerald 的两房 Flexi 会削弱“套数＝新育儿家庭”的假设。Clementi 的观察重点是实际入住家庭及学额是否继续变化。',ballot:'2025 MOE：2C 及 2C(S) 未抽签。'},
    'fairfield-methodist':{label:'FAIRFIELD · Dover / Buona Vista',headline:'2C 持续超额，局部迁入值得密切跟踪',text:'2023–2026 年 2C 竞争比约 1.65–1.73。2026 年申请 80、学额 48，较 2025 的 70 / 42 按相同比例增加，竞争比均约 1.67。申请上升不等于竞争比必然上升。',housing:'优先观察 Dover、Ghim Moh 与 Ulu Pandan 新家庭，但这些项目是否进入 1km 或 1–2km 必须逐栋确认。家庭也会选择附近其他学校，宗教／志愿者等较早阶段资格会改变 2C 人群。',ballot:'2025 MOE：2C 在 SC 1km 内组抽签，47 人竞争 42 个抽签学额。'},
    'henry-park':{label:'HENRY PARK · Holland Grove',headline:'学额较小，增量申请对竞争比更敏感',text:'2026 年申请从 93 降至 76，学额也从 63 降至 51，竞争比由 1.48 变为 1.49。仅看报名人数下降会误判竞争缓解。',housing:'Ulu Pandan / Ghim Moh 是值得调查的新增需求来源；具体影响取决于楼栋距离、儿童年龄和实际志愿。Henry Park 不在已公布的 12 所双轨学校名单中，不能套用“2km 内同组”的新规则。',ballot:'2025 MOE：2C 在 SC 1km 内组抽签，76 人竞争 63 个抽签学额。'},
    queenstown:{label:'QUEENSTOWN · 东段',headline:'2026 年学额增加，历史竞争反而缓解',text:'2026 年 2C 申请从 115 降至 108，学额从 105 增至 147，竞争比从 1.10 降至 0.73。2C(S) 为 25 / 39。这个例子说明学校供给变化可以抵消区域家庭增长。',housing:'重点观察 Tanglin Halt、Queensway 等片区的更新和迁入；Queenstown 市镇涵盖更大区域，Ulu Pandan 在同一市镇不代表其儿童都会申请 Queenstown Primary。',ballot:'2025 MOE：2C 抽签落在 PR 1km 内组，12 人竞争 8 个抽签学额；不是 SC 1km 内组。'}
  };
  function svg(title,body,width=960,height=300){return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${e(title)}"><title>${e(title)}</title>${body}</svg>`;}
  function lineChart(series,years,{min=0,max,threshold=null,title}={}){
    const W=960,H=300,L=62,R=22,T=24,B=44;
    const x=i=>L+i*(W-L-R)/(years.length-1), y=v=>H-B-(v-min)/(max-min)*(H-T-B);
    let out='';
    for(let i=0;i<=4;i++){const v=min+(max-min)*i/4;out+=`<line class="grid" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text text-anchor="end" x="${L-10}" y="${y(v)+4}">${max<5?v.toFixed(1):n(v)}</text>`;}
    years.forEach((year,i)=>{if(years.length<8||i%5===0||i===years.length-1)out+=`<text text-anchor="middle" x="${x(i)}" y="${H-18}">${year}</text>`;});
    if(threshold!==null)out+=`<line x1="${L}" x2="${W-R}" y1="${y(threshold)}" y2="${y(threshold)}" stroke="#707a70" stroke-dasharray="5 4"/>`;
    for(const s of series){out+=`<polyline points="${s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.7"/>`;s.values.forEach((v,i)=>out+=`<circle cx="${x(i)}" cy="${y(v)}" r="${years.length<8?5:3}" fill="${s.color}"><title>${e(s.name)} · ${years[i]}：${max<5?v.toFixed(2):v.toFixed(1)}</title></circle>`);}
    return svg(title,out);
  }
  function constructionChart(rows){
    const W=960,H=310,L=62,T=25,B=45,max=40000,step=(W-L-20)/rows.length;
    let out='';
    for(let value=0;value<=max;value+=10000){const y=H-B-value/max*(H-T-B);out+=`<line class="grid" x1="${L}" x2="940" y1="${y}" y2="${y}"/><text text-anchor="end" x="${L-10}" y="${y+4}">${n(value)}</text>`;}
    rows.forEach((r,i)=>{const h=r.constructed/max*(H-T-B),x=L+i*step+5;out+=`<rect x="${x}" y="${H-B-h}" width="${step-10}" height="${h}" rx="3" fill="${r.year>=2021?'#285e49':'#b4c7a5'}"><title>${r.year}：${n(r.constructed)} 套</title></rect><text x="${x+(step-10)/2}" y="${H-20}" text-anchor="middle">${String(r.year).slice(2)}</text>`;});
    return svg('2006 至 2025 年每年建成 HDB 套数；完整数值见页面末尾年度表',out,W,H);
  }
  function render(data){
    if(data.schema_version!==1||data.annual.length!==21||data.schools.length!==4)throw new Error('Invalid data');
    const years=data.annual,first=years[0],last=years.at(-1),previous=years.at(-2),base=years.find(r=>r.year===2020);
    const recent=years.filter(r=>r.year>=2021).reduce((s,r)=>s+r.constructed,0)/5;
    const prior=years.filter(r=>r.year>=2016&&r.year<=2020).reduce((s,r)=>s+r.constructed,0)/5;
    $('national-metrics').innerHTML=[['2025 年建成',n(last.constructed)+' 套','较 2024 年 '+pct((last.constructed/previous.constructed-1)*100)],['最近 5 年平均',n(recent)+' 套 / 年','2021–2025；较前五年 '+pct((recent/prior-1)*100)],['20 年全国存量增长',pct((last.national/first.national-1)*100),'2005 年底 → 2025 年底；净增 '+n(last.national-first.national)+' 套']].map(([a,b,c])=>`<div class="metric"><small>${a}</small><b>${b}</b><p>${c}</p></div>`).join('');
    $('construction-chart').innerHTML=constructionChart(years.slice(1));
    $('periods').innerHTML=[2006,2011,2016,2021].map(start=>{const average=years.filter(r=>r.year>=start&&r.year<start+5).reduce((s,r)=>s+r.constructed,0)/5;return `<div><span>${start}–${start+4}</span><strong>${n(average)}</strong><small> 套 / 年</small></div>`;}).join('');
    $('national-reading').textContent=`2025 年建成 ${n(last.constructed)} 套，比 2024 年增加 ${pct((last.constructed/previous.constructed-1)*100)}，但低于 2017 年的 35,210 套。2021–2025 年平均 ${n(recent)} 套，较 2016–2020 年下降 ${Math.abs((recent/prior-1)*100).toFixed(1)}%。因此“近年恢复建设”成立，“超过过去 20 年所有阶段”并不成立。`;
    const areas=[['national','全国','#577c9d'],['clementi','Clementi','#285e49'],['queenstown','Queenstown','#ae602e']];
    function drawStock(){const indexed=$('stock-mode').value==='index';const selected=indexed?areas:areas.slice(1);$('stock-chart').innerHTML=lineChart(selected.map(([key,name,color])=>({name,color,values:years.map(r=>indexed?r[key]/first[key]*100:r[key])})),years.map(r=>r.year),{min:indexed?90:0,max:indexed?140:40000,title:indexed?'年末在管存量指数，2005=100，完整数值见年度表':'Clementi 与 Queenstown 年末在管套数，完整数值见年度表'});document.querySelector('.legend .national').hidden=!indexed;}
    $('stock-mode').addEventListener('change',drawStock);drawStock();
    $('stock-table').innerHTML=areas.map(([key,name])=>`<tr><td>${name}</td><td>${n(first[key])}</td><td>${n(base[key])}</td><td>${n(last[key])}</td><td>${n(last[key]-first[key])}<br>${pct((last[key]/first[key]-1)*100)}</td><td>${n(last[key]-base[key])}<br>${pct((last[key]/base[key]-1)*100)}</td></tr>`).join('');
    $('projects').innerHTML=projects.map(([name,count,stage,note,url,extra])=>`<tr><td>${name}</td><td>${count}</td><td>${stage}<small>当前交付进度未逐栋核验</small></td><td>${note}</td><td>${link(url)}${extra?'<br>'+link(extra,'补充来源 ↗'):''}</td></tr>`).join('');
    const ratio=(s,year)=>{const r=s.history.find(r=>r.year===year);return r.applied['2C']/r.vacancy['2C'];};
    $('school-chart').innerHTML=lineChart(data.schools.map((s,i)=>({name:s.name,color:colors[i],values:[2023,2024,2025,2026].map(y=>ratio(s,y))})),[2023,2024,2025,2026],{max:2,min:0,threshold:1,title:'四校 2023 至 2026 年 2C 申请人数除以学额；详细数据见下方卡片'})+`<div class="legend">${data.schools.map((s,i)=>`<span style="color:${colors[i]}">${e(s.name)}</span>`).join('')}</div>`;
    $('school-cards').innerHTML=data.schools.map(s=>{const c=commentary[s.slug],r=s.history.at(-1);return `<article class="school-card"><div class="eyebrow">${c.label}</div><h3>${e(s.name)}</h3><div class="ratio">${ratio(s,2026).toFixed(2)}×<small>2026 2C · ${r.applied['2C']} / ${r.vacancy['2C']}</small></div><p><strong>${c.headline}</strong></p><p>${c.text}</p><p>${c.housing}</p><div class="evidence">${c.ballot}</div><div class="table-scroll"><table><caption>${e(s.name)} · 申请人数 / 学额</caption><thead><tr><th>报名年</th><th>2B</th><th>2C</th><th>2C(S)</th></tr></thead><tbody>${s.history.map(r=>`<tr><td>${r.year}</td>${['2B','2C','2C(S)'].map(p=>`<td>${r.applied[p]} / ${r.vacancy[p]}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="source">0 / 0 表示该阶段无学额，不计算竞争比。${link(sources.moe,'2025 MOE 来源')} · <a href="index.html?school=${e(s.slug)}">查看学校详情 ↗</a></p></article>`;}).join('');
    $('scenario-school').innerHTML=data.schools.map(s=>`<option value="${s.slug}">${e(s.name)}</option>`).join('');
    function scenario(){const form=$('scenario-form');if(!form.checkValidity()){$('scenario-output').textContent='请输入有效范围内的数字；学额至少为 1。';return;}const school=data.schools.find(s=>s.slug===$('scenario-school').value),baseline=school.history.at(-1).applied['2C'];const added=Number($('homes').value)*Number($('cohort').value)/100*Number($('share').value)/100,seats=Number($('seats').value),total=baseline+added;const extra=Math.max(0,seats-baseline);$('scenario-output').innerHTML=`<div class="scenario-result"><div><small>假设新增 2C 申请人数</small><output>${added.toFixed(1)} 人</output><p>基线 ${baseline} 人 → 情景 ${total.toFixed(1)} 人</p></div><div><small>假设竞争比（非中签概率）</small><output>${(total/seats).toFixed(2)}×</output><p>${baseline>seats?'基线申请已超过所设学额。':`基线至所设学额还相差 ${n(extra)} 人；等于学额时竞争比为 1。`}</p></div></div>`;}
    $('scenario-form').addEventListener('submit',event=>event.preventDefault());$('scenario-form').addEventListener('input',scenario);$('scenario-school').addEventListener('change',()=>{const s=data.schools.find(s=>s.slug===$('scenario-school').value);$('seats').value=s.history.at(-1).vacancy['2C'];scenario();});scenario();
    $('source-list').innerHTML=[['全国建成量 · SingStat M400151',data.sources.construction,'年度序列更新于 '+data.annual_data_updated_on+'；自然年口径。'],['全国及市镇在管住宅 · SingStat M400351',data.sources.stock,'取总住宅单位分组，不累计其下重复出现的各房型小计。'],['PrimarySch 学校历史','https://primarysch.com/schools_data.json','本站学校快照；2023–2024 二手汇编，2026 与下项交叉核验。'],['2026 报名数据交叉来源','https://sgschoolkaki.com/p1-registration/data-2026','学校数字核验日期 '+data.school_checked_on+'。'],['MOE 历年学额与抽签',sources.moe,'2025 原始证据已存于学校快照；本次官网读取遇到验证页。'],['2026 抽签组别的额外参考 · CNA',sources.cna,'报道列出 Fairfield 与 Henry Park 在 SC 1km 内组抽签；未将新闻内容回填为 MOE 原始记录。'],['MOE 报名地址及距离规则','https://www.moe.gov.sg/primary/p1-registration','报名年请核对官方地址、入住承诺与距离类别；本页未逐栋确认入学资格。']].map(([name,url,note])=>`<div class="source-row">${link(url,e(name)+' ↗')}<span>${e(note)}</span></div>`).join('');
    $('annual-table').innerHTML=years.map(r=>`<tr><td>${r.year}${r.year===2005?'（基期）':''}</td>${['constructed','national','clementi','queenstown'].map(k=>`<td>${n(r[k])}</td>`).join('')}</tr>`).join('');
    $('load-status').textContent='';
  }
  fetch('data/hdb_growth.json?v=20261106a').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(render).catch(()=>{$('load-status').className='error';$('load-status').innerHTML='图表数据暂时无法载入。请刷新页面重试；正文及来源链接仍可阅读。';});
})();
