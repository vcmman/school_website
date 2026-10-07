"""Normalize original URA v1 transaction batches without inventing missing fields."""
import argparse
import datetime as dt
import hashlib
import json
import math
import re
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://eservice.ura.gov.sg/uraDataService/invokeUraDS/v1?service=PMI_Resi_Transaction'


def normalize_batches(paths, retrieved_on):
    as_of = dt.date.fromisoformat(retrieved_on)
    if as_of > dt.datetime.now(ZoneInfo('Asia/Singapore')).date():
        raise ValueError('Download date cannot be in the future')
    records, hashes, projects = [], {}, set()
    for path in paths:
        raw = path.read_bytes()
        payload = json.loads(raw)
        if payload.get('Status') != 'Success' or not isinstance(payload.get('Result'), list):
            raise ValueError('Not a successful original URA response')
        hashes[path.name] = hashlib.sha256(raw).hexdigest()
        for project in payload['Result']:
            name = project['project'].strip()
            identity = (name, project.get('street'))
            if not name or identity in projects:
                raise ValueError('Repeated project across batches: review overlap before import')
            projects.add(identity)
            for row in project.get('transaction', []):
                month = str(row.get('contractDate', ''))
                if not re.fullmatch(r'(0[1-9]|1[0-2])\d{2}', month):
                    raise ValueError('Unsupported contractDate')
                price, area = float(row['price']), float(row['area'])
                units = int(row['noOfUnits'])
                if not all(math.isfinite(v) and v > 0 for v in [price, area, units]):
                    raise ValueError('Invalid price, area or unit count')
                record = {
                    'project': name, 'source': 'URA',
                    'property_type': row.get('propertyType'),
                    'contract_month': f'20{month[2:]}-{month[:2]}',
                    'price_sgd': price, 'area_sqm': area,
                    'sale_type': {'1': 'new_sale', '2': 'sub_sale', '3': 'resale'}.get(str(row.get('typeOfSale')), 'unknown'),
                    'area_type': {'Strata': 'strata', 'Land': 'land', 'Unknown': 'unknown'}.get(row.get('typeOfArea'), 'unknown'),
                    'units': units, 'floor_range': row.get('floorRange'),
                    'district': row.get('district'), 'tenure': row.get('tenure'),
                }
                # Different units may have identical public fields. Retain official multiplicity.
                records.append(record)
    if not records:
        raise ValueError('No transactions; existing evidence retained')
    return {'schema_version': 1, 'source': 'URA', 'source_url': SOURCE_URL,
            'as_of_date': retrieved_on, 'retrieved_on': retrieved_on,
            'status': 'available', 'raw_hashes': hashes, 'records': records}


def write_output(output, destination):
    temp = destination.with_suffix('.tmp')
    temp.write_text(json.dumps(output, separators=(',', ':'), allow_nan=False))
    temp.replace(destination)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('files', nargs='+', type=Path, help='Original successful URA API batch JSON files')
    parser.add_argument('--retrieved-on', required=True, help='Actual download date, YYYY-MM-DD')
    args = parser.parse_args()
    output = normalize_batches(args.files, args.retrieved_on)
    write_output(output, ROOT / 'site/data/ura_transactions.json')
    print(f"Imported {len(output['records'])} transactions")


if __name__ == '__main__':
    main()
