(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolBalloting=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function describe(result,language='en'){
    const zh=language==='zh',t=(en,cn)=>zh?cn:en;
    if(!result)return t('Citizenship / distance not verified','公民／PR 距离界线未核实');
    if(result.vacancy===0)return t('No places / phase not conducted','无剩余学额／未开展该阶段');
    const text=result.result_text||'';
    if(/cap on the intake of Permanent Resident/.test(text))return t('PR intake-cap ballot; distance group not stated','PR 招生上限触发抽签；未公布距离组别');
    if(text){
      const groups=[];
      const expression=/(all )?(Singapore Citizen|Permanent Resident) children(?: residing (within 1km|within 2km|between 1km and 2km|outside 2km) of the school)?/g;
      let match;
      while((match=expression.exec(text))){
        const citizen=match[2]==='Singapore Citizen'?t('SC (citizen)','SC（公民）'):t('PR (permanent resident)','PR（永久居民）');
        const distance={'within 1km':'≤1km','within 2km':'≤2km','between 1km and 2km':'>1–2km','outside 2km':'>2km'}[match[3]];
        groups.push(citizen+(distance?' '+distance:match[1]?t(' · all distances',' · 所有距离'):t(' · distance unspecified',' · 距离未注明')));
      }
      if(groups.length)return t(/No balloting/.test(text)?'Admitted without ballot: ':'Balloting group: ',/No balloting/.test(text)?'无需抽签获录：':'需抽签组别：')+groups.join(t(' + ','及'));
    }
    if(result.balloting_required===false)return t('No ballot required; group breakdown not stated','无需抽签；未提供身份／距离分组');
    return t('Group unclear; consult the MOE source','组别不明确，请查阅 MOE 原文');
  }
  return {describe};
});
