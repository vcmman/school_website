(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CondoRanking=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function evaluate(condo,options){
    const p=condo.family_profile;
    const samples=(p?.listing_samples||[]).filter(s=>{
      const age=(Date.parse(options.asOf)-Date.parse(s.observed_on))/86400000;
      return s.evidence_status==='listing_detail_checked' && s.listing_type==='sale' && /^https:\/\/.+\/sale\/property\//.test(s.source_url||'') && Number.isFinite(age)&&age>=0&&age<=90 && Number.isFinite(s.price_sgd)&&s.price_sgd>300000 && Number.isFinite(s.size_sqft)&&s.size_sqft>=options.minSize && Number.isFinite(s.beds)&&s.beds>=options.minBeds && Number.isFinite(s.baths)&&s.baths>=2;
    }).sort((a,b)=>a.price_sgd-b.price_sgd||b.size_sqft-a.size_sqft);
    const sample=samples[0]||null;
    const completed=p?.completion_verified===true && Number.isFinite(p.top_year)&&p.top_year<=Number(options.asOf.slice(0,4));
    const familyKnown=!!sample&&completed;
    const category=!familyKnown?'verify':sample.price_sgd<=options.budget?'family_budget':'family_comfort';
    return {...condo,sample,completed,familyKnown,category,psf:sample?sample.price_sgd/sample.size_sqft:null,reasons:familyKnown?['matching_layout']:[],condition_verified:false};
  }
  function rank(rows,options){
    const values=rows.filter(r=>Number.isFinite(r.distance_m)&&r.distance_m<=options.radius).map(r=>evaluate(r,options));
    values.sort((a,b)=>{
      if(options.sort==='distance')return a.distance_m-b.distance_m||a.name.localeCompare(b.name);
      if(a.familyKnown!==b.familyKnown)return a.familyKnown?-1:1;
      if(!a.familyKnown)return a.distance_m-b.distance_m||a.name.localeCompare(b.name);
      if(a.category!==b.category)return a.category==='family_budget'?-1:1;
      if(options.sort==='family')return b.sample.beds-a.sample.beds||b.sample.size_sqft-a.sample.size_sqft||a.sample.price_sgd-b.sample.price_sgd;
      if(options.sort==='value')return a.psf-b.psf||a.sample.price_sgd-b.sample.price_sgd||a.distance_m-b.distance_m;
      return a.sample.price_sgd-b.sample.price_sgd||a.distance_m-b.distance_m||b.sample.size_sqft-a.sample.size_sqft;
    });
    return values.filter(r=>options.category==='all'||r.category===options.category);
  }
  return {evaluate,rank};
});
