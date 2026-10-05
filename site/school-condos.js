const state = {
  data: null,
  search: "",
  sort: "demand",
  selectedSlug: null
};

const generatedAt = document.getElementById("pickGeneratedAt");
const schoolCount = document.getElementById("pickSchoolCount");
const latestYearEl = document.getElementById("pickLatestYear");
const condoCount = document.getElementById("pickCondoCount");
const resultCount = document.getElementById("pickResultCount");
const schoolList = document.getElementById("pickSchoolList");
const details = document.getElementById("pickDetails");

const searchInput = document.getElementById("pickSearchInput");
const schoolSelect = document.getElementById("pickSchoolSelect");
const sortFilter = document.getElementById("pickSortFilter");

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
  "SUITE",
  "SUITES",
  "VILLA",
  "VILLAS",
  "PARC",
  "PARK",
  "GARDEN",
  "GARDENS",
  "HEIGHTS",
  "COURT",
  "COURTS"
];

const privateExcludeTokens = [
  "ACTIVE PARK",
  "BUS STOP",
  "CAR PARK",
  "COMMUNITY CLUB",
  "COUNTRY CLUB",
  "ECO GREEN",
  "HDB",
  "HOME FOR THE AGED",
  "INDUSTRIAL",
  "LEARNING STUDIO",
  "MEDICARE",
  "NEIGHBOURHOOD PARK",
  "PARK CONNECTOR",
  "PUBLIC PARK",
  "ROAD PARK",
  "PRIMARY",
  "SCHOOL",
  "TEMPLE",
  "TOWN GARDEN",
  "WATERWAY PARK"
];

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.toLowerCase().trim();
  syncSchoolSelect();
  renderSchoolList();
});

sortFilter.addEventListener("change", (event) => {
  state.sort = event.target.value;
  syncSchoolSelect();
  renderSchoolList();
});

schoolSelect.addEventListener("change", (event) => {
  state.selectedSlug = event.target.value;
  renderSchoolList();
});

function normalizeName(value) {
  return String(value || "").toUpperCase().replace(/\s+/g, " ").trim();
}

function latestBallotYear() {
  return state.data?.stats?.latest_ballot_year || 2026;
}

function getLatestBallot(school) {
  return school.ballot_latest || school[`ballot_${latestBallotYear()}`] || school.ballot_2025 || {};
}

function isLikelyPrivateCondo(condo) {
  const name = normalizeName(condo.name);
  if (!name) return false;
  if (privateExcludeTokens.some((token) => name.includes(token))) return false;
  if (privateExactNames.has(name)) return true;
  return privateAllowTokens.some((token) => name.includes(token));
}

function privateCondosForSchool(school) {
  const rows = school.nearby_condos_within_1km || [];
  return rows.filter(isLikelyPrivateCondo);
}

function pressureForPhase(school, phase) {
  const snapshot = getLatestBallot(school).phases?.[phase];
  if (typeof snapshot?.pressure === "number") return snapshot.pressure;
  const year = getLatestBallot(school).year || latestBallotYear();
  const record = (school.ballot_history || []).find((item) => item.year === year);
  const vacancy = record?.vacancy?.[phase];
  const applied = record?.applied?.[phase];
  if (typeof vacancy === "number" && vacancy > 0 && typeof applied === "number" && applied >= 0) {
    return applied / vacancy;
  }
  return -1;
}

function demandSignal(school) {
  const twoCs = pressureForPhase(school, "2C(S)");
  const twoC = pressureForPhase(school, "2C");
  if (twoCs >= 0) return { phase: "2C(S)", pressure: twoCs };
  if (twoC >= 0) return { phase: "2C", pressure: twoC };
  return { phase: "No data", pressure: -1 };
}

function demandSortValue(school) {
  const twoCs = pressureForPhase(school, "2C(S)");
  const twoC = pressureForPhase(school, "2C");
  return Math.max(twoCs, twoC, -1);
}

function confidenceLabel(score) {
  if (score >= 82) return "High";
  if (score >= 68) return "Medium";
  return "Needs check";
}

