"""Local-only URA credentials and authenticated v1 transaction collection."""
import argparse
import datetime as dt
import getpass
import json
import os
import stat
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

from import_ura_transactions import normalize_batches, write_output

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / '.env.ura'
TOKEN_URL = 'https://eservice.ura.gov.sg/uraDataService/insertNewToken/v1'
DATA_URL = 'https://eservice.ura.gov.sg/uraDataService/invokeUraDS/v1'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('URA redirected the request; stopped to protect credentials')


def valid_key(value):
    if not value or any(ord(c) < 33 or ord(c) > 126 for c in value):
        raise ValueError('Invalid Access Key format')
    return value


def load_key():
    if os.environ.get('URA_ACCESS_KEY'):
        return valid_key(os.environ['URA_ACCESS_KEY'].strip())
    if not CONFIG.exists():
        raise RuntimeError('No URA key configured. Run: python3 scripts/fetch_ura_transactions.py --configure')
    if CONFIG.is_symlink() or stat.S_IMODE(CONFIG.stat().st_mode) & 0o077:
        raise RuntimeError('Credential file must be a regular private file (chmod 600 .env.ura)')
    for line in CONFIG.read_text().splitlines():
        if line.startswith('URA_ACCESS_KEY='):
            return valid_key(line.split('=', 1)[1].strip())
    raise RuntimeError('No URA_ACCESS_KEY in .env.ura')


def configure():
    if not sys.stdin.isatty():
        raise RuntimeError('Configure interactively in your terminal; never paste credentials into chat')
    key = valid_key(getpass.getpass('URA Access Key (hidden): ').strip())
    # Exclusive creation avoids overwriting an existing credential or following a symlink.
    fd = os.open(CONFIG, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as file:
        file.write('URA_ACCESS_KEY=' + key + '\n')
    print('Private local credential configured. It is excluded from Git and deployment.')


def request_json(url, headers):
    request = urllib.request.Request(url, headers={**headers, 'Accept': 'application/json', 'User-Agent': 'SchoolAtlas/1.0'})
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=90) as response:
            raw = response.read()
            content_type = response.headers.get_content_type()
            charset = response.headers.get_content_charset()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f'URA HTTP {exc.code}; collection stopped, existing data retained') from None
    except urllib.error.URLError:
        raise RuntimeError('Cannot reach URA; check network access') from None
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f'URA returned malformed JSON ({len(raw)} bytes; parser: {exc.msg}, offset {exc.pos}); existing data retained') from None
    except UnicodeDecodeError as exc:
        raise RuntimeError(f'URA response encoding error ({content_type}, charset {charset or "unspecified"}, {len(raw)} bytes; {exc.encoding} at offset {exc.start}); existing data retained') from None
    if payload.get('Status') != 'Success':
        # Never log remote messages: an error body may echo authentication material.
        raise RuntimeError('URA rejected the request; check activation, key and data-service permissions')
    return raw, payload


def fetch():
    key = load_key()
    _, payload = request_json(TOKEN_URL, {'AccessKey': key})
    token = payload.get('Result')
    if not isinstance(token, str) or not token:
        raise RuntimeError('URA returned no valid token')
    now = dt.datetime.now(ZoneInfo('Asia/Singapore'))
    folder = ROOT / '.private/ura' / now.strftime('%Y%m%dT%H%M%S%f')
    folder.mkdir(parents=True, mode=0o700)
    paths = []
    for batch in range(1, 5):
        raw, payload = request_json(f'{DATA_URL}?service=PMI_Resi_Transaction&batch={batch}', {'AccessKey': key, 'Token': token})
        if not isinstance(payload.get('Result'), list) or not payload['Result']:
            raise RuntimeError('Empty or malformed batch; existing public data retained')
        path = folder / f'batch-{batch}.json'
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'wb') as file:
            file.write(raw)
        paths.append(path)
        print(f'Batch {batch}/4 saved')
        if batch < 4:
            time.sleep(2)
    output = normalize_batches(paths, now.date().isoformat(), batch_ids=[1, 2, 3, 4])
    write_output(output, ROOT / 'site/data/ura_transactions.json')
    print(f"Downloaded all 4 batches; imported {len(output['records'])} transactions. Token was not saved.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--configure', action='store_true', help='Enter Access Key privately, once')
    args = parser.parse_args()
    try:
        configure() if args.configure else fetch()
    except (RuntimeError, ValueError, FileExistsError, KeyError, TypeError):
        # Safe diagnostics for common failures without exposing credentials or API bodies.
        if args.configure and CONFIG.exists():
            print('Credential file already exists; not overwritten.', file=sys.stderr)
        else:
            exc = sys.exc_info()[1]
            print(str(exc) if isinstance(exc, RuntimeError) else 'Input/data validation failed; existing data retained.', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
