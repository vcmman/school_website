const state = {
  data: null,
  search: "",
  region: "all",
  schoolFilter: "withSignal",
  verificationFilter: "all",
  sort: "score",
  maxPrice: 2500000,
  minSize: 800,
  maxMrt: 1300,
  maxAge: 10,
  selectedId: null
};

const generatedAt = document.getElementById("investGeneratedAt");
const investCount = document.getElementById("investCount");
const investCoverage = document.getElementById("investCoverage");
const investSchoolSignals = document.getElementById("investSchoolSignals");
const resultCount = document.getElementById("investResultCount");
const list = document.getElementById("investList");
const details = document.getElementById("investDetails");
const top50Body = document.getElementById("investTop50Body");

const searchInput = document.getElementById("investSearchInput");
const regionFilter = document.getElementById("investRegionFilter");
const schoolFilter = document.getElementById("investSchoolFilter");
const verificationFilter = document.getElementById("investVerificationFilter");
const sortFilter = document.getElementById("investSortFilter");
const maxPriceInput = document.getElementById("investMaxPrice");
const minSizeInput = document.getElementById("investMinSize");
const maxMrtInput = document.getElementById("investMaxMrt");
const maxAgeInput = document.getElementById("investMaxAge");

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.toLowerCase().trim();
  render();
});

regionFilter.addEventListener("change", (event) => {
  state.region = event.target.value;
  render();
});

schoolFilter.addEventListener("change", (event) => {
  state.schoolFilter = event.target.value;
  render();
});

verificationFilter.addEventListener("change", (event) => {
  state.verificationFilter = event.target.value;
  render();
});

sortFilter.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});

maxPriceInput.addEventListener("input", (event) => {
  state.maxPrice = Number(event.target.value) || 2500000;
  render();
});

minSizeInput.addEventListener("input", (event) => {
  state.minSize = Number(event.target.value) || 800;
  render();
});

maxMrtInput.addEventListener("input", (event) => {
  state.maxMrt = Number(event.target.value) || 1300;
  render();
});

maxAgeInput.addEventListener("input", (event) => {
  state.maxAge = Number(event.target.value) || 10;
  render();
});

