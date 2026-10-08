const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {build, write, digest} = require('../scripts/build_price_summary');
const {verify, prepare} = require('../scripts/prepare_release');
const Snapshot = require('../site/price-snapshot');
const serialize = value => Buffer.from(JSON.stringify(value));
const fixture = () => {
  const atlas = {schema_version:2,stats:{latest_ballot_year:2026},primary_schools:[{name:'Test School'}],condos:{schools:{test:[{name:'Test Condo'},{name:'Public Condo'}]}}};
  const ura = {schema_version:1,source:'URA',status:'partial',as_of_date:'2026-10-06',retrieved_on:'2026-10-06',raw_hashes:{'batch-1.json':'a'.repeat(64)},coverage:{downloaded_batches:[1],expected_batches:[1,2,3,4],national_coverage_complete:false},records:[90,100,120].map(area_sqm=>({source:'URA',project:'Test Condo',property_type:'Condominium',units:1,area_type:'strata',sale_type:'resale',contract_month:'2026-09',area_sqm,price_sgd:area_sqm*20000}))};
  const evidence = {schema_version:1,source:'Cashew',checked_on:'2026-10-06',coverage:'displayed_samples_only',projects:{PUBLICCONDO:{source:'Cashew',name:'Public Condo',checked_on:'2026-10-06',source_url:'https://www.cashew.sg/property/public-condo',records:[800,1000,1200].map(area_sqft_approx=>({source:'Cashew',project:'Public Condo',sale_type:'resale',contract_month:'2026-09',area_sqft_approx,price_sgd:area_sqft_approx*1800,reported_psf:1800}))}}};
  return {atlas,ura,evidence};
};

