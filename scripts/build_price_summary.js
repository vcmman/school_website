'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Pricing = require('../site/condo-pricing');
const Snapshot = require('../site/price-snapshot');
const root = path.resolve(__dirname, '..');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function build(atlasBytes, uraBytes, publicBytes) {
  const atlas = JSON.parse(atlasBytes), ura = JSON.parse(uraBytes), evidence = JSON.parse(publicBytes);
  if (atlas.schema_version !== 2 || !atlas.condos?.schools || ura.schema_version !== 1 || ura.source !== 'URA' || !ura.records?.length || !Object.keys(ura.raw_hashes || {}).length || evidence.schema_version !== 1 || evidence.source !== 'Cashew' || !Object.keys(evidence.projects || {}).length) throw new Error('Missing or invalid input evidence; retain the last good snapshot');
  const groups = new Map();
  for (const row of ura.records) {
    const key = Pricing.normalize(row.project);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const projects = {};
  const names = [...new Set(Object.values(atlas.condos.schools).flat().map(p => p.name))].sort();
  function aggregate(stats, checkedOn) {
    if (!stats) return null;
    const {source_kind, count, average_psf, min_size_sqft, max_size_sqft, first_month, last_month} = stats;
    return {source_kind, count, average_psf, min_size_sqft, max_size_sqft, first_month, last_month, checked_on: checkedOn,
      ...(source_kind === 'secondary' ? {source_url: stats.source_url, coverage: stats.coverage} : {})};
  }
  for (const name of names) {
    const key = Pricing.normalize(name), entry = evidence.projects[key];
    const primary = aggregate(Pricing.summarize(groups.get(key) || [], name, ura.as_of_date, 1000), ura.retrieved_on);
    const secondary = aggregate(Pricing.summarizePublic(entry, entry?.checked_on, 1000), entry?.checked_on);
    if (primary || secondary) {
      if (projects[key]) throw new Error('Ambiguous normalized project name');
      projects[key] = {name, ...(primary ? {primary} : {}), ...(secondary ? {secondary} : {})};
    }
  }
  if (ura.as_of_date !== ura.retrieved_on) throw new Error('Official snapshot date mismatch');
  const output = {schema_version: 1, atlas_sha256: digest(atlasBytes), input_hashes: {ura: digest(uraBytes), public: digest(publicBytes)},
    official: {source: 'URA', status: ura.status, retrieved_on: ura.retrieved_on, coverage: ura.coverage},
    secondary: {source: 'Cashew', checked_on: evidence.checked_on, coverage: evidence.coverage}, projects};
  return Snapshot.validate(output);
}
function write(rootPath = root) {
  const read = file => fs.readFileSync(path.join(rootPath, 'site/data', file));
  const output = build(read('atlas_bundle.json'), read('ura_transactions.json'), read('property_evidence.json'));
  const destination = path.join(rootPath, 'site/data/condo_price_summary.json');
  if (fs.existsSync(destination)) {
    const previous = Snapshot.validate(JSON.parse(fs.readFileSync(destination)));
    if (output.official.retrieved_on < previous.official.retrieved_on || output.secondary.checked_on < previous.secondary.checked_on) throw new Error('Older evidence cannot replace the last good snapshot');
  }
  const temp = destination + '.tmp';
  try {
    fs.writeFileSync(temp, JSON.stringify(output) + '\n');
    fs.renameSync(temp, destination);
  } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
  return output;
}
if (require.main === module) {
  try { const output = write(); console.log(`Published aggregate snapshot: ${Object.keys(output.projects).length} projects; official coverage ${output.official.status}`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {build, write, digest};
