const marketSignals = [
  {
    label: "1Q2026 private price index",
    value: "+0.9%",
    note: "URA reported the overall private residential price index rose 0.9% quarter-on-quarter."
  },
  {
    label: "1Q2026 non-landed",
    value: "+1.3%",
    note: "Non-landed private homes rebounded after a 4Q2025 decline."
  },
  {
    label: "1Q2026 OCR non-landed",
    value: "+2.2%",
    note: "OCR outpaced RCR and CCR in the latest URA quarter."
  },
  {
    label: "2025 full-year private prices",
    value: "+3.3%",
    note: "The full-year increase moderated to the slowest annual gain since 2020."
  },
  {
    label: "Pipeline supply",
    value: "55.8k",
    note: "URA expects about 55,800 private housing units, including ECs, to complete in coming years."
  },
  {
    label: "Vacancy rate",
    value: "6.2%",
    note: "Completed private residential vacancy rose from 6.0% to 6.2% in 1Q2026."
  }
];

function isZh() {
  return window.I18N?.language === "zh";
}

const zhText = {
  "1Q2026 private price index": "2026 年一季度私人住宅价格指数",
  "1Q2026 non-landed": "2026 年一季度非有地住宅",
  "1Q2026 OCR non-landed": "2026 年一季度 OCR 非有地住宅",
  "2025 full-year private prices": "2025 全年私人住宅价格",
  "Pipeline supply": "供应管道",
  "Vacancy rate": "空置率",
  "URA reported the overall private residential price index rose 0.9% quarter-on-quarter.":
    "URA 公布整体私人住宅价格指数环比上涨 0.9%。",
  "Non-landed private homes rebounded after a 4Q2025 decline.":
    "非有地私人住宅在 2025 年四季度下跌后出现反弹。",
  "OCR outpaced RCR and CCR in the latest URA quarter.": "最新 URA 季度中，OCR 涨幅高于 RCR 和 CCR。",
  "The full-year increase moderated to the slowest annual gain since 2020.":
    "全年涨幅放缓至 2020 年以来最慢的年度增速。",
  "URA expects about 55,800 private housing units, including ECs, to complete in coming years.":
    "URA 预计未来几年约有 55,800 个私人住宅单位（含 EC）完工。",
  "Completed private residential vacancy rose from 6.0% to 6.2% in 1Q2026.":
    "已完工私人住宅空置率在 2026 年一季度从 6.0% 升至 6.2%。",
  High: "高",
  "Medium-high": "中高",
  Medium: "中",
  Selective: "选择性",
  Strong: "强",
  Good: "较好",
  Defensive: "防守型",
  "EC-special": "EC 特殊机会",
  "Longer-term": "偏长期",
  "Project candidate": "项目候选",
  "Live listing verified": "实时房源已核验",
  "Requested case study": "指定案例",
  "Upcoming project": "即将推出",
  "Awarded GLS": "已中标 GLS",
  "Tender-stage GLS": "招标阶段 GLS",
  "Confirmed-list GLS": "确认名单 GLS",
  "Awarded EC site": "已中标 EC 地块",
  "Under construction": "在建",
  "Under construction / integrated": "在建 / 综合项目",
  "Near TOP / mostly sold": "接近 TOP / 基本售罄",
  "Multiple projects completing": "多个项目陆续完工",
  "Newly launched / future TOP": "新开盘 / 未来 TOP",
  Apartment: "公寓",
  Condominium: "公寓项目",
  "Future condo": "未来公寓",
  "Future mixed-use condo": "未来综合公寓",
  "Future mega condo": "未来大型公寓",
  "Future boutique condo": "未来精品公寓",
  "Future waterfront condo": "未来滨水公寓",
  "Executive condominium": "执行共管公寓",
  Freehold: "永久产权",
  "999-year": "999 年限",
  "99-year": "99 年限",
  "99-year from 1999": "99 年限，自 1999 年起",
  "99-year from 2005": "99 年限，自 2005 年起",
  "99-year from 2009": "99 年限，自 2009 年起",
  "99-year from 2004": "99 年限，自 2004 年起",
  "99-year from 1996": "99 年限，自 1996 年起",
  "99-year from 1993": "99 年限，自 1993 年起",
  "99-year from 2000": "99 年限，自 2000 年起",
  "999-year from 1885": "999 年限，自 1885 年起",
  "999-year from 1877": "999 年限，自 1877 年起"
};

function t(value) {
  if (!isZh()) return value;
  return zhText[value] || value;
}

function zhPlace(value) {
  if (!value) return "该区域";
  return value
    .replace(/\/ /g, " / ")
    .replace("town centre", "市镇中心")
    .replace("edge", "边缘")
    .replace("central", "中心")
    .replace("waterfront", "滨水")
    .replace("MRT", "MRT");
}

function zhProjectStatus(project) {
  if (!isZh()) {
    return [project.area || project.location, project.region, project.status || project.type].filter(Boolean).join(" · ");
  }
  const parts = [project.region, zhPlace(project.location || project.area), t(project.status || project.type || "")].filter(Boolean);
  return parts.join(" · ");
}

function zhPickDetail(pick, field) {
  const place = zhPlace(pick.area);
  const base = `${pick.name} 位于 ${place}，属于 ${pick.region}。`;
  if (field === "currentFit") {
    return `${base}重点核验当前成交/挂牌、总价、户型效率和是否仍接近目标预算。`;
  }
  if (field === "school") {
    return `学校需求：保留原学校名称作为核验线索；买入前确认具体单位是否真的落在有效距离带内。`;
  }
  if (field === "transport") {
    return `交通与区位：主要看 MRT、商场、就业节点或成熟社区是否能提高出租和转售流动性。`;
  }
  if (field === "why") {
    return `重估逻辑：${pick.region} 区位、学校/交通需求、家庭买家深度和替代新盘价格压力共同支撑五年上涨空间。`;
  }
  if (field === "risks") {
    return `主要风险：如果入场价已经反映利好，或具体户型、楼层、朝向、维护状态较弱，五年涨幅会被压缩。`;
  }
  if (field === "verdict") {
    return `结论：作为选择性候选，只有在买入价处于可比成交低位、户型和维护状态干净时才值得认真推进。`;
  }
  return pick[field] || "";
}

function zhLaunchText(project, field) {
  const place = zhPlace(project.location || project.area);
  if (field === "thesis") {
    return `核心逻辑：${place} 具备交通、就业、学校、滨水或片区更新等催化；评分 ${project.score}，上涨潜力为${t(project.upside)}。`;
  }
  if (field === "watchOut") {
    return `注意事项：控制入场价，比较附近新盘和二手替代品；若溢价已提前反映，五年回报会被压缩。`;
  }
  if (field === "conditionAngle") {
    return `状态角度：重点看实际单位装修、外立面、电梯、防水、MCST 资金和社区维护，不能只看项目名称。`;
  }
  if (field === "gap") {
    return `此前缺失原因：旧筛选口径没有覆盖这一类成熟 99 年限或非长产权项目，本表将其单独列出重新比较。`;
  }
  return project[field] || "";
}

function zhSourceNote(source) {
  if (!isZh()) return source.note;
  if (source.url.includes("ura.gov.sg") || source.name.includes("URA")) {
    return "用于核验官方价格、租金、销量、空置率、供应管道和 GLS 背景。";
  }
  if (source.url.includes("lta.gov.sg") || source.name.includes("LTA")) {
    return "用于核验地铁线路、开通时间和交通催化背景。";
  }
  if (source.url.includes("investment_condos")) {
    return "本站本地投资公寓候选库，包含项目候选、实时挂牌片段、学校信号和 HDB 排除过滤。";
  }
  if (source.name.includes("facts") || source.name.includes("directory")) {
    return "用于核验项目基础资料，例如地址、年限、TOP、单位数、区域和周边配套。";
  }
  if (source.name.includes("listing") || source.name.includes("transaction") || source.name.includes("price")) {
    return "用于核验当前挂牌、近期成交、psf 区间和入场价纪律。";
  }
  return "用于交叉核验本页的市场、项目、交通或供应背景。";
}

