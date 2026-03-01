#!/usr/bin/env python3
"""Build a primary-school dataset from SGSchooling and generate site JSON."""
from __future__ import annotations

import csv
import datetime as dt
import json
import math
import os
import re
import time
from pathlib import Path
from typing import Any
from urllib.parse import urljoin
from xml.etree import ElementTree as ET

import pandas as pd
import requests
from bs4 import BeautifulSoup
from pyproj import Transformer

BASE_DIR = Path("/Users/byc/src/test")
SITE_DATA_DIR = BASE_DIR / "site" / "data"
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "cache"
TOP_SCHOOLS_PATH = DATA_DIR / "top20_schools.csv"
PROPERTYGURU_CONDO_PATH = DATA_DIR / "propertyguru_condos.csv"
CONDO_QUERY_OVERRIDES_PATH = DATA_DIR / "condo_query_overrides.json"

SG_BASE_URL = "https://sgschooling.com"
SG_SITEMAP_URL = f"{SG_BASE_URL}/sitemap.xml"
SG_PSLE_COMMUNITY_URL = f"{SG_BASE_URL}/blog/psle-2025-score-ranges-community-data"
ONEMAP_SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search"
HDB_DATASET_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc"
URA_TOKEN_URL = "https://eservice.ura.gov.sg/uraDataService/insertNewToken.action"
URA_TXN_URL = "https://eservice.ura.gov.sg/uraDataService/invokeUraDS"

PRICE_MIN = 500_000
PRICE_MAX = 2_000_000
MAX_RADIUS_M = 1000
HDB_RECENT_MONTHS = 6
MAX_HDB_GEOCODES = 3000

REQ_TIMEOUT = 40
TRANSFORMER = Transformer.from_crs("EPSG:4326", "EPSG:3414", always_xy=True)


def ensure_dirs() -> None:
    SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def parse_number(value: str) -> int | None:
    normalized = clean_text(value).replace(",", "")
    if normalized in {"", "-", "—", "–"}:
        return None
    if normalized.isdigit():
        return int(normalized)
    return None


def parse_float(value: str) -> float | None:
    normalized = clean_text(value)
    if normalized in {"", "-", "—", "–"}:
        return None
    return float(normalized)


def parse_price(value: Any) -> float | None:
    text = clean_text(str(value))
    if not text:
        return None
    cleaned = re.sub(r"[^0-9.]", "", text)
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def fetch_text(url: str) -> str:
    response = requests.get(url, timeout=REQ_TIMEOUT)
    response.raise_for_status()
    return response.text


def get_download_url(dataset_id: str) -> str:
    init_url = f"https://api-open.data.gov.sg/v1/public/api/datasets/{dataset_id}/initiate-download"
    init_resp = requests.get(init_url, timeout=REQ_TIMEOUT)
    if init_resp.status_code == 404:
        init_url = f"https://api-production.data.gov.sg/v2/public/api/datasets/{dataset_id}/initiate-download"
        init_resp = requests.get(init_url, timeout=REQ_TIMEOUT)
    init_resp.raise_for_status()

    poll_url = f"https://api-open.data.gov.sg/v1/public/api/datasets/{dataset_id}/poll-download"
    for _ in range(25):
        poll_resp = requests.get(poll_url, timeout=REQ_TIMEOUT)
        if poll_resp.status_code == 404:
            poll_resp = requests.get(
                f"https://api-production.data.gov.sg/v2/public/api/datasets/{dataset_id}/poll-download",
                timeout=REQ_TIMEOUT,
            )
        poll_resp.raise_for_status()
        data = poll_resp.json().get("data", {})
        url = data.get("url")
        if url:
            return str(url)
        time.sleep(1)
    raise RuntimeError(f"Download URL not ready for dataset {dataset_id}")


def download_csv_if_missing(dataset_id: str, cache_name: str) -> Path:
    path = CACHE_DIR / cache_name
    if path.exists():
        return path
    url = get_download_url(dataset_id)
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()
    path.write_bytes(resp.content)
    return path


