(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SchoolRanking = api;
})(typeof globalThis === 'object' ? globalThis : this, function() {
  'use strict';
  function pressure(school, phase, year) {
    const row = school.ballot_history?.find(r => r.year === year);
    const vacancy = row?.vacancy?.[phase], applied = row?.applied?.[phase];
    return Number.isInteger(vacancy) && vacancy > 0 && Number.isInteger(applied) && applied >= 0 ? applied / vacancy : null;
  }
  function plan(schools, year) {
    const comparable = schools.filter(s => pressure(s, '2C(S)', year) !== null || pressure(s, '2C', year) !== null);
    // A pairwise fallback can create cycles. Pick one phase for the whole dataset.
    const fallback = comparable.some(s => pressure(s, '2C(S)', year) === null);
    return {year, phase: fallback ? '2C' : '2C(S)', fallback};
  }
  function rank(schools, policy) {
    function descending(a, b, phase) {
      const x = pressure(a, phase, policy.year), y = pressure(b, phase, policy.year);
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
      return y - x;
    }
    return schools.slice().sort((a, b) => descending(a, b, policy.phase)
      || (policy.phase === '2C(S)' ? descending(a, b, '2C') : 0)
      || a.name.localeCompare(b.name, 'en') || String(a.slug).localeCompare(String(b.slug), 'en'));
  }
  return {pressure, plan, rank};
});
