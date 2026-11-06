const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {build} = require('../scripts/build_hdb_research');
const years = Object.fromEntries(Array.from({length:21}, (_,i)=>[2005+i,100+i]));
const row = name => ({DataSeries:name,...years});
const construction = {result:{records:[row('Flats Constructed')]}};
const stock = {result:{records:[row('Total Residential Units'),row('  Clementi'),row('Queenstown'),row('1-Room Residential Units'),{...row('Clementi'),2025:99999}]}};
const atlas = {verification_report:{checked_on:'2026-10-06'},primary_schools:['clementi','fairfield-methodist','henry-park','queenstown'].map(slug=>({slug,name:slug,ballot_history:[]}))};
const run = (c=construction,s=stock) => build(JSON.stringify(c),JSON.stringify(s),JSON.stringify(atlas));
test('HDB stock uses town totals without adding repeated room-type subtotals',()=>{
  const result=run();
  assert.equal(result.annual.at(-1).clementi,120);
  assert.equal(result.annual[0].year,2005);
  assert.equal(result.annual.at(-1).year,2025);
});
test('missing observations and unrecognized stock sections fail instead of producing misleading charts',()=>{
  const bad=structuredClone(construction);delete bad.result.records[0][2020];
  assert.throws(()=>run(bad),/Invalid annual observation: 2020/);
  assert.throws(()=>run(construction,{result:{records:stock.result.records.slice(0,3)}}),/Missing total-stock section/);
});
test('published research snapshot has complete school denominators and reconciles headline comparisons',()=>{
  const data=JSON.parse(fs.readFileSync('site/data/hdb_growth.json','utf8'));
  for(const school of data.schools) for(const year of [2023,2024,2025,2026]) {
    const history=school.history.find(r=>r.year===year);
    assert.ok(history,school.slug+' '+year);
    assert.ok(history.vacancy['2C']>0);
    assert.ok(Number.isInteger(history.applied['2C']));
  }
  const annual=data.annual;
  assert.equal(annual.filter(r=>r.year>=2021).reduce((sum,r)=>sum+r.constructed,0),92811);
  assert.equal(annual.at(-1).clementi-annual.find(r=>r.year===2020).clementi,1982);
  assert.equal(annual.at(-1).queenstown-annual.find(r=>r.year===2020).queenstown,-1099);
});