def load_geocode_cache() -> dict[str, list[float]]:
    cache_path = CACHE_DIR / "geocode_cache.json"
    if not cache_path.exists():
        return {}
    return json.loads(cache_path.read_text(encoding="utf-8"))


def save_geocode_cache(cache: dict[str, list[float]]) -> None:
    cache_path = CACHE_DIR / "geocode_cache.json"
    cache_path.write_text(json.dumps(cache, indent=2), encoding="utf-8")


def geocode_address(
    address: str, cache: dict[str, list[float]], allow_online_lookup: bool = True
) -> tuple[float, float] | None:
    if address in cache:
        lat, lon = cache[address]
        return float(lat), float(lon)
    if not allow_online_lookup:
        return None

    params = {
        "searchVal": address,
        "returnGeom": "Y",
        "getAddrDetails": "Y",
        "pageNum": 1,
    }
    response = requests.get(ONEMAP_SEARCH_URL, params=params, timeout=REQ_TIMEOUT)
    response.raise_for_status()
    results = response.json().get("results", [])
    if not results:
        return None
    best = results[0]
    lat = float(best["LATITUDE"])
    lon = float(best["LONGITUDE"])
    cache[address] = [lat, lon]
    return lat, lon


def to_svy21(lat: float, lon: float) -> tuple[float, float]:
    x, y = TRANSFORMER.transform(lon, lat)
    return float(x), float(y)


def distance_m(x1: float, y1: float, x2: float, y2: float) -> float:
    return float(math.hypot(x1 - x2, y1 - y2))


def fetch_school_urls() -> list[str]:
    xml_text = fetch_text(SG_SITEMAP_URL)
    root = ET.fromstring(xml_text)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    urls: list[str] = []
    for loc in root.findall("sm:url/sm:loc", ns):
        raw = clean_text(loc.text or "")
        if not raw.startswith("/school/"):
            continue
        if raw in {"/school/", "/school"}:
            continue
        if not raw.endswith(".html"):
            continue
        urls.append(urljoin(SG_BASE_URL, raw))
    return sorted(set(urls))


