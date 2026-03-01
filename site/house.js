const state = {
  data: null,
  search: "",
  sort: "rank",
  selectedSlug: null
};

const generatedAt = document.getElementById("houseGeneratedAt");
const schoolCount = document.getElementById("houseSchoolCount");
const resultCount = document.getElementById("houseResultCount");
const schoolList = document.getElementById("houseSchoolList");
const details = document.getElementById("houseDetails");

const searchInput = document.getElementById("houseSearchInput");
const sortFilter = document.getElementById("houseSortFilter");

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.toLowerCase().trim();
  renderSchoolList();
});

sortFilter.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderSchoolList();
});

function countHomes(school) {
  return (school.housing_within_1km || []).length;
}

function matchesSchool(school) {
  if (!state.search) return true;
  const town = (school.school_info?.Town || "").toLowerCase();
  return school.name.toLowerCase().includes(state.search) || town.includes(state.search);
}

function rankValue(school) {
  return school.community_ranking?.rank ?? Number.MAX_SAFE_INTEGER;
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
  if (state.sort === "count") {
    return [...schools].sort((a, b) => countHomes(b) - countHomes(a) || a.name.localeCompare(b.name));
  }
  if (state.sort === "rank") {
    return [...schools].sort((a, b) => rankValue(a) - rankValue(b) || a.name.localeCompare(b.name));
  }
  return [...schools].sort((a, b) => a.name.localeCompare(b.name));
}

function visibleSchools() {
  if (!state.data) return [];
  return sortSchools(state.data.primary_schools).filter(matchesSchool);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0
  }).format(value);
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
      const sortRank = state.sort === "phaseProbability" ? ` · Sort #${index + 1}` : "";
      return `
        <button class="school-item ${active}" data-slug="${school.slug}">
          <div class="name">${school.name}</div>
          <div class="meta">${town} · ${countHomes(school)} homes${sortRank}</div>
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

  const homes = school.housing_within_1km || [];
  const rows = homes.length
    ? homes
        .map(
          (home) => `
      <tr>
        <td>${home.type || "Home"}</td>
        <td>${home.address}</td>
        <td>${formatPrice(home.price)}</td>
        <td>${home.area_sqm ?? "-"}</td>
        <td>${Math.round(home.distance_m)} m</td>
        <td>${home.date}</td>
        <td>${home.url ? `<a href="${home.url}" target="_blank" rel="noopener noreferrer">Link</a>` : "-"}</td>
        <td>${home.source}</td>
      </tr>
    `
        )
        .join("")
    : `<tr><td colspan="8">No recent matches within 1km.</td></tr>`;

  const rank = school.community_ranking?.rank ? `#${school.community_ranking.rank}` : "Unranked";
  details.innerHTML = `
    <div class="title-row">
      <div>
        <h3>${school.name}</h3>
        <p class="subtle">${school.school_info?.Town || "Unknown town"} · Rank: ${rank}</p>
      </div>
    </div>

    <section class="section">
      <h4>Suggested Homes Within 1km</h4>
      <table class="mini-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Address</th>
            <th>Price</th>
            <th>Area (sqm)</th>
            <th>Distance</th>
            <th>Month</th>
            <th>Listing</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="subtle">Source: data.gov.sg HDB resale data. Suggestions are transaction-based, not live listings.</p>
    </section>
  `;
}

async function init() {
  const response = await fetch("data/site.json");
  state.data = await response.json();
  const generated = new Date(state.data.generated_at).toLocaleString("en-SG", { hour12: false });
  generatedAt.textContent = `Data generated: ${generated}`;
  schoolCount.textContent = `Schools: ${state.data.stats.primary_school_count}`;
  renderSchoolList();
}

init();