test('derived summary retains price arithmetic and provenance without individual transactions',()=>{
  const {atlas,ura,evidence}=fixture();
  const output=build(serialize(atlas),serialize(ura),serialize(evidence));
  assert.equal(output.atlas_sha256,digest(serialize(atlas)));
  assert.equal(output.input_hashes.ura,digest(serialize(ura)));
  const primary=Snapshot.summarize(output,'TESTCONDO',1000);
  assert.equal(primary.count,3);assert.ok(Math.abs(primary.average_psf-20000/10.7639104167)<1e-8);
  assert.equal(primary.estimate_sgd,primary.average_psf*1000);
  assert.equal(Snapshot.summarize(output,'PUBLICCONDO',1000).estimate_sgd,1800000);
  assert.equal(Snapshot.summarize(output,'PUBLICCONDO',1500).estimate_sgd,null);
  assert.equal(Snapshot.summarize(output,'UNKNOWN',1000),null);
  assert.equal(Snapshot.summarize(output,'TESTCONDO',NaN),null);
  assert.doesNotMatch(JSON.stringify(output),/"records"|"recent"|"price_sgd"|"floor_range"|"layouts"/);
});
test('primary evidence wins without pooling sources, and sparse samples never give estimates',()=>{
  const {atlas,ura,evidence}=fixture();
  evidence.projects.TESTCONDO={...evidence.projects.PUBLICCONDO,name:'Test Condo',records:evidence.projects.PUBLICCONDO.records.map(r=>({...r,project:'Test Condo'}))};
  ura.records=ura.records.slice(0,1);
  const output=build(serialize(atlas),serialize(ura),serialize(evidence));
  assert.ok(output.projects.TESTCONDO.secondary);
  assert.equal(Snapshot.summarize(output,'TESTCONDO',1000).source_kind,'primary');
  assert.equal(Snapshot.summarize(output,'TESTCONDO',1000).count,1);
  assert.equal(Snapshot.summarize(output,'TESTCONDO',1000).estimate_sgd,null);
});
test('invalid or misleading snapshots cannot pass validation',()=>{
  const {atlas,ura,evidence}=fixture();
  const good=build(serialize(atlas),serialize(ura),serialize(evidence));
  const mutations=[
    s=>s.schema_version=99, s=>s.atlas_sha256='broken', s=>s.input_hashes.ura='broken',
    s=>s.official.status='available', s=>s.official.coverage.national_coverage_complete=true,
    s=>s.official.coverage.downloaded_batches=[1,1], s=>s.official.coverage.downloaded_batches=[],
    s=>s.official.retrieved_on='2099-01-01', s=>s.official.retrieved_on='2026-02-30',
    s=>s.projects={}, s=>s.projects.TESTCONDO.primary.average_psf=-1,
    s=>s.projects.TESTCONDO.primary.count=2.5, s=>s.projects.TESTCONDO.primary.min_size_sqft=99999,
    s=>s.projects.TESTCONDO.primary.last_month='2026-10',s=>s.projects.TESTCONDO.primary.first_month='2025-09',
    s=>s.projects.PUBLICCONDO.secondary.source_url='https://example.com/incorrect',
    s=>s.projects.PUBLICCONDO.secondary.source_url+='?token=secret',
    s=>s.projects.TESTCONDO.primary.records=[],s=>s.credentials='secret',
    s=>s.projects.TESTCONDO.layouts=[],s=>s.official.access_key='secret',
    s=>delete s.projects.TESTCONDO.primary,
  ];
  for(const mutate of mutations){const copy=structuredClone(good);mutate(copy);assert.throws(()=>Snapshot.validate(copy));}
});
test('a failed refresh retains the previous public snapshot byte-for-byte',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-refresh-'));
  try {
    const directory=path.join(root,'site/data');fs.mkdirSync(directory,{recursive:true});
    const {atlas,ura,evidence}=fixture();
    for(const [name,value] of [['atlas_bundle',atlas],['ura_transactions',ura],['property_evidence',evidence]])fs.writeFileSync(path.join(directory,name+'.json'),serialize(value));
    write(root);const good=fs.readFileSync(path.join(directory,'condo_price_summary.json'));
    fs.writeFileSync(path.join(directory,'property_evidence.json'),'{}');assert.throws(()=>write(root));
    assert.deepEqual(fs.readFileSync(path.join(directory,'condo_price_summary.json')),good);
    fs.unlinkSync(path.join(directory,'ura_transactions.json'));assert.throws(()=>write(root));
    assert.deepEqual(fs.readFileSync(path.join(directory,'condo_price_summary.json')),good);
    assert.equal(fs.existsSync(path.join(directory,'condo_price_summary.json.tmp')),false);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('older evidence cannot replace a newer published snapshot or acquire a fresh build date',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-older-evidence-'));
  try {
    const directory=path.join(root,'site/data');fs.mkdirSync(directory,{recursive:true});
    const {atlas,ura,evidence}=fixture();
    for(const [name,value] of [['atlas_bundle',atlas],['ura_transactions',ura],['property_evidence',evidence]])fs.writeFileSync(path.join(directory,name+'.json'),serialize(value));
    write(root);const previous=fs.readFileSync(path.join(directory,'condo_price_summary.json'));
    ura.as_of_date=ura.retrieved_on='2026-09-06';ura.records=ura.records.map(r=>({...r,contract_month:'2026-08'}));
    fs.writeFileSync(path.join(directory,'ura_transactions.json'),serialize(ura));
    assert.throws(()=>write(root),/Older evidence/);
    assert.deepEqual(fs.readFileSync(path.join(directory,'condo_price_summary.json')),previous);
    assert.equal(JSON.parse(previous).official.retrieved_on,'2026-10-06');
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
function cleanRelease() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-release-'));
  fs.mkdirSync(path.join(root,'site/data'),{recursive:true});
  for(const file of fs.readdirSync('site'))if(/^[\w-]+\.(js|css|html)$/.test(file))fs.copyFileSync(path.join('site',file),path.join(root,'site',file));
  for(const file of ['atlas_bundle.json','condo_price_summary.json'])fs.copyFileSync(path.join('site/data',file),path.join(root,'site/data',file));
  return root;
}
test('a clean checkout builds with only tracked public data and never publishes private inputs',()=>{
  const root=cleanRelease();
  try {
    for(const file of ['ura_transactions.json','property_evidence.json'])assert.equal(fs.existsSync(path.join(root,'site/data',file)),false);
    assert.equal(verify(root).official.status,'partial');
    // Even if present locally, ignored inputs and nested CLI output never enter the artifact.
    for(const file of ['ura_transactions.json','property_evidence.json'])fs.writeFileSync(path.join(root,'site/data',file),'private synthetic input');
    fs.mkdirSync(path.join(root,'site/.vercel/output'),{recursive:true});fs.writeFileSync(path.join(root,'site/.vercel/output/secret.json'),'private');
    fs.writeFileSync(path.join(root,'site/.env.ura'),'private');fs.writeFileSync(path.join(root,'site/test.cpp'),'private');
    fs.writeFileSync(path.join(root,'site/data/private-notes.json'),'private');
    fs.writeFileSync(path.join(root,'site/private-credentials.js'),'const secret = "private";');
    const result=prepare(root);
    assert.ok(result.files['data/condo_price_summary.json']);
    for(const file of ['data/ura_transactions.json','data/property_evidence.json','data/private-notes.json','private-credentials.js','.env.ura','.vercel','test.cpp'])assert.equal(fs.existsSync(path.join(root,'.build/site',file)),false);
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'.build/site/data/release_manifest.json')));
    assert.equal(manifest.files['data/condo_price_summary.json'],digest(fs.readFileSync(path.join(root,'.build/site/data/condo_price_summary.json'))));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('missing data, changed school bundles and invalid scripts block a release without destroying the last build',()=>{
  const root=cleanRelease();
  try {
    prepare(root);const previous=fs.readFileSync(path.join(root,'.build/site/data/condo_price_summary.json'));
    fs.appendFileSync(path.join(root,'site/data/atlas_bundle.json'),'\n');assert.throws(()=>prepare(root),/regenerate/);
    assert.deepEqual(fs.readFileSync(path.join(root,'.build/site/data/condo_price_summary.json')),previous);
    fs.copyFileSync('site/data/atlas_bundle.json',path.join(root,'site/data/atlas_bundle.json'));
    fs.appendFileSync(path.join(root,'site/redesign.js'),'\ninvalid syntax here');assert.throws(()=>verify(root),/Invalid JavaScript/);
    fs.unlinkSync(path.join(root,'site/data/condo_price_summary.json'));assert.throws(()=>prepare(root));
    assert.deepEqual(fs.readFileSync(path.join(root,'.build/site/data/condo_price_summary.json')),previous);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('Vercel deploy configuration runs the gate and uploads build scripts but not private price files',()=>{
  const config=JSON.parse(fs.readFileSync('vercel.json'));
  assert.equal(config.buildCommand,'npm run build');assert.equal(config.outputDirectory,'.build');
  const ignores=fs.readFileSync('.vercelignore','utf8').split('\n');
  assert.ok(!ignores.includes('/scripts/'));assert.ok(ignores.includes('/site/data/ura_transactions.json'));
  assert.ok(ignores.includes('/site/data/property_evidence.json'));
  const workflow=fs.readFileSync('.github/workflows/checks.yml','utf8');
  for(const check of ['npm test','npm run test:python','npm run build'])assert.ok(workflow.includes(check));
});
