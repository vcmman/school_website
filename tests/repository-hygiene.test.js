const test=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

test('download and intermediate rules do not hide public datasets or manual inputs',()=>{
 const ignored=['data/cache/future-response.json','data/cache/nested/download.csv','data/rebuild/raw/source.html','data/rebuild/coordinates.json','data/rebuild/projects.json','data/rebuild/schools.json','data/rebuild/audit.json','data/rebuild/ura-projects.json','data/rebuild/progress.log','.private/ura/batch-1.json','.env.ura','site/data/ura_transactions.json','site/data/property_evidence.json'];
 const kept=['site/data/atlas_bundle.json','site/data/atlas_schools.json','site/data/school_condos_2km.json','site/data/site.json','site/data/school_data_audit.json','data/rebuild/README.md','data/rebuild/property-exclusions.json','data/condo_query_overrides.json','data/condo_family_profiles.json','data/propertyguru_condos.csv','data/top20_schools.csv'];
 kept.push('site/data/condo_price_summary.json','scripts/build_price_summary.js','scripts/prepare_release.js','.github/workflows/checks.yml');
 ignored.push('.build/site/index.html','.release-example/site/data/atlas_bundle.json','site/data/condo_price_summary.json.tmp');
 const result=spawnSync('git',['check-ignore','--no-index','--stdin'],{cwd:root,input:[...ignored,...kept].join('\n')+'\n',encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.deepEqual(new Set(result.stdout.trim().split('\n')),new Set(ignored));
});

test('the index contains no local cache or rebuild intermediates',()=>{
 const result=spawnSync('git',['ls-files','-z','--','data/cache','data/rebuild'],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.deepEqual(result.stdout.split('\0').filter(Boolean).sort(),['data/rebuild/README.md','data/rebuild/property-exclusions.json']);
});