const condoPicks = [
  {
    rank: 1,
    name: "The Garden Residences",
    region: "OCR",
    area: "Serangoon North / Ang Mo Kio",
    status: "Project candidate",
    conviction: "High",
    fiveYearBase: "18-24%",
    fiveYearBull: "25-32%",
    currentFit: "Verify current 2-bed+ or compact 3-bed resale listings around the SGD 2M band.",
    school: "Rosyth School signal from the local school dataset.",
    transport: "Future CRL1 Serangoon North/Tavistock corridor, with CRL1 targeted for 2030.",
    why: "This is the cleanest five-year catalyst case: still OCR-priced, close to a scarce school-demand node, and positioned for a visible 2030 rail accessibility re-rating.",
    risks: "Entry price discipline is crucial. If resale psf already prices in the CRL catalyst, the remaining upside falls quickly."
  },
  {
    rank: 2,
    name: "Sengkang Grand Residences",
    region: "OCR",
    area: "Buangkok / Sengkang",
    status: "Project candidate",
    conviction: "High",
    fiveYearBase: "16-23%",
    fiveYearBull: "24-30%",
    currentFit: "Verify sub-10-year units and quantum; prioritise efficient layouts over larger family units.",
    school: "Nan Chiau Primary School signal from the local school dataset.",
    transport: "Integrated Buangkok MRT/bus/mall node; north-east corridor also benefits from broader Punggol/Sengkang employment decentralisation.",
    why: "Integrated transport plus retail convenience usually supports liquidity. The five-year upside case comes from OCR affordability, family demand, and integrated-node scarcity.",
    risks: "Integrated projects often trade at a premium already. Avoid paying a price that leaves no discount versus fresh OCR launches."
  },
  {
    rank: 3,
    name: "Parc Clematis",
    region: "OCR",
    area: "Clementi",
    status: "Live listing verified",
    conviction: "High",
    fiveYearBase: "15-22%",
    fiveYearBull: "23-28%",
    currentFit: "Recent live example: SGD 1.648M, 893 sqft, TOP 2023, with Nan Hua Primary proximity signal.",
    school: "Nan Hua Primary School and Clementi Primary School signals.",
    transport: "Clementi is on CRL2 by 2032; the immediate MRT walk is not as strong, so unit-level price must compensate.",
    why: "Clementi has durable owner-occupier depth. A sub-SGD 2M, >800 sqft, young unit can still screen well if bought below nearby replacement-cost pressure.",
    risks: "MRT distance is weaker than the best picks. Treat this as a price-discipline pick, not a pure convenience pick."
  },
  {
    rank: 4,
    name: "The GATZ",
    region: "RCR",
    area: "Dakota / Geylang",
    status: "Live listing verified",
    conviction: "High",
    fiveYearBase: "15-22%",
    fiveYearBull: "23-30%",
    currentFit: "Recent live example: SGD 1.988M, 1,054 sqft, TOP 2024, near Dakota, freehold.",
    school: "Kong Hwa School and Haig Girls' School corridor signals.",
    transport: "Dakota and Paya Lebar fringe access; RCR city-fringe replacement cost supports the thesis.",
    why: "Freehold, young age, good size, and sub-SGD 2M entry are rare together. If liquidity is acceptable, this has a plausible >20% path.",
    risks: "Boutique-project liquidity can be thin. Check transaction history, maintenance, and exit depth before relying on the upside forecast."
  },
  {
    rank: 5,
    name: "Park Place Residences",
    region: "RCR",
    area: "Paya Lebar",
    status: "Live listing verified",
    conviction: "Medium-high",
    fiveYearBase: "13-21%",
    fiveYearBull: "22-27%",
    currentFit: "Recent live example: SGD 2.45M, 1,076 sqft, TOP 2019, beside Paya Lebar MRT.",
    school: "Kong Hwa School signal.",
    transport: "Integrated Paya Lebar MRT, retail, and office node.",
    why: "The asset quality is strong: transport, retail, city-fringe employment, and school demand. It can still reach 20% if entry is not at peak premium.",
    risks: "The listed quantum is above the clean SGD 2M target and the integrated premium may already be capitalised."
  },
  {
    rank: 6,
    name: "North Park Residences",
    region: "OCR",
    area: "Yishun",
    status: "Project candidate",
    conviction: "Medium-high",
    fiveYearBase: "12-20%",
    fiveYearBull: "21-26%",
    currentFit: "Verify age, layout, and current resale psf; target efficient 2-bed+ units.",
    school: "Northland Primary School signal.",
    transport: "Integrated Yishun MRT, mall, and bus interchange node.",
    why: "Integrated OCR assets tend to stay liquid. The >20% case depends on buying at a meaningful discount to new OCR family-home alternatives.",
    risks: "Yishun has more competing supply than prime city-fringe nodes; do not overpay for the integrated premium."
  },
  {
    rank: 7,
    name: "Alex Residences",
    region: "RCR",
    area: "Redhill / Alexandra",
    status: "Project candidate",
    conviction: "Medium",
    fiveYearBase: "12-19%",
    fiveYearBull: "20-25%",
    currentFit: "Verify sub-10-year status and resale quantum around SGD 2M.",
    school: "Alexandra Primary School signal.",
    transport: "Redhill/Tiong Bahru city-fringe corridor with short CBD access.",
    why: "RCR resale near MRT remains a practical upgrader/renter product. It is a cleaner hold than speculative far-flung growth plays.",
    risks: "Upside may be steady rather than explosive unless bought below nearby RCR replacement cost."
  },
  {
    rank: 8,
    name: "Gem Residences",
    region: "RCR",
    area: "Toa Payoh / Braddell",
    status: "Project candidate",
    conviction: "Medium",
    fiveYearBase: "11-18%",
    fiveYearBull: "20-24%",
    currentFit: "Verify remaining lease profile, unit stack, and current transaction psf.",
    school: "Pei Chun Public School signal.",
    transport: "Mature Toa Payoh/Braddell connectivity and central island access.",
    why: "Mature-estate scarcity and school demand support liquidity. A >20% result is possible only with a sharp entry price.",
    risks: "Likely already well-discovered by family buyers; avoid low-floor or compromised-facing units."
  },
  {
    rank: 9,
    name: "Riviere",
    region: "CCR",
    area: "Havelock / River Valley",
    status: "Live listing verified",
    conviction: "Medium",
    fiveYearBase: "10-17%",
    fiveYearBull: "18-23%",
    currentFit: "Recent live example: SGD 2.49M, 818 sqft, TOP 2023, near Havelock.",
    school: "River Valley Primary School signal.",
    transport: "TEL Havelock access and Singapore River lifestyle positioning.",
    why: "High-quality CCR/TEL asset, but the entry psf is already rich. More suited for defensive quality than highest upside.",
    risks: "Harder to clear >20% after buyer costs unless purchased materially below comparable CCR riverfront stock."
  },
  {
    rank: 10,
    name: "Sanctuary @ Newton",
    region: "CCR",
    area: "Newton / Novena",
    status: "Live listing verified",
    conviction: "Medium",
    fiveYearBase: "10-17%",
    fiveYearBull: "18-24%",
    currentFit: "Recent live example: SGD 2.118M, 807 sqft, TOP 2025, freehold.",
    school: "ACS Primary, ACS Junior, and SJI Junior corridor signals.",
    transport: "Newton/Novena MRT corridor.",
    why: "New freehold stock in a school-rich CCR/Novena corridor has scarcity value. Upside is more resilient-quality than cheap-growth.",
    risks: "Small unit size and high psf reduce margin of safety."
  },
  {
    rank: 11,
    name: "City Gate",
    region: "RCR",
    area: "Nicoll Highway / Beach Road",
    status: "Live listing verified",
    conviction: "Medium",
    fiveYearBase: "10-16%",
    fiveYearBull: "18-22%",
    currentFit: "Recent live example: SGD 1.9M, 904 sqft, TOP 2019, 350m to Nicoll Highway.",
    school: "No strong school signal in current data.",
    transport: "Nicoll Highway and Bugis/Kampong Glam fringe positioning.",
    why: "Good MRT convenience and city-fringe quantum. It needs rental demand and entry discount to reach a >20% outcome.",
    risks: "Weaker school anchor versus the top-ranked picks."
  },
  {
    rank: 12,
    name: "6 Derbyshire",
    region: "CCR",
    area: "Novena",
    status: "Live listing verified",
    conviction: "Selective",
    fiveYearBase: "8-15%",
    fiveYearBull: "16-21%",
    currentFit: "Recent live example: SGD 1.679M, 829 sqft, TOP 2017, freehold.",
    school: "ACS/SJI Junior corridor signals.",
    transport: "Novena MRT access.",
    why: "Attractive quantum for freehold CCR, but age will cross the 10-year threshold soon. Only buy if transaction comparables show clear undervaluation.",
    risks: "Less clean versus the under-10-year rule over the five-year holding period."
  }
];

