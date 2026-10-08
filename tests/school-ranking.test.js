const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {pressure, plan, rank} = require('../site/school-ranking');
const school = (name, cs, c, year = 2026) => ({name, slug: name, ballot_history: [{year, applied: {'2C(S)': cs?.[0], '2C': c?.[0]}, vacancy: {'2C(S)': cs?.[1], '2C': c?.[1]}}]});
const names = rows => rows.map(s => s.name);

test('comparable 2C(S) ratios first, equal ratios use 2C, hardest first', () => {
  const rows = [school('Easy', [5,10], [5,10]), school('Hard', [20,10], [10,10]), school('Tie', [20,10], [30,10])];
  const policy = plan(rows, 2026);
  assert.equal(policy.phase, '2C(S)');
  assert.deepEqual(names(rank(rows, policy)), ['Tie','Hard','Easy']);
  assert.deepEqual(names(rows), ['Easy','Hard','Tie']);
});
test('fallback uses the same 2C phase for every school, not mixed phase ratios', () => {
  const rows = [school('Admiralty', [0,0], [87,40]), school('Bukit View', [39,5], [207,212])];
  assert.deepEqual(plan(rows, 2026), {year: 2026, phase: '2C', fallback: true});
  assert.deepEqual(names(rank(rows, plan(rows, 2026))), ['Admiralty','Bukit View']);
});
test('current dataset regression: Admiralty precedes Bukit View under uniform fallback', () => {
  const rows = JSON.parse(fs.readFileSync('site/data/atlas_bundle.json')).primary_schools;
  const result = rank(rows, plan(rows, 2026));
  assert.equal(plan(rows, 2026).phase, '2C');
  assert.ok(result.findIndex(s => s.slug === 'admiralty') < result.findIndex(s => s.slug === 'bukit-view'));
});
test('zero places, invalid counts and other years are unknown; zero applicants are valid', () => {
  for (const counts of [[0,0], [1,0], [-1,10], [10,-1], [1.5,10], [10,2.5], ['10',10], [Infinity,10], [NaN,10]]) assert.equal(pressure(school('X', counts), '2C(S)', 2026), null);
  assert.equal(pressure(school('X', [0,10]), '2C(S)', 2026), 0);
  assert.equal(pressure(school('X', [20,10], null, 2025), '2C(S)', 2026), null);
});
test('missing data never ranks ahead of valid zero demand or forces a fallback by itself', () => {
  const rows = [school('Unknown'), school('Zero', [0,10]), school('Hard', [20,10])];
  assert.equal(plan(rows, 2026).phase, '2C(S)');
  assert.deepEqual(names(rank(rows, plan(rows, 2026))), ['Hard','Zero','Unknown']);
  assert.deepEqual(rank([], plan([], 2026)), []);
});
test('a fixed policy is transitive, permutation-independent and stable across filtering', () => {
  const rows = [school('A',[30,10],[1,10]),school('B',[20,10],[40,10]),school('C',null,[20,10]),school('D'),school('E',null,[0,10])];
  const policy = plan(rows, 2026), expected = names(rank(rows, policy));
  function permutations(list) {
    return list.length ? list.flatMap((item,index) => permutations(list.filter((_,i) => i !== index)).map(tail => [item,...tail])) : [[]];
  }
  for (const order of permutations(rows)) assert.deepEqual(names(rank(order, policy)), expected);
  for (let mask=0; mask < 1 << rows.length; mask++) {
    const subset = rows.filter((_,i) => mask & 1 << i);
    assert.deepEqual(names(rank(subset, policy)), expected.filter(name => subset.some(s => s.name === name)));
  }
});
test('ties and all-missing records use a deterministic alphabetical order', () => {
  const rows = [school('Zulu'), school('Alpha')];
  assert.deepEqual(names(rank(rows, plan(rows, 2026))), ['Alpha','Zulu']);
});
