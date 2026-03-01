#!/usr/bin/env python3
"""Manual-browser-assisted PropertyGuru condo exporter.

Why this script exists:
- PropertyGuru often blocks pure HTTP scraping with anti-bot checks.
- This tool opens a real browser, lets you solve any challenge manually,
  then extracts visible listing data and writes a CSV for build_data.py.

Output:
- /Users/byc/src/test/data/propertyguru_condos.csv
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

BASE_DIR = Path("/Users/byc/src/test")
OUT_PATH = BASE_DIR / "data" / "propertyguru_condos.csv"
START_URL = (
    "https://www.propertyguru.com.sg/property-for-sale"
    "?market=residential&listing_type=sale&property_type=CONDO"
)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def parse_price(value: str) -> str:
    match = re.search(r"([0-9][0-9,]*)", value.replace("$", ""))
    return match.group(1).replace(",", "") if match else ""


def extract_from_jsonld(page) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    scripts = page.locator("script[type='application/ld+json']")
    count = scripts.count()
    for i in range(count):
        text = scripts.nth(i).inner_text(timeout=1000)
        if not text:
            continue
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            continue

        objects: list[Any]
        if isinstance(payload, list):
            objects = payload
        else:
            objects = [payload]

        for obj in objects:
            if not isinstance(obj, dict):
                continue
            items = obj.get("itemListElement", [])
            if not isinstance(items, list):
                continue
            for item in items:
                if not isinstance(item, dict):
                    continue
                listing = item.get("item") if isinstance(item.get("item"), dict) else item
                if not isinstance(listing, dict):
                    continue

                url = clean_text(str(listing.get("url", "")))
                name = clean_text(str(listing.get("name", "")))
                offer = listing.get("offers", {}) if isinstance(listing.get("offers"), dict) else {}
                price = clean_text(str(offer.get("price", "")))

                address_obj = (
                    listing.get("address", {}) if isinstance(listing.get("address"), dict) else {}
                )
                address = clean_text(
                    " ".join(
                        [
                            str(address_obj.get("streetAddress", "")),
                            str(address_obj.get("addressLocality", "")),
                            str(address_obj.get("postalCode", "")),
                        ]
                    )
                )
                if not address:
                    address = name

                if address and price:
                    rows.append(
                        {
                            "project": name,
                            "address": address,
                            "price": price,
                            "area_sqm": "",
                            "date": "",
                            "url": url,
                        }
                    )
    return rows


def extract_fallback_cards(page) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    cards = page.locator("a[href*='/listing/']")
    count = min(cards.count(), 300)
    for i in range(count):
        card = cards.nth(i)
        text = clean_text(card.inner_text(timeout=1000))
        if not text:
            continue
        url = card.get_attribute("href") or ""
        if url and url.startswith("/"):
            url = "https://www.propertyguru.com.sg" + url
        price = parse_price(text)
        if not price:
            continue

        # Best-effort parsing: first line as project/title.
        lines = [clean_text(line) for line in text.split("\n") if clean_text(line)]
        project = lines[0] if lines else ""
        address = project
        rows.append(
            {
                "project": project,
                "address": address,
                "price": price,
                "area_sqm": "",
                "date": "",
                "url": url,
            }
        )
    return rows


def dedupe_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, str, str]] = set()
    out: list[dict[str, str]] = []
    for row in rows:
        key = (row.get("address", ""), row.get("price", ""), row.get("url", ""))
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def write_csv(rows: list[dict[str, str]]) -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["address", "price", "area_sqm", "date", "url", "project"],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "address": row.get("address", ""),
                    "price": row.get("price", ""),
                    "area_sqm": row.get("area_sqm", ""),
                    "date": row.get("date", ""),
                    "url": row.get("url", ""),
                    "project": row.get("project", ""),
                }
            )


def main() -> None:
    print("Launching browser...")
    print("1) Complete any challenge/login manually.")
    print("2) Scroll through a few result pages.")
    print("3) Return to terminal and press Enter to export.")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.goto(START_URL, wait_until="domcontentloaded")

        input("Press Enter here after the page is ready and listings are visible... ")

        rows = extract_from_jsonld(page)
        if not rows:
            rows = extract_fallback_cards(page)

        rows = dedupe_rows(rows)
        write_csv(rows)
        browser.close()

    print(f"Wrote {OUT_PATH} ({len(rows)} rows)")
    print("Next: run python3 /Users/byc/src/test/scripts/build_data.py")


if __name__ == "__main__":
    main()
