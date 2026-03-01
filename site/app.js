const state = {
  data: null,
  search: "",
  rankFilter: "all",
  sort: "rank",
  selectedSlug: null
};

const generatedAt = document.getElementById("generatedAt");
const schoolCount = document.getElementById("schoolCount");
const rankCount = document.getElementById("rankCount");
const resultCount = document.getElementById("resultCount");

const searchInput = document.getElementById("searchInput");
const rankFilter = document.getElementById("rankFilter");
const sortFilter = document.getElementById("sortFilter");

const schoolList = document.getElementById("schoolList");
const schoolDetails = document.getElementById("schoolDetails");
const rankingBody = document.getElementById("rankingBody");

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.toLowerCase().trim();
  renderSchoolList();
});

rankFilter.addEventListener("change", (event) => {
  state.rankFilter = event.target.value;
  renderSchoolList();
});

sortFilter.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderSchoolList();
});

function matchesSearch(school) {
  if (!state.search) return true;
  const town = (school.school_info.Town || "").toLowerCase();
  const address = (school.school_info.Address || school.address.street || "").toLowerCase();
  return (
    school.name.toLowerCase().includes(state.search) ||
    town.includes(state.search) ||
    address.includes(state.search)
  );
}

function matchesRankFilter(school) {
  const isRanked = Boolean(school.community_ranking);
  if (state.rankFilter === "ranked") return isRanked;
  if (state.rankFilter === "unranked") return !isRanked;
  return true;
}

function sortableRank(school) {
  return school.community_ranking ? school.community_ranking.rank : Number.MAX_SAFE_INTEGER;
}

function phaseProbabilityFromRecord(record, phase) {
  const applied = record?.applied?.[phase];
  if (typeof applied !== "number" || applied <= 0) return null;

  const taken = record?.taken?.[phase];
  if (typeof taken === "number" && taken >= 0) {
    return Math.min(1, Math.max(0, taken / applied));
  }

  const vacancy = record?.vacancy?.[phase];
  if (typeof vacancy === "number" && vacancy >= 0) {
    return Math.min(1, Math.max(0, vacancy / applied));
  }

  return null;
}

function averagePhaseProbability(school, phase) {
  const history = school.ballot_history || [];
  let total = 0;
  let count = 0;

  history.forEach((record) => {
    const value = phaseProbabilityFromRecord(record, phase);
    if (typeof value === "number") {
      total += value;
      count += 1;
    }
  });

  return count ? total / count : -1;
}

function sortSchools(schools) {
  if (state.sort === "phaseProbability") {
    return [...schools].sort((a, b) => {
      const a2C = averagePhaseProbability(a, "2C");
      const b2C = averagePhaseProbability(b, "2C");
      const a2Cs = averagePhaseProbability(a, "2C(S)");
      const b2Cs = averagePhaseProbability(b, "2C(S)");

      const aHasAny = a2C >= 0 || a2Cs >= 0;
      const bHasAny = b2C >= 0 || b2Cs >= 0;
      if (aHasAny !== bHasAny) return aHasAny ? -1 : 1;

      if (a2Cs >= 0 && b2Cs >= 0 && Math.abs(a2Cs - b2Cs) > 1e-6) return a2Cs - b2Cs;
      if (a2C >= 0 && b2C >= 0 && Math.abs(a2C - b2C) > 1e-6) return a2C - b2C;

      return a.name.localeCompare(b.name);
    });
  }
  if (state.sort === "town") {
    return [...schools].sort((a, b) => {
      const aTown = a.school_info.Town || "";
      const bTown = b.school_info.Town || "";
      return aTown.localeCompare(bTown) || a.name.localeCompare(b.name);
    });
  }
  if (state.sort === "rank") {
    return [...schools].sort((a, b) => sortableRank(a) - sortableRank(b) || a.name.localeCompare(b.name));
  }
  return [...schools].sort((a, b) => a.name.localeCompare(b.name));
}

function getVisibleSchools() {
  if (!state.data) return [];
  return sortSchools(state.data.primary_schools).filter(matchesSearch).filter(matchesRankFilter);
}

function renderSchoolList() {
  const schools = getVisibleSchools();
  resultCount.textContent = `${schools.length} results`;

  if (!schools.length) {
    schoolList.innerHTML = `<p class="empty">No schools match the current filters.</p>`;
    schoolDetails.innerHTML = `<p class="empty">No school selected.</p>`;
    return;
  }

  if (!state.selectedSlug || !schools.some((school) => school.slug === state.selectedSlug)) {
    state.selectedSlug = schools[0].slug;
  }

  schoolList.innerHTML = schools
    .map((school, index) => {
      const town = school.school_info.Town || "Unknown town";
      const rank = school.community_ranking ? `#${school.community_ranking.rank}` : "Unranked";
      const sortRank = state.sort === "phaseProbability" ? ` · Sort #${index + 1}` : "";
      const active = school.slug === state.selectedSlug ? "active" : "";
      return `
        <button class="school-item ${active}" data-slug="${school.slug}">
          <div class="name">${school.name}</div>
          <div class="meta">${town} · ${rank}${sortRank}</div>
        </button>
      `;
    })
    .join("");

  schoolList.querySelectorAll(".school-item").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedSlug = element.dataset.slug;
      renderSchoolList();
      renderSchoolDetails();
    });
  });

  renderSchoolDetails();
}