const requestedCaseStudies = [
  {
    rank: "A",
    name: "Eight Riversuites",
    region: "RCR",
    area: "Boon Keng / Whampoa East",
    status: "Requested case study",
    conviction: "Medium-high",
    fiveYearBase: "12-18%",
    fiveYearBull: "20-25%",
    currentFit:
      "Best risk/reward is likely the larger 3-bed family format around the lower transaction/listing psf band. A 700 sqft 2-bed at about SGD 2,000+ psf has less margin of safety.",
    school: "Hong Wen School and Bendemeer Primary are nearby; this is useful but not as powerful as the strongest 1km school-demand picks.",
    transport:
      "Boon Keng MRT is roughly 350-440m away, with Geylang Bahru and Bendemeer also nearby. That is the main durable liquidity anchor.",
    why:
      "City-fringe RCR, near MRT, 99-year leasehold from 2011, TOP around 2016, and large project liquidity. The 20% path is plausible if bought below nearby RCR replacement-cost pressure, especially for efficient family-sized units.",
    risks:
      "It is no longer a young condo under the original 10-year rule. If buying the smaller high-psf units, a 20% five-year gain is less likely after stamp duty and selling costs.",
    verdict:
      "Better than Twin Waterfalls for transport and RCR scarcity. I would treat it as a selective buy, not an automatic buy: strong only if entry is around the lower end of recent 3-bed psf."
  },
  {
    rank: "B",
    name: "Twin Waterfalls",
    region: "OCR",
    area: "Punggol Walk / Soo Teck",
    status: "Requested case study",
    conviction: "Medium",
    fiveYearBase: "10-16%",
    fiveYearBull: "18-23%",
    currentFit:
      "Recent public listing/transaction snippets show typical compact 3-bed units around the mid-SGD 1.4M to 1.7M range, with larger/penthouse formats around SGD 2.1M to 2.25M.",
    school:
      "Strong local school convenience: the site data links it to Punggol Green Primary, and public listings also mention nearby Compassvale and Punggol View Primary.",
    transport:
      "Soo Teck LRT and Punggol MRT/Waterway Point access are useful, but the walk-to-MRT story is weaker than a direct MRT-front project.",
    why:
      "Now around the 10-year EC privatisation point, buyer pool is broader than during the EC restriction period. Family-sized quantum, Punggol town maturity, and school proximity can support liquidity.",
    risks:
      "It is an older OCR EC, not a sub-10-year private condo. The 20% case needs a low entry psf and continued Punggol upgrader demand; otherwise it is more likely to be a steady 10-16% hold.",
    verdict:
      "Decent family-liquidity hold, but not my strongest >20% pick. I would only underwrite >20% if the unit is bought near the low end of recent comparable psf and has a clean stack/layout."
  }
];

const newLaunchPipeline = [
  {
    rank: 1,
    name: "Hudson Place Residences",
    region: "RCR",
    location: "Media Circle / one-north",
    type: "Apartment",
    launchWindow: "2026",
    status: "Upcoming project",
    units: "327",
    indicativePrice: "Watch sub-/near-RCR benchmark pricing",
    score: 86,
    upside: "Strong",
    thesis:
      "Best near-term new-launch investment setup: one-north employment demand, limited true residential supply in the immediate tech/media cluster, and a smaller project size that avoids mega-launch absorption risk.",
    watchOut:
      "Do not chase if developer pricing jumps too close to prime RCR levels. Compare carefully with Dover Drive and older one-north resale stock."
  },
  {
    rank: 2,
    name: "Dover Drive GLS",
    region: "RCR",
    location: "Dover / one-north edge",
    type: "Future condo",
    launchWindow: "Likely 2027",
    status: "Awarded GLS",
    units: "TBD",
    indicativePrice: "Land bid implies premium RCR launch pricing",
    score: 84,
    upside: "Strong",
    thesis:
      "Scarce city-fringe education/employment corridor with one-north, NUS, Dover and Buona Vista demand. It should have deeper exit liquidity than many OCR launches.",
    watchOut:
      "High land cost can compress upside. Best entry is a practical 2-bed+ or compact 3-bed, not a high-psf trophy stack."
  },
  {
    rank: 3,
    name: "Bayshore Drive mixed-use GLS",
    region: "OCR",
    location: "Bayshore / Bedok South MRT",
    type: "Future mixed-use condo",
    launchWindow: "Likely 2027-2028",
    status: "Tender-stage GLS",
    units: "~1,280 homes",
    indicativePrice: "Likely premium OCR",
    score: 83,
    upside: "Strong",
    thesis:
      "Largest transformation story in the east: future mall, Bedok South MRT, Bayshore masterplan, coastal lifestyle, and long runway for precinct re-rating.",
    watchOut:
      "Huge supply means unit selection matters. Buy efficient stacks; avoid paying too much for generic inner-facing units."
  },
  {
    rank: 4,
    name: "New Upper Changi Road GLS",
    region: "OCR",
    location: "Bedok town centre",
    type: "Future mega condo",
    launchWindow: "Likely 2027-2028",
    status: "Confirmed-list GLS",
    units: "~1,040 homes",
    indicativePrice: "Likely mature-estate OCR pricing",
    score: 81,
    upside: "Strong",
    thesis:
      "Mature Bedok has transport, retail, food, schools, and a large HDB upgrader pool. A rare large launch close to Bedok MRT can pull strong local demand.",
    watchOut:
      "Mega-project absorption risk. The upside is strongest only if launch price leaves a discount to Bedok Residences/Sky Eden-style convenience premiums."
  },
  {
    rank: 5,
    name: "Lorong Puntong GLS",
    region: "OCR",
    location: "Sin Ming / Bright Hill",
    type: "Future boutique condo",
    launchWindow: "Likely 2027-2028",
    status: "Confirmed-list GLS",
    units: "~140 homes",
    indicativePrice: "Likely high psf for school/MRT scarcity",
    score: 79,
    upside: "Good",
    thesis:
      "Small supply, Bright Hill MRT, and Ai Tong School proximity make this one of the cleanest family-liquidity launches if pricing is not excessive.",
    watchOut:
      "Boutique scarcity cuts both ways: good for pricing, but thinner resale depth. High psf can make five-year upside fragile."
  },
  {
    rank: 6,
    name: "Lentor Gardens Residences",
    region: "OCR",
    location: "Lentor Gardens / Upper Thomson",
    type: "Condominium",
    launchWindow: "2026",
    status: "Upcoming project",
    units: "499",
    indicativePrice: "Compare against Springleaf/Lentor launches",
    score: 76,
    upside: "Good",
    thesis:
      "Directly benefits from the Lentor/Upper Thomson private-housing reset and TEL accessibility. Better if launch pricing undercuts nearby recent projects.",
    watchOut:
      "Lentor has several competing projects. Avoid if the price gap to resale or recently launched stock is too thin."
  },
  {
    rank: 7,
    name: "Kallang Close GLS",
    region: "RCR",
    location: "Kallang / Bendemeer",
    type: "Future waterfront condo",
    launchWindow: "Likely 2027",
    status: "Awarded GLS",
    units: "~470 homes",
    indicativePrice: "Land bid points to high RCR pricing",
    score: 75,
    upside: "Good",
    thesis:
      "City-fringe waterfront positioning, Bendemeer/Kallang MRT access, and upgrader demand from nearby mature HDB estates give it solid depth.",
    watchOut:
      "At a high launch psf, the five-year gain may be average unless the developer prices early units attractively."
  },
  {
    rank: 8,
    name: "Tanjong Rhu Road GLS",
    region: "RCR",
    location: "Tanjong Rhu / Katong Park",
    type: "Future condo",
    launchWindow: "Likely 2027",
    status: "Awarded GLS",
    units: "TBD",
    indicativePrice: "Premium RCR",
    score: 73,
    upside: "Good",
    thesis:
      "Rare private land in a long-established Tanjong Rhu pocket with TEL access and Kallang Basin lifestyle appeal.",
    watchOut:
      "Rarity will be priced in. Upside depends on selecting a livable quantum, not simply buying the lowest floor-plan psf."
  },
  {
    rank: 9,
    name: "Holland Plain GLS",
    region: "CCR",
    location: "Holland / Holland Village edge",
    type: "Future condo",
    launchWindow: "Likely 2027-2028",
    status: "Awarded GLS",
    units: "TBD",
    indicativePrice: "Premium CCR/D10",
    score: 70,
    upside: "Selective",
    thesis:
      "Rare D10/Holland supply with strong lifestyle, school, and expat-rental appeal. Good product quality could hold value well.",
    watchOut:
      "High land and launch pricing can cap percentage upside. More defensive quality than maximum-gain play."
  },
  {
    rank: 10,
    name: "Woodlands Drive 17 EC",
    region: "OCR",
    location: "Woodlands",
    type: "Executive condominium",
    launchWindow: "Likely 2026-2027",
    status: "Awarded EC site",
    units: "TBD",
    indicativePrice: "EC pricing; eligibility applies",
    score: 69,
    upside: "EC-special",
    thesis:
      "If eligible, EC entry discount plus Woodlands regional-centre/Johor connectivity story can create strong long-term gains after privatisation.",
    watchOut:
      "Not a normal five-year liquidity play. EC restrictions and MOP mean realised gains take longer."
  },
  {
    rank: 11,
    name: "Dunearn Road GLS",
    region: "CCR",
    location: "Bukit Timah / King Albert Park",
    type: "Future condo",
    launchWindow: "Likely 2027",
    status: "Awarded GLS",
    units: "TBD",
    indicativePrice: "Premium Bukit Timah",
    score: 68,
    upside: "Selective",
    thesis:
      "School belt, nature, and King Albert Park accessibility make it durable for owner-occupiers.",
    watchOut:
      "The location is obvious, so pricing may absorb most of the good news upfront."
  },
  {
    rank: 12,
    name: "Peck Hay Road GLS",
    region: "CCR",
    location: "Newton",
    type: "Future condo",
    launchWindow: "Likely 2027-2028",
    status: "Tender-stage GLS",
    units: "~315 homes",
    indicativePrice: "Very high CCR pricing",
    score: 64,
    upside: "Defensive",
    thesis:
      "Newton MRT interchange adjacency and central scarcity make it high-quality stock.",
    watchOut:
      "Likely too expensive for a clean 20% five-year upside thesis unless bought during a weak launch phase."
  }
];

