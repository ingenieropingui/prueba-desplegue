import json
from pathlib import Path
p=Path(__file__).resolve().parent.parent / 'src' / 'data' / 'scraped_events.json'
events=json.loads(p.read_text(encoding='utf-8'))
for e in events:
    s=' '.join(str(e.get(k,'') or '') for k in ('tipo','titulo','nombre','descripcion','lugar','url'))
    if 'cali' in s.lower():
        print(json.dumps(e, ensure_ascii=False, indent=2))
