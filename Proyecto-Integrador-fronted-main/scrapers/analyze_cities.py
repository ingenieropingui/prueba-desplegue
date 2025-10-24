import json
from collections import Counter
from pathlib import Path

p = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'scraped_events.json'
if not p.exists():
    print('scraped_events.json not found')
    raise SystemExit(1)

events = json.loads(p.read_text(encoding='utf-8'))

cities = ['Bogotá','Bogota','Medellín','Medellin','Cali','Barranquilla','Cartagena','Bucaramanga','Pereira','Manizales','Ibagué','Neiva','Pasto','Envigado','Soacha']

counter = Counter()

for e in events:
    text = ' '.join(str(e.get(k,'') or '') for k in ('lugar','descripcion','url','titulo','nombre'))
    text_lower = text.lower()
    found = None
    for c in cities:
        if c.lower() in text_lower:
            found = c.title()
            break
    if not found:
        counter['unknown'] += 1
    else:
        counter[found] += 1

print('Events total:', len(events))
for k,v in counter.most_common():
    print(f'{k}: {v}')
