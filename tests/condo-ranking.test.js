const test=require('node:test');const assert=require('node:assert/strict');const {rank,evaluate}=require('../site/condo-ranking');
const options={asOf:'2026-10-06',radius:2000,sort:'balanced',category:'all',budget:2000000,minBeds:3,minSize:900};
function condo(name,price=1800000,distance=500){return {name,distance_m:distance,family_profile:{top_year:2015,completion_verified:true,listing_samples:[{source_url:'https://www.99.co/singapore/sale/property/example-'+name,listing_type:'sale',evidence_status:'listing_detail_checked',observed_on:'2026-10-06',price_sgd:price,size_sqft:1000,beds:3,baths:2}]}};}
test('only individually checked sale listings with verified completion can be recommended',()=>{
 const row=condo('A');assert.equal(evaluate(row,options).familyKnown,true);
 for(const patch of [{source_url:'https://www.99.co/singapore/condos-apartments/test'},{listing_type:'rent'},{evidence_status:null},{observed_on:'2026-01-01'},{observed_on:'2026-10-07'},{baths:1},{beds:2},{size_sqft:800},{price_sgd:5000}]){const c=condo('A');Object.assign(c.family_profile.listing_samples[0],patch);assert.equal(evaluate(c,options).familyKnown,false);}
 const future=condo('Future');future.family_profile.top_year=2029;assert.equal(evaluate(future,options).familyKnown,false);
 const directoryOnly=condo('Source unknown');directoryOnly.family_profile.completion_verified=false;assert.equal(evaluate(directoryOnly,options).familyKnown,false);
});
test('no invented condition/value scores; budget and size sorts are explicit',()=>{
 const budget=condo('Budget');const premium=condo('Premium',2500000,10);const unknown={name:'Unknown',distance_m:1};
 const rows=rank([unknown,premium,budget],options);assert.deepEqual(rows.map(r=>r.name),['Budget','Premium','Unknown']);assert.equal(rows[0].condition_verified,false);assert.equal(rows[0].balancedScore,undefined);
 assert.deepEqual(rank([unknown,premium,budget],{...options,category:'family_budget'}).map(r=>r.name),['Budget']);
 assert.equal(rank([unknown,premium,budget],{...options,sort:'distance'})[0].name,'Unknown');
 assert.equal(rank([condo('Outside',1800000,2001)],options).length,0);
});
test('rebuilt schemas have 182 current schools and only original-source evidence',()=>{
 const data=require('../site/data/atlas_schools.json');const catalog=require('../site/data/school_condos_2km.json');
 assert.equal(data.schema_version,2);assert.equal(catalog.schema_version,2);assert.equal(data.primary_schools.length,182);
 assert.ok(data.verification_report.property_directory_count>2000);
 assert.deepEqual(data.verification_report.moe_ballot_years,[2025]);
 for(const s of data.primary_schools){
  assert.ok(s.directory.source_url.includes('moe.gov.sg'));
  for(const history of s.ballot_history)for(const phase of ['2B','2C','2C(S)']){
   for(const key of ['applied','vacancy']){const v=history[key]?.[phase];assert.ok(v==null||(Number.isInteger(v)&&v>=0));}
   if(history.balloting[phase]){assert.equal(history.balloting[phase].year,history.year);assert.equal(history.balloting[phase].source,'MOE');assert.ok(history.balloting[phase].source_url.includes('moe.gov.sg'));}
  }
  for(const c of catalog.schools[s.slug]){assert.ok(c.directory_source_url.startsWith('https://homy.sg/')||c.directory_source_url.startsWith('https://eservice.ura.gov.sg/'));assert.ok(c.distance_m<=2000);assert.ok(['OneMap','URA'].includes(c.source));assert.equal(c.family_profile,null);}
 }
});
test('MOE citizenship and distance text stays attached to original year and phase',()=>{
 const s=require('../site/data/atlas_schools.json').primary_schools.find(s=>s.slug==='henry-park');
 assert.equal(s.ballot_history.find(r=>r.year===2026).balloting['2C'],null);
 const old=s.ballot_history.find(r=>r.year===2025).balloting['2C'];assert.match(old.result_text,/Singapore Citizen.*within 1km/);assert.equal(old.applied,93);assert.equal(old.vacancy,63);assert.equal(old.applicants_balloted,76);
});
test('Henry Park omitted projects are restored and within radius',()=>{
 const rows=require('../site/data/school_condos_2km.json').schools['henry-park'];
 for(const name of ['PARKSUITES','QUINTERRA','PANDAN VALLEY','THE TRIZON'])assert.ok(rows.find(r=>r.name===name&&r.distance_m<1000));
 assert.equal(rank(rows,{...options,category:'family_budget'}).length,0);
});
test('citizenship/distance describes ballot versus restricted admission, without inference',()=>{
 const {describe}=require('../site/school-balloting');
 const ballot={vacancy:60,balloting_required:true,result_text:'Conducted for: Singapore Citizen children residing within 1km of the school.'};assert.match(describe(ballot,'zh'),/需抽签组别：SC（公民） ≤1km/);
 assert.match(describe({...ballot,result_text:'Conducted for: Permanent Resident children residing between 1km and 2km of the school.'},'zh'),/PR（永久居民） >1–2km/);
 const noBallot={vacancy:50,balloting_required:false,result_text:'No balloting was conducted. Places were offered to all Singapore Citizen children, and Permanent Resident children residing within 1km of the school.'};assert.match(describe(noBallot,'zh'),/无需抽签获录/);assert.match(describe(noBallot,'zh'),/所有距离/);assert.match(describe(noBallot,'zh'),/PR（永久居民） ≤1km/);
 assert.match(describe(null,'zh'),/未核实/);assert.match(describe({vacancy:0},'zh'),/未开展/);
});