def parse_school_info_table(table: Any) -> dict[str, str]:
    info: dict[str, str] = {}
    for row in table.select("tbody tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        key = clean_text(cells[0].get_text(" ", strip=True))
        value = clean_text(cells[1].get_text(" ", strip=True))
        if key:
            info[key] = value
    return info


def parse_mother_tongue_table(table: Any) -> dict[str, dict[str, bool]]:
    header_cells = table.select("thead tr th")
    headers = [clean_text(c.get_text(" ", strip=True)) for c in header_cells]
    langs = headers[1:] if len(headers) > 1 else []

    result: dict[str, dict[str, bool]] = {}
    for row in table.select("tbody tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        row_key = clean_text(cells[0].get_text(" ", strip=True))
        offerings: dict[str, bool] = {}
        for idx, lang in enumerate(langs):
            value = clean_text(cells[idx + 1].get_text(" ", strip=True))
            offerings[lang] = "✅" in value
        result[row_key] = offerings
    return result


def parse_ballot_history_table(table: Any) -> list[dict[str, Any]]:
    header_cells = table.select("thead tr th")
    phases = [clean_text(c.get_text(" ", strip=True)) for c in header_cells][1:]

    records: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    for row in table.select("tbody tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue

        row_label = clean_text(cells[0].get_text(" ", strip=True))
        values = [clean_text(c.get_text(" ", strip=True)) for c in cells[1:]]

        if row_label.isdigit():
            current = {
                "year": int(row_label),
                "vacancy": {},
                "applied": {},
                "taken": {},
            }
            records.append(current)
            continue

        if current is None:
            continue

        if "Vacancy" in row_label:
            target = "vacancy"
        elif "Applied" in row_label:
            target = "applied"
        elif "Taken" in row_label:
            target = "taken"
        else:
            continue

        for idx, phase in enumerate(phases):
            if idx >= len(values):
                break
            current[target][phase] = parse_number(values[idx])

    return records


def parse_school_page(url: str) -> dict[str, Any] | None:
    html = fetch_text(url)
    soup = BeautifulSoup(html, "html.parser")

    edu_org: dict[str, Any] | None = None
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string
        if not raw:
            continue
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict) and payload.get("@type") == "EducationalOrganization":
            edu_org = payload
            break

    if not edu_org:
        return None

    additional_type = clean_text(str(edu_org.get("additionalType", ""))).lower()
    if "primary" not in additional_type:
        return None

    tables = soup.select("div.page__content table")
    if not tables:
        return None

    school_info = parse_school_info_table(tables[0]) if len(tables) >= 1 else {}
    mother_tongue = parse_mother_tongue_table(tables[1]) if len(tables) >= 2 else {}
    ballot_history = parse_ballot_history_table(tables[2]) if len(tables) >= 3 else []

    address = edu_org.get("address", {}) if isinstance(edu_org.get("address"), dict) else {}
    name = clean_text(str(edu_org.get("name", "")))
    slug = re.sub(r"\.html$", "", url.rstrip("/").split("/")[-1])

    return {
        "slug": slug,
        "name": name,
        "url": url,
        "description": clean_text(str(edu_org.get("description", ""))),
        "address": {
            "street": clean_text(str(address.get("streetAddress", ""))),
            "locality": clean_text(str(address.get("addressLocality", ""))),
            "country": clean_text(str(address.get("addressCountry", "SG"))),
        },
        "website": clean_text(str(edu_org.get("sameAs", ""))),
        "school_info": school_info,
        "mother_tongue": mother_tongue,
        "ballot_history": ballot_history,
    }


def fetch_psle_community_table() -> list[dict[str, Any]]:
    html = fetch_text(SG_PSLE_COMMUNITY_URL)
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if table is None:
        raise RuntimeError("Could not find PSLE community table in SGSchooling page")

    rows: list[dict[str, Any]] = []
    rank = 0
    for row in table.select("tbody tr"):
        cells = row.find_all("td")
        if len(cells) != 6:
            continue
        rank += 1

        link = cells[0].find("a")
        school_url = urljoin(SG_BASE_URL, link.get("href", "")) if link else ""
        school = clean_text(cells[0].get_text(" ", strip=True))

        rows.append(
            {
                "rank": rank,
                "school": school,
                "school_url": school_url or None,
                "score_range": clean_text(cells[1].get_text(" ", strip=True)),
                "students": parse_number(cells[2].get_text(" ", strip=True)) or 0,
                "total_in_cohort": parse_number(cells[3].get_text(" ", strip=True)) or 0,
                "percentage": clean_text(cells[4].get_text(" ", strip=True)),
                "top10_avg_al": parse_float(cells[5].get_text(" ", strip=True)),
            }
        )
    return rows


def write_top_schools_csv(rows: list[dict[str, Any]]) -> None:
    with TOP_SCHOOLS_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "rank",
                "short_name",
                "official_name",
                "score_range",
                "top10_avg_al",
                "students",
                "total_in_cohort",
                "percentage",
                "source",
            ]
        )
        for row in rows:
            writer.writerow(
                [
                    row["rank"],
                    row["school"],
                    row["school"],
                    row["score_range"],
                    row["top10_avg_al"] if row["top10_avg_al"] is not None else "",
                    row["students"],
                    row["total_in_cohort"],
                    row["percentage"],
                    SG_PSLE_COMMUNITY_URL,
                ]
            )


def attach_rankings(primary_schools: list[dict[str, Any]], rankings: list[dict[str, Any]]) -> None:
    by_slug = {school["slug"]: school for school in primary_schools}
    for rank in rankings:
        school_url = rank.get("school_url") or ""
        slug = str(school_url).rstrip("/").split("/")[-1]
        school = by_slug.get(slug)
        if not school:
            continue
        school["community_ranking"] = {
            "rank": rank["rank"],
            "score_range": rank["score_range"],
            "students": rank["students"],
            "total_in_cohort": rank["total_in_cohort"],
            "percentage": rank["percentage"],
            "top10_avg_al": rank["top10_avg_al"],
            "source_url": SG_PSLE_COMMUNITY_URL,
        }