const topSoonPipeline = [
  {
    rank: 1,
    name: "The Reserve Residences",
    region: "RCR",
    location: "Beauty World / Jalan Anak Bukit",
    top: "Q1 2028",
    units: "732 homes",
    status: "Under construction / integrated",
    score: 88,
    upside: "Strong",
    thesis:
      "The cleanest TOP-soon thesis: integrated transport hub, Beauty World MRT linkage, mall component, and mature Bukit Timah/Clementi upgrader depth.",
    watchOut:
      "A lot of the upside was already priced at launch. Subsale only works if the entry spread versus new D21/D23 supply is still visible."
  },
  {
    rank: 2,
    name: "Nava Grove",
    region: "RCR",
    location: "Pine Grove / Ulu Pandan",
    top: "Nov 2028",
    units: "552",
    status: "Under construction",
    score: 84,
    upside: "Strong",
    thesis:
      "Second Pine Grove parcel with better timing than Pinetree Hill for buyers who missed the first launch. Family layouts, Henry Park/Nan Hua corridor demand, and RCR scarcity support the case.",
    watchOut:
      "No direct MRT. Buy only if the price gap versus Pinetree Hill and Clementi/one-north resale remains sensible."
  },
  {
    rank: 3,
    name: "Pinetree Hill",
    region: "RCR",
    location: "Pine Grove / Ulu Pandan",
    top: "Sep 2027",
    units: "520",
    status: "Near TOP / mostly sold",
    score: 82,
    upside: "Good",
    thesis:
      "First mover in the Pine Grove reset, close to strong school-demand corridors and nearly sold out. TOP timing can attract buyers who want a newer RCR family product soon.",
    watchOut:
      "It is already very well sold and the Henry Park/school narrative is known. Do not overpay in subsale just because TOP is near."
  },
  {
    rank: 4,
    name: "The Continuum",
    region: "RCR",
    location: "Thiam Siew Avenue / Katong",
    top: "2027",
    units: "816",
    status: "Under construction",
    score: 79,
    upside: "Good",
    thesis:
      "Large freehold D15 project with Kong Hwa/Haig/Tanjong Katong school demand and Paya Lebar/Dakota access. Freehold scarcity helps long-term holding.",
    watchOut:
      "Percentage upside can be slower because freehold pricing starts high. Best for quality hold, less for fast flip."
  },
  {
    rank: 5,
    name: "Grand Dunman",
    region: "RCR",
    location: "Dakota / Dunman Road",
    top: "Late 2027 / 2028",
    units: "1,008",
    status: "Under construction",
    score: 78,
    upside: "Good",
    thesis:
      "Direct Dakota MRT convenience, huge facilities, and strong D15 family/rental demand. Liquidity should be deep because of project scale.",
    watchOut:
      "Large supply creates internal competition at exit. Stack and entry price matter more than project name."
  },
  {
    rank: 6,
    name: "Tembusu Grand",
    region: "RCR",
    location: "Jalan Tembusu / Tanjong Katong",
    top: "Oct 2028",
    units: "638",
    status: "Under construction",
    score: 76,
    upside: "Good",
    thesis:
      "D15 family location, future Tanjong Katong MRT convenience, reputable developers, and limited remaining supply can support resale liquidity.",
    watchOut:
      "Competes with Grand Dunman, The Continuum, Emerald of Katong, and other D15 stock. Avoid paying a premium for generic stacks."
  },
  {
    rank: 7,
    name: "Lentor Hills / Lentor cluster",
    region: "OCR",
    location: "Lentor / Upper Thomson",
    top: "2027-2028",
    units: "Cluster supply",
    status: "Multiple projects completing",
    score: 70,
    upside: "Selective",
    thesis:
      "TEL accessibility and new-town clustering can create a refreshed private enclave, with some rental and upgrader demand.",
    watchOut:
      "Too many similar projects. Only buy the project/stack with the clearest discount and best walk to MRT."
  },
  {
    rank: 8,
    name: "Tengah Garden Residences",
    region: "OCR",
    location: "Tengah Garden Avenue",
    top: "2029",
    units: "863",
    status: "Newly launched / future TOP",
    score: 66,
    upside: "Longer-term",
    thesis:
      "New town growth, future Jurong Region Line, and attractive quantum help long-term buyers who can tolerate immature amenities.",
    watchOut:
      "Not a near-TOP play. The five-year gain depends on Tengah maturing faster than buyer fatigue from large supply."
  }
];

