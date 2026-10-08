'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const Snapshot = require('../site/price-snapshot');
const {digest} = require('./build_price_summary');
const root = path.resolve(__dirname, '..');
const required = ['index.html', 'school-condos.html', 'redesign.css', 'redesign.js', 'school-ranking.js', 'school-balloting.js', 'condo-pricing.js', 'condo-ranking.js', 'price-snapshot.js', 'data/atlas_bundle.json', 'data/condo_price_summary.json'];
// Explicit public assets avoid accidentally shipping arbitrary local JSON or CLI output.
const publicAssets = [...required, 'app.js', 'condo.html', 'condo.js', 'house.html', 'house.js', 'invest.html', 'invest.js', 'research.html', 'research.js', 'ai-stocks.html', 'i18n.js', 'school-condos.js', 'styles.css',
  'data/atlas_schools.json', 'data/school_condos_2km.json', 'data/school_data_audit.json', 'data/site.json', 'data/investment_condos.json', 'data/investment_condos.js'];

function verify(rootPath = root) {
  const site = path.join(rootPath, 'site');
  for (const file of required) if (!fs.statSync(path.join(site, file)).isFile()) throw new Error('Missing release asset: ' + file);
  const atlasBytes = fs.readFileSync(path.join(site, 'data/atlas_bundle.json'));
  const atlas = JSON.parse(atlasBytes);
  if (atlas.schema_version !== 2 || !atlas.primary_schools?.length || !atlas.condos?.schools || !Number.isInteger(atlas.stats?.latest_ballot_year)) throw new Error('Invalid school bundle');
  const snapshot = Snapshot.validate(JSON.parse(fs.readFileSync(path.join(site, 'data/condo_price_summary.json'))));
  if (snapshot.atlas_sha256 !== digest(atlasBytes)) throw new Error('School bundle changed: regenerate the public price summary before publishing');
  const projectKeys = new Set(Object.values(atlas.condos.schools).flat().map(p => p.name.toUpperCase().replace(/[^A-Z0-9]/g, '')));
  for (const key of Object.keys(snapshot.projects)) if (!projectKeys.has(key)) throw new Error('Unknown price project: ' + key);
  for (const file of publicAssets.filter(file => file.endsWith('.js') && fs.existsSync(path.join(site, file)))) {
    const check = spawnSync(process.execPath, ['--check', path.join(site, file)], {encoding: 'utf8'});
    if (check.status !== 0) throw new Error('Invalid JavaScript: ' + file + '\n' + check.stderr);
  }
  for (const file of ['index.html', 'school-condos.html']) {
    const html = fs.readFileSync(path.join(site, file), 'utf8');
    for (const [, asset] of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)) {
      if (/^[a-z]+:|^#/.test(asset)) continue;
      if (!fs.existsSync(path.join(site, asset))) throw new Error('Broken HTML asset: ' + asset);
    }
    for (const script of ['school-ranking.js','price-snapshot.js']) if (!html.includes(script)) throw new Error('Missing page module: ' + script);
  }
  return snapshot;
}
function prepare(rootPath = root) {
  const snapshot = verify(rootPath);
  const staging = fs.mkdtempSync(path.join(rootPath, '.release-'));
  const hashes = {};
  try {
    const copy = relative => {
      const source = path.join(rootPath, 'site', relative);
      if (fs.lstatSync(source).isSymbolicLink()) throw new Error('Symlink not allowed in release: ' + relative);
      const bytes = fs.readFileSync(source);
      const destination = path.join(staging, 'site', relative);
      fs.mkdirSync(path.dirname(destination), {recursive: true});
      fs.writeFileSync(destination, bytes);
      hashes[relative] = digest(bytes);
    };
    for (const file of publicAssets.slice().sort()) if (fs.existsSync(path.join(rootPath, 'site', file))) copy(file);
    fs.writeFileSync(path.join(staging, 'site/data/release_manifest.json'), JSON.stringify({schema_version: 1, official_evidence_date: snapshot.official.retrieved_on, secondary_evidence_date: snapshot.secondary.checked_on, official_status: snapshot.official.status, files: hashes}) + '\n');
    const destination = path.join(rootPath, '.build');
    fs.rmSync(destination, {recursive: true, force: true});
    fs.renameSync(staging, destination);
    return {files: hashes, projects: Object.keys(snapshot.projects).length};
  } finally { fs.rmSync(staging, {recursive: true, force: true}); }
}
if (require.main === module) {
  try {
    const result = process.argv.includes('--verify-only') ? verify() : prepare();
    console.log(process.argv.includes('--verify-only') ? 'Release data and assets verified' : `Release prepared: ${Object.keys(result.files).length} public files, ${result.projects} price summaries`);
  } catch (error) { console.error('Release blocked: ' + error.message); process.exitCode = 1; }
}
module.exports = {verify, prepare};
