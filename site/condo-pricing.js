(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CondoPricing=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const normalize = name => String(name||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  function summarize(records,project,asOf,size){
    const end=new Date(asOf+'T00:00:00Z');
    if(!Number.isFinite(end.getTime())||!Number.isFinite(size)||size<=0)return null;
    const cutoff=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),1));
    const start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-12,1));
    // Compare ordinary individual resales, never mix developer/bulk sales or land area.
    const rows=records.filter(r=>{
      const date=new Date(r.contract_month+'-01T00:00:00Z');
      return normalize(project)!=='RESIDENTIALAPARTMENTS'&&normalize(r.project)===normalize(project)&&r.source==='URA'&&r.sale_type==='resale'&&r.area_type==='strata'&&r.units===1&&['Condominium','Apartment','Executive Condominium'].includes(r.property_type)&&/^\d{4}-(0[1-9]|1[0-2])$/.test(r.contract_month||'')&&date>=start&&date<cutoff&&Number.isFinite(r.price_sgd)&&r.price_sgd>0&&Number.isFinite(r.area_sqm)&&r.area_sqm>0;
    });
    if(!rows.length)return null;
    const psf=rows.reduce((sum,r)=>sum+r.price_sgd/(r.area_sqm*10.7639104167),0)/rows.length;
    const min=Math.min(...rows.map(r=>r.area_sqm*10.7639104167)),max=Math.max(...rows.map(r=>r.area_sqm*10.7639104167));
    return {count:rows.length,average_psf:psf,estimate_sgd:rows.length>=3&&size>=min&&size<=max?psf*size:null,size_sqft:size,first_month:rows.map(r=>r.contract_month).sort()[0],last_month:rows.map(r=>r.contract_month).sort().at(-1),min_size_sqft:min,max_size_sqft:max,source_kind:'primary',recent:rows.slice().sort((a,b)=>b.contract_month.localeCompare(a.contract_month)).slice(0,3).map(r=>({...r,area_sqft_approx:r.area_sqm*10.7639104167}))};
  }
  function byDistance(rows,radius){return rows.filter(r=>Number.isFinite(r.distance_m)&&r.distance_m>=0&&r.distance_m<=radius).sort((a,b)=>a.distance_m-b.distance_m||a.name.localeCompare(b.name));}
  function summarizePublic(evidence,asOf,size){
    if(evidence?.source!=='Cashew'||!Number.isFinite(size)||size<=0)return null;
    const end=new Date(asOf+'T00:00:00Z');
    if(!Number.isFinite(end.getTime()))return null;
    const cutoff=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),1));
    const start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-12,1));
    const rows=(evidence.records||[]).filter(r=>{
      const date=new Date(r.contract_month+'-01T00:00:00Z');
      return r.source==='Cashew'&&normalize(r.project)===normalize(evidence.name)&&r.sale_type==='resale'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(r.contract_month||'')&&date>=start&&date<cutoff&&Number.isFinite(r.price_sgd)&&r.price_sgd>0&&Number.isFinite(r.area_sqft_approx)&&r.area_sqft_approx>0&&Number.isFinite(r.reported_psf)&&r.reported_psf>0&&Math.abs(r.price_sgd/r.area_sqft_approx-r.reported_psf)<=Math.max(3,r.reported_psf*.003);
    });
    if(!rows.length)return null;
    const psf=rows.reduce((sum,r)=>sum+r.reported_psf,0)/rows.length;
    const min=Math.min(...rows.map(r=>r.area_sqft_approx)),max=Math.max(...rows.map(r=>r.area_sqft_approx));
    return {count:rows.length,average_psf:psf,estimate_sgd:rows.length>=3&&size>=min&&size<=max?psf*size:null,size_sqft:size,first_month:rows.map(r=>r.contract_month).sort()[0],last_month:rows.map(r=>r.contract_month).sort().at(-1),min_size_sqft:min,max_size_sqft:max,source_kind:'secondary',source_url:evidence.source_url,coverage:'displayed_sample_only',recent:rows.slice().sort((a,b)=>b.contract_month.localeCompare(a.contract_month)).slice(0,3)};
  }
  return {summarize,summarizePublic,byDistance,normalize};
});