function scoreCondo(school, condo) {
  const distance = typeof condo.distance_m === "number" ? condo.distance_m : 1000;
  const demand = demandSignal(school);
  const distanceScore = Math.max(0, 1 - distance / 1000) * 45;
  const demandScore = demand.pressure >= 0 ? Math.min(demand.pressure / 2.5, 1) * 25 : 0;
  const name = normalizeName(condo.name);
  const privateScore = privateExactNames.has(name) ? 15 : 11;
  const addressScore = condo.address ? 8 : 0;
  const sourceScore = String(condo.source || "").includes("enrichment") ? 4 : 7;
  const score = Math.round(distanceScore + demandScore + privateScore + addressScore + sourceScore);
  return {
    ...condo,
    score,
    demand,
    confidence: confidenceLabel(score),
    reason: `${Math.round(distance)} m from school; ${demand.phase} pressure ${demand.pressure >= 0 ? demand.pressure.toFixed(2) + "x" : "unavailable"}; likely private condo name from ${condo.source || "OneMap"}.`
  };
}

function topCondosForSchool(school) {
  return privateCondosForSchool(school)
    .map((condo) => scoreCondo(school, condo))
    .sort((a, b) => b.score - a.score || a.distance_m - b.distance_m || a.name.localeCompare(b.name))
    .slice(0, 5);
}

function matchesSchool(school) {
  if (!state.search) return true;
  const town = (school.school_info?.Town || school.organized?.overview?.town || "").toLowerCase();
  const condoText = (school.nearby_condos_within_1km || []).map((condo) => `${condo.name} ${condo.address}`).join(" ").toLowerCase();
  return school.name.toLowerCase().includes(state.search) || town.includes(state.search) || condoText.includes(state.search);
}

function sortSchools(schools) {
  const rows = [...schools];
  if (state.sort === "count") {
    return rows.sort((a, b) => privateCondosForSchool(b).length - privateCondosForSchool(a).length || a.name.localeCompare(b.name));
  }
  if (state.sort === "name") return rows.sort((a, b) => a.name.localeCompare(b.name));
  if (state.sort === "town") {
    return rows.sort((a, b) => {
      const aTown = a.school_info?.Town || a.organized?.overview?.town || "";
      const bTown = b.school_info?.Town || b.organized?.overview?.town || "";
      return aTown.localeCompare(bTown) || a.name.localeCompare(b.name);
    });
  }
  return rows.sort((a, b) => demandSortValue(b) - demandSortValue(a) || privateCondosForSchool(b).length - privateCondosForSchool(a).length || a.name.localeCompare(b.name));
}

function visibleSchools() {
  if (!state.data) return [];
  return sortSchools(state.data.primary_schools.filter((school) => privateCondosForSchool(school).length > 0).filter(matchesSchool));
}

function formatPressure(value) {
  return typeof value === "number" && value >= 0 ? `${value.toFixed(2)}x` : "—";
}

function syncSchoolSelect() {
  const schools = visibleSchools();
  if (!schools.length) {
    schoolSelect.innerHTML = `<option value="">No matching school</option>`;
    state.selectedSlug = null;
    return;
  }
  if (!state.selectedSlug || !schools.some((school) => school.slug === state.selectedSlug)) {
    state.selectedSlug = schools[0].slug;
  }
  schoolSelect.innerHTML = schools
    .map((school) => `<option value="${school.slug}" ${school.slug === state.selectedSlug ? "selected" : ""}>${school.name}</option>`)
    .join("");
}