function formatPrice(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatScore(value) {
  return `${value.toFixed(1)}`;
}

function formatMaybePrice(value) {
  return typeof value === "number" ? formatPrice(value) : "TBD";
}

function formatMaybeNumber(value, suffix = "") {
  return typeof value === "number" ? `${value}${suffix}` : "TBD";
}

function demandLabel(signal) {
  if (typeof signal.rank === "number") return `Rank #${signal.rank}`;
  if (typeof signal.pressure_2cs === "number") return `2C(S) ${signal.pressure_2cs.toFixed(2)}x`;
  if (typeof signal.pressure_2c === "number") return `2C ${signal.pressure_2c.toFixed(2)}x`;
  return "School demand signal";
}

function matchesSearch(listing) {
  if (!state.search) return true;
  const schoolText = (listing.school_signals || []).map((item) => item.name).join(" ").toLowerCase();
  const blob = [
    listing.name,
    listing.address,
    listing.corridor,
    listing.mrt_station,
    listing.region,
    schoolText
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(state.search);
}

function matchesFilters(listing) {
  if (state.region !== "all" && listing.region !== state.region) return false;
  if (state.schoolFilter === "withSignal" && !(listing.school_signals || []).length) return false;
  if (state.verificationFilter !== "all" && listing.verification_status !== state.verificationFilter) return false;
  if (typeof listing.price_sgd === "number" && listing.price_sgd > state.maxPrice) return false;
  if (typeof listing.size_sqft === "number" && listing.size_sqft < state.minSize) return false;
  if (typeof listing.mrt_distance_m === "number" && listing.mrt_distance_m > state.maxMrt) return false;
  if (typeof listing.age_years === "number" && listing.age_years >= state.maxAge) return false;
  return matchesSearch(listing);
}

function sortListings(listings) {
  if (state.sort === "price") {
    return [...listings].sort(
      (a, b) =>
        (a.price_sgd ?? Number.MAX_SAFE_INTEGER) - (b.price_sgd ?? Number.MAX_SAFE_INTEGER) ||
        b.investment_score - a.investment_score
    );
  }
  if (state.sort === "mrt") {
    return [...listings].sort(
      (a, b) =>
        (a.mrt_distance_m ?? Number.MAX_SAFE_INTEGER) - (b.mrt_distance_m ?? Number.MAX_SAFE_INTEGER) ||
        b.investment_score - a.investment_score
    );
  }
  if (state.sort === "size") {
    return [...listings].sort(
      (a, b) => (b.size_sqft ?? -1) - (a.size_sqft ?? -1) || b.investment_score - a.investment_score
    );
  }
  if (state.sort === "age") {
    return [...listings].sort(
      (a, b) =>
        (a.age_years ?? Number.MAX_SAFE_INTEGER) - (b.age_years ?? Number.MAX_SAFE_INTEGER) ||
        b.investment_score - a.investment_score
    );
  }
  return [...listings].sort(
    (a, b) => b.investment_score - a.investment_score || (a.price_sgd ?? Number.MAX_SAFE_INTEGER) - (b.price_sgd ?? Number.MAX_SAFE_INTEGER)
  );
}

function visibleListings() {
  if (!state.data) return [];
  return sortListings(state.data.listings.filter(matchesFilters));
}

function statusLabel(listing) {
  return listing.verification_status === "live" ? "Live" : "Candidate";
}

function renderList() {
  const listings = visibleListings();
  resultCount.textContent = `${listings.length} results`;

  if (!listings.length) {
    list.innerHTML = `<p class="empty">No listings match the current criteria.</p>`;
    details.innerHTML = `<p class="empty">No condo selected.</p>`;
    return;
  }

  if (!state.selectedId || !listings.some((item) => item.id === state.selectedId)) {
    state.selectedId = listings[0].id;
  }

  list.innerHTML = listings
    .map((listing, index) => {
      const active = listing.id === state.selectedId ? "active" : "";
      const schoolTag = listing.school_signals?.length ? `${listing.school_signals.length} school signals` : "No school signal";
      const status = listing.verification_status === "live" ? "Live" : "Candidate";
      return `
        <button class="school-item ${active}" data-id="${listing.id}">
          <div class="investment-item-head">
            <div class="name">${listing.name}</div>
            <span class="score-pill">${formatScore(listing.investment_score)}</span>
          </div>
          <div class="meta">${listing.region} · ${status} · ${
            typeof listing.price_sgd === "number" ? formatPrice(listing.price_sgd) : "Price TBD"
          } · ${typeof listing.size_sqft === "number" ? `${listing.size_sqft} sqft` : "Size TBD"}</div>
          <div class="meta">${listing.mrt_station || "MRT corridor TBD"} · ${
            typeof listing.mrt_distance_m === "number" ? `${listing.mrt_distance_m} m` : "MRT distance TBD"
          } · Sort #${index + 1}</div>
          <div class="meta">${schoolTag}</div>
        </button>
      `;
    })
    .join("");

  list.querySelectorAll(".school-item").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedId = element.dataset.id;
      renderList();
      renderDetails();
    });
  });

  renderDetails();
}