def load_hdb_resale_df() -> pd.DataFrame:
    cache_file = download_csv_if_missing(HDB_DATASET_ID, "hdb_resale.csv")
    return pd.read_csv(cache_file)


def build_hdb_listings(cache: dict[str, list[float]]) -> list[dict[str, Any]]:
    df = load_hdb_resale_df()
    df["resale_price"] = pd.to_numeric(df["resale_price"], errors="coerce")
    df = df[(df["resale_price"] >= PRICE_MIN) & (df["resale_price"] <= PRICE_MAX)]

    cutoff = pd.Timestamp(dt.date.today().replace(day=1) - dt.timedelta(days=HDB_RECENT_MONTHS * 30))
    df["month_dt"] = pd.to_datetime(df["month"], format="%Y-%m", errors="coerce")
    df = df[df["month_dt"] >= cutoff]

    df["address"] = df["block"].astype(str).str.strip() + " " + df["street_name"].astype(str).str.strip()
    df = df.sort_values("month_dt", ascending=False)
    df = df.drop_duplicates(subset=["address"], keep="first")
    if len(df) > MAX_HDB_GEOCODES:
        df = df.head(MAX_HDB_GEOCODES)

    listings: list[dict[str, Any]] = []
    for _, row in df.iterrows():
        address = str(row["address"]).strip()
        geo = geocode_address(address, cache, allow_online_lookup=False)
        if not geo:
            continue
        lat, lon = geo
        x, y = to_svy21(lat, lon)
        listings.append(
            {
                "type": "HDB",
                "address": address,
                "price": float(row["resale_price"]),
                "area_sqm": float(row["floor_area_sqm"]) if not pd.isna(row["floor_area_sqm"]) else None,
                "date": str(row["month"]),
                "lat": lat,
                "lon": lon,
                "x": x,
                "y": y,
                "source": "data.gov.sg (HDB resale)",
            }
        )
    return listings


def build_propertyguru_condo_listings(cache: dict[str, list[float]]) -> list[dict[str, Any]]:
    if not PROPERTYGURU_CONDO_PATH.exists():
        return []

    df = pd.read_csv(PROPERTYGURU_CONDO_PATH)
    cols = {c.lower(): c for c in df.columns}
    address_col = cols.get("address")
    price_col = cols.get("price")
    if not address_col or not price_col:
        print(
            "Skipped PropertyGuru condos: expected columns `address` and `price` in "
            f"{PROPERTYGURU_CONDO_PATH}"
        )
        return []

    area_col = cols.get("area_sqm")
    date_col = cols.get("date")
    url_col = cols.get("url")
    project_col = cols.get("project")

    listings: list[dict[str, Any]] = []
    for _, row in df.iterrows():
        address = clean_text(str(row[address_col]))
        price = parse_price(row[price_col])
        if not address or price is None:
            continue
        if price < PRICE_MIN or price > PRICE_MAX:
            continue

        geo = geocode_address(address, cache, allow_online_lookup=True)
        if not geo:
            geo = geocode_address(f"{address} Singapore", cache, allow_online_lookup=True)
        if not geo:
            continue

        lat, lon = geo
        x, y = to_svy21(lat, lon)
        area_val = None
        if area_col is not None and not pd.isna(row.get(area_col)):
            area_val = parse_float(str(row.get(area_col)))

        listings.append(
            {
                "type": "Condo",
                "address": address,
                "price": float(price),
                "area_sqm": area_val,
                "date": clean_text(str(row.get(date_col, ""))) if date_col else "",
                "project": clean_text(str(row.get(project_col, ""))) if project_col else "",
                "url": clean_text(str(row.get(url_col, ""))) if url_col else "",
                "lat": lat,
                "lon": lon,
                "x": x,
                "y": y,
                "source": "PropertyGuru",
            }
        )
    return listings


