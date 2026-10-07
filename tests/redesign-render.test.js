const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise rendering and handlers offline; this does not replace visual browser QA.
async function renderPage(page,missingPrices=false){
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',value:'',textContent:''});return elements.get(id);};
 const radii=[1000,2000].map(r=>({dataset:{radius:String(r)}}));
 const requests=[];
 const context={URL,URLSearchParams,Intl,location:{search:'?school=henry-park',href:'http://localhost/'+page+'.html'},history:{replaceState(){}},localStorage:{getItem(){return 'en';},setItem(){}},document:{body:{dataset:{page}},documentElement:{},getElementById:get,querySelectorAll(selector){return selector==='[data-radius]'?radii:[];}},CondoPricing:require('../site/condo-pricing'),CondoRanking:require('../site/condo-ranking'),SchoolBalloting:require('../site/school-balloting'),fetch:async path=>{
   requests.push(path);const filename='site/'+path.split('?')[0];const ok=fs.existsSync(filename)&&(!missingPrices||filename.endsWith('atlas_bundle.json'));
   return {ok,json:async()=>JSON.parse(fs.readFileSync(filename,'utf8'))};
 }};
 vm.runInNewContext(fs.readFileSync('site/redesign.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 return {get,radii,context,requests};
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

test('missing ignored price files never break school or condo browsing',async()=>{
 const {get}=await renderPage('condos',true);
 assert.match(get('detail').innerHTML,/GLENTREES/);assert.match(get('detail').innerHTML,/No usable resale evidence/);
 assert.doesNotMatch(get('app').innerHTML,/Unable to load school data/);
 get('language').onclick();assert.match(get('detail').innerHTML,/暂无可用转售成交证据/);
});
