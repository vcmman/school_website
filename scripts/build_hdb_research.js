'use strict';
// Rebuild from the two public data.gov.sg datastore responses; no private inputs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
function build(constructionBytes, stockBytes, atlasBytes) {
  const construction = JSON.parse(constructionBytes).result.records.find(r => r.DataSeries === 'Flats Constructed');
  const rows = JSON.parse(stockBytes).result.records;
  // Town labels repeat under room-type subtotals. Select only the TOTAL section.
  const end = rows.findIndex(r => r.DataSeries === '1-Room Residential Units');
  if (end < 0) throw new Error('Missing total-stock section');
  const totals = rows.slice(0, end);
  const series = ['Total Residential Units','Clementi','Queenstown'].map(name => totals.find(r => r.DataSeries.trim() === name));
  const annual = Array.from({length:21}, (_,i) => {
    const year = 2005+i;
    const values = [construction, ...series].map(r => Number(r?.[year]));
    if (!values.every(v => Number.isInteger(v) && v > 0)) throw new Error('Invalid annual observation: '+year);
    return {year,constructed:values[0],national:values[1],clementi:values[2],queenstown:values[3]};
  });
  const slugs = ['clementi','fairfield-methodist','henry-park','queenstown'];
  const atlas = JSON.parse(atlasBytes);
  const schools = slugs.map(slug => {
    const school = atlas.primary_schools.find(s => s.slug === slug);
    if (!school) throw new Error('Missing school '+slug);
    return {slug,name:school.name,history:school.ballot_history.filter(r => r.year >= 2023).sort((a,b)=>a.year-b.year)};
  });
  const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  return {schema_version:1,researched_on:'2026-11-06',annual_data_updated_on:'2026-05-11',school_checked_on:atlas.verification_report.checked_on,
    sources:{construction:'https://data.gov.sg/datasets/d_5363b6c403ae9a7d91c387eae64c4fac/view',stock:'https://data.gov.sg/datasets/d_06d2fe53728d2d971f1a8beae3c882d9/view'},
    hashes:{construction:hash(constructionBytes),stock:hash(stockBytes),schools:hash(atlasBytes)},annual,schools};
}
if (require.main === module) {
  const [construction, stock] = process.argv.slice(2);
  if (!construction || !stock) throw new Error('Usage: node scripts/build_hdb_research.js CONSTRUCTION_RESPONSE STOCK_RESPONSE');
  const data = build(fs.readFileSync(construction),fs.readFileSync(stock),fs.readFileSync(path.join(root,'site/data/atlas_bundle.json')));
  fs.writeFileSync(path.join(root,'site/data/hdb_growth.json'),JSON.stringify(data,null,2)+'\n');
  console.log('HDB research: 21 annual observations including 2005 baseline; 4 schools');
}
module.exports = {build};
