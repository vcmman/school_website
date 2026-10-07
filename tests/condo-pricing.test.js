const test=require('node:test');const assert=require('node:assert/strict');
const {summarize,summarizePublic,byDistance}=require('../site/condo-pricing');
const record=(patch={})=>({project:'Test Condo',source:'URA',sale_type:'resale',area_type:'strata',units:1,property_type:'Condominium',contract_month:'2026-09',price_sgd:2000000,area_sqm:100,...patch});
test('fixed distance order ignores price and original order',()=>{
 assert.deepEqual(byDistance([{name:'Far',distance_m:1999},{name:'Close',distance_m:100},{name:'Outside',distance_m:2001},{name:'Unknown',distance_m:null}],2000).map(r=>r.name),['Close','Far']);
});
test('mean of transaction PSF times chosen size, not weighted PSF',()=>{
 const rows=[record(),record({price_sgd:1800000,area_sqm:90}),record({price_sgd:3000000,area_sqm:200})];
 const s=summarize(rows,'TEST CONDO','2026-10-06',1000);
 assert.equal(s.count,3);assert.ok(Math.abs(s.average_psf-(20000+20000+15000)/3/10.7639104167)<0.001);assert.equal(s.estimate_sgd,s.average_psf*1000);
});
test('exclude future/current month, stale, other projects, invalid, non-strata and non-resales',()=>{
 const invalid=[{contract_month:'2026-10'},{contract_month:'2025-09'},{contract_month:'2027-01'},{contract_month:'2026-13'},{source:'99.co'},{project:'Other'},{sale_type:'new_sale'},{sale_type:'sub_sale'},{units:2},{area_type:'land'},{property_type:'HDB'},{price_sgd:-1},{area_sqm:0}].map(record);
 assert.equal(summarize(invalid,'Test Condo','2026-10-06',1000),null);
 const sparse=summarize([record({contract_month:'2025-10'})],'Test Condo','2026-10-06',1000);assert.equal(sparse.count,1);assert.equal(sparse.estimate_sgd,null);
 assert.equal(summarize([record()],'Test Condo','2026-10-06',NaN),null);
});
test('URA evidence schema distinguishes absent data from imported records; pages load pricing module',()=>{
 const fs=require('node:fs');const p=fs.existsSync('site/data/ura_transactions.json')?JSON.parse(fs.readFileSync('site/data/ura_transactions.json','utf8')):{schema_version:1,source:'URA',status:'not_acquired',records:[],retrieved_on:null};assert.equal(p.schema_version,1);assert.equal(p.source,'URA');assert.ok(Array.isArray(p.records));
 if(p.status==='not_acquired'){assert.deepEqual(p.records,[]);assert.equal(p.retrieved_on,null);}else{assert.ok(['available','partial'].includes(p.status));assert.ok(p.records.length>0);assert.match(p.retrieved_on,/^\d{4}-\d{2}-\d{2}$/);assert.ok(Object.keys(p.raw_hashes).length>0);if(p.status==='partial')assert.equal(p.coverage.national_coverage_complete,false);}
 for(const page of ['index.html','school-condos.html'])assert.match(fs.readFileSync('site/'+page,'utf8'),/condo-pricing\.js/);
});
test('never extrapolate prices outside observed size range or combine generic project names',()=>{
 const rows=[record(),record(),record()];
 for(const size of [800,1200])assert.equal(summarize(rows,'Test Condo','2026-10-06',size).estimate_sgd,null);
 assert.equal(summarize(rows.map(r=>({...r,project:'RESIDENTIAL APARTMENTS'})),'RESIDENTIAL APARTMENTS','2026-10-06',1000),null);
});
test('public sample averages stay separate from primary records and do not invent unit counts',()=>{
 const publicRow=(patch={})=>({project:'Test Condo',source:'Cashew',sale_type:'resale',contract_month:'2026-09',price_sgd:2000000,area_sqft_approx:1000,reported_psf:2000,units:null,...patch});
 const evidence={name:'Test Condo',source:'Cashew',source_url:'https://www.cashew.sg/property/test',records:[publicRow(),publicRow({price_sgd:1200000,area_sqft_approx:800,reported_psf:1500}),publicRow({price_sgd:3600000,area_sqft_approx:1200,reported_psf:3000})]};
 const stats=summarizePublic(evidence,'2026-10-06',1000);
 assert.equal(stats.source_kind,'secondary');assert.equal(stats.coverage,'displayed_sample_only');assert.equal(stats.average_psf,6500/3);assert.equal(stats.estimate_sgd,stats.average_psf*1000);
 assert.equal(summarizePublic(evidence,'2026-10-06',1500).estimate_sgd,null);
 const invalid=[{source:'URA'},{project:'Other'},{contract_month:'2026-10'},{contract_month:'2025-09'},{contract_month:'2026-13'},{price_sgd:1},{reported_psf:1},{sale_type:'new_sale'}].map(publicRow);
 assert.equal(summarizePublic({...evidence,records:invalid},'2026-10-06',1000),null);
 assert.equal(summarizePublic({...evidence,records:[publicRow()]},'2026-10-06',1000).estimate_sgd,null);
});