const longTenureOlderCondos = [
  {
    rank: 1,
    name: "Maple Woods",
    region: "RCR",
    location: "Bukit Timah / King Albert Park",
    tenure: "Freehold",
    top: "1997",
    units: "697",
    score: 88,
    upside: "Strong",
    conditionAngle:
      "Large green estate, full facilities, proven transaction liquidity, and KAP MRT access. Shortlist only renovated stacks with no traffic/noise issue.",
    thesis:
      "Best blend of long tenure, school-belt demand, MRT access, sizeable land, and liquidity. It is expensive, but it is the cleanest older long-tenure compound asset in this screen.",
    watchOut:
      "Entry psf is already high. Avoid weak stacks and units needing heavy renovation unless the discount is real."
  },
  {
    rank: 2,
    name: "The Anchorage",
    region: "RCR",
    location: "Alexandra / Queenstown",
    tenure: "Freehold",
    top: "1997",
    units: "775",
    score: 86,
    upside: "Strong",
    conditionAngle:
      "Large freehold estate beside Anchorpoint/IKEA with Queenstown MRT access and family-sized layouts.",
    thesis:
      "Rare large-scale freehold in a mature RCR location. The space-per-dollar and retail/MRT convenience make it attractive versus smaller new 99-year RCR units.",
    watchOut:
      "Quantum can be high because units are large. Confirm stack, road noise, and MCST upkeep."
  },
  {
    rank: 3,
    name: "Glentrees",
    region: "CCR",
    location: "Mount Sinai / Holland",
    tenure: "999-year",
    top: "2005",
    units: "176",
    score: 84,
    upside: "Strong",
    conditionAngle:
      "Low-density garden/terrace concept with 999-year tenure and Henry Park proximity; good if the unit is well kept.",
    thesis:
      "This is a lifestyle-scarcity pick: long tenure, prime landed-enclave setting, large units, and school demand. It fits buyers who want space and permanence.",
    watchOut:
      "Boutique liquidity and high quantum. A 20% thesis needs a sharp entry price, not just a pretty estate."
  },
  {
    rank: 4,
    name: "Monterey Park Condominium",
    region: "RCR",
    location: "West Coast Rise / Clementi",
    tenure: "999-year from 1885",
    top: "2005",
    units: "280",
    score: 82,
    upside: "Good",
    conditionAngle:
      "Newer than many legacy freehold picks, with family-sized layouts and generally more manageable age.",
    thesis:
      "A practical value pick: 999-year land, 2005 completion, West Coast/Clementi school corridor, and lower psf than many newer 99-year Clementi-area products.",
    watchOut:
      "MRT access is weaker. Rank improves if the unit is well renovated and bought below nearby new-launch alternatives."
  },
  {
    rank: 5,
    name: "Clementi Park",
    region: "RCR",
    location: "Sunset Way / Clementi",
    tenure: "Freehold",
    top: "1985",
    units: "487",
    score: 78,
    upside: "Selective",
    conditionAngle:
      "Large freehold estate in a quiet green enclave; condition varies heavily by block and unit renovation.",
    thesis:
      "Long-tenure family space near the Clementi/Bukit Timah education belt. Upside is tied to land scarcity and replacement-cost gap.",
    watchOut:
      "Very old. Budget renovation and inspect waterproofing, lifts, facade, carpark, and estate sinking fund."
  },
  {
    rank: 6,
    name: "Pandan Valley",
    region: "RCR",
    location: "Pandan Valley / Ulu Pandan",
    tenure: "Freehold",
    top: "1979",
    units: "605+",
    score: 77,
    upside: "Selective",
    conditionAngle:
      "Iconic large-land freehold estate with huge layouts and park-like grounds; some units are highly renovated, others need major work.",
    thesis:
      "Best landbank/en-bloc optionality among the old freehold family estates, with Henry Park and Dover/Clementi corridor demand.",
    watchOut:
      "Age risk is real. The wrong unit can become a renovation project rather than an investment."
  },
  {
    rank: 7,
    name: "Ridgewood Condominium",
    region: "CCR",
    location: "Mount Sinai / Henry Park",
    tenure: "999-year from 1885",
    top: "1981",
    units: "464",
    score: 75,
    upside: "Selective",
    conditionAngle:
      "Large 999-year site in the Henry Park/Mount Sinai school belt; condition and block quality must be checked carefully.",
    thesis:
      "The land and school-demand story are strong, and large layouts are hard to replicate. Works if you buy a maintained stack below nearby newer supply.",
    watchOut:
      "Old-estate capex and renovation needs can eat the upside. Treat MCST documents as mandatory, not optional."
  },
  {
    rank: 8,
    name: "Spanish Village",
    region: "CCR",
    location: "Farrer Road / Holland",
    tenure: "Freehold",
    top: "1987",
    units: "226",
    score: 72,
    upside: "Selective",
    conditionAngle:
      "Low-rise freehold D10 estate near Farrer Road MRT; appealing if the estate and unit have been well maintained.",
    thesis:
      "Freehold, central school/lifestyle corridor, and low-rise scarcity give it defensive value with en-bloc optionality.",
    watchOut:
      "Smaller project and older build mean thinner liquidity. Avoid unless inspection confirms low capex risk."
  },
  {
    rank: 9,
    name: "Hawaii Tower",
    region: "RCR",
    location: "Meyer Road / Katong Park",
    tenure: "Freehold",
    top: "1984",
    units: "135",
    score: 70,
    upside: "Selective",
    conditionAngle:
      "Freehold Meyer Road address, TEL Katong Park access, and sea/coast lifestyle appeal.",
    thesis:
      "Long-tenure Meyer Road stock has scarcity value and benefits from TEL access and east-coast lifestyle demand.",
    watchOut:
      "Small project and very large older units mean high quantum and fewer buyers. Not ideal for a tight SGD 2M budget."
  },
  {
    rank: 10,
    name: "Melrose Park",
    region: "CCR",
    location: "Kellock Road / River Valley",
    tenure: "999-year from 1877",
    top: "2000",
    units: "170",
    score: 68,
    upside: "Defensive",
    conditionAngle:
      "999-year River Valley estate with spacious layouts and central convenience.",
    thesis:
      "Quality long-tenure CCR hold with proven profit history, but current pricing already reflects much of the scarcity premium.",
    watchOut:
      "High psf and high quantum cap percentage upside. Better for legacy preservation than aggressive five-year gain."
  }
];

const matureLeaseholdCondos = [
  {
    rank: 1,
    name: "Gardenvista",
    region: "RCR",
    location: "Dunearn / King Albert Park",
    tenure: "99-year from 1999",
    top: "2006",
    units: "318",
    score: 86,
    upside: "Strong",
    gap:
      "Was excluded by the long-tenure screen because it is 99-year leasehold, not freehold/999-year. This is the main missing project added after recheck.",
    thesis:
      "Best new addition for this filter: mature Bukit Timah/KAP location, walkable MRT node, school-belt family demand, manageable project size, and likely psf discount versus nearby freehold stock.",
    watchOut:
      "Lease decay is visible because the lease started in 1999. Compare carefully with freehold neighbours and avoid paying freehold-like psf."
  },
  {
    rank: 2,
    name: "One-North Residences",
    region: "RCR",
    location: "one-north / Buona Vista",
    tenure: "99-year from 2005",
    top: "2009",
    units: "405",
    score: 85,
    upside: "Strong",
    gap:
      "Previously sat outside the freehold/999-year table, despite having strong employment-node rental demand.",
    thesis:
      "Direct one-north work-live-play exposure, deep tenant demand from Biopolis/Fusionopolis, walkable MRT access, and scarcity versus newer one-north launches.",
    watchOut:
      "Layouts and loft products can be niche. Check usable area, maintenance, and entry psf against One-North Eden and Blossoms by the Park."
  },
  {
    rank: 3,
    name: "The Metropolitan Condominium",
    region: "RCR",
    location: "Redhill / Alexandra View",
    tenure: "99-year",
    top: "2009",
    units: "382",
    score: 84,
    upside: "Strong",
    gap:
      "Missing because earlier forms focused on new launches, sub-10-year stock, or long-tenure estates.",
    thesis:
      "Very clean MRT-front RCR liquidity play. Redhill access, Alexandra/Dawson renewal, CBD proximity, and practical 2- to 4-bed layouts support a broad exit pool.",
    watchOut:
      "It is well-known and not cheap. The upside case depends on buying below the upper recent psf band, not simply buying any available unit."
  },
  {
    rank: 4,
    name: "Waterbank at Dakota",
    region: "RCR",
    location: "Dakota / Old Airport Road",
    tenure: "99-year from 2009",
    top: "2013",
    units: "616",
    score: 82,
    upside: "Strong",
    gap:
      "Previously missing from the older-stock forms because it is neither new enough for the scout nor long-tenure.",
    thesis:
      "Two-minute Dakota MRT access, D15/RCR family demand, Old Airport Road amenity depth, and sizeable liquidity make this a strong mature 99-year candidate.",
    watchOut:
      "Internal competition is real in a 616-unit project. Prioritise efficient stacks and avoid paying too much for generic pool-facing premiums."
  },
  {
    rank: 5,
    name: "Citylights",
    region: "RCR",
    location: "Lavender / Jellicoe Road",
    tenure: "99-year from 2004",
    top: "2007",
    units: "600",
    score: 80,
    upside: "Good",
    gap:
      "Excluded by the long-tenure rule even though it is a mature city-fringe MRT project.",
    thesis:
      "Lavender MRT convenience, city-fringe rental pool, large-scale facilities, and downtown access give it durable liquidity.",
    watchOut:
      "City-fringe convenience is already recognised. Check stack, noise, and whether the asking psf leaves any margin versus newer Beach Road/Rochor stock."
  },
  {
    rank: 6,
    name: "Heritage View",
    region: "RCR",
    location: "Dover / one-north edge",
    tenure: "99-year from 1996",
    top: "2000",
    units: "618",
    score: 79,
    upside: "Good",
    gap:
      "Previously absent because the long-tenure table only allowed freehold/999-year estates.",
    thesis:
      "Education and knowledge-economy demand from Dover, INSEAD/ESSEC, Biopolis, Fusionopolis, and Buona Vista support rental and resale depth.",
    watchOut:
      "Lease age and estate capex matter. Read MCST documents and compare with Dover Parkview and newer one-north alternatives."
  },
  {
    rank: 7,
    name: "Dover Parkview",
    region: "RCR",
    location: "Dover Rise / Buona Vista",
    tenure: "99-year from 1993",
    top: "1997",
    units: "686",
    score: 78,
    upside: "Good",
    gap:
      "Previously filtered out despite strong school, university, and one-north rental anchors.",
    thesis:
      "Large older layouts, dual Buona Vista/Dover access, education-belt demand, and lower psf versus newer RCR projects make it a value-for-space candidate.",
    watchOut:
      "Older estate and shorter remaining lease. Budget renovation, lifts/facade checks, and sinking-fund review before underwriting upside."
  },
  {
    rank: 8,
    name: "D'Leedon",
    region: "CCR",
    location: "Farrer Road / Leedon Heights",
    tenure: "99-year",
    top: "2014",
    units: "1,703",
    score: 77,
    upside: "Good",
    gap:
      "Not part of the freehold/999-year list, but worth tracking as a mature 99-year D10 mega project.",
    thesis:
      "Zaha Hadid design, Farrer Road MRT access, huge land/facilities, and D10 school/lifestyle appeal keep it highly liquid despite leasehold tenure.",
    watchOut:
      "Mega-project internal resale competition can cap gains. Choose rare layouts/stacks and avoid high-psf small units with limited family exit demand."
  },
  {
    rank: 9,
    name: "The Interlace",
    region: "RCR",
    location: "Depot Road / Alexandra",
    tenure: "99-year",
    top: "2013",
    units: "1,040",
    score: 76,
    upside: "Good",
    gap:
      "Previously missed because it is an older 99-year architectural/lifestyle asset, not a launch or long-tenure candidate.",
    thesis:
      "Iconic architecture, large land, resort-style facilities, Southern Ridges lifestyle, and city-fringe access create differentiated owner-occupier demand.",
    watchOut:
      "Project is product-specific and not every layout is liquid. Check renovation quality, facing, and exit demand for the exact unit type."
  },
  {
    rank: 10,
    name: "Caribbean at Keppel Bay",
    region: "RCR",
    location: "Keppel Bay / HarbourFront",
    tenure: "99-year from 1999",
    top: "2004",
    units: "969",
    score: 75,
    upside: "Good",
    gap:
      "Previously excluded by the long-tenure rule, despite being a mature waterfront 99-year project with a strong lifestyle moat.",
    thesis:
      "HarbourFront/VivoCity access, waterfront positioning, marina lifestyle, and Greater Southern Waterfront optionality create a differentiated resale story.",
    watchOut:
      "Quantum can run high and waterfront premiums are visible. Compare to Reflections, Corals, and non-waterfront RCR alternatives before buying."
  },
  {
    rank: 11,
    name: "The Bayshore",
    region: "OCR",
    location: "Bayshore / East Coast",
    tenure: "99-year from 1993",
    top: "1996",
    units: "1,038",
    score: 74,
    upside: "Good",
    gap:
      "Did not appear in the earlier forms because it is mature 99-year OCR stock rather than young or long-tenure stock.",
    thesis:
      "Bayshore transformation, TEL/Bayshore-area renewal, coastal lifestyle, and large-unit affordability versus new east-coast supply give it a credible re-rating path.",
    watchOut:
      "Large project and older lease. Avoid weak stacks and validate how much of the Bayshore transformation premium is already priced in."
  },
  {
    rank: 12,
    name: "Costa Del Sol",
    region: "OCR",
    location: "Bayshore / Upper East Coast",
    tenure: "99-year from 2000",
    top: "2003/2004",
    units: "906",
    score: 73,
    upside: "Good",
    gap:
      "Previously not captured because the old list separated newer investment scouts from long-tenure legacy estates.",
    thesis:
      "Seafront orientation, Bayshore transformation, large facilities, and relative value versus newer east-coast stock can support upside if bought at disciplined psf.",
    watchOut:
      "Maintenance, facade, and sea-facing premiums need unit-level checks. Do not overpay just because of the Bayshore story."
  },
  {
    rank: 13,
    name: "Parc Oasis",
    region: "OCR",
    location: "Jurong East / Lakeside",
    tenure: "99-year",
    top: "1994",
    units: "950",
    score: 71,
    upside: "Selective",
    gap:
      "Previously missed by the long-tenure filter, but should be monitored for Jurong Lake District and western-region catalysts.",
    thesis:
      "Large mature estate, Jurong Lake District optionality, and lower psf family-sized layouts can work for buyers who want space near the west growth story.",
    watchOut:
      "Older lease and estate condition are the main brakes. Only strong if the unit is meaningfully cheaper than newer Jurong/Lakeside options."
  },
  {
    rank: 14,
    name: "The Lakeshore",
    region: "OCR",
    location: "Lakeside / Jurong West",
    tenure: "99-year",
    top: "2007",
    units: "848",
    score: 70,
    upside: "Selective",
    gap:
      "Not in the first research pass because the page did not yet have a mature 99-year leasehold bucket.",
    thesis:
      "Lakeside MRT area, Jurong Lake District long-run story, and large project liquidity keep it relevant for west-side family demand.",
    watchOut:
      "JLD timing can be slow. Buy only if current psf compensates for the wait and leasehold age."
  },
  {
    rank: 15,
    name: "Bishan 8",
    region: "RCR",
    location: "Bishan central",
    tenure: "99-year",
    top: "1996",
    units: "200",
    score: 69,
    upside: "Selective",
    gap:
      "Previously omitted because it is old 99-year stock rather than long-tenure stock.",
    thesis:
      "Bishan MRT/interchange, Junction 8, mature-estate scarcity, and school/family demand make it a small but practical watchlist project.",
    watchOut:
      "Small project and old lease can reduce transaction depth. Inspect condition and compare with newer Bishan/Thomson options."
  }
];