def fetch_onemap_condo_landmarks() -> list[dict[str, Any]]:
    """Fetch condo/apartment place names + coordinates from OneMap search API."""
    terms = [
        "CONDOMINIUM",
        "CONDO",
        "APARTMENT",
        "RESIDENCE",
        "RESIDENCES",
        "SUITES",
        "VILLA",
        "VILLAS",
        "TOWER",
        "TOWERS",
        "MANSION",
        "MANSIONS",
    ]
    exclude_tokens = {
        "HDB",
        "PRIMARY SCHOOL",
        "SECONDARY SCHOOL",
        "JUNIOR COLLEGE",
        "POLYTECHNIC",
        "ITE",
        "MRT",
        "LRT",
        "BUS INTERCHANGE",
        "COMMUNITY CLUB",
        "COMMUNITY CENTRE",
        "HAWKER CENTRE",
        "MARKET",
        "INDUSTRIAL",
        "WAREHOUSE",
        "FACTORY",
        "PARKING",
        "CAR PARK",
        "MULTI STOREY CAR PARK",
        "TEMP BUS STOP",
        "POLICE",
        "FIRE STATION",
        "HOSPITAL",
        "CLINIC",
        "CHURCH",
        "MOSQUE",
        "TEMPLE",
    }
    landmarks: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    for term in terms:
        page = 1
        total_pages = 1
        while page <= total_pages:
            response = requests.get(
                ONEMAP_SEARCH_URL,
                params={
                    "searchVal": term,
                    "returnGeom": "Y",
                    "getAddrDetails": "Y",
                    "pageNum": page,
                },
                timeout=REQ_TIMEOUT,
            )
            response.raise_for_status()
            payload = response.json()

            try:
                total_pages = int(payload.get("totalNumPages", 1))
            except (TypeError, ValueError):
                total_pages = 1

            for item in payload.get("results", []) or []:
                building = clean_text(str(item.get("BUILDING", "")))
                address = clean_text(str(item.get("ADDRESS", "")))
                postal = clean_text(str(item.get("POSTAL", "")))
                name_upper = building.upper()
                if not building:
                    continue
                if any(token in name_upper for token in exclude_tokens):
                    continue
                address_upper = address.upper()
                if any(token in address_upper for token in exclude_tokens):
                    continue

                try:
                    x = float(item.get("X", ""))
                    y = float(item.get("Y", ""))
                except (TypeError, ValueError):
                    continue

                key = (building, postal or address)
                if key in seen:
                    continue
                seen.add(key)

                landmarks.append(
                    {
                        "name": building,
                        "address": address,
                        "postal": postal,
                        "x": x,
                        "y": y,
                        "lat": float(item.get("LATITUDE", 0) or 0),
                        "lon": float(item.get("LONGITUDE", 0) or 0),
                        "source": "OneMap place search",
                    }
                )

            page += 1
            time.sleep(0.03)

    return landmarks


def extract_road_query(address: str) -> str:
    text = clean_text(address.upper())
    text = re.sub(r"\bSINGAPORE\s*\d{6}\b", "", text).strip()
    text = re.sub(r"^\d+[A-Z]?\s+", "", text).strip()
    return text


def simplify_road_query(road: str) -> str:
    text = clean_text(road.upper())
    text = re.sub(r"\b(ROAD|RD|AVENUE|AVE|STREET|ST|DRIVE|DR|LANE|LN|CRESCENT|CLOSE|WAY)\b", "", text)
    text = clean_text(text)
    return text


def simplify_school_name(name: str) -> str:
    text = clean_text(name.upper())
    text = re.sub(r"\b(PRIMARY SCHOOL|PRIMARY|SCHOOL)\b", "", text)
    text = text.replace("(", " ").replace(")", " ")
    return clean_text(text)


