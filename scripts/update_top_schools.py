#!/usr/bin/env python3
"""Refresh top schools CSV using SGSchooling community data."""
from __future__ import annotations

from build_data import fetch_psle_community_table, write_top_schools_csv


def main() -> None:
    rows = fetch_psle_community_table()
    write_top_schools_csv(rows)
    print("Wrote /Users/byc/src/test/data/top20_schools.csv")


if __name__ == "__main__":
    main()