const researchSources = [
  {
    name: "URA 1Q2026 real estate statistics",
    url: "https://www.ura.gov.sg/Corporate/Media-Room/Media-Releases/pr26-31",
    note: "Latest official prices, rentals, sales, vacancy, and pipeline figures used in this report."
  },
  {
    name: "URA 4Q2025 real estate statistics",
    url: "https://www.ura.gov.sg/Corporate/Media-Room/Media-Releases/pr26-05",
    note: "Full-year 2025 price, rental, completion, and supply context."
  },
  {
    name: "URA private residential property data portal",
    url: "https://www.ura.gov.sg/Corporate/Property/Property-Data/Private-Residential-Properties",
    note: "Official portal for transaction, rental, developer sales, pipeline, and time-series data."
  },
  {
    name: "data.gov.sg URA private transactions dataset",
    url: "https://data.gov.sg/datasets/d_7c69c943d5f0d89d6a9a773d2b51f337/view",
    note: "Public transaction-volume dataset used for market liquidity context."
  },
  {
    name: "LTA rail development factsheet, 4 Mar 2026",
    url: "https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/3/news-releases/next-phase-of-rail-development.html",
    note: "CCL6, TEL5, DTL3e, CRL3, JRL, Seletar/Tengah/West Coast planning context."
  },
  {
    name: "LTA Cross Island Line project page",
    url: "https://www.lta.gov.sg/content/ltagov/en/upcoming_projects/rail_expansion/cross_island_line.html",
    note: "CRL1 2030, CRL-Punggol Extension 2032, and CRL2 2032 station/corridor context."
  },
  {
    name: "LTA Jurong Region Line project page",
    url: "https://www.lta.gov.sg/content/ltagov/en/upcoming_projects/rail_expansion/jurong_region_line.html",
    note: "JRL stages and western-region connectivity context."
  },
  {
    name: "Local investment condo shortlist",
    url: "data/investment_condos.json",
    note: "Project candidates, live listing snippets, school signals, and HDB-exclusion filtering generated for this site."
  },
  {
    name: "Eight Riversuites project directory",
    url: "https://www.singaporeexpats.com/condo/condo/3363/EIGHT-RIVERSUITES",
    note: "Project facts: Whampoa East address, D12, 99-year leasehold, TOP around 2016, 862 units, nearby MRT and schools."
  },
  {
    name: "Eight Riversuites live listing snippets",
    url: "https://www.propertyguru.com.sg/property-for-sale/at-eight-riversuites-21204",
    note: "Current sale-listing evidence for 2-bed and larger-unit asking quantum, psf, and Boon Keng MRT proximity."
  },
  {
    name: "Eight Riversuites recent transaction summary",
    url: "https://www.propertyhowmuch.sg/condo/eight-riversuites__52438",
    note: "Recent 1-bed, 2-bed, and 3-bed transaction ranges used to frame entry-price discipline."
  },
  {
    name: "Twin Waterfalls project directory",
    url: "https://www.singaporeexpats.com/condo/condo/3788/TWIN-WATERFALLS",
    note: "Project facts: Punggol Walk address, D19, 99-year leasehold, TOP around 2015, 728 units."
  },
  {
    name: "Twin Waterfalls listing and transaction snippets",
    url: "https://www.srx.com.sg/condo/twin-waterfalls-21562",
    note: "Current sale-listing and recent transaction snippets used for Punggol pricing and unit-size context."
  },
  {
    name: "Twin Waterfalls price trend summary",
    url: "https://stackproperty.sg/private/projects/twin-waterfalls",
    note: "Three-year resale average psf by floor-area band for the Twin Waterfalls case study."
  },
  {
    name: "PropertyGuru resale EC guide",
    url: "https://www.propertyguru.com.sg/property-guides/buying-resale-condo-executive-condo-singapore-60281",
    note: "Background on EC resale restrictions and the 10-year full-privatisation point."
  },
  {
    name: "URA current GLS sites",
    url: "https://www.ura.gov.sg/Corporate/Land-Sales/Current-URA-GLS-Sites",
    note: "Live official list of Confirmed and Reserve List residential sites, including awarded, tender-stage, and scheduled 2026 sites."
  },
  {
    name: "EdgeProp new launches data",
    url: "https://www.edgeprop.sg/new-launches",
    note: "Current upcoming-launch table, latest launch sales data, showflat timing, units, district, and completion context."
  },
  {
    name: "EdgeProp 1H2026 GLS supply article",
    url: "https://www.edgeprop.sg/property-news/1h2026-gls-programme-offers-nine-confirmed-list-sites-including-two-ec-plots-and-mixed-use-site",
    note: "Supply context for the 1H2026 GLS programme, including Bayshore Drive, Peck Hay Road, Berlayar Drive, New Upper Changi Road, Lorong Puntong, and EC plots."
  },
  {
    name: "ERA 1H2026 GLS research",
    url: "https://www.era.com.sg/research-articles/1h-2026-gls-6-private-residential-sites-1-mixed-use-site-and-2-ec-sites-on-confirmed-list",
    note: "Research notes on likely buyer demand, mature-estate appeal, and New Upper Changi Road's Bedok MRT proximity and estimated unit count."
  },
  {
    name: "CBRE Kallang Close tender commentary",
    url: "https://www.cbre.com.sg/press-releases/commentary-on-ura-tender-closing-at-kallang-close",
    note: "Kallang Close tender result, 470-unit indication, bid participation, and local upgrader demand context."
  },
  {
    name: "HDB upcoming EC developments",
    url: "https://www.hdb.gov.sg/-/media/buying-a-flat/executive-condominiums/finding-an-ec/Upcoming-EC-development.pdf?hash=E2515AB845F3998B6BFAC6E8E4885B8A&sc_lang=en",
    note: "Official upcoming EC sites and successful tenderers for Woodlands Drive 17, Senja Close, and Sembawang Road."
  },
  {
    name: "Pinetree Hill project facts",
    url: "https://www.pinetree-hill.com.sg/",
    note: "Project fact sheet for Pinetree Hill: 520 units, Pine Grove, 99-year leasehold, expected TOP around September 2027."
  },
  {
    name: "Pinetree Hill market data",
    url: "https://stackproperty.sg/private/projects/pinetree-hill",
    note: "Pinetree Hill D21/RCR project details and sales/psf context used for the TOP-soon watchlist."
  },
  {
    name: "Nava Grove project facts",
    url: "https://www.newlaunches.sg/condominium/nava-grove.html",
    note: "Nava Grove project facts: Pine Grove, MCL Land and Sinarmas Land, expected TOP around November 2028."
  },
  {
    name: "Nava Grove market listing",
    url: "https://www.99.co/singapore/condos-apartments/nava-grove",
    note: "Nava Grove location, project relationship to Pinetree Hill, and current new-launch context."
  },
  {
    name: "The Reserve Residences factsheet",
    url: "https://www.fareast.com.sg/-/media/fareast/about-us_new/newsroom-landing-page/related-news/PDFs/Integrated-Development-The-Reserve-Residences-Launches-on-27-May-2023.pdf",
    note: "Official launch factsheet for The Reserve Residences, including Beauty World integrated hub and estimated TOP."
  },
  {
    name: "The Continuum project facts",
    url: "https://www.thecontinuumcondo.com/",
    note: "The Continuum D15 freehold project facts, TOP timing, unit count, and location context."
  },
  {
    name: "Grand Dunman project facts",
    url: "https://condolisting.sg/condo/grand-dunman/",
    note: "Grand Dunman D15 project facts, Dakota proximity, unit count, and expected TOP context."
  },
  {
    name: "Tembusu Grand project facts",
    url: "https://condolisting.sg/condo/tembusu-grand/",
    note: "Tembusu Grand D15 project facts, unit count, developer, and expected TOP context."
  },
  {
    name: "Monterey Park Condominium facts",
    url: "https://www.srx.com.sg/condo/monterey-park-condominium-62",
    note: "Monterey Park facts: 999-year lease from 1885, West Coast Rise, D5, 280 units, completed around 2005."
  },
  {
    name: "Monterey Park price trend",
    url: "https://www.homejourney.sg/projects/monterey-park-condominium",
    note: "Recent Monterey Park transaction and psf context for the long-tenure older-condo screen."
  },
  {
    name: "Glentrees project facts",
    url: "https://condolisting.sg/condo/glentrees/",
    note: "Glentrees facts: 999-year leasehold, Mount Sinai Lane, District 10, completed 2005, 176 units."
  },
  {
    name: "Glentrees transaction context",
    url: "https://www.propertyguru.com.sg/project/glentrees-274/last-transacted-prices-and-insights",
    note: "Glentrees current/historical transaction context and unit-size evidence."
  },
  {
    name: "Maple Woods project facts",
    url: "https://www.edgeprop.sg/condo-apartment/maplewoods",
    note: "Maple Woods facts: freehold, completed 1997, 697 units, King Albert Park access, recent psf data."
  },
  {
    name: "The Anchorage project facts",
    url: "https://condolisting.sg/condo/the-anchorage/",
    note: "The Anchorage facts: freehold, Queenstown/Alexandra, 775 units, completed 1997, large older layouts."
  },
  {
    name: "Clementi Park project facts",
    url: "https://www.propertyguru.com.sg/project/clementi-park-230",
    note: "Clementi Park facts: freehold Sunset Way condo, older CDL estate in District 21."
  },
  {
    name: "Pandan Valley project facts",
    url: "https://www.homejourney.sg/projects/pandan-valley",
    note: "Pandan Valley facts: freehold, completed 1979, large D21 land plot and big-unit layout context."
  },
  {
    name: "Ridgewood long-tenure context",
    url: "https://www.eeeha.com.sg/news/RENfortnightly14Oct-31Oct2017.pdf",
    note: "Ridgewood 999-year site and large land-parcel context used for the long-tenure screen."
  },
  {
    name: "Spanish Village project facts",
    url: "https://www.edgeprop.sg/condo-apartment/spanish-village",
    note: "Spanish Village facts: freehold, Farrer Road, District 10, completed 1987."
  },
  {
    name: "Hawaii Tower project facts",
    url: "https://www.srx.com.sg/condo/hawaii-tower-1178",
    note: "Hawaii Tower facts: freehold Meyer Road condo completed in 1984."
  },
  {
    name: "Melrose Park project facts",
    url: "https://www.edgeprop.sg/index.php?option=com_analytica&p=melrose-park-1225&page=residential&task=pdf&uid=0",
    note: "Melrose Park facts and 999-year River Valley transaction context."
  },
  {
    name: "CondoListing 99-year leasehold index",
    url: "https://condolisting.sg/99-years-leasehold-condos-in-singapore/",
    note: "Cross-check source for mature 99-year leasehold candidates, including Gardenvista, One-North Residences, Heritage View, Dover Parkview, The Bayshore, Costa Del Sol, Parc Oasis, and The Lakeshore."
  },
  {
    name: "Gardenvista project facts",
    url: "https://condolisting.sg/condo/gardenvista/",
    note: "Gardenvista facts: Dunearn Road, District 21/RCR, 99-year leasehold, 318 units, TOP 2006."
  },
  {
    name: "One-North Residences project facts",
    url: "https://condolisting.sg/condo/one-north-residences/",
    note: "One-North Residences facts: 99-year leasehold, 405 units, TOP 2009, one-north MRT/employment-node context."
  },
  {
    name: "The Metropolitan Condominium project facts",
    url: "https://www.propertyguru.com.sg/project/the-metropolitan-condominium-89",
    note: "The Metropolitan facts: 99-year leasehold, completion 2009, 382 units, Redhill MRT proximity and transaction context."
  },
  {
    name: "Waterbank at Dakota project facts",
    url: "https://condolisting.sg/condo/waterbank-at-dakota/",
    note: "Waterbank at Dakota facts: 99-year leasehold from 2009, 616 units, TOP 2013, Dakota MRT proximity."
  },
  {
    name: "Citylights project facts",
    url: "https://condolisting.sg/condo/citylights/",
    note: "Citylights facts: 99-year leasehold from 2004, 600 units, TOP 2007, Lavender MRT city-fringe context."
  },
  {
    name: "D'Leedon project facts",
    url: "https://condolisting.sg/condo/dleedon/",
    note: "D'Leedon facts: District 10/CCR, 99-year leasehold, 1,703 units, TOP 2014, Farrer Road MRT context."
  },
  {
    name: "The Interlace project facts",
    url: "https://condolisting.sg/condo/the-interlace/",
    note: "The Interlace facts: 99-year leasehold, 1,040 units, TOP 2013, Alexandra/Depot Road lifestyle context."
  },
  {
    name: "Caribbean at Keppel Bay project facts",
    url: "https://caribbean.com.sg/about-condo",
    note: "Caribbean at Keppel Bay facts: 99-year leasehold, 969 units, completed 2004, HarbourFront/Keppel Bay context."
  },
  {
    name: "The Bayshore project facts",
    url: "https://condolisting.sg/condo/the-bayshore/",
    note: "The Bayshore facts: 99-year lease from 1993, 1,038 units, TOP 1996, Bayshore transformation context."
  },
  {
    name: "Costa Del Sol project facts",
    url: "https://condolisting.sg/condo/costa-del-sol/",
    note: "Costa Del Sol facts: 99-year leasehold, about 906 units, TOP around 2003/2004, Bayshore seafront context."
  }
];

