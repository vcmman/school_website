"""Offline tests: synthetic publisher markup is not market evidence."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from supplement_property_data import parse_page

HTML = '''<h1>Test Condo</h1><table><caption>Latest displayed samples</caption>
<thead><tr><th>Date</th><th>Price</th><th>Area</th><th>psf</th><th>Floor</th><th>Type of sale</th></tr></thead>
<tbody><tr><td>Sept 2026</td><td>$2,000,000</td><td>1,000 sqft</td><td>$2,000</td><td>01-05</td><td>Resale</td></tr></tbody></table>
<table><thead><tr><th>Unit type</th><th>Bedrooms</th><th>Area</th></tr></thead>
<tbody><tr><td>A1</td><td></td><td>1,000 sqft</td></tr></tbody></table>'''


class PublicEvidenceTests(unittest.TestCase):
    def test_facts_source_and_missing_bedrooms(self):
        evidence = parse_page(HTML, 'https://www.cashew.sg/property/test')
        row = evidence['records'][0]
        self.assertEqual(row['contract_month'], '2026-09')
        self.assertEqual(row['price_sgd'], 2000000)
        self.assertEqual(row['reported_psf'], 2000)
        self.assertEqual(row['source'], 'Cashew')
        self.assertEqual(row['claimed_original_source'], 'URA')
        self.assertIsNone(row['units'])
        self.assertIsNone(evidence['layouts'][0]['beds'])
        self.assertEqual(len(evidence['raw_hash']), 64)

    def test_numeric_conflict_is_rejected(self):
        with self.assertRaises(ValueError):
            parse_page(HTML.replace('$2,000</td>', '$1,000</td>'), 'https://www.cashew.sg/property/test')

    def test_missing_table_is_missing_evidence_not_zero_sales(self):
        self.assertEqual(parse_page('<h1>Test Condo</h1>', 'https://www.cashew.sg/property/test')['records'], [])
        with self.assertRaises(ValueError):
            parse_page('<p>Unavailable</p>', 'https://www.cashew.sg/property/test')


if __name__ == '__main__':
    unittest.main()
