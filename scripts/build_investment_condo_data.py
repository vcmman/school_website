#!/usr/bin/env python3
"""Build a curated CCR/RCR/OCR condo investment shortlist for the site.

The output is intentionally hybrid:
- a smaller set of live-verified listings with current price/size/age snippets
- a larger candidate pool derived from local condo-name / school-proximity data

This gives the site a broad chooser list while preserving which entries have
fully verified live listing facts.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
SITE_DATA_PATH = BASE_DIR / "site" / "data" / "site.json"
OUT_PATH = BASE_DIR / "site" / "data" / "investment_condos.json"

TODAY = dt.date.today()
TARGET_BUDGET = 2_000_000
MAX_CANDIDATE_PROJECTS = 56

TOWN_REGION_MAP = {
    "Central": "CCR",
    "Novena": "CCR",
    "Bukit Timah": "CCR",
    "Tanglin": "CCR",
    "Queenstown": "RCR",
    "Bukit Merah": "RCR",
    "Geylang": "RCR",
    "Kallang": "RCR",
    "Marine Parade": "RCR",
    "Toa Payoh": "RCR",
    "Bedok": "RCR",
}

CANDIDATE_EXCLUDE_TOKENS = (
    "PARK CONNECTOR",
    "NEIGHBOURHOOD PARK",
    "TOWN GARDEN",
    "WATERWAY PARK",
    "SCULPTURE PARK",
    "ACTIVE PARK",
    "INDUSTRIAL",
    "LOGISPARK",
    "MEDICARE",
    "EDUCARE",
    "STUDENT CARE",
    "HOME FOR THE AGED",
    "ECO GREEN",
    "KNOWLEDGE PARK",
    "BRIDGE",
    "COMPASSVALE GARDENS",
    "FERNVALE GARDENS",
    "FERNVALE RESIDENCE",
    "FERNVALE VILLAGE",
    "FARRER PARK GARDENS",
    "MARSILING GARDENS",
    "YUHUA VILLAGE",
    "RIVERVALE GARDENS",
    "TELOK BLANGAH TOWERS",
    "GREENCOURT",
    "GREENRIDGES",
    "DEWCOURT",
    "RIVERCOURT",
    "MEADOWS",
    "RIDGES",
    "PARKVIEW",
    "PARCVISTA",
    "HARMONY VILLAGE",
    "HOUGANG VILLAGE",
    "HAINANESE VILLAGE",
    "SOUTH PARKVIEW",
    "NORTHSHORE RESIDENCES",
    "PUNGGOL RESIDENCES",
    "WOODLANDS VISTA",
    "ADMIRALTY VISTA",
    "BUKIT MERAH RIDGE",
    "CLEMENTI RIDGES",
    "CLEMENTI MEADOWS",
    "AMK HEIGHTS",
    "HOUGANG HEIGHTS",
    "TOA PAYOH COURT",
    "TOA PAYOH VISTA",
    "TAMPINES GREEN",
    "TAMPINES PARKVIEW",
    "YISHUN",
)

KNOWN_PRIVATE_CANDIDATE_NAMES = {
    "ADAM PARK CONDOMINIUM",
    "ALEX RESIDENCES",
    "AVA TOWERS",
    "AZALEA PARK CONDOMINIUM",
    "BALLOTA PARK CONDOMINIUM",
    "BEDOK RESIDENCES",
    "BISHAN PARK CONDOMINIUM",
    "CARISSA PARK CONDOMINIUM",
    "CASHEW PARK CONDOMINIUM",
    "CENTRAL GREEN CONDOMINIUM",
    "CHANGI RISE CONDOMINIUM",
    "COMMONWEALTH TOWERS",
    "DAHLIA PARK CONDOMINIUM",
    "DOVER GARDENS",
    "EASTVALE CONDOMINIUM",
    "EDELWEISS PARK CONDOMINIUM",
    "ELIZABETH TOWERS",
    "FABER GARDEN CONDOMINIUM",
    "FARRER PARK SUITES",
    "FERRARIA PARK CONDOMINIUM",
    "GALAXY TOWERS",
    "GEM RESIDENCES",
    "GEYLANG MANSIONS",
    "GOLDENHILL PARK CONDOMINIUM",
    "GOLDHILL TOWERS",
    "HAZEL PARK CONDOMINIUM",
    "HEDGES PARK CONDOMINIUM",
    "HIGH OAK CONDOMINIUM",
    "HORIZON TOWERS",
    "HUNDRED PALMS RESIDENCES",
    "INZ RESIDENCE",
    "KENSINGTON PARK CONDOMINIUM",
    "LAKEPOINT CONDOMINIUM",
    "LEONIE TOWERS",
    "LION TOWERS",
    "MANDALAY TOWERS",
    "MANSIONS 28",
    "MAYFLOWER GARDENS",
    "MAYFLOWER RESIDENCES",
    "MCNAIR TOWERS",
    "MONTEREY PARK CONDOMINIUM",
    "NINE RESIDENCES",
    "NORTH PARK RESIDENCES",
    "NOVENA GARDENS",
    "NOVENA SUITES'",
    "OLEANDER TOWERS",
    "ORCHID PARK CONDOMINIUM",
    "OXLEY THANKSGIVING RESIDENCE",
    "PALM GROVE CONDOMINIUM",
    "PARBURY HILL CONDOMINIUM",
    "PINEHURST CONDOMINIUM",
    "PINETREE CONDOMINIUM",
    "PLATINUM RESIDENCE",
    "PRIME RESIDENCE",
    "RAFFLESIA CONDOMINIUM",
    "RESIDENCE 66",
    "RESIDENCE 81",
    "NINE RESIDENCES",
    "RESIDENCE 118",
    "RESIDENCE @ ST GEORGE",
    "RESIDENCE TWENTY-TWO",
    "RESIDENCES @ EVELYN",
    "RESIDENCES @ JANSEN",
    "RESIDENCES @ KILLINEY",
    "RESIDENCES @ NOVENA",
    "RESIDENCES @ SOMME",
    "RESIDENCES 88",
    "RESIDENCES AT EMERALD HILL",
    "RESIDENCES AT 338A",
    "RESIDENCES BOTANIQUE",
    "RIVERSOUND RESIDENCE",
    "RIDGEWOOD CONDOMINIUM",
    "SAINT GEORGE'S TOWERS",
    "SAINT MICHAEL'S CONDOMINIUM",
    "SELETAR SPRINGS CONDOMINIUM",
    "SENGKANG GRAND RESIDENCES",
    "SHERWOOD CONDOMINIUM",
    "SHERWOOD TOWERS",
    "SIMEI GREEN CONDOMINIUM",
    "SKYPARK RESIDENCES",
    "ST RESIDENCES NOVENA",
    "SUITES @ TANJONG KATONG",
    "SUITES AT BUKIT TIMAH",
    "SUNFLOWER RESIDENCE",
    "SUNSET WAY RESIDENCE",
    "VUE 8 RESIDENCE",
    "THE GARDEN RESIDENCES",
    "THE LAKEFRONT RESIDENCES",
    "THE METROPOLITAN CONDOMINIUM",
    "THE PARC CONDOMINIUM",
    "THOMSON VIEW CONDOMINIUM",
    "TRELLIS TOWERS",
    "TROPICANA CONDOMINIUM",
    "TWIN WATERFALLS",
    "URBAN RESORT CONDOMINIUM",
    "VILLA CHANCERITA",
    "VILLA CHANCERY",
    "VILLA DES FLORES",
    "VILLA MADELEINE",
    "VILLA MARTIA",
    "VILLA PONDER ROSA",
    "VILLA VERDE",
    "VILLAEA VISTA",
    "VILLAGE RESIDENCE HOUGANG",
    "VILLAGE RESIDENCE ROBERTSON QUAY",
    "VILLAGE TOWER",
    "VILLAS @ GILSTEAD",
    "VILLAS @ SIGLAP",
    "VILLAS HOLLAND",
    "VILLAS LA VUE",
    "VILLAS LAGUNA",
    "WESTWOOD RESIDENCES",
    "WOODGROVE CONDOMINIUM",
}

CANDIDATE_ALLOW_TOKENS = ("CONDOMINIUM",)

RAW_LISTINGS = [
    {
        "id": "sanctuary-newton-807",
        "name": "Sanctuary @ Newton",
        "address": "2 Surrey Road",
        "region": "CCR",
        "corridor": "Newton / Novena",
        "price_sgd": 2_118_000,
        "psf_sgd": 2625,
        "size_sqft": 807,
        "beds": 2,
        "baths": 2,
        "property_type": "Condominium",
        "tenure": "Freehold",
        "top_month": 6,
        "top_year": 2025,
        "mrt_station": "Novena / Newton",
        "mrt_distance_m": 600,
        "listed_on": "2026-01-25",
        "school_names": [
            ("Anglo-Chinese School (Primary)", "mrt corridor"),
            ("Anglo-Chinese School (Junior)", "mrt corridor"),
            ("St. Joseph's Institution Junior", "mrt corridor"),
        ],
        "source_url": "https://www.propertyguru.com.sg/listing/for-sale-sanctuary-newton-60200182",
        "source_note": "Live listing snippet captured from current PropertyGuru search results.",
    },
    {
        "id": "6-derbyshire-829",
        "name": "6 Derbyshire",
        "address": "6 Derbyshire Road",
        "region": "CCR",
        "corridor": "Newton / Novena",
        "price_sgd": 1_678_888,
        "psf_sgd": 2025,
        "size_sqft": 829,
        "beds": 2,
        "baths": 2,
        "property_type": "Condominium",
        "tenure": "Freehold",
        "top_month": 3,
        "top_year": 2017,
        "mrt_station": "Novena",
        "mrt_distance_m": 630,
        "listed_on": "2026-04-26",
        "school_names": [
            ("Anglo-Chinese School (Primary)", "mrt corridor"),
            ("Anglo-Chinese School (Junior)", "mrt corridor"),
            ("St. Joseph's Institution Junior", "mrt corridor"),
        ],
        "source_url": "https://www.propertyguru.com.sg/listing/25485051/for-sale-6-derbyshire",
        "source_note": "Live listing snippet captured from current PropertyGuru search results.",
    },
    {
        "id": "park-place-residences-1076",
        "name": "Park Place Residences",
        "address": "6 Paya Lebar Road",
        "region": "RCR",
        "corridor": "Paya Lebar",
        "price_sgd": 2_450_000,
        "psf_sgd": 2277,
        "size_sqft": 1076,
        "beds": 3,
        "baths": 2,
        "property_type": "Condominium",
        "tenure": "99-year leasehold",
        "top_month": 12,
        "top_year": 2019,
        "mrt_station": "Paya Lebar",
        "mrt_distance_m": 240,
        "listed_on": "2026-03-12",
        "school_names": [
            ("Kong Hwa School", "explicit 1km mention"),
            ("CHIJ (Katong) Primary", "mrt corridor"),
        ],
        "source_url": "https://www.propertyguru.com.sg/listing/for-sale-park-place-residences-25237064",
        "source_note": "Snippet explicitly mentions 1km Kong Hwa School.",
    },
    {
        "id": "the-gatz-1054",
        "name": "The GATZ",
        "address": "26 Lorong 32 Geylang",
        "region": "RCR",
        "corridor": "Dakota / Geylang",
        "price_sgd": 1_988_000,
        "psf_sgd": 1886,
        "size_sqft": 1054,
        "beds": 3,
        "baths": 3,
        "property_type": "Condominium",
        "tenure": "Freehold",
        "top_month": 1,
        "top_year": 2024,
        "mrt_station": "Dakota",
        "mrt_distance_m": 800,
        "listed_on": "2026-01-05",
        "school_names": [
            ("Kong Hwa School", "nearest school from listing"),
            ("Haig Girls' School", "mrt corridor"),
        ],
        "source_url": "https://www.propertyguru.com.sg/listing/25473772/for-sale-the-gatz",
        "source_note": "Listing snippet names Kong Hwa School as a nearby school and notes TOP in 2024.",
    },
    {
        "id": "city-gate-904",
        "name": "City Gate",
        "address": "371 Beach Road",
        "region": "RCR",
        "corridor": "Nicoll Highway / Beach Road",
        "price_sgd": 1_899_999,
        "psf_sgd": 2102,
        "size_sqft": 904,
        "beds": 3,
        "baths": 2,
        "property_type": "Apartment",
        "tenure": "99-year leasehold",
        "top_month": 1,
        "top_year": 2019,
        "mrt_station": "Nicoll Highway",
        "mrt_distance_m": 350,
        "listed_on": "2026-03-13",
        "school_names": [],
        "source_url": "https://www.propertyguru.com.sg/listing/for-sale-city-gate-60203901",
        "source_note": "Live listing snippet captured from current PropertyGuru search results.",
    },
    {
        "id": "kallang-riverside-1033",
        "name": "Kallang Riverside",
        "address": "51 Kampong Bugis",
        "region": "RCR",
        "corridor": "Kallang / Lavender",
        "price_sgd": 2_388_000,
        "psf_sgd": 2312,
        "size_sqft": 1033,
        "beds": 2,
        "baths": 2,
        "property_type": "Condominium",
        "tenure": "Freehold",
        "top_month": 12,
        "top_year": 2019,
        "mrt_station": "Lavender",
        "mrt_distance_m": 770,
        "listed_on": "2026-04-25",
        "school_names": [],
        "source_url": "https://www.propertyguru.com.sg/listing/60096303/for-sale-kallang-riverside",
        "source_note": "Live listing snippet captured from current PropertyGuru search results.",
    },
    {
        "id": "riviere-818",
        "name": "Riviere",
        "address": "1 Jiak Kim Street",
        "region": "CCR",
        "corridor": "Havelock / River Valley",
        "price_sgd": 2_490_000,
        "psf_sgd": 3044,
        "size_sqft": 818,
        "beds": 2,
        "baths": 2,
        "property_type": "Condominium",
        "tenure": "99-year leasehold",
        "top_month": 1,
        "top_year": 2023,
        "mrt_station": "Havelock",
        "mrt_distance_m": 580,
        "listed_on": "2026-05-07",
        "school_names": [
            ("River Valley Primary School", "district corridor"),
        ],
        "source_url": "https://www.propertyguru.com.sg/listing/for-sale-riviere-500111718",
        "source_note": "Live listing snippet captured from current PropertyGuru search results.",
    },
    {
        "id": "parc-clematis-893",
        "name": "Parc Clematis",
        "address": "8E Jalan Lempeng",
        "region": "OCR",
        "corridor": "Clementi",
        "price_sgd": 1_648_000,
        "psf_sgd": 1845,
        "size_sqft": 893,
        "beds": 2,
        "baths": 1,
        "property_type": "Condominium",
        "tenure": "99-year leasehold",
        "top_month": 1,
        "top_year": 2023,
        "mrt_station": "Clementi",
        "mrt_distance_m": 1250,
        "listed_on": "2026-04-08",
        "school_names": [
            ("Nan Hua Primary School", "explicit 1km mention"),
            ("Clementi Primary School", "mrt corridor"),
        ],
        "source_url": "https://www.propertyguru.com.sg/listing/24296520/for-sale-parc-clematis",
        "source_note": "Recent sale snippet explicitly says 1km to Nan Hua Primary and shows Built: 2023.",
    },
]


def load_site_data() -> dict:
    return json.loads(SITE_DATA_PATH.read_text(encoding="utf-8"))


def load_school_index(site: dict) -> dict[str, dict]:
    return {school["name"]: school for school in site["primary_schools"]}


def normalize_project_name(name: str) -> str:
    text = " ".join(str(name).upper().split())
    return text.replace("’", "'").strip()


def region_for_town(town: str) -> str:
    return TOWN_REGION_MAP.get(town, "OCR")


def candidate_name_allowed(name: str) -> bool:
    upper = normalize_project_name(name)
    if not upper:
        return False
    if any(token in upper for token in CANDIDATE_EXCLUDE_TOKENS):
        return False
    if upper in KNOWN_PRIVATE_CANDIDATE_NAMES:
        return True
    return any(token in upper for token in CANDIDATE_ALLOW_TOKENS)


def months_old(top_year: int, top_month: int) -> int:
    return (TODAY.year - top_year) * 12 + (TODAY.month - top_month)


def school_demand_score(school: dict) -> float:
    rank = school.get("community_ranking", {}).get("rank")
    if isinstance(rank, int) and rank > 0:
        return max(0.25, 1 - ((rank - 1) / 99))

    phases = school.get("ballot_latest", school.get("ballot_2025", {})).get("phases", {})
    pressure_2cs = phases.get("2C(S)", {}).get("pressure")
    pressure_2c = phases.get("2C", {}).get("pressure")
    pressure = pressure_2cs if isinstance(pressure_2cs, (int, float)) else pressure_2c
    if isinstance(pressure, (int, float)):
        return min(1.0, pressure / 2.5)
    return 0.25


def build_school_signal(school: dict, basis: str) -> dict:
    phases = school.get("ballot_latest", school.get("ballot_2025", {})).get("phases", {})
    return {
        "name": school["name"],
        "basis": basis,
        "town": school.get("organized", {}).get("overview", {}).get("town", ""),
        "mrt": school.get("organized", {}).get("contact", {}).get("mrt", ""),
        "rank": school.get("community_ranking", {}).get("rank"),
        "pressure_2cs": phases.get("2C(S)", {}).get("pressure"),
        "pressure_2c": phases.get("2C", {}).get("pressure"),
        "demand_score": round(school_demand_score(school), 3),
    }


def build_candidate_projects(site: dict, verified_by_name: dict[str, dict]) -> list[dict]:
    aggregated: dict[str, dict] = {}

    for school in site["primary_schools"]:
        town = school.get("organized", {}).get("overview", {}).get("town", "")
        region = region_for_town(town)
        mrt = school.get("organized", {}).get("contact", {}).get("mrt", "")
        if not mrt:
            continue

        for condo in school.get("nearby_condos_within_1km", []):
            condo_name = condo.get("name", "")
            if not candidate_name_allowed(condo_name):
                continue

            key = normalize_project_name(condo_name)
            item = aggregated.setdefault(
                key,
                {
                    "id": f"candidate-{len(aggregated) + 1}",
                    "name": condo_name,
                    "address": condo.get("address", ""),
                    "region": region,
                    "corridor": town or "OCR corridor",
                    "price_sgd": None,
                    "psf_sgd": None,
                    "size_sqft": None,
                    "beds": None,
                    "baths": None,
                    "property_type": "Condo candidate",
                    "tenure": "",
                    "top_month": None,
                    "top_year": None,
                    "mrt_station": mrt,
                    "mrt_distance_m": None,
                    "listed_on": "",
                    "school_names": [],
                    "source_url": "",
                    "source_note": (
                        "Expanded candidate derived from local condo-name and school-proximity data. "
                        "Current listing price, size, and age still need live verification."
                    ),
                    "verification_status": "candidate",
                    "school_signals": [],
                    "school_distance_m": None,
                },
            )

            school_distance = round(float(condo.get("distance_m", 0)))
            signal = build_school_signal(school, f"{school_distance}m from school")
            item["school_signals"].append(signal)
            item["school_names"].append((school["name"], f"{school_distance}m from school"))
            if item["school_distance_m"] is None or school_distance < item["school_distance_m"]:
                item["school_distance_m"] = school_distance
            if not item["address"] and condo.get("address"):
                item["address"] = condo["address"]

            current_region = item["region"]
            if current_region != "CCR" and region == "CCR":
                item["region"] = region
            elif current_region == "OCR" and region == "RCR":
                item["region"] = region

        # end condo loop

    candidates: list[dict] = []
    for key, item in aggregated.items():
        if key in verified_by_name:
            continue
        school_signals = sorted(item["school_signals"], key=lambda row: (-row["demand_score"], row["name"]))[:3]
        if not school_signals:
            continue

        school_fit = school_signals[0]["demand_score"]
        school_distance_fit = max(0.0, 1 - min((item["school_distance_m"] or 1000) / 1000, 1))
        mrt_fit = 0.65 if item["mrt_station"] else 0.25
        score = school_fit * 0.6 + school_distance_fit * 0.25 + mrt_fit * 0.15

        item["school_signals"] = school_signals
        item["score_breakdown"] = {
            "price_fit": None,
            "size_fit": None,
            "mrt_fit": round(mrt_fit, 3),
            "age_fit": None,
            "psf_fit": None,
            "school_fit": round(school_fit, 3),
        }
        item["investment_score"] = round(score * 100, 1)
        candidates.append(item)

    candidates.sort(key=lambda row: (-row["investment_score"], row["name"]))
    return candidates[:MAX_CANDIDATE_PROJECTS]


def build_listing_payload(school_index: dict[str, dict]) -> list[dict]:
    raw_prices = [entry["price_sgd"] for entry in RAW_LISTINGS]
    raw_psf = [entry["psf_sgd"] for entry in RAW_LISTINGS]
    price_min = min(raw_prices)
    price_max = max(raw_prices)
    psf_min = min(raw_psf)
    psf_max = max(raw_psf)

    listings: list[dict] = []
    for entry in RAW_LISTINGS:
        age_months = months_old(entry["top_year"], entry["top_month"])
        age_years = round(age_months / 12, 1)

        school_signals = [
            build_school_signal(school_index[name], basis)
            for name, basis in entry["school_names"]
            if name in school_index
        ]
        school_signals.sort(key=lambda item: (-item["demand_score"], item["name"]))

        price_fit = max(0.0, 1 - min(abs(entry["price_sgd"] - TARGET_BUDGET) / 800_000, 1))
        size_fit = min(1.0, max(0, entry["size_sqft"] - 800) / 400)
        mrt_fit = max(0.0, 1 - min(entry["mrt_distance_m"] / 1300, 1))
        age_fit = max(0.0, 1 - min(age_years / 10, 1))
        psf_fit = 1.0 if psf_max == psf_min else 1 - ((entry["psf_sgd"] - psf_min) / (psf_max - psf_min))
        school_fit = school_signals[0]["demand_score"] if school_signals else 0.0

        score = (
            price_fit * 0.18
            + size_fit * 0.18
            + mrt_fit * 0.20
            + age_fit * 0.16
            + psf_fit * 0.10
            + school_fit * 0.18
        )

        listings.append(
            {
                **entry,
                "size_sqm": round(entry["size_sqft"] / 10.7639, 1),
                "age_years": age_years,
                "age_under_10": age_years < 10,
                "school_signals": school_signals,
                "score_breakdown": {
                    "price_fit": round(price_fit, 3),
                    "size_fit": round(size_fit, 3),
                    "mrt_fit": round(mrt_fit, 3),
                    "age_fit": round(age_fit, 3),
                    "psf_fit": round(psf_fit, 3),
                    "school_fit": round(school_fit, 3),
                },
                "investment_score": round(score * 100, 1),
                "verification_status": "live",
                "school_distance_m": None,
            }
        )

    listings.sort(key=lambda item: (-item["investment_score"], item["price_sgd"]))
    return listings


def main() -> None:
    site = load_site_data()
    school_index = load_school_index(site)
    listings = build_listing_payload(school_index)
    verified_by_name = {normalize_project_name(item["name"]): item for item in listings}
    candidates = build_candidate_projects(site, verified_by_name)
    combined = listings + candidates
    combined.sort(
        key=lambda item: (
            0 if item["verification_status"] == "live" else 1,
            -item["investment_score"],
            item["name"],
        )
    )
    payload = {
        "generated_at": dt.datetime.utcnow().isoformat() + "Z",
        "as_of_date": str(TODAY),
        "sources": [
            "Current PropertyGuru listing and search-result snippets gathered online on 2026-05-13",
            "Local school dataset from site/data/site.json",
        ],
        "coverage_note": (
            "Live-verified listings stay separate from the expanded candidate pool. Candidate projects are useful "
            "for discovery and school/MRT screening, but their current price, size, and age still need live checks."
        ),
        "stats": {
            "listing_count": len(combined),
            "verified_listing_count": len(listings),
            "candidate_project_count": len(candidates),
            "ccr_count": sum(1 for item in combined if item["region"] == "CCR"),
            "rcr_count": sum(1 for item in combined if item["region"] == "RCR"),
            "ocr_count": sum(1 for item in combined if item["region"] == "OCR"),
            "with_school_signal_count": sum(1 for item in combined if item["school_signals"]),
            "max_age_years": max(
                (item["age_years"] for item in listings if item["age_years"] is not None),
                default=None,
            ),
        },
        "listings": combined,
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