function renderSignals() {
  document.getElementById("researchSignalGrid").innerHTML = marketSignals
    .map(
      (signal) => `
        <article class="research-signal-card">
          <span>${t(signal.label)}</span>
          <strong>${signal.value}</strong>
          <p>${t(signal.note)}</p>
        </article>
      `
    )
    .join("");
}

function convictionClass(conviction) {
  return conviction.toLowerCase().replace(/[^a-z]+/g, "-");
}

function renderPicks() {
  document.getElementById("researchPickGrid").innerHTML = condoPicks
    .map(
      (pick) => `
        <article class="research-pick-card">
          <div class="research-pick-head">
            <div>
              <span class="research-rank">#${pick.rank}</span>
              <h3>${pick.name}</h3>
              <p>${zhProjectStatus(pick)}</p>
            </div>
            <span class="conviction ${convictionClass(pick.conviction)}">${t(pick.conviction)}</span>
          </div>
          <div class="research-return-row">
            <div><span>Base 5y</span><strong>${pick.fiveYearBase}</strong></div>
            <div><span>Bull 5y</span><strong>${pick.fiveYearBull}</strong></div>
          </div>
          <dl class="research-pick-list">
            <dt>Current fit</dt><dd>${isZh() ? zhPickDetail(pick, "currentFit") : pick.currentFit}</dd>
            <dt>School</dt><dd>${isZh() ? zhPickDetail(pick, "school") : pick.school}</dd>
            <dt>Transport</dt><dd>${isZh() ? zhPickDetail(pick, "transport") : pick.transport}</dd>
            <dt>Why it can re-rate</dt><dd>${isZh() ? zhPickDetail(pick, "why") : pick.why}</dd>
            <dt>Main risk</dt><dd>${isZh() ? zhPickDetail(pick, "risks") : pick.risks}</dd>
          </dl>
        </article>
      `
    )
    .join("");
}

