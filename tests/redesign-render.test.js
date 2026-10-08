const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise rendering and handlers offline; this does not replace visual browser QA.
async function renderPage(page,options={}){
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',value:'',textContent:''});return elements.get(id);};
 const radii=[1000,2000].map(r=>({dataset:{radius:String(r)}}));
 const requests=[];
 const timers=new Map();let timerID=0;
 const context={URL,URLSearchParams,Intl,AbortController,setTimeout:options.fakeTimers?(callback)=>{timers.set(++timerID,callback);return timerID;}:setTimeout,clearTimeout:options.fakeTimers?(id)=>timers.delete(id):clearTimeout,location:{search:'?school=henry-park',href:'http://localhost/'+page+'.html'},history:{replaceState(){}},localStorage:{getItem(){return 'en';},setItem(){}},document:{body:{dataset:{page}},documentElement:{},getElementById:get,querySelectorAll(selector){return selector==='[data-radius]'?radii:[];}},CondoPricing:require('../site/condo-pricing'),CondoRanking:require('../site/condo-ranking'),SchoolBalloting:require('../site/school-balloting'),SchoolRanking:require('../site/school-ranking'),PriceSnapshot:require('../site/price-snapshot'),fetch:async path=>{
   requests.push(path);
   if(options.fetch)return options.fetch(path);
   const filename='site/'+path.split('?')[0];const ok=fs.existsSync(filename)&&(!options.missingPrices||filename.endsWith('atlas_bundle.json'));
   return {ok,json:async()=>JSON.parse(fs.readFileSync(filename,'utf8'))};
 }};
 vm.runInNewContext(fs.readFileSync('site/redesign.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 return {get,radii,context,requests,timers};
}

test('school explorer loads without property payloads and language/search handlers remain usable',async()=>{
 const {get,context,requests}=await renderPage('explorer');
 assert.equal(requests.length,1);assert.match(get('detail').innerHTML,/HENRY PARK/i);
 get('language').onclick();assert.equal(context.document.documentElement.lang,'zh-CN');assert.match(get('detail').innerHTML,/报名与抽签历史/);
 get('search').oninput({target:{value:'no-such-school'}});assert.match(get('detail').innerHTML,/没有符合条件/);
 get('search').oninput({target:{value:'恒力'}});assert.match(get('detail').innerHTML,/HENRY PARK/i);
});

test('condo rendering preserves distance order and translated prices after area/radius changes',async()=>{
 const {get,radii}=await renderPage('condos');
 let html=get('detail').innerHTML;
 assert.ok(html.indexOf('GLENTREES')<html.indexOf('PARKSUITES'));assert.match(html,/nearest first/);
 get('language').onclick();assert.match(get('detail').innerHTML,/按距离由近到远/);
 get('estimate-size').onchange({target:{value:'1500'}});assert.match(get('detail').innerHTML,/1500 sqft/);
 radii[0].onclick();html=get('detail').innerHTML;assert.match(html,/GLENTREES/);assert.doesNotMatch(html,/DOVER PARKVIEW/);
});

test('missing price snapshot never breaks school browsing and is not treated as missing transactions',async()=>{
 const {get}=await renderPage('condos',{missingPrices:true});
 assert.match(get('detail').innerHTML,/GLENTREES/);assert.match(get('detail').innerHTML,/Price data could not be loaded/);
 assert.doesNotMatch(get('app').innerHTML,/Unable to load school data/);
 get('language').onclick();assert.match(get('detail').innerHTML,/价格数据加载失败/);
});

test('sorting note explains uniform fallback in both languages; no mixed-phase ranking',async()=>{
 const {get}=await renderPage('explorer');
 assert.match(get('sort-note').textContent,/All schools use 2026 2C/);
 const html=get('list').innerHTML;
 assert.ok(html.indexOf('data-school="admiralty"') < html.indexOf('data-school="bukit-view"'));
 get('language').onclick();assert.match(get('sort-note').textContent,/全表统一按 2026 年 2C/);
 get('sort').onchange({target:{value:'name'}});assert.equal(get('sort-note').textContent,'');
});

test('condo page loads only public aggregates, not ignored transaction payloads',async()=>{
 const {get,requests}=await renderPage('condos');
 assert.equal(requests.length,2);assert.ok(requests[1].startsWith('data/condo_price_summary.json'));
 assert.match(get('detail').innerHTML,/URA original resale average/);
 assert.match(get('detail').innerHTML,/2026-10-06/);
});

test('slow price fetch does not block school, language, search, or radius; timeout can be retried',async()=>{
 let block=true;
 const {get,radii,timers}=await renderPage('condos',{fakeTimers:true,fetch:path=>{
   if(path.includes('condo_price_summary')&&block)return new Promise(()=>{});
   return Promise.resolve({ok:true,json:async()=>JSON.parse(fs.readFileSync('site/'+path.split('?')[0]))});
 }});
 assert.match(get('detail').innerHTML,/Loading price evidence/);
 get('language').onclick();radii[0].onclick();assert.match(get('detail').innerHTML,/正在加载价格证据/);
 assert.doesNotMatch(get('detail').innerHTML,/DOVER PARKVIEW/);
 get('search').oninput({target:{value:'恒力'}});assert.match(get('detail').innerHTML,/HENRY PARK/i);
 for(const callback of [...timers.values()])callback();
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(get('detail').innerHTML,/价格数据加载失败/);
 block=false;get('retry-prices').onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.match(get('detail').innerHTML,/转售样本平均尺价/);
 assert.doesNotMatch(get('detail').innerHTML,/正在加载价格证据|价格数据加载失败/);
 assert.equal(timers.size,0);
});

test('invalid snapshot and school request failures have distinct translated error states',async()=>{
 const {get}=await renderPage('condos',{fetch:path=>Promise.resolve({ok:true,json:async()=>path.includes('atlas_bundle')?JSON.parse(fs.readFileSync('site/data/atlas_bundle.json')):{schema_version:999}})});
 assert.match(get('detail').innerHTML,/Price data could not be loaded/);
 const failure=await renderPage('explorer',{fetch:()=>Promise.reject(new Error('offline'))});
 assert.match(failure.get('app').innerHTML,/Unable to load school data/);
});
