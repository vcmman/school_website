#!/usr/bin/env python3
"""Build a primary-school dataset from SGSchooling and generate site JSON."""
from __future__ import annotations

import csv
import datetime as dt
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import urljoin
from xml.etree import ElementTree as ET

import requests
from bs4 import BeautifulSoup

BASE_DIR = Path("/Users/byc/src/test")
SITE_DATA_DIR = BASE_DIR / "site" / "data"
DATA_DIR = BASE_DIR / "data"
TOP_SCHOOLS_PATH = DATA_DIR / "top20_schools.csv"

SG_BASE_URL = "https://sgschooling.com"
SG_SITEMAP_URL = f"{SG_BASE_URL}/sitemap.xml"
SG_PSLE_COMMUNITY_URL = f"{SG_BASE_URL}/blog/psle-2025-score-ranges-community-data"

REQ_TIMEOUT = 40


def ensure_dirs() -> None:
    SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)


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


def fetch_text(url: str) -> str:
    response = requests.get(url, timeout=REQ_TIMEOUT)
    response.raise_for_status()
    return response.text


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

    site_data = {
        "generated_at": dt.datetime.utcnow().isoformat() + "Z",
        "sources": {
            "sitemap": SG_SITEMAP_URL,
            "primary_pages_base": f"{SG_BASE_URL}/school/",
            "community_ranking": SG_PSLE_COMMUNITY_URL,
        },
        "stats": {
            "primary_school_count": len(primary_schools),
            "ranked_school_count": len(rankings),
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


if __name__ == "__main__":
    main()