function renderTop50Table() {
  const listings = visibleListings().slice(0, 50);
  if (!listings.length) {
    top50Body.innerHTML = `<tr><td colspan="10">No listings match the current criteria.</td></tr>`;
    return;
  }

  top50Body.innerHTML = listings
    .map((listing, index) => {
      const schools = (listing.school_signals || []).slice(0, 2).map((item) => item.name).join(", ") || "-";
      const status = statusLabel(listing);
      return `
        <tr class="invest-top-row" data-id="${listing.id}">
          <td>${index + 1}</td>
          <td><button class="table-link" type="button" data-id="${listing.id}">${listing.name}</button></td>
          <td>${listing.region}</td>
          <td><span class="status-dot ${listing.verification_status === "live" ? "hot" : "muted"}">${status}</span></td>
          <td>${formatScore(listing.investment_score)}</td>
          <td>${formatMaybePrice(listing.price_sgd)}</td>
          <td>${formatMaybeNumber(listing.size_sqft, " sqft")}</td>
          <td>${formatMaybeNumber(listing.age_years, "y")}</td>
          <td>${formatMaybeNumber(listing.mrt_distance_m, " m")}</td>
          <td>${schools}</td>
        </tr>
      `;
    })
    .join("");

  top50Body.querySelectorAll(".table-link").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      renderList();
      renderDetails();
      document.getElementById("investDetails")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderCriteria(listing) {
  const criteria = [
    {
      label: "Around SGD 2M",
      state:
        typeof listing.price_sgd === "number"
          ? listing.price_sgd <= state.maxPrice && listing.price_sgd >= 1400000
            ? "ok"
            : "off"
          : "unknown"
    },
    {
      label: "Above 800 sqft",
      state: typeof listing.size_sqft === "number" ? (listing.size_sqft >= 800 ? "ok" : "off") : "unknown"
    },
    {
      label: "Near MRT",
      state: typeof listing.mrt_distance_m === "number" ? (listing.mrt_distance_m <= state.maxMrt ? "ok" : "off") : "unknown"
    },
    {
      label: "Age under 10y",
      state: typeof listing.age_years === "number" ? (listing.age_years < state.maxAge ? "ok" : "off") : "unknown"
    },
    {
      label: "School signal",
      state: (listing.school_signals || []).length > 0 ? "ok" : "off"
    }
  ];

  return `
    <div class="criteria-grid">
      ${criteria
        .map(
          (item) => `
            <div class="criteria-pill ${item.state}">${item.label}</div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderScoreBreakdown(listing) {
  const rows = [
    ["Budget fit", listing.score_breakdown.price_fit],
    ["Size fit", listing.score_breakdown.size_fit],
    ["MRT fit", listing.score_breakdown.mrt_fit],
    ["Age fit", listing.score_breakdown.age_fit],
    ["Value fit", listing.score_breakdown.psf_fit],
    ["School fit", listing.score_breakdown.school_fit]
  ];

  return `
    <div class="score-grid">
      ${rows
        .map(
          ([label, value]) => `
            <div class="score-row">
              <div class="score-row-label">${label}</div>
              <div class="score-bar">${typeof value === "number" ? `<span style="width:${Math.round(value * 100)}%"></span>` : ""}</div>
              <div class="score-row-value">${typeof value === "number" ? Math.round(value * 100) : "—"}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderSchoolSignals(listing) {
  const signals = listing.school_signals || [];
  if (!signals.length) {
    return `<p class="empty">No strong school match is attached to this listing in the current shortlist.</p>`;
  }

  return `
    <div class="signal-grid">
      ${signals
        .map(
          (signal) => `
            <article class="info-card">
              <h5>${signal.name}</h5>
              <div class="info-list">
                <div class="info-label">Basis</div>
                <div class="info-value">${signal.basis}</div>
                <div class="info-label">Demand</div>
                <div class="info-value">${demandLabel(signal)}</div>
                <div class="info-label">Town</div>
                <div class="info-value">${signal.town || "—"}</div>
                <div class="info-label">MRT</div>
                <div class="info-value">${signal.mrt || "—"}</div>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDetails() {
  const listing = state.data.listings.find((item) => item.id === state.selectedId);
  if (!listing) {
    details.innerHTML = `<p class="empty">No condo selected.</p>`;
    return;
  }

  details.innerHTML = `
    <div class="title-row">
      <div>
        <h3>${listing.name}</h3>
        <p class="subtle">${listing.region} · ${listing.corridor} · ${listing.address}</p>
      </div>
      <span class="rank-chip">${listing.verification_status === "live" ? "Live listing" : "Expanded candidate"} · Score ${formatScore(listing.investment_score)}</span>
    </div>

    <div class="metric-strip">
      <div class="metric-pill"><span class="metric-label">Price</span><strong>${typeof listing.price_sgd === "number" ? formatPrice(listing.price_sgd) : "TBD"}</strong></div>
      <div class="metric-pill"><span class="metric-label">Size</span><strong>${typeof listing.size_sqft === "number" ? `${listing.size_sqft} sqft` : "TBD"}</strong></div>
      <div class="metric-pill"><span class="metric-label">MRT</span><strong>${typeof listing.mrt_distance_m === "number" ? `${listing.mrt_distance_m} m` : "TBD"}</strong></div>
      <div class="metric-pill"><span class="metric-label">Age</span><strong>${typeof listing.age_years === "number" ? `${listing.age_years}y` : "TBD"}</strong></div>
    </div>

    <section class="section">
      <h4>Why It Made The Shortlist</h4>
      <p class="subtle">${state.data.coverage_note}</p>
      ${renderCriteria(listing)}
    </section>

    <section class="section">
      <h4>Listing Snapshot</h4>
      <div class="info-card-grid">
        <article class="info-card">
          <h5>Core facts</h5>
          <div class="info-list">
            <div class="info-label">Price</div>
            <div class="info-value">${typeof listing.price_sgd === "number" ? formatPrice(listing.price_sgd) : "Needs live check"}</div>
            <div class="info-label">PSF</div>
            <div class="info-value">${typeof listing.psf_sgd === "number" ? `S$ ${listing.psf_sgd.toLocaleString("en-SG")} psf` : "Needs live check"}</div>
            <div class="info-label">Beds / baths</div>
            <div class="info-value">${listing.beds && listing.baths ? `${listing.beds} / ${listing.baths}` : "Needs live check"}</div>
            <div class="info-label">Type</div>
            <div class="info-value">${listing.property_type}</div>
            <div class="info-label">Tenure</div>
            <div class="info-value">${listing.tenure || "Needs live check"}</div>
          </div>
        </article>
        <article class="info-card">
          <h5>Access & age</h5>
          <div class="info-list">
            <div class="info-label">MRT</div>
            <div class="info-value">${listing.mrt_station || "Needs corridor check"}</div>
            <div class="info-label">Walk distance</div>
            <div class="info-value">${typeof listing.mrt_distance_m === "number" ? `${listing.mrt_distance_m} m` : "Needs live check"}</div>
            <div class="info-label">School distance</div>
            <div class="info-value">${typeof listing.school_distance_m === "number" ? `${listing.school_distance_m} m` : "—"}</div>
            <div class="info-label">TOP year</div>
            <div class="info-value">${listing.top_year || "Needs live check"}</div>
            <div class="info-label">Current age</div>
            <div class="info-value">${typeof listing.age_years === "number" ? `${listing.age_years} years` : "Needs live check"}</div>
            <div class="info-label">Listed on</div>
            <div class="info-value">${listing.listed_on || "Candidate only"}</div>
          </div>
        </article>
      </div>
    </section>

    <section class="section">
      <h4>Investment Score Breakdown</h4>
      ${renderScoreBreakdown(listing)}
    </section>

    <section class="section">
      <h4>Primary-School Demand Signals</h4>
      ${renderSchoolSignals(listing)}
    </section>

    <div class="link-row">
      ${listing.source_url ? `<a href="${listing.source_url}" target="_blank" rel="noopener noreferrer">Open source listing</a>` : ""}
    </div>

    <section class="section">
      <h4>Source Note</h4>
      <p class="subtle">${listing.source_note}</p>
    </section>
  `;
}

function renderHeader() {
  const generated = new Date(state.data.generated_at).toLocaleString("en-SG", { hour12: false });
  generatedAt.textContent = `Data generated: ${generated}`;
  investCount.textContent = `Listings: ${state.data.stats.listing_count}`;
  investCoverage.textContent = `Coverage: ${state.data.stats.ccr_count} CCR · ${state.data.stats.rcr_count} RCR · ${state.data.stats.ocr_count} OCR`;
  investSchoolSignals.textContent = `${state.data.stats.verified_listing_count} live · ${state.data.stats.candidate_project_count} candidates`;
}

function render() {
  renderList();
  renderTop50Table();
}

async function init() {
  if (window.INVESTMENT_CONDOS_DATA) {
    state.data = window.INVESTMENT_CONDOS_DATA;
  } else {
    const response = await fetch("data/investment_condos.json", { cache: "no-store" });
    state.data = await response.json();
  }
  renderHeader();
  render();
}

init();
