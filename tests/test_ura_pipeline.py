"""Offline contract tests using synthetic URA-shaped data, not market evidence."""
import copy
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import fetch_ura_transactions as fetcher
from import_ura_transactions import normalize_batches

ROW = {'contractDate': '0926', 'area': '100', 'price': '2000000',
       'propertyType': 'Condominium', 'typeOfArea': 'Strata', 'tenure': 'Freehold',
       'floorRange': '01-05', 'typeOfSale': '3', 'district': '10', 'noOfUnits': '1'}


def payload(name='TEST PROJECT', rows=None):
    return {'Status': 'Success', 'Result': [{'project': name, 'street': 'TEST ROAD',
            'transaction': rows if rows is not None else [copy.deepcopy(ROW)]}]}


class PipelineTests(unittest.TestCase):
    def test_official_v1_fields_and_identical_units_retained(self):
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder) / 'batch.json'
            p.write_text(json.dumps(payload(rows=[ROW, ROW])))
            result = normalize_batches([p], '2026-10-06')
            self.assertEqual(len(result['records']), 2)
            row = result['records'][0]
            self.assertEqual(row['area_type'], 'strata')
            self.assertEqual(row['sale_type'], 'resale')
            self.assertEqual(row['contract_month'], '2026-09')
            self.assertIn('/v1?', result['source_url'])

    def test_overlapping_project_batches_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            a, b = Path(folder) / 'a.json', Path(folder) / 'b.json'
            for p in (a, b):
                p.write_text(json.dumps(payload()))
            with self.assertRaises(ValueError):
                normalize_batches([a, b], '2026-10-06')

    def test_unknown_area_not_assumed_strata_and_invalid_values_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder) / 'a.json'
            row = {**ROW, 'typeOfArea': 'Unknown'}
            p.write_text(json.dumps(payload(rows=[row])))
            self.assertEqual(normalize_batches([p], '2026-10-06')['records'][0]['area_type'], 'unknown')
            for change in [{'area': '0'}, {'price': 'NaN'}, {'contractDate': '1326'}]:
                p.write_text(json.dumps(payload(rows=[{**ROW, **change}])))
                with self.assertRaises(ValueError):
                    normalize_batches([p], '2026-10-06')

    def test_missing_and_world_readable_credentials_fail_closed(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {}, clear=True):
            config = Path(folder) / '.env.ura'
            with patch.object(fetcher, 'CONFIG', config):
                with self.assertRaises(RuntimeError):
                    fetcher.load_key()
                config.write_text('URA_ACCESS_KEY=synthetic-test-key\n')
                config.chmod(0o644)
                with self.assertRaises(RuntimeError):
                    fetcher.load_key()
                config.chmod(0o600)
                self.assertEqual(fetcher.load_key(), 'synthetic-test-key')

    def test_failure_keeps_public_data_and_token_is_not_saved(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            destination = root / 'site/data/ura_transactions.json'
            destination.parent.mkdir(parents=True)
            destination.write_text('existing')
            batch = payload()
            with patch.object(fetcher, 'ROOT', root), patch.object(fetcher, 'load_key', return_value='synthetic'), patch.object(fetcher.time, 'sleep'), patch.object(fetcher, 'request_json', side_effect=[(b'', {'Result': 'private-token'}), (json.dumps(batch).encode(), batch), RuntimeError('batch failed')]):
                with self.assertRaises(RuntimeError):
                    fetcher.fetch()
            self.assertEqual(destination.read_text(), 'existing')
            for file in (root / '.private').rglob('*.json'):
                self.assertNotIn('private-token', file.read_text())

    def test_success_requires_four_batches_before_atomic_publish(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'site/data').mkdir(parents=True)
            batches = [payload('PROJECT ' + str(i)) for i in range(4)]
            calls = [(b'', {'Result': 'private-token'})] + [(json.dumps(p).encode(), p) for p in batches]
            with patch.object(fetcher, 'ROOT', root), patch.object(fetcher, 'load_key', return_value='synthetic'), patch.object(fetcher.time, 'sleep'), patch.object(fetcher, 'request_json', side_effect=calls) as request:
                fetcher.fetch()
            self.assertEqual(request.call_count, 5)
            result = json.loads((root / 'site/data/ura_transactions.json').read_text())
            self.assertEqual(len(result['records']), 4)
            self.assertEqual(len(result['raw_hashes']), 4)
            self.assertEqual(result['status'], 'available')
            self.assertEqual(result['coverage']['downloaded_batches'], [1, 2, 3, 4])
            self.assertTrue(result['coverage']['national_coverage_complete'])
            self.assertNotIn('private-token', json.dumps(result))

    def test_partial_and_unidentified_imports_never_claim_national_coverage(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'batch-1.json'
            path.write_text(json.dumps(payload()))
            unknown = normalize_batches([path], '2026-10-06')
            self.assertEqual(unknown['status'], 'partial')
            self.assertEqual(unknown['coverage']['downloaded_batches'], [])
            partial = normalize_batches([path], '2026-10-06', batch_ids=[1])
            self.assertEqual(partial['coverage']['downloaded_batches'], [1])
            self.assertFalse(partial['coverage']['national_coverage_complete'])
            for batches in [[1, 2], [5], [0]]:
                with self.assertRaises(ValueError):
                    normalize_batches([path], '2026-10-06', batch_ids=batches)

    def test_redirect_cannot_forward_credentials(self):
        with self.assertRaises(RuntimeError):
            fetcher.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://example.com')


if __name__ == '__main__':
    unittest.main()
