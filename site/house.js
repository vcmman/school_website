const state = {
  data: null,
  search: "",
  sort: "phaseProbability",
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

function phaseProbability2025(school, phase) {
  const history = school.ballot_history || [];
  const record2025 = history.find((item) => item?.year === 2025);
  if (!record2025) return -1;

  const applied = record2025?.applied?.[phase];
  const vacancy = record2025?.vacancy?.[phase];
  if (typeof applied !== "number" || applied < 0) return -1;
  if (typeof vacancy !== "number" || vacancy <= 0) return -1;
  return applied / vacancy;
}

function sortSchools(schools) {
  if (state.sort === "phaseProbability") {
    return [...schools].sort((a, b) => {
      const a2C = phaseProbability2025(a, "2C");
      const b2C = phaseProbability2025(b, "2C");
      const a2Cs = phaseProbability2025(a, "2C(S)");
      const b2Cs = phaseProbability2025(b, "2C(S)");
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
      const sortRank = ` · Sort #${index + 1}`;
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
  const response = await fetch("data/site.json", { cache: "no-store" });
  state.data = await response.json();
  const generated = new Date(state.data.generated_at).toLocaleString("en-SG", { hour12: false });
  generatedAt.textContent = `Data generated: ${generated}`;
  schoolCount.textContent = `Schools: ${state.data.stats.primary_school_count}`;
  renderSchoolList();
}

init();