function renderSchoolList() {
  const schools = visibleSchools();
  resultCount.textContent = `${schools.length} results`;

  if (!schools.length) {
    schoolList.innerHTML = `<p class="empty">No matching schools with condo candidates.</p>`;
    details.innerHTML = `<p class="empty">No school selected.</p>`;
    return;
  }

  if (!state.selectedSlug || !schools.some((school) => school.slug === state.selectedSlug)) {
    state.selectedSlug = schools[0].slug;
  }
  if (schoolSelect.value !== state.selectedSlug) schoolSelect.value = state.selectedSlug;

  schoolList.innerHTML = schools
    .map((school) => {
      const active = school.slug === state.selectedSlug ? "active" : "";
      const town = school.school_info?.Town || school.organized?.overview?.town || "Unknown town";
      const demand = demandSignal(school);
      const picks = topCondosForSchool(school);
      const nearest = picks[0];
      return `
        <button class="school-item ${active}" data-slug="${school.slug}">
          <div class="name">${school.name}</div>
          <div class="meta">${town} · ${demand.phase} ${formatPressure(demand.pressure)} · ${picks.length} picks</div>
          <div class="meta">Top: ${nearest ? `${nearest.name} · ${Math.round(nearest.distance_m)} m` : "—"}</div>
        </button>
      `;
    })
    .join("");

  schoolList.querySelectorAll(".school-item").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedSlug = element.dataset.slug;
      schoolSelect.value = state.selectedSlug;
      renderSchoolList();
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

  const picks = topCondosForSchool(school);
  const demand = demandSignal(school);
  const ballotYear = getLatestBallot(school).year || latestBallotYear();
  const allPrivateCount = privateCondosForSchool(school).length;
  const nearest = picks[0];
  const town = school.school_info?.Town || school.organized?.overview?.town || "Unknown town";

  const rows = picks.length
    ? picks
        .map(
          (condo, index) => `
            <article class="recommend-card">
              <div class="recommend-rank">#${index + 1}</div>
              <div class="recommend-main">
                <div class="recommend-title-row">
                  <h4>${condo.name}</h4>
                  <span class="score-pill">${condo.score}</span>
                </div>
                <p class="subtle">${condo.address || "Address unavailable"}</p>
                <div class="criteria-grid">
                  <span class="criteria-pill ok">${Math.round(condo.distance_m)} m</span>
                  <span class="criteria-pill ${condo.confidence === "High" ? "ok" : condo.confidence === "Medium" ? "unknown" : "off"}">${condo.confidence}</span>
                  <span class="criteria-pill unknown">${condo.demand.phase} ${formatPressure(condo.demand.pressure)}</span>
                </div>
                <p class="detail-intro">${condo.reason}</p>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty">No likely private condo candidates found within 1km for this school.</p>`;

  details.innerHTML = `
    <div class="title-row">
      <div>
        <h3>${school.name}</h3>
        <p class="subtle">${town} · Latest ballot year ${ballotYear}</p>
      </div>
      <span class="rank-chip">${demand.phase} ${formatPressure(demand.pressure)}</span>
    </div>

    <div class="metric-strip">
      <div class="metric-pill"><span class="metric-label">Top picks</span><strong>${picks.length}</strong></div>
      <div class="metric-pill"><span class="metric-label">Private candidates</span><strong>${allPrivateCount}</strong></div>
      <div class="metric-pill"><span class="metric-label">Nearest pick</span><strong>${nearest ? `${Math.round(nearest.distance_m)} m` : "—"}</strong></div>
      <div class="metric-pill"><span class="metric-label">Ballot demand</span><strong>${formatPressure(demand.pressure)}</strong></div>
    </div>

    <section class="section">
      <h4>Top 5 Recommended Condo Candidates</h4>
      <p class="subtle">Ranking blends school demand, distance, private-condo name confidence, address quality, and source quality. It does not yet score price, tenure, TOP, floor plan, or transaction history.</p>
      <div class="recommend-grid">${rows}</div>
    </section>

    <section class="section">
      <h4>How to use this shortlist</h4>
      <div class="tag-list">
        <span class="tag">Verify MOE home-school distance</span>
        <span class="tag">Check tenure and TOP</span>
        <span class="tag">Compare recent caveats</span>
        <span class="tag">Inspect unit stack and layout</span>
      </div>
    </section>
  `;
}

function renderHeaderStats() {
  const generated = new Date(state.data.generated_at).toLocaleString("en-SG", { hour12: false });
  const uniquePrivate = new Set();
  state.data.primary_schools.forEach((school) => {
    privateCondosForSchool(school).forEach((condo) => uniquePrivate.add(`${normalizeName(condo.name)}|${normalizeName(condo.address)}`));
  });
  generatedAt.textContent = `Data generated: ${generated}`;
  schoolCount.textContent = `Schools: ${state.data.stats.primary_school_count}`;
  latestYearEl.textContent = `Latest ballot: ${latestBallotYear()}`;
  condoCount.textContent = `Condo candidates: ${uniquePrivate.size}`;
}

async function init() {
  const response = await fetch("data/site.json", { cache: "no-store" });
  state.data = await response.json();
  renderHeaderStats();
  syncSchoolSelect();
  renderSchoolList();
}

init();