def load_condo_query_overrides() -> dict[str, list[str]]:
    if not CONDO_QUERY_OVERRIDES_PATH.exists():
        return {}
    try:
        payload = json.loads(CONDO_QUERY_OVERRIDES_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    out: dict[str, list[str]] = {}
    if isinstance(payload, dict):
        for k, v in payload.items():
            if isinstance(v, list):
                out[str(k)] = [clean_text(str(x)) for x in v if clean_text(str(x))]
    return out


def build_school_query_candidates(school: dict[str, Any], address: str, overrides: dict[str, list[str]]) -> list[str]:
    queries: list[str] = []
    slug = school.get("slug", "")

    queries.extend(overrides.get(slug, []))

    town = clean_text(str(school.get("school_info", {}).get("Town", "")))
    if town:
        queries.extend([town, f"{town} CONDO", f"{town} RESIDENCE"])

    road = extract_road_query(address)
    if road:
        queries.append(road)
        short_road = simplify_road_query(road)
        if short_road and short_road != road:
            queries.append(short_road)

    school_core = simplify_school_name(str(school.get("name", "")))
    if school_core:
        queries.extend([school_core, f"{school_core} CONDO", f"{school_core} RESIDENCE"])

    # Remove duplicates while preserving order.
    deduped: list[str] = []
    seen: set[str] = set()
    for q in queries:
        qn = clean_text(q)
        if not qn:
            continue
        key = qn.upper()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(qn)
    return deduped


def fetch_onemap_search_results(search_val: str, max_pages: int = 6) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    page = 1
    total_pages = 1
    while page <= total_pages and page <= max_pages:
        response = requests.get(
            ONEMAP_SEARCH_URL,
            params={
                "searchVal": search_val,
                "returnGeom": "Y",
                "getAddrDetails": "Y",
                "pageNum": page,
            },
            timeout=REQ_TIMEOUT,
        )
        response.raise_for_status()
        payload = response.json()
        try:
            total_pages = int(payload.get("totalNumPages", 1))
        except (TypeError, ValueError):
            total_pages = 1

        results.extend(payload.get("results", []) or [])
        page += 1
        time.sleep(0.02)
    return results


def ura_get_token(access_key: str) -> str:
    response = requests.get(URA_TOKEN_URL, headers={"AccessKey": access_key}, timeout=REQ_TIMEOUT)
    response.raise_for_status()
    payload = response.json()
    token = payload.get("Result")
    if not token:
        raise RuntimeError(f"URA token error: {payload}")
    return str(token)


def build_ura_condo_listings(access_key: str) -> list[dict[str, Any]]:
    token = ura_get_token(access_key)
    batch = 1
    listings: list[dict[str, Any]] = []

    while True:
        response = requests.get(
            URA_TXN_URL,
            params={"service": "PMI_Resi_Transaction", "batch": batch},
            headers={"AccessKey": access_key, "Token": token},
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()

        if payload.get("Status") != "Success":
            break
        projects = payload.get("Result", [])
        if not projects:
            break

        for project in projects:
            property_type = clean_text(str(project.get("propertyType", ""))).lower()
            if "condominium" not in property_type and "apartment" not in property_type:
                continue

            try:
                x = float(project.get("x", ""))
                y = float(project.get("y", ""))
            except (TypeError, ValueError):
                continue

            project_name = clean_text(str(project.get("project", "")))
            street = clean_text(str(project.get("street", "")))
            base_address = clean_text(f"{project_name} {street}")

            for txn in project.get("transaction", []) or []:
                price = parse_price(txn.get("price", ""))
                if price is None or price < PRICE_MIN or price > PRICE_MAX:
                    continue

                area_sqm = None
                if txn.get("area"):
                    area_sqm = parse_float(str(txn.get("area")))

                listings.append(
                    {
                        "type": "Condo",
                        "address": base_address or project_name or street,
                        "price": float(price),
                        "area_sqm": area_sqm,
                        "date": clean_text(str(txn.get("contractDate", ""))),
                        "project": project_name,
                        "url": "",
                        "x": x,
                        "y": y,
                        "source": "URA PMI_Resi_Transaction",
                    }
                )

        batch += 1
        time.sleep(0.1)

    return listings


def build_housing_suggestions(primary_schools: list[dict[str, Any]]) -> None:
    cache = load_geocode_cache()
    hdb_listings = build_hdb_listings(cache)
    condo_listings = build_propertyguru_condo_listings(cache)
    onemap_condos = fetch_onemap_condo_landmarks()
    ura_access_key = clean_text(str(os.environ.get("URA_ACCESS_KEY", "")))
    ura_listings: list[dict[str, Any]] = []
    if ura_access_key:
        try:
            ura_listings = build_ura_condo_listings(ura_access_key)
        except Exception as exc:
            print(f"URA condo pull failed: {exc}")

    listings = hdb_listings + condo_listings + ura_listings
    query_overrides = load_condo_query_overrides()

    for school in primary_schools:
        address = school.get("school_info", {}).get("Address") or school.get("address", {}).get("street", "")
        if not address:
            school["housing_within_1km"] = []
            continue
        geo = geocode_address(str(address), cache)
        if not geo:
            school["housing_within_1km"] = []
            continue

        lat, lon = geo
        school["location"] = {"lat": lat, "lon": lon}
        school_x, school_y = to_svy21(lat, lon)

        candidates: list[dict[str, Any]] = []
        for listing in listings:
            dist = distance_m(school_x, school_y, listing["x"], listing["y"])
            if dist <= MAX_RADIUS_M:
                candidates.append(
                    {
                        "type": listing.get("type", "Home"),
                        "address": listing["address"],
                        "price": listing["price"],
                        "area_sqm": listing["area_sqm"],
                        "date": listing["date"],
                        "distance_m": round(dist, 1),
                        "source": listing["source"],
                        "url": listing.get("url", ""),
                    }
                )
        candidates.sort(key=lambda item: (item["distance_m"], -item["price"]))
        school["housing_within_1km"] = candidates[:10]

        nearby_condos: list[dict[str, Any]] = []
        for condo in onemap_condos:
            dist = distance_m(school_x, school_y, condo["x"], condo["y"])
            if dist <= MAX_RADIUS_M:
                condo_name_upper = condo["name"].upper()
                if any(
                    token in condo_name_upper
                    for token in (
                        "SCHOOL",
                        "SCHOOLHOUSE",
                        "COMMUNITY CENTRE",
                        "COMMUNITY CENTER",
                        "COMMUNITY CLUB",
                        "FIRE POST",
                        "FIRE STATION",
                        "POLICE",
                        "MRT",
                        "LRT",
                    )
                ):
                    continue
                nearby_condos.append(
                    {
                        "name": condo["name"],
                        "address": condo["address"],
                        "distance_m": round(dist, 1),
                        "source": condo["source"],
                    }
                )

        if len(nearby_condos) < 20:
            query_candidates = build_school_query_candidates(school, str(address), query_overrides)
        else:
            query_candidates = []

        for query in query_candidates[:8]:
            extra_results = fetch_onemap_search_results(query, max_pages=8)
            for item in extra_results:
                building = clean_text(str(item.get("BUILDING", "")))
                if not building:
                    continue
                upper = building.upper()
                if any(
                    token in upper
                    for token in (
                        "SCHOOL",
                        "KINDERGARTEN",
                        "SCHOOLHOUSE",
                        "MRT",
                        "LRT",
                        "BUS INTERCHANGE",
                        "COMMUNITY CENTRE",
                        "COMMUNITY CENTER",
                        "COMMUNITY CLUB",
                        "FIRE POST",
                        "FIRE STATION",
                        "POLICE",
                        "MALL",
                        "HOTEL",
                        "MARKET",
                        "HAWKER",
                        "CLINIC",
                        "HOSPITAL",
                        "CHURCH",
                        "MOSQUE",
                        "TEMPLE",
                        "CAR PARK",
                        "PARKING",
                        "HDB",
                    )
                ):
                    continue
                try:
                    x = float(item.get("X", ""))
                    y = float(item.get("Y", ""))
                except (TypeError, ValueError):
                    continue
                dist = distance_m(school_x, school_y, x, y)
                if dist > MAX_RADIUS_M:
                    continue
                nearby_condos.append(
                        {
                            "name": building,
                            "address": clean_text(str(item.get("ADDRESS", ""))),
                            "distance_m": round(dist, 1),
                            "source": f"OneMap enrichment ({query})",
                        }
                    )

        nearby_condos.sort(key=lambda item: (item["distance_m"], item["name"]))
        deduped = {}
        for condo in nearby_condos:
            key = (condo["name"].upper(), condo.get("address", "").upper())
            prev = deduped.get(key)
            if prev is None or condo["distance_m"] < prev["distance_m"]:
                deduped[key] = condo
        school["nearby_condos_within_1km"] = sorted(
            deduped.values(), key=lambda item: (item["distance_m"], item["name"])
        )

    save_geocode_cache(cache)
    return {
        "hdb_count": len(hdb_listings),
        "propertyguru_condo_count": len(condo_listings),
        "ura_condo_count": len(ura_listings),
        "onemap_condo_name_count": len(onemap_condos),
    }


def collect_primary_schools() -> list[dict[str, Any]]:
    schools: list[dict[str, Any]] = []
    for url in fetch_school_urls():
        school = parse_school_page(url)
        if school:
            schools.append(school)

    schools.sort(key=lambda item: item["name"])
    return schools


def main() -> None:
    ensure_dirs()

    rankings = fetch_psle_community_table()
    write_top_schools_csv(rankings)

    primary_schools = collect_primary_schools()
    attach_rankings(primary_schools, rankings)
    housing_counts = build_housing_suggestions(primary_schools)

    schools_with_housing = sum(1 for school in primary_schools if school.get("housing_within_1km"))

    site_data = {
        "generated_at": dt.datetime.utcnow().isoformat() + "Z",
        "sources": {
            "sitemap": SG_SITEMAP_URL,
            "primary_pages_base": f"{SG_BASE_URL}/school/",
            "community_ranking": SG_PSLE_COMMUNITY_URL,
            "hdb_resale": "https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view",
            "geocoding": "https://www.onemap.gov.sg/docs/",
            "propertyguru_condos_csv": str(PROPERTYGURU_CONDO_PATH),
            "ura_api": "https://eservice.ura.gov.sg/maps/api/",
            "onemap_condo_search": ONEMAP_SEARCH_URL,
        },
        "stats": {
            "primary_school_count": len(primary_schools),
            "ranked_school_count": len(rankings),
            "schools_with_housing_suggestions": schools_with_housing,
            "housing_radius_m": MAX_RADIUS_M,
            "hdb_listing_count": housing_counts["hdb_count"],
            "propertyguru_condo_count": housing_counts["propertyguru_condo_count"],
            "ura_condo_count": housing_counts["ura_condo_count"],
            "onemap_condo_name_count": housing_counts["onemap_condo_name_count"],
        },
        "community_ranking": rankings,
        "primary_schools": primary_schools,
    }

    output = SITE_DATA_DIR / "site.json"
    output.write_text(json.dumps(site_data, indent=2), encoding="utf-8")
    print(f"Wrote {output}")
    print(f"Wrote {TOP_SCHOOLS_PATH}")
    print(f"Primary schools: {len(primary_schools)}")
    print(f"Ranked schools: {len(rankings)}")
    print(f"Schools with housing suggestions: {schools_with_housing}")
    print(f"HDB listing count: {housing_counts['hdb_count']}")
    print(f"PropertyGuru condo count: {housing_counts['propertyguru_condo_count']}")
    print(f"URA condo count: {housing_counts['ura_condo_count']}")
    print(f"OneMap condo name count: {housing_counts['onemap_condo_name_count']}")


if __name__ == "__main__":
    main()
