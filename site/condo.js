const state = {
  data: null,
  search: "",
  sort: "phaseProbability",
  recordFilter: "private",
  selectedSlug: null
};

const generatedAt = document.getElementById("condoGeneratedAt");
const schoolCount = document.getElementById("condoSchoolCount");
const condoNameCount = document.getElementById("condoNameCount");
const condoPrivateCount = document.getElementById("condoPrivateCount");
const resultCount = document.getElementById("condoResultCount");
const schoolList = document.getElementById("condoSchoolList");
const details = document.getElementById("condoDetails");

const searchInput = document.getElementById("condoSearchInput");
const sortFilter = document.getElementById("condoSortFilter");
const recordFilter = document.getElementById("condoRecordFilter");

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.toLowerCase().trim();
  renderSchoolList();
});

sortFilter.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderSchoolList();
});

recordFilter.addEventListener("change", (event) => {
  state.recordFilter = event.target.value;
  renderSchoolList();
});

const privateExactNames = new Set([
  "ALEX RESIDENCES",
  "AMBER PARK",
  "BEDOK RESIDENCES",
  "CITY GATE",
  "GEM RESIDENCES",
  "GLENTREES",
  "INZ RESIDENCE",
  "LAKEPOINT CONDOMINIUM",
  "MAPLE WOODS",
  "MONTEREY PARK CONDOMINIUM",
  "NAVA GROVE",
  "NINE RESIDENCES",
  "NORTH PARK RESIDENCES",
  "PARC CLEMATIS",
  "PINETREE HILL",
  "RIVIERE",
  "THE ANCHORAGE",
  "THE GARDEN RESIDENCES",
  "THE PARC CONDOMINIUM",
  "TWIN WATERFALLS"
]);

const privateAllowTokens = [
  "CONDOMINIUM",
  "APARTMENT",
  "MANSION",
  "MANSIONS",
  "RESIDENCE",
  "RESIDENCES",
  "SUITES",
  "VILLA",
  "VILLAS",
  "PARC"
];

const privateExcludeTokens = [
  "ACTIVE PARK",
  "BUS STOP",
  "CAR PARK",
  "COMMUNITY CLUB",
  "COUNTRY CLUB",
  "ECO GREEN",
  "FARRER PARK GARDENS",
  "FERNVALE",
  "GREENCOURT",
  "GREENRIDGES",
  "HDB",
  "HOME FOR THE AGED",
  "INDUSTRIAL",
  "LEARNING STUDIO",
  "MEDICARE",
  "NEIGHBOURHOOD PARK",
  "PARK CONNECTOR",
  "PUBLIC PARK",
  "ROAD PARK",
  "PARKVIEW",
  "PRIMARY",
  "RIDGE",
  "SCHOOL",
  "TEMPLE",
  "TOWN GARDEN",
  "VISTA",
  "WATERWAY PARK"
];

function normalizeName(value) {
  return String(value || "").toUpperCase().replace(/\s+/g, " ").trim();
}

function isLikelyPrivateCondo(condo) {
  const name = normalizeName(condo.name);
  if (!name) return false;
  if (privateExcludeTokens.some((token) => name.includes(token))) return false;
  if (privateExactNames.has(name)) return true;
  return privateAllowTokens.some((token) => name.includes(token));
}

function countCondos(school) {
  return condoRowsForSchool(school).length;
}

function condoRowsForSchool(school) {
  const rows = school.nearby_condos_within_1km || [];
  if (state.recordFilter === "all") return rows;
  return rows.filter(isLikelyPrivateCondo);
}

function matchesSchool(school) {
  if (!state.search) return true;
  const town = (school.school_info?.Town || "").toLowerCase();
  const condoText = (school.nearby_condos_within_1km || []).map((condo) => condo.name).join(" ").toLowerCase();
  return school.name.toLowerCase().includes(state.search) || town.includes(state.search) || condoText.includes(state.search);
}

function rankValue(school) {
  return school.community_ranking?.rank ?? Number.MAX_SAFE_INTEGER;
}

function latestBallotYear() {
  return state.data?.stats?.latest_ballot_year || 2026;
}

function getLatestBallot(school) {
  return school.ballot_latest || school[`ballot_${latestBallotYear()}`] || school.ballot_2025 || {};
}

function phaseProbabilityLatest(school, phase) {
  const phaseSnapshot = getLatestBallot(school).phases?.[phase];
  if (typeof phaseSnapshot?.pressure === "number") return phaseSnapshot.pressure;

  const latestYear = getLatestBallot(school).year || latestBallotYear();
  const history = school.ballot_history || [];
  const record = history.find((item) => item?.year === latestYear);
  if (!record) return -1;

  const applied = record?.applied?.[phase];
  const vacancy = record?.vacancy?.[phase];
  if (typeof applied !== "number" || applied < 0) return -1;
  if (typeof vacancy !== "number" || vacancy <= 0) return -1;
  return applied / vacancy;
}

