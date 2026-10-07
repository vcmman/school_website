(() => {
  'use strict';
  const app = document.getElementById('app');
  const page = document.body.dataset.page;
  let language = 'en';
  try { language = localStorage.getItem('atlas-language') === 'zh' ? 'zh' : 'en'; } catch (_) {}
  const state = { pricing: null, evidence: null, pricingGroups: {}, estimateSize: 1000, data: null, condos: null, search: '', town: '', sort: 'pressure', radius: 2000, condoSort: 'balanced', category: 'family_budget', budget: 2000000, minBeds: 3, minSize: 900, selected: new URLSearchParams(location.search).get('school') };
  const t = (en, zh) => language === 'zh' ? zh : en;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL = url => { try { const u = new URL(url); return ['https:', 'http:'].includes(u.protocol) ? escape(u.href) : '#'; } catch (_) { return '#'; } };
  const schools = () => state.data.primary_schools;
  const townNames = {'Ang Mo Kio':'宏茂桥','Bedok':'勿洛','Bishan':'碧山','Bukit Batok':'武吉巴督','Bukit Merah':'红山','Bukit Panjang':'武吉班让','Bukit Timah':'武吉知马','Central':'中区','Choa Chu Kang':'蔡厝港','Clementi':'金文泰','Geylang':'芽笼','Hougang':'后港','Jurong East':'裕廊东','Jurong West':'裕廊西','Kallang':'加冷','Marine Parade':'马林百列','Novena':'诺维娜','Pasir Ris':'巴西立','Punggol':'榜鹅','Queenstown':'女皇镇','Sembawang':'三巴旺','Sengkang':'盛港','Serangoon':'实龙岗','Tampines':'淡滨尼','Toa Payoh':'大巴窑','Woodlands':'兀兰','Yishun':'义顺','Tengah':'登加'};
  const schoolAliases = {'tao-nan':'道南','nanyang':'南洋','nan-hua':'南华','ai-tong':'爱同','kong-hwa':'光华','henry-park':'恒力','pei-hwa':'培华','chongfu':'崇福','nan-chiau':'南侨','red-swastika':'卍慈','rosyth':'乐赛','rulang':'孺廊','punggol-green':'榜鹅绿洲'};
  const townLabel = value => language === 'zh' ? (townNames[value] || value) : value;
  const typeLabel = value => language === 'zh' ? String(value).replace(/GOVERNMENT-AIDED SCH(?:OOL)?|Gov-aided/gi, '政府辅助学校').replace(/GOVERNMENT SCHOOL|Government/gi, '政府学校').replace(/CO-ED SCHOOL|Mixed-gender/gi, '男女混校').replace(/GIRLS'? SCHOOL|Girls/gi, '女校').replace(/BOYS'? SCHOOL|Boys/gi, '男校').replace(/SAP/g, '特选学校') : value;
  const town = s => s.school_info?.Town || s.address?.locality || '';
  const address = s => s.school_info?.Address || s.address?.street || '';
  const ballotYear = () => state.data.stats.latest_ballot_year || 2026;
  const phase = (s, p, year = ballotYear()) => {
    const row = s.ballot_history?.find(r => r.year === year);
    const vacancy = row?.vacancy?.[p];
    const applied = row?.applied?.[p];
    return { vacancy, applied, pressure: Number.isFinite(vacancy) && vacancy > 0 && Number.isFinite(applied) ? applied / vacancy : null };
  };
  const pressure = s => phase(s, '2C(S)').pressure ?? phase(s, '2C').pressure;
  const compare = (a, b) => {
    const x = pressure(a), y = pressure(b);
    if (x === null || y === null) return x === y ? a.name.localeCompare(b.name) : x === null ? 1 : -1;
    return y - x || (phase(b, '2C').pressure ?? -1) - (phase(a, '2C').pressure ?? -1) || a.name.localeCompare(b.name);
  };
  const nearbyRows = s => (state.condos?.schools?.[s.slug] || []).filter(c => c.distance_m <= state.radius);
  const condoRows = s => CondoRanking.rank(nearbyRows(s), {asOf:state.condos.as_of_date, radius:state.radius, sort:state.condoSort, category:state.category, budget:state.budget, minBeds:state.minBeds, minSize:state.minSize});
  function filtered() {
    const query = state.search.toLowerCase().trim();
    return schools().filter(s => (!query || `${s.name} ${schoolAliases[s.slug] || ""} ${town(s)} ${townNames[town(s)] || ""} ${address(s)}`.toLowerCase().includes(query)) && (!state.town || town(s) === state.town)).sort(state.sort === 'name' ? (a,b) => a.name.localeCompare(b.name) : state.sort === 'condos' ? (a,b) => nearbyRows(b).length - nearbyRows(a).length || a.name.localeCompare(b.name) : compare);
  }
  function shell() {
    const slug = `?v=20261006evidence2${state.selected ? `&school=${encodeURIComponent(state.selected)}` : ''}`;
    app.innerHTML = `<header><nav class="nav" aria-label="${t('Main navigation','主导航')}"><a class="brand" href="index.html?v=20261006evidence2">School<span> Atlas</span></a><div class="nav-links"><a class="${page === 'explorer' ? 'active' : ''}" href="index.html${slug}">${t('School Explorer','学校探索')}</a><a class="${page === 'condos' ? 'active' : ''}" href="school-condos.html${slug}">${t('Condo Picks','周边公寓')}</a></div><button class="language" id="language">${t('中文','English')}</button></nav></header><main><section class="intro"><div><div class="eyebrow">${t('Singapore · Schools & homes','新加坡 · 学校与住宅')}</div><h1>${page === 'explorer' ? t('Find the school. Understand the choices.','找到学校，看清选择。') : t('A school in mind. A home nearby.','心仪的学校，附近的家。')}</h1><p>${page === 'explorer' ? t('Compare registration demand, explore school details, and discover nearby condos.','比较报名竞争程度，了解学校资料，寻找周边公寓。') : t('Compare project distances and available transaction evidence within 2km.','查看学校 2km 内项目距离、成交证据与参考价格。')}</p></div><div class="dataset">${schools().length} ${t('schools · 2026 registration · 2027 intake','所学校 · 2026 报名 / 2027 入学')}</div></section><div class="workspace"><aside class="sidebar"><div class="filters"><label for="search">${t('Find a school','搜索学校')}</label><input id="search" type="search" placeholder="${t('School, town or address','学校英文名、地区或地址')}" value="${escape(state.search)}"><div class="filter-row"><div><label for="town">${t('Town','地区')}</label><select id="town"><option value="">${t('All towns','全部地区')}</option>${[...new Set(schools().map(town).filter(Boolean))].sort().map(v => `<option ${state.town === v ? 'selected' : ''} value="${escape(v)}">${escape(townLabel(v))}</option>`).join('')}</select></div><div><label for="sort">${t('Sort by','排序')}</label><select id="sort"><option value="pressure">${t('Hard → easy','竞争：难 → 易')}</option><option value="name">${t('School name','学校名称')}</option><option value="condos">${t('Condo coverage','公寓数量')}</option></select></div></div></div><div class="count" id="count" aria-live="polite"></div><div class="school-list" id="list"></div><div class="mobile-select"><label for="school-select">${t('Select school','选择学校')}</label><select id="school-select"></select></div></aside><section class="detail" id="detail" aria-live="polite"></section></div></main><footer>${t('Data:','数据来源：')} <a href="https://primarysch.com/data/" target="_blank" rel="noopener">PrimarySch</a><a href="https://www.moe.gov.sg/primary/p1-registration/past-vacancies-and-balloting-data" target="_blank" rel="noopener">MOE</a><a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener">OneMap</a><span>${t('Condo catalog is a selected sample. Distances are approximate.','公寓库为已收录项目，非完整清单。距离为估算。')}</span></footer>`;
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = `School Atlas | ${page === 'explorer' ? t('School Explorer','学校探索') : t('Condo Picks','周边公寓')}`;
    document.getElementById('sort').value = state.sort;
    document.getElementById('language').onclick = () => { language = language === 'en' ? 'zh' : 'en'; try { localStorage.setItem('atlas-language', language); } catch (_) {} shell(); };
    document.getElementById('search').oninput = e => { state.search = e.target.value; render(); };
    document.getElementById('town').onchange = e => { state.town = e.target.value; render(); };
    document.getElementById('sort').onchange = e => { state.sort = e.target.value; render(); };
    document.getElementById('list').onclick = e => { const button = e.target.closest('[data-school]'); if (button) select(button.dataset.school); };
    document.getElementById('school-select').onchange = e => select(e.target.value);
    render();
  }
  function select(slug) {
    state.selected = slug;
    const url = new URL(location.href); url.searchParams.set('school', slug); history.replaceState(null, '', url);
    render();
  }
  function metric(s, p) {
    const row = phase(s, p);
    const valid = Number.isFinite(row.vacancy) && Number.isFinite(row.applied);
    return `<div class="metric"><span class="subtle">${escape(p)} · 2026</span><div class="value ${row.pressure > 1 ? 'warn' : ''}">${row.pressure === null ? '—' : row.pressure.toFixed(2) + '×'}</div><p>${valid ? `${row.applied} ${t('applicants /','申请人 /')} ${row.vacancy} ${t('places','学额')}` : t('No 2026 data','暂无 2026 数据')}</p>${valid && row.vacancy === 0 ? `<p>${t('No places available','没有剩余学额')}</p>` : ''}${ballotSummary(s,p)}</div>`;
  }
  function render() {
    const rows = filtered();
    if (!rows.some(s => s.slug === state.selected)) state.selected = rows[0]?.slug || null;
    document.getElementById('count').textContent = `${rows.length} ${t('schools','所学校')}`;
    document.getElementById('list').innerHTML = rows.map(s => `<button class="school ${s.slug === state.selected ? 'selected' : ''}" data-school="${escape(s.slug)}" aria-pressed="${s.slug === state.selected}"><strong>${escape(s.name)}</strong><small>${escape(townLabel(town(s)))} · ${nearbyRows(s).length} ${t('condos within','个公寓 /')} ${state.radius / 1000}km</small></button>`).join('');
    document.getElementById('school-select').innerHTML = rows.map(s => `<option value="${escape(s.slug)}" ${s.slug === state.selected ? 'selected' : ''}>${escape(s.name)}</option>`).join('');
    document.querySelectorAll('.nav-links a').forEach(a => { const u = new URL(a.href); if (state.selected) u.searchParams.set('school', state.selected); else u.searchParams.delete('school'); a.href = u.href; });
    const s = rows.find(s => s.slug === state.selected);
    if (!s) { document.getElementById('detail').innerHTML = `<h2>${t('No matching schools','没有符合条件的学校')}</h2><p>${t('Try a different name or choose all towns.','尝试其他关键词或选择全部地区。')}</p>`; return; }
    document.getElementById('detail').innerHTML = `<div class="school-head"><div><div class="eyebrow">${escape(townLabel(town(s)))}</div><h2>${escape(s.name)}</h2><p class="subtle">${escape(address(s))}</p></div><span class="pill">${t('Primary school','小学')}</span></div>${page === 'explorer' ? explorer(s) : condos(s)}`;
    document.querySelectorAll('[data-radius]').forEach(button => { button.onclick = () => { state.radius = Number(button.dataset.radius); render(); }; });
    for (const [id, key, numeric] of [['estimate-size','estimateSize',true],['condo-sort','condoSort',false],['condo-category','category',false],['condo-budget','budget',true],['condo-beds','minBeds',true],['condo-size','minSize',true]]) {
      const input = document.getElementById(id);
      if (input) { input.value = state[key]; input.onchange = event => { state[key] = numeric ? Number(event.target.value) : event.target.value; render(); }; }
    }
  }
  const ballotLabel = result => SchoolBalloting.describe(result,language);
  function ballotSummary(s,p,year=ballotYear()) {
    const row=s.ballot_history?.find(r=>r.year===year);
    const result=row?.balloting?.[p];
    const older=s.ballot_history?.find(r=>r.year<year && r.balloting?.[p]);
    return `<div class="ballot-status"><strong>${year} ${t('balloting group','抽签组别')}</strong><p>${escape(ballotLabel(result))}</p>${result ? `<a href="${safeURL(result.source_url)}" target="_blank" rel="noopener">MOE ↗</a>` : older ? `<p class="historical">${older.year} ${t('historical only','仅历史参考')}：${escape(ballotLabel(older.balloting[p]))} <a href="${safeURL(older.balloting[p].source_url)}" target="_blank" rel="noopener">MOE ↗</a></p>` : ''}</div>`;
  }
  function explorer(s) {
    const info=s.school_info||{};
    const histories=s.ballot_history||[];
    const langs=Object.entries(s.mother_tongue?.Regular||{}).filter(([,v])=>v).map(([k])=>t(k,({Chinese:'华文',Malay:'马来文',Tamil:'淡米尔文'})[k]||k));
    return `<h3>${t('Demand & balloting groups','报名竞争与抽签组别')}</h3><div class="metrics">${['2C(S)','2C','2B'].map(p=>metric(s,p)).join('')}</div><div class="note">${t('Applicants ÷ vacancies measures demand, not admission probability. Citizenship and distance are displayed only from the matching MOE year and phase. Missing 2026 groups are not inferred from counts or historical cutoffs.','申请人数 ÷ 学额表示报名竞争，并非个人录取概率。抽签公民／PR 与距离只使用同年、同阶段 MOE 原文。2026 组别缺失时，不根据人数或旧年界线推测。')}</div><div class="facts"><div class="fact"><span>${t('School type','学校类型')}</span>${escape(typeLabel(info.Type))}</div><div class="fact"><span>${t('Mother tongue','母语课程')}</span>${escape(langs.join(' / ')||'—')}</div><div class="fact"><span>${t('Contact','联系方式')}</span>${escape(s.directory.telephone||'—')}</div><div class="fact"><span>${t('Coordinate evidence','坐标依据')}</span>${s.location_verification?.source==='OneMap'?t('New OneMap public-response match; exact admission boundary unverified','新查询 OneMap 返回点位匹配；具体入学距离待核实'):s.location?t('Secondary coordinates; postal code agrees with MOE','二手坐标，邮编与 MOE 一致；点位待独立核实'):t('Unverified; no nearby distances calculated','待核实；不计算周边距离')}</div></div><div class="links"><a class="action" href="school-condos.html?v=20261006evidence2&school=${encodeURIComponent(s.slug)}">${t('Nearby projects','周边住宅项目')}</a>${s.website?`<a class="pill" href="${safeURL(s.website)}" target="_blank" rel="noopener">${t('School website','学校官网')} ↗</a>`:''}</div><h3>${t('Registration history & balloting','报名与抽签历史')}</h3><p class="subtle">${t('Registration year / next-year intake. Each phase: applicants / vacancies, then citizenship and distance. — means missing, not zero.','年份为报名年，次年入学。每阶段显示申请人数 / 学额，以及抽签公民／PR 与距离。— 代表缺失，并非零。')}</p><div class="history"><table><thead><tr><th>${t('Year','报名年')}</th>${['2B','2C','2C(S)'].map(p=>`<th>${p}<br>${t('Applicants / places','申请 / 学额')}</th>`).join('')}<th>${t('Numeric source','数字来源')}</th></tr></thead><tbody>${histories.map(r=>`<tr><td>${r.year}</td>${['2B','2C','2C(S)'].map(p=>`<td>${r.applied?.[p]??'—'} / ${r.vacancy?.[p]??'—'}<div class="table-ballot">${escape(ballotLabel(r.balloting?.[p]))}</div></td>`).join('')}<td><a href="${safeURL(r.source_url)}" target="_blank" rel="noopener">${r.verification==='direct_moe'?'MOE':t('PrimarySch · secondary','PrimarySch · 二手汇编')}</a>${r.crosscheck_source_url?`<br><a href="${safeURL(r.crosscheck_source_url)}" target="_blank" rel="noopener">${t('Cross-check','交叉核对')}</a>`:''}</td></tr>`).join('')}</tbody></table></div>${dataNote()}`;
  }
  const tenureLabel=value=>language==='zh'?String(value||'').replace(/Freehold/gi,'永久产权').replace(/(\d+) yrs lease commencing from (\d+)/gi,'$1年地契，自$2年起').replace(/(\d+) years/gi,'$1年地契'):value;
  const money=value=>new Intl.NumberFormat(language==='zh'?'zh-SG':'en-SG',{style:'currency',currency:'SGD',maximumFractionDigits:0}).format(value);
  const categoryLabel=key=>({family_budget:t('Matching sample within budget','有匹配样本 · 预算内'),family_comfort:t('Matching sample above budget','有匹配样本 · 超预算'),verify:t('Project only · not a recommendation','仅周边项目 · 非推荐')})[key];
  function dataNote() {
    const audit=state.data.verification_report;
    return `<div class="note">${t('Rebuilt from source snapshots','从原始来源重新建库')} · ${escape(audit.checked_on)}<br>${t('MOE directory','MOE 学校目录')}：${audit.school_count} ${t('schools','所学校')}。${t('Direct MOE ballot years','直接取得 MOE 抽签年份')}：${(audit.moe_ballot_years||[]).join(', ')}。${t('2026 counts cross-checked','2026 数字交叉核对')}：${audit.numeric_cells_checked??'—'} ${t('cells','项')}。${t('Other registration years use the PrimarySch secondary compilation. Current-year citizen/distance data is unavailable in the retrieved MOE page.','其他报名年份使用 PrimarySch 二手汇编。取得的 MOE 页面未提供本年度公民／PR 距离组别。')} <a href="${safeURL(schools()[0]?.directory?.source_url)}" target="_blank" rel="noopener">${t('Official directory','官方目录')}</a></div>`;
  }
  function condoCard(c) {
    const pricing=state.pricing;
    const key=CondoPricing.normalize(c.name);
    const evidence=state.evidence?.projects?.[key];
    const original=['available','partial'].includes(pricing?.status)?CondoPricing.summarize(state.pricingGroups[key]||[],c.name,pricing.as_of_date,state.estimateSize):null;
    const stats=original||CondoPricing.summarizePublic(evidence,evidence?.checked_on,state.estimateSize);
    const secondary=stats?.source_kind==='secondary';
    const estimate=stats?.estimate_sgd!=null;
    const priceText=stats?
      '<p>'+t(secondary?'Displayed resale sample average (secondary publisher)':'URA original resale average',secondary?'公开转售样本平均尺价（第三方整理）':'URA 原始转售成交平均尺价')+': '+money(Math.round(stats.average_psf))+'/sqft · '+stats.count+' '+t('records','笔记录')+' · '+stats.first_month+' – '+stats.last_month+'</p>'+(secondary?'<p class="warn">'+t('Publicly displayed samples only; may omit sales or bulk indicators. Not the complete project annual average.','仅公开展示样本，可能遗漏成交或批量标识，不是完整小区年度均价。')+' <a href="'+safeURL(stats.source_url)+'" target="_blank" rel="noopener">'+t('Source','来源')+' ↗</a></p>':'')+'<div class="asking">'+(estimate?money(Math.round(stats.estimate_sgd/10000)*10000):t('No comparable-size estimate','暂无可比面积估算'))+' <small>'+state.estimateSize+' sqft · '+t('reference only, not a listing','仅参考，非房源')+'</small></div><p>'+t('Observed transaction sizes','样本成交面积')+': '+Math.round(stats.min_size_sqft)+'–'+Math.round(stats.max_size_sqft)+' sqft'+(!estimate?' · '+t('At least 3 sales and a size within the sample range are required.','需要至少 3 笔成交，且面积须在样本范围内。'):'')+'</p><div class="subtle">'+t('Recent reported transactions','近期所报成交')+': '+stats.recent.map(r=>r.contract_month+' · '+Math.round(r.area_sqft_approx)+' sqft · '+money(r.price_sgd)).join('<br>')+'</div>':
      '<p class="note">'+t('No usable resale evidence yet. No asking-price substitute.','暂无可用转售成交证据，不用挂牌价替代。')+'</p>';
    const checkedOn=secondary?evidence?.checked_on:pricing?.retrieved_on;
    const checkedText=stats&&checkedOn?'<p class="subtle">'+t('Evidence retrieved','证据取得日期')+': '+escape(checkedOn)+'</p>':'';
    const layouts=evidence?.layouts?.length?'<p>'+t('Publisher-listed layout areas (not floor-plan verified)','公开户型面积（未核对户型图）')+': '+[...new Set(evidence.layouts.map(r=>r.area_sqft))].slice(0,6).join(' / ')+' sqft</p>':'';
    return `<article class="condo project-card"><div class="condo-body"><h3>${escape(c.name)}</h3><p>${escape(c.address)}</p>${priceText}${checkedText}${layouts}<p>${t(c.source==='URA'?'Tenure from URA; completion from secondary directory':'Directory claims (unconfirmed)',c.source==='URA'?'产权据 URA 成交记录；建成年份据二手目录':'目录所报资料（未独立确认）')}：${escape(tenureLabel(c.directory_tenure)||t('tenure unknown','产权未知'))} · ${c.directory_completion||t('completion unknown','建成年份未知')}</p><div class="links"><a href="${safeURL(c.directory_source_url)}" target="_blank" rel="noopener">${t('Project source','项目来源')} ↗</a><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}" target="_blank" rel="noopener">${t('Map','地图')} ↗</a></div></div><div class="distance">${(c.distance_m/1000).toFixed(2)} km<small>${t('Approximate straight line','估算直线距离')}</small></div></article>`;
  }
  function pricingCoverage() {
    if(state.pricing?.status==='partial')return t('Official transaction coverage is partial: batches ','官方成交仅覆盖部分批次：')+escape((state.pricing.coverage?.downloaded_batches||[]).join(', '))+t(' of 4. Public samples are labelled separately.','（共 4 批）。公开样本另行标注。');
    return state.pricing?.status==='available'?t('Official records loaded; unmatched project samples are labelled separately.','已加载官方记录；未匹配项目的公开样本另行标注。'):t('Official records unavailable. Only separately labelled public samples may be shown.','暂无官方记录，仅展示另行标注的公开样本。');
  }
  function condos(s) {
    const all=CondoPricing.byDistance(nearbyRows(s),state.radius);
    return `<h3>${t('School balloting context','学校抽签参考')}</h3><div class="metrics">${['2C(S)','2C','2B'].map(p=>metric(s,p)).join('')}</div><div class="radius">${[1000,2000].map(r=>`<button data-radius="${r}" class="${r===state.radius?'active':''}" aria-pressed="${r===state.radius}">${t('Within','范围：')} ${r/1000}km</button>`).join('')}<span class="pill">${all.length} ${t('located projects','个已定位项目')}</span></div><div class="condo-controls"><div><label for="estimate-size">${t('Area for price estimate (not a verified layout)','估算面积（不代表已核实户型）')}</label><select id="estimate-size">${[800,900,1000,1200,1500].map(v=>`<option value="${v}">${v} sqft</option>`).join('')}</select></div></div><div class="note">${t('Located project catalog','已定位项目库')}：${state.condos.catalog_count}。${pricingCoverage()}</div><h3>${t('Nearby condos · nearest first','周边公寓 · 按距离由近到远')}</h3><p class="subtle">${t('Fixed distance order, not a quality ranking. Reference: latest 12 complete months’ arithmetic mean resale PSF × area. At least 3 records and an area within the observed range are required. Official data excludes new, sub- and bulk sales; secondary samples have separate limitations.','固定按学校距离排序，不是品质或投资排名。参考价＝最近 12 个完整月份转售尺价算术平均 × 所选面积；至少 3 笔记录，面积须在成交样本范围内。官方数据排除新售、再售及批量交易，第三方样本的限制另行标注。')}</p>${all.length?all.map(condoCard).join(''):`<div class="note">${t('Location coverage incomplete; no matched projects in this range.','定位覆盖尚未完成，本范围暂无已匹配项目。')}</div>`}<div class="note">${t('Location coverage is incomplete. Straight-line point distances are not official admission distances. Estimates exclude taxes and fees, and do not adjust for floor, facing, renovation or layout. A selected size does not prove that layout exists in a project.','项目定位覆盖尚未完成，点位直线距离不是官方入学距离。估算不含税费，也未调整楼层、朝向、装修和布局；所选面积不表示小区实际存在该户型。')} <a href="https://www.ura.gov.sg/property-data/private-residential-properties/" target="_blank" rel="noopener">URA ↗</a> <a href="https://eservice.ura.gov.sg/maps/api/" target="_blank" rel="noopener">URA API ↗</a>${state.pricing?.retrieved_on?'<p>'+t('Transactions retrieved','成交数据取得日期')+': '+escape(state.pricing.retrieved_on)+'</p>':''}</div>${dataNote()}`;
  }
  // The explorer needs no property payload; keep its first load lightweight.
  const pricingRequest=page==='condos'?fetch('data/ura_transactions.json?v=20261006evidence2',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('prices');return r.json();}).catch(()=>({status:'not_acquired',records:[]})):Promise.resolve({status:'not_acquired',records:[]});
  const evidenceRequest=page==='condos'?fetch('data/property_evidence.json?v=20261006evidence2',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('evidence');return r.json();}).catch(()=>({projects:{}})):Promise.resolve({projects:{}});
  Promise.all([fetch('data/atlas_bundle.json?v=20261006evidence2',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('data');return r.json();}),pricingRequest,evidenceRequest]).then(([data,pricing,evidence]) => { if(data.schema_version!==2 || !data.condos) throw new Error('schema'); state.pricing=pricing;state.evidence=evidence;for(const r of pricing.records||[]){const k=CondoPricing.normalize(r.project);(state.pricingGroups[k]||=[]).push(r);}state.data=data;state.condos=data.condos;shell(); }).catch(() => { app.innerHTML=`<div class="error"><h2>${t('Unable to load school data','学校数据加载失败')}</h2><p>${t('Please refresh the page to try again.','请刷新页面重试。')}</p><button class="action" onclick="location.reload()">${t('Retry','重试')}</button></div>`; });
})();