function renderSchoolInfoMap(info) {
  const entries = Object.entries(info || {});
  if (!entries.length) {
    return `<p class="empty">No school-info fields found.</p>`;
  }
  return `
    <div class="kv-grid">
      ${entries
        .map(([key, value]) => `<div class="k">${key}</div><div class="v">${value || "-"}</div>`)
        .join("")}
    </div>
  `;
}

function renderMotherTongue(data) {
  const rows = Object.entries(data || {});
  if (!rows.length) {
    return `<p class="empty">No mother-tongue table found.</p>`;
  }
  const langs = Object.keys(rows[0][1]);
  return `
    <table class="mini-table">
      <thead>
        <tr>
          <th>Level</th>
          ${langs.map((lang) => `<th>${lang}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([level, values]) => `
            <tr>
              <td>${level}</td>
              ${langs.map((lang) => `<td>${values[lang] ? "Yes" : "No"}</td>`).join("")}
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderBallotHistory(records) {
  if (!records || !records.length) {
    return `<p class="empty">No ballot history table found.</p>`;
  }
  const recent = [...records].sort((a, b) => b.year - a.year).slice(0, 8);
  const phaseNames = ["Phase 1", "2A(1)", "2A(2)", "2B", "2C", "2C(S)", "3", "Total"];
  return `
    <table class="mini-table">
      <thead>
        <tr>
          <th>Year</th>
          <th>Metric</th>
          ${phaseNames.map((name) => `<th>${name}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${recent
          .map((row) =>
            ["vacancy", "applied", "taken"]
              .map((metric, index) => {
                const label = metric.charAt(0).toUpperCase() + metric.slice(1);
                const values = phaseNames.map((phase) => row[metric][phase] ?? "-");
                return `
                  <tr>
                    <td>${index === 0 ? row.year : ""}</td>
                    <td>${label}</td>
                    ${values.map((value) => `<td>${value}</td>`).join("")}
                  </tr>
                `;
              })
              .join("")
          )
          .join("")}
      </tbody>
    </table>
    <p class="subtle">Showing latest 8 years from SGSchooling ballot history.</p>
  `;
}

function renderSchoolDetails() {
  if (!state.data || !state.selectedSlug) {
    schoolDetails.innerHTML = `<p class="empty">No school selected.</p>`;
    return;
  }

  const school = state.data.primary_schools.find((item) => item.slug === state.selectedSlug);
  if (!school) {
    schoolDetails.innerHTML = `<p class="empty">No school selected.</p>`;
    return;
  }

  const rank = school.community_ranking
    ? `<span class="rank-chip">PSLE Rank #${school.community_ranking.rank}</span>`
    : `<span class="rank-chip muted">No PSLE rank row</span>`;

  schoolDetails.innerHTML = `
    <div class="title-row">
      <div>
        <h3>${school.name}</h3>
        <p class="subtle">${school.address.locality || "Singapore"} · ${school.address.street || "-"}</p>
      </div>
      ${rank}
    </div>

    <div class="link-row">
      <a href="${school.url}" target="_blank" rel="noopener noreferrer">Open SGSchooling page</a>
      ${school.website ? `<a href="${school.website}" target="_blank" rel="noopener noreferrer">School website</a>` : ""}
    </div>

    <section class="section">
      <h4>Profile</h4>
      ${renderSchoolInfoMap(school.school_info)}
    </section>

    <section class="section">
      <h4>Mother Tongue</h4>
      ${renderMotherTongue(school.mother_tongue)}
    </section>

    <section class="section">
      <h4>Ballot History</h4>
      ${renderBallotHistory(school.ballot_history)}
    </section>
  `;
}

function renderCommunityRanking() {
  if (!state.data) return;
  rankingBody.innerHTML = state.data.community_ranking
    .map((row) => {
      const al = typeof row.top10_avg_al === "number" ? row.top10_avg_al.toFixed(1) : "-";
      return `
        <tr>
          <td>${row.rank}</td>
          <td><a href="${row.school_url}" target="_blank" rel="noopener noreferrer">${row.school}</a></td>
          <td>${row.score_range}</td>
          <td>${row.students}</td>
          <td>${row.total_in_cohort}</td>
          <td>${row.percentage}</td>
          <td>${al}</td>
        </tr>
      `;
    })
    .join("");
}

function renderHeaderStats() {
  const generated = new Date(state.data.generated_at).toLocaleString("en-SG", { hour12: false });
  generatedAt.textContent = `Data generated: ${generated}`;
  schoolCount.textContent = `Schools: ${state.data.stats.primary_school_count}`;
  rankCount.textContent = `Ranked: ${state.data.stats.ranked_school_count}`;
}

async function init() {
  const response = await fetch("data/site.json");
  state.data = await response.json();
  renderHeaderStats();
  renderSchoolList();
  renderCommunityRanking();
}

init();