function sortSchools(schools) {
  if (state.sort === "phaseProbability") {
    return [...schools].sort((a, b) => {
      const a2C = phaseProbabilityLatest(a, "2C");
      const b2C = phaseProbabilityLatest(b, "2C");
      const a2Cs = phaseProbabilityLatest(a, "2C(S)");
      const b2Cs = phaseProbabilityLatest(b, "2C(S)");
      const a2CsValid = a2Cs >= 0;
      const b2CsValid = b2Cs >= 0;
      if (a2CsValid !== b2CsValid) return a2CsValid ? -1 : 1;
      if (a2CsValid && Math.abs(a2Cs - b2Cs) > 1e-6) return b2Cs - a2Cs;

      const a2CValid = a2C >= 0;
      const b2CValid = b2C >= 0;
      if (a2CValid !== b2CValid) return a2CValid ? -1 : 1;
      if (a2CValid && Math.abs(a2C - b2C) > 1e-6) return b2C - a2C;

      return a.name.localeCompare(b.name);
    });
  }
  if (state.sort === "count") {
    return [...schools].sort((a, b) => countCondos(b) - countCondos(a) || a.name.localeCompare(b.name));
  }
  if (state.sort === "rank") {
    return [...schools].sort((a, b) => rankValue(a) - rankValue(b) || a.name.localeCompare(b.name));
  }
  return [...schools].sort((a, b) => a.name.localeCompare(b.name));
}

function visibleSchools() {
  if (!state.data) return [];
  return sortSchools(state.data.primary_schools)
    .filter(matchesSchool)
    .filter((school) => countCondos(school) > 0);
}

function renderSchoolList() {
  const schools = visibleSchools();
  resultCount.textContent = `${schools.length} results`;

  if (!schools.length) {
    schoolList.innerHTML = `<p class="empty">No matching schools.</p>`;
    details.innerHTML = `<p class="empty">No school selected.</p>`;
    return;
  }

  if (!state.selectedSlug || !schools.some((s) => s.slug === state.selectedSlug)) {
    state.selectedSlug = schools[0].slug;
  }

  schoolList.innerHTML = schools
    .map((school, index) => {
      const active = school.slug === state.selectedSlug ? "active" : "";
      const town = school.school_info?.Town || "Unknown town";
      const sortRank = ` · Sort #${index + 1}`;
      const nearest = condoRowsForSchool(school)[0];
      return `
        <button class="school-item ${active}" data-slug="${school.slug}">
          <div class="name">${school.name}</div>
          <div class="meta">${town} · ${countCondos(school)} ${state.recordFilter === "private" ? "likely private" : "place"} records${sortRank}</div>
          <div class="meta">Nearest ${nearest ? `${nearest.name} · ${Math.round(nearest.distance_m)} m` : "—"}</div>
        </button>
      `;
    })
    .join("");

  schoolList.querySelectorAll(".school-item").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedSlug = element.dataset.slug;
      renderSchoolList();
      renderDetails();
    });
  });

  renderDetails();
}

function renderDetails() {
  const school = state.data.primary_schools.find((item) => item.slug === state.selectedSlug);
  if (!school) {
    details.innerHTML = `<p class="empty">No school selected.</p>`;
    return;
  }

  const condos = condoRowsForSchool(school);
  const condoRows = condos.length
    ? condos
        .map(
          (condo) => `
      <tr>
        <td>${condo.name}</td>
        <td>${condo.address || "-"}</td>
        <td>${Math.round(condo.distance_m)} m</td>
        <td>${condo.source}</td>
      </tr>
    `
        )
        .join("")
    : `<tr><td colspan="4">No condo names found within 1km.</td></tr>`;

  const rank = school.community_ranking?.rank ? `#${school.community_ranking.rank}` : "Unranked";
  const allCount = (school.nearby_condos_within_1km || []).length;
  const privateCount = (school.nearby_condos_within_1km || []).filter(isLikelyPrivateCondo).length;
  const nearest = condos[0];
  details.innerHTML = `
    <div class="title-row">
      <div>
        <h3>${school.name}</h3>
        <p class="subtle">${school.school_info?.Town || "Unknown town"} · Rank: ${rank}</p>
      </div>
    </div>

    <div class="metric-strip">
      <div class="metric-pill"><span class="metric-label">Shown</span><strong>${condos.length}</strong></div>
      <div class="metric-pill"><span class="metric-label">Likely private</span><strong>${privateCount}</strong></div>
      <div class="metric-pill"><span class="metric-label">All records</span><strong>${allCount}</strong></div>
      <div class="metric-pill"><span class="metric-label">Nearest shown</span><strong>${nearest ? `${Math.round(nearest.distance_m)} m` : "—"}</strong></div>
    </div>

    <section class="section">
      <h4>Nearby Condo Names Within 1km</h4>
      <div class="table-scroll">
        <table class="mini-table">
          <thead>
            <tr>
              <th>Condo Name</th>
              <th>Address</th>
              <th>Distance</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>${condoRows}</tbody>
        </table>
      </div>
      <p class="subtle">Default view hides obvious HDB/public-estate/noisy OneMap records. Switch to “All OneMap place records” if you want the raw enrichment list.</p>
    </section>
  `;
}

async function init() {
  const response = await fetch("data/site.json", { cache: "no-store" });
  state.data = await response.json();
  const generated = new Date(state.data.generated_at).toLocaleString("en-SG", { hour12: false });
  generatedAt.textContent = `Data generated: ${generated}`;
  schoolCount.textContent = `Schools: ${state.data.stats.primary_school_count}`;
  condoNameCount.textContent = `Condo names: ${state.data.stats.onemap_condo_name_count ?? "-"}`;
  const uniquePrivate = new Set();
  state.data.primary_schools.forEach((school) => {
    (school.nearby_condos_within_1km || []).filter(isLikelyPrivateCondo).forEach((condo) => {
      uniquePrivate.add(`${normalizeName(condo.name)}|${normalizeName(condo.address)}`);
    });
  });
  condoPrivateCount.textContent = `Likely private: ${uniquePrivate.size}`;
  renderSchoolList();
}

init();
