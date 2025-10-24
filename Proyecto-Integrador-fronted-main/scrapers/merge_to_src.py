import json
import os
from pathlib import Path
import requests
from datetime import datetime

BASE = Path(__file__).resolve().parent
SRC_DATA = BASE.parent / 'src' / 'data' / 'scraped_events.json'

combined = []
for p in BASE.glob('*.json'):
    if p.name == 'README_SCRAPERS.md':
        continue
    try:
        data = json.loads(p.read_text(encoding='utf-8'))
        if isinstance(data, list):
            combined.extend(data)
    except Exception as e:
        print(f'warning: failed to read {p}: {e}')

def check_url_alive(u):
    if not u:
        return False, None
    try:
        # Prefer HEAD to be light; follow redirects and allow some servers to reject HEAD
        r = requests.head(u, allow_redirects=True, timeout=6)
        if r.status_code >= 400:
            # fallback to GET for servers that don't support HEAD
            r = requests.get(u, allow_redirects=True, timeout=8)
        alive = (r.status_code < 400)
        return alive, r.status_code
    except Exception:
        return False, None

# enrich events with url_active and url_checked timestamp
for e in combined:
    url = e.get('url') or e.get('link') or ''
    if url:
        alive, status = check_url_alive(url)
        e['url_active'] = bool(alive)
        e['url_status'] = status
        e['url_checked'] = datetime.utcnow().isoformat() + 'Z'
    else:
        e['url_active'] = False
        e['url_status'] = None
        e['url_checked'] = None

# write to src/data/scraped_events.json
SRC_DATA.parent.mkdir(parents=True, exist_ok=True)
SRC_DATA.write_text(json.dumps(combined, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Wrote {len(combined)} events to {SRC_DATA} (url_active checked)')
