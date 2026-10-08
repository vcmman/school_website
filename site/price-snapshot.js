(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PriceSnapshot = api;
})(typeof globalThis === 'object' ? globalThis : this, function() {
  'use strict';
  const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(value + 'T00:00:00Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
  function validate(snapshot, now = new Date()) {
    const fail = message => { throw new Error('Price snapshot: ' + message); };
    const only = (object, fields) => {
      if (!object || typeof object !== 'object' || Array.isArray(object) || Object.keys(object).some(k => !fields.includes(k))) fail('unexpected fields');
    };
    only(snapshot, ['schema_version','atlas_sha256','input_hashes','official','secondary','projects']);
    only(snapshot.input_hashes, ['ura','public']);
    only(snapshot.official, ['source','status','retrieved_on','coverage']);
    only(snapshot.official.coverage, ['downloaded_batches','expected_batches','national_coverage_complete']);
    only(snapshot.secondary, ['source','checked_on','coverage']);
    only(snapshot.projects, Object.keys(snapshot.projects || {}));
    if (snapshot?.schema_version !== 1 || !hash(snapshot.atlas_sha256) || !hash(snapshot.input_hashes?.ura) || !hash(snapshot.input_hashes?.public)) fail('invalid schema or provenance');
    const today = now.toISOString().slice(0, 10);
    for (const value of [snapshot.official?.retrieved_on, snapshot.secondary?.checked_on]) {
      if (!date(value) || value > today) fail('invalid or future evidence date');
    }
    const official = snapshot.official;
    if (!['partial', 'available'].includes(official.status) || official.source !== 'URA') fail('missing official evidence');
    const batches = official.coverage?.downloaded_batches;
    if (!Array.isArray(batches) || !batches.length || new Set(batches).size !== batches.length || batches.some(n => ![1,2,3,4].includes(n))) fail('invalid batch coverage');
    const complete = batches.length === 4;
    if (JSON.stringify(official.coverage.expected_batches) !== '[1,2,3,4]') fail('invalid expected coverage');
    if (official.coverage.national_coverage_complete !== complete || (official.status === 'available') !== complete) fail('misleading national coverage');
    if (snapshot.secondary.source !== 'Cashew' || snapshot.secondary.coverage !== 'displayed_samples_only') fail('invalid secondary source');
    if (!snapshot.projects || !Object.keys(snapshot.projects).length) fail('empty project summaries');
    let primaryCount = 0;
    for (const [key, project] of Object.entries(snapshot.projects)) {
      only(project, ['name','primary','secondary']);
      if (!project.name || project.name.toUpperCase().replace(/[^A-Z0-9]/g, '') !== key || key === 'RESIDENTIALAPARTMENTS') fail('invalid project identity');
      for (const kind of ['primary', 'secondary']) {
        const row = project[kind];
        if (!row) continue;
        only(row, ['source_kind','count','average_psf','min_size_sqft','max_size_sqft','first_month','last_month','checked_on','source_url','coverage']);
        if (kind === 'primary') primaryCount++;
        if (row.source_kind !== kind || !Number.isInteger(row.count) || row.count < 1 || ![row.average_psf, row.min_size_sqft, row.max_size_sqft].every(v => Number.isFinite(v) && v > 0) || row.min_size_sqft > row.max_size_sqft) fail('invalid aggregate');
        const retrieved = kind === 'primary' ? official.retrieved_on : snapshot.secondary.checked_on;
        if (!date(row.checked_on) || row.checked_on > retrieved) fail('invalid project date');
        if (kind === 'primary' && row.checked_on !== retrieved) fail('official date mismatch');
        const end = new Date(row.checked_on + 'T00:00:00Z');
        const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 12, 1)).toISOString().slice(0,7);
        if (![row.first_month, row.last_month].every(v => /^\d{4}-(0[1-9]|1[0-2])$/.test(v || '')) || row.first_month < start || row.first_month > row.last_month || row.last_month >= row.checked_on.slice(0,7)) fail('invalid transaction window');
        if (kind === 'secondary' && (!/^https:\/\/www\.cashew\.sg\/[^?#]+$/.test(row.source_url || '') || row.coverage !== 'displayed_sample_only')) fail('invalid public attribution');
        if (kind === 'primary' && ('source_url' in row || 'coverage' in row)) fail('unexpected primary attribution');
      }
      if (!project.primary && !project.secondary) fail('empty project');
    }
    if (!primaryCount) fail('no usable official summaries');
    return snapshot;
  }
  function summarize(snapshot, key, size) {
    if (!Number.isFinite(size) || size <= 0) return null;
    const project = snapshot?.projects?.[key];
    const row = project?.primary || project?.secondary;
    if (!row) return null;
    return {...row, size_sqft: size, estimate_sgd: row.count >= 3 && size >= row.min_size_sqft && size <= row.max_size_sqft ? row.average_psf * size : null};
  }
  return {validate, summarize};
});
