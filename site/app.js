const state = {
  data: null,
  search: "",
  rankFilter: "all",
  sort: "phaseProbability",
  selectedSlug: null
};

const generatedAt = document.getElementById("generatedAt");
const schoolCount = document.getElementById("schoolCount");
const rankCount = document.getElementById("rankCount");
const verifiedCount = document.getElementById("verifiedCount");
const ballotCount = document.getElementById("ballotCount");
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

function formatValue(value, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function formatPressureShort(phase) {
  if (!phase || typeof phase.pressure !== "number") return "—";
  return `${phase.pressure.toFixed(2)}x`;
}

function formatCount(value) {
  return typeof value === "number" ? value : "—";
}

function renderOfficialCutoff(official) {
  if (!official?.has_data) {
    return `<p class="subtle compact-note">No official MOE cutoff published for this phase.</p>`;
  }

  const meta = [];
  if (official.balloting_required === true) meta.push("Balloting required");
  if (official.balloting_required === false) meta.push("No balloting");
  if (typeof official.applicants_balloted === "number" && official.applicants_balloted > 0) {
    meta.push(`Balloted applicants ${official.applicants_balloted}`);
  }
  if (typeof official.vacancies_balloted === "number" && official.vacancies_balloted > 0) {
    meta.push(`Balloted places ${official.vacancies_balloted}`);
  }

  return `
    <div class="official-cutoff">
      <div class="official-kicker">Official MOE 2025 result</div>
      ${official.result_label ? `<div class="official-label">${official.result_label}</div>` : ""}
      ${official.result_text ? `<p class="subtle">${official.result_text}</p>` : ""}
      ${meta.length ? `<div class="pressure-meta official-meta">${meta.map((item) => `<span>${item}</span>`).join("")}</div>` : ""}
      ${official.remarks ? `<p class="subtle compact-note">${official.remarks}</p>` : ""}
    </div>
  `;
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
    .map((school) => {
      const town = school.organized?.overview?.town || school.school_info.Town || "Unknown town";
      const active = school.slug === state.selectedSlug ? "active" : "";
      return `
        <button class="school-item ${active}" data-slug="${school.slug}">
          <div class="name">${school.name}</div>
          <div class="meta">${town}</div>
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

function renderTagList(tags, emptyText = "No data available.") {
  const items = (tags || []).filter(Boolean);
  if (!items.length) {
    return `<p class="empty">${emptyText}</p>`;
  }
  return `<div class="tag-list">${items.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>`;
}

function renderInfoCard(title, rows) {
  const filtered = rows.filter(([, value]) => value && value !== "—");
  if (!filtered.length) return "";
  return `
    <article class="info-card">
      <h5>${title}</h5>
      <div class="info-list">
        ${filtered
          .map(
            ([label, value]) => `
              <div class="info-label">${label}</div>
              <div class="info-value">${value}</div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderMotherTongue(data) {
  const regular = Object.entries(data?.Regular || {})
    .filter(([, enabled]) => enabled)
    .map(([lang]) => lang);
  const higher = Object.entries(data?.Higher || {})
    .filter(([, enabled]) => enabled)
    .map(([lang]) => lang);

  if (!regular.length && !higher.length) {
    return `<p class="empty">No mother-tongue table found.</p>`;
  }

  return `
    <div class="language-grid">
      <div class="language-block">
        <h5>Regular</h5>
        ${renderTagList(regular, "No regular mother-tongue data")}
      </div>
      <div class="language-block">
        <h5>Higher</h5>
        ${renderTagList(higher, "No higher mother-tongue data")}
      </div>
    </div>
  `;
}

function renderPressureCard(label, phase) {
  const pressure = typeof phase?.pressure === "number" ? `${phase.pressure.toFixed(2)}x` : "—";
  const status = !phase?.has_data ? "No 2025 data" : phase.oversubscribed ? "Oversubscribed" : "Within vacancy";
  const statusClass = !phase?.has_data ? "muted" : phase.oversubscribed ? "hot" : "calm";
  const officialCutoff = renderOfficialCutoff(phase?.official);
  const breakdown = Array.isArray(phase?.breakdown) && phase.breakdown.length
    ? `
        <div class="result-list compact">
          ${phase.breakdown
            .map(
              (entry) => `
                <div class="result-row compact">
                  <div class="result-main">
                    <strong>${entry.label}</strong>
                    <span>${formatValue(entry.description, "")}</span>
                  </div>
                  <div class="result-meta">
                    <span>Applicants ${formatCount(entry.applicants)}</span>
                    <span>Vacancies ${formatCount(entry.vacancies)}</span>
                    <span>Chance ${
                      typeof entry.ballot_chance_pct === "number" ? `${entry.ballot_chance_pct.toFixed(0)}%` : "—"
                    }</span>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      `
    : `<p class="subtle compact-note">No SGSchooling SC / PR bucket breakdown found for this phase.</p>`;

  return `
    <article class="pressure-card">
      <div class="pressure-header">
        <h5>${label}</h5>
        <span class="status-dot ${statusClass}">${status}</span>
      </div>
      <div class="pressure-value">${pressure}</div>
      <div class="pressure-meta">
        <span>Applied ${formatCount(phase?.applied)}</span>
        <span>Vacancy ${formatCount(phase?.vacancy)}</span>
        <span>Taken ${formatCount(phase?.taken)}</span>
      </div>
      ${officialCutoff}
      ${breakdown}
    </article>
  `;
}

function renderCcaSnapshot(cca) {
  const entries = Object.entries(cca || {}).filter(([, values]) => values && values.length);
  if (!entries.length) {
    return `<p class="empty">No CCA profile found.</p>`;
  }
  return `
    <div class="info-card-grid">
      ${entries
        .map(
          ([label, values]) => `
            <article class="info-card">
              <h5>${label}</h5>
              ${renderTagList(values)}
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderSourceCoverage(school) {
  const quality = school.organized?.data_quality || {};
  const sourceTags = [
    quality.directory_verified ? "Official directory verified" : "Directory match unavailable",
    quality.has_2025_ballot ? "2025 ballot record" : "No 2025 ballot row",
    quality.has_official_2025_cutoff ? "Official MOE cutoff" : "No official MOE cutoff",
    quality.has_location ? "Mapped location" : "No mapped location",
    quality.has_school_website ? "School website linked" : "Website missing"
  ];

  return `
    <div class="source-panel">
      ${renderTagList(sourceTags)}
      <p class="subtle">
        Profile and ballot history come from SGSchooling. The per-phase cutoff line comes from MOE&apos;s 2025
        vacancies and balloting data page. Verified identity, contact, and school directory details come from the
        cached official school directory when a match is available.
      </p>
    </div>
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

  const rank = school.community_ranking ? `<span class="rank-chip">PSLE Rank #${school.community_ranking.rank}</span>` : "";
  const overview = school.organized?.overview || {};
  const contact = school.organized?.contact || {};
  const phases = school.ballot_2025?.phases || {};
  const programmeTags = school.organized?.programmes || [];
  const description = formatValue(school.description, "");
  const identityCard = renderInfoCard("Verified Overview", [
    ["Town", formatValue(overview.town)],
    ["Address", formatValue(overview.address)],
    ["Type", formatValue(overview.type)],
    ["Affiliations", formatValue(overview.affiliations)],
    ["Zone", formatValue(overview.zone)],
    ["Session", formatValue(overview.session)],
    ["Level", formatValue(overview.level)],
    ["Principal", formatValue(overview.principal)]
  ]);
  const contactCard = renderInfoCard("Contact & Access", [
    ["Telephone", formatValue(contact.telephone)],
    ["Alt telephone", formatValue(contact.telephone_2)],
    ["Email", formatValue(contact.email)],
    ["Nearest MRT", formatValue(contact.mrt)],
    ["Bus", formatValue(contact.bus)],
    ["Social", formatValue(contact.social_media)]
  ]);

  schoolDetails.innerHTML = `
    <div class="title-row">
      <div>
        <h3>${school.name}</h3>
        <p class="subtle">${overview.town || school.address.locality || "Singapore"} · ${overview.address || school.address.street || "-"}</p>
        ${description ? `<p class="detail-intro">${description}</p>` : ""}
      </div>
      ${rank}
    </div>

    <div class="metric-strip">
      <div class="metric-pill"><span class="metric-label">2C(S)</span><strong>${formatPressureShort(phases["2C(S)"])}</strong></div>
      <div class="metric-pill"><span class="metric-label">2C</span><strong>${formatPressureShort(phases["2C"])}</strong></div>
      <div class="metric-pill"><span class="metric-label">2B</span><strong>${formatPressureShort(phases["2B"])}</strong></div>
      <div class="metric-pill"><span class="metric-label">Zone</span><strong>${formatValue(overview.zone)}</strong></div>
    </div>

    <section class="section">
      <h4>2025 Ballot Pressure</h4>
      <p class="subtle">Pressure is shown as applied/vacancy. Values above 1.00x mean the phase was oversubscribed. Each phase card shows the official MOE 2025 cutoff first, then the finer SGSchooling SC / PR distance buckets when they are available.</p>
      <div class="pressure-grid">
        ${renderPressureCard("2C(S)", phases["2C(S)"])}
        ${renderPressureCard("2C", phases["2C"])}
        ${renderPressureCard("2B", phases["2B"])}
      </div>
    </section>

    <section class="section">
      <h4>Verified School Summary</h4>
      <div class="info-card-grid">
        ${identityCard}
        ${contactCard}
      </div>
    </section>

    <section class="section">
      <h4>Programmes & Languages</h4>
      <div class="info-card-grid">
        <article class="info-card">
          <h5>Programme tags</h5>
          ${renderTagList(programmeTags, "No verified programme tags")}
        </article>
        <article class="info-card">
          <h5>Mother tongue offerings</h5>
          ${renderMotherTongue(school.mother_tongue)}
        </article>
      </div>
    </section>

    <div class="link-row">
      <a href="${school.url}" target="_blank" rel="noopener noreferrer">Open SGSchooling page</a>
      ${school.website ? `<a href="${school.website}" target="_blank" rel="noopener noreferrer">School website</a>` : ""}
    </div>

    <section class="section">
      <h4>CCA Snapshot</h4>
      ${renderCcaSnapshot(school.organized?.cca)}
    </section>

    <section class="section">
      <h4>Source Coverage</h4>
      ${renderSourceCoverage(school)}
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
  verifiedCount.textContent = `Directory verified: ${state.data.stats.directory_verified_count ?? "-"}`;
  ballotCount.textContent = `2025 ballot: ${state.data.stats.schools_with_2025_ballot ?? "-"}`;
}

async function init() {
  const response = await fetch("data/site.json", { cache: "no-store" });
  state.data = await response.json();
  renderHeaderStats();
  renderSchoolList();
  renderCommunityRanking();
}

init();