function renderCaseStudies() {
  document.getElementById("researchCaseGrid").innerHTML = requestedCaseStudies
    .map(
      (pick) => `
        <article class="research-pick-card requested-case-card">
          <div class="research-pick-head">
            <div>
              <span class="research-rank">Case ${pick.rank}</span>
              <h3>${pick.name}</h3>
              <p>${zhProjectStatus(pick)}</p>
            </div>
            <span class="conviction ${convictionClass(pick.conviction)}">${t(pick.conviction)}</span>
          </div>
          <div class="research-return-row">
            <div><span>Base 5y</span><strong>${pick.fiveYearBase}</strong></div>
            <div><span>Bull 5y</span><strong>${pick.fiveYearBull}</strong></div>
          </div>
          <dl class="research-pick-list">
            <dt>Current fit</dt><dd>${isZh() ? zhPickDetail(pick, "currentFit") : pick.currentFit}</dd>
            <dt>School</dt><dd>${isZh() ? zhPickDetail(pick, "school") : pick.school}</dd>
            <dt>Transport</dt><dd>${isZh() ? zhPickDetail(pick, "transport") : pick.transport}</dd>
            <dt>Why it can re-rate</dt><dd>${isZh() ? zhPickDetail(pick, "why") : pick.why}</dd>
            <dt>Main risk</dt><dd>${isZh() ? zhPickDetail(pick, "risks") : pick.risks}</dd>
            <dt>Verdict</dt><dd>${isZh() ? zhPickDetail(pick, "verdict") : pick.verdict}</dd>
          </dl>
        </article>
      `
    )
    .join("");
}

function renderNewLaunches() {
  document.getElementById("newLaunchBody").innerHTML = newLaunchPipeline
    .map(
      (launch) => `
        <tr>
          <td>${launch.rank}</td>
          <td>
            <strong>${launch.name}</strong>
            <span class="table-note">${t(launch.status)}</span>
          </td>
          <td>${launch.region}</td>
          <td>${launch.location}</td>
          <td>${t(launch.type)}</td>
          <td>${launch.launchWindow}</td>
          <td>${launch.units}</td>
          <td>${launch.score}</td>
          <td><span class="launch-upside">${t(launch.upside)}</span></td>
          <td>${isZh() ? zhLaunchText(launch, "thesis") : launch.thesis}</td>
          <td>${isZh() ? zhLaunchText(launch, "watchOut") : launch.watchOut}</td>
        </tr>
      `
    )
    .join("");
}

function renderTopSoon() {
  document.getElementById("topSoonBody").innerHTML = topSoonPipeline
    .map(
      (project) => `
        <tr>
          <td>${project.rank}</td>
          <td>
            <strong>${project.name}</strong>
            <span class="table-note">${t(project.status)}</span>
          </td>
          <td>${project.region}</td>
          <td>${project.location}</td>
          <td>${project.top}</td>
          <td>${project.units}</td>
          <td>${project.score}</td>
          <td><span class="launch-upside">${t(project.upside)}</span></td>
          <td>${isZh() ? zhLaunchText(project, "thesis") : project.thesis}</td>
          <td>${isZh() ? zhLaunchText(project, "watchOut") : project.watchOut}</td>
        </tr>
      `
    )
    .join("");
}

function renderLongTenure() {
  document.getElementById("longTenureBody").innerHTML = longTenureOlderCondos
    .map(
      (project) => `
        <tr>
          <td>${project.rank}</td>
          <td><strong>${project.name}</strong></td>
          <td>${project.region}</td>
          <td>${project.location}</td>
          <td>${t(project.tenure)}</td>
          <td>${project.top}</td>
          <td>${project.units}</td>
          <td>${project.score}</td>
          <td><span class="launch-upside">${t(project.upside)}</span></td>
          <td>${isZh() ? zhLaunchText(project, "conditionAngle") : project.conditionAngle}</td>
          <td>${isZh() ? zhLaunchText(project, "thesis") : project.thesis}</td>
          <td>${isZh() ? zhLaunchText(project, "watchOut") : project.watchOut}</td>
        </tr>
      `
    )
    .join("");
}

function renderMatureLeasehold() {
  document.getElementById("leaseholdBody").innerHTML = matureLeaseholdCondos
    .map(
      (project) => `
        <tr>
          <td>${project.rank}</td>
          <td><strong>${project.name}</strong></td>
          <td>${project.region}</td>
          <td>${project.location}</td>
          <td>${t(project.tenure)}</td>
          <td>${project.top}</td>
          <td>${project.units}</td>
          <td>${project.score}</td>
          <td><span class="launch-upside">${t(project.upside)}</span></td>
          <td>${isZh() ? zhLaunchText(project, "gap") : project.gap}</td>
          <td>${isZh() ? zhLaunchText(project, "thesis") : project.thesis}</td>
          <td>${isZh() ? zhLaunchText(project, "watchOut") : project.watchOut}</td>
        </tr>
      `
    )
    .join("");
}

function renderPickTable() {
  const rows = [
    ...condoPicks,
    ...requestedCaseStudies.map((study) => ({
      ...study,
      rank: `Case ${study.rank}`
    }))
  ];
  document.getElementById("researchPickBody").innerHTML = rows
    .map(
      (pick) => `
        <tr>
          <td>${pick.rank}</td>
          <td>${pick.name}</td>
          <td>${pick.region}</td>
          <td>${pick.area}</td>
          <td>${pick.fiveYearBase}</td>
          <td>${pick.fiveYearBull}</td>
          <td>${t(pick.conviction)}</td>
          <td>${t(pick.status)}</td>
        </tr>
      `
    )
    .join("");
}

function renderSources() {
  document.getElementById("researchSourceList").innerHTML = researchSources
    .map(
      (source) => `
        <li>
          <a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name}</a>
          <span>${zhSourceNote(source)}</span>
        </li>
      `
    )
    .join("");
}

function initResearchPage() {
  renderSignals();
  renderNewLaunches();
  renderTopSoon();
  renderLongTenure();
  renderMatureLeasehold();
  renderPicks();
  renderCaseStudies();
  renderPickTable();
  renderSources();
}

initResearchPage();
window.addEventListener("i18n:change", initResearchPage);
