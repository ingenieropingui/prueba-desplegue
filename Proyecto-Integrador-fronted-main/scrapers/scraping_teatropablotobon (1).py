import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Agregar headers para evitar bloqueos simples por User-Agent
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/115.0 Safari/537.36'
}

# Si quieres que el scraper siga a las páginas de detalle para extraer hora/lugar/descripcion,
# cambia FOLLOW_DETAIL a True. Para ejecuciones rápidas o si la red está lenta, mantenlo False.
FOLLOW_DETAIL = False
FOLLOW_DETAIL = True

def normalizar_fecha_generica(fecha_raw: str):
    """Intenta normalizar fechas ISO (YYYY-MM-DD) o en formato 'día de mes'."""
    if not fecha_raw:
        return None
    # si contiene YYYY-MM-DD
    m = re.search(r"(\d{4}-\d{2}-\d{2})", fecha_raw)
    if m:
        return m.group(1)
    # si tiene T con datetime ISO
    m2 = re.search(r"(\d{4}-\d{2}-\d{2})T", fecha_raw)
    if m2:
        return m2.group(1)
    # fallback a normalizar español
    return normalizar_fecha_es(fecha_raw)


def limpiar_boilerplate(text: str):
    if not text:
        return text
    t = text.strip()
    menu_indicators = ['Menú Categorías', 'Buscar', 'Inicio chevron_right', 'Ubicación y precios', 'Línea Ética']
    if any(mi in t for mi in menu_indicators) and len(t) > 300:
        for marker in ['Descripción', 'Información del evento', 'Descripción del evento', 'Información', 'Descripción:']:
            idx = t.find(marker)
            if idx != -1:
                return t[idx:].strip()
        return None
    return t

MESES = {
    "enero": "01", "febrero": "02", "marzo": "03",
    "abril": "04", "mayo": "05", "junio": "06",
    "julio": "07", "agosto": "08", "septiembre": "09",
    "octubre": "10", "noviembre": "11", "diciembre": "12"
}

def convertir_fecha_simple(fecha_txt: str, year: int):
    try:
        partes = fecha_txt.replace("de", "").split()
        if len(partes) >= 2:
            dia = partes[0]
            mes = MESES.get(partes[1].lower())
            if mes:
                return f"{year}-{mes.zfill(2)}-{dia.zfill(2)}"
    except Exception:
        return fecha_txt.title()
    return fecha_txt.title()

def normalizar_fecha_es(fecha_raw: str, year: int = datetime.now().year):
    if not fecha_raw or fecha_raw == "N/A":
        return None
    return convertir_fecha_simple(fecha_raw, year)

def normalizar_ingreso(ingreso_raw: str):
    ingreso_raw = ingreso_raw.lower()
    if "libre" in ingreso_raw:
        return "LIBRE"
    elif "costo" in ingreso_raw or "$" in ingreso_raw:
        return "COSTO"
    elif "inscripción" in ingreso_raw:
        return "INSCRIPCION"
    return "OTRO"


def extract_address_from_text(text: str):
    if not text:
        return None
    # buscar patrones comunes de direcciones en español
    patterns = [r"Direcci[oó]n[:\s]+([\w\d\s#\-.,]+)", r"(Carrera\s+\d+[A-Za-z]?\s*#?\s*\d+[-\d]*)",
                r"(Calle\s+\d+[A-Za-z]?)", r"(Cra\.?\s*\d+)", r"(Medell[ií]n|Bogot[aá]|Cali|Barranquilla|Cartagena)"]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(0).strip()
    return None


def venue_from_url(url: str):
    if not url:
        return None
    u = url.lower()
    if 'teatropablotobon' in u or 'tptu' in u:
        return 'Teatro Pablo Tobón Uribe, Medellín'
    if 'astorplaza' in u or 'teatroastorplaza' in u:
        return 'Teatro Astor Plaza, Bogotá'
    return None

def limpiar_nombre(nombre_raw: str):
    return re.sub(r"\d+", "", nombre_raw).strip()

def normalizar_tipo(tipo_raw: str):
    tipo_raw = tipo_raw.lower()
    if "musica" in tipo_raw or "música" in tipo_raw:
        return "MÚSICA"
    elif "teatro" in tipo_raw:
        return "TEATRO"
    elif "danza" in tipo_raw:
        return "DANZA"
    elif "comedia" in tipo_raw:
        return "COMEDIA"
    return "OTROS"

def scrape_eventos():
    url = "https://teatropablotobon.com/eventos/"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.encoding = "utf-8"
    soup = BeautifulSoup(resp.text, "html.parser")

    eventos_data = []
    titulos = soup.find_all("h2")

    def find_link(elem):
        a = elem.find('a')
        if a and a.get('href'):
            return a.get('href')
        for parent in elem.parents:
            if parent.name == 'a' and parent.get('href'):
                return parent.get('href')
        next_a = elem.find_next('a')
        if next_a and next_a.get('href'):
            return next_a.get('href')
        prev_a = elem.find_previous('a')
        if prev_a and prev_a.get('href'):
            return prev_a.get('href')
        return None

    for t in titulos:
        nombre = t.get_text(strip=True)
        if not nombre or "pasados" in nombre.lower():
            continue

        tipo, ingreso = "N/A", "N/A"
        chips_block = t.find_previous("div", class_="chips")
        if chips_block:
            tipo_chip = chips_block.find(
                "div",
                class_=re.compile(r"chips__chip.*(musica|teatro|danza|comedia|otros)", re.IGNORECASE)
            )
            if tipo_chip:
                tipo = tipo_chip.get_text(strip=True)

            ingreso_chip = chips_block.find("div", class_=re.compile(r"chips__chip.*entrada", re.IGNORECASE))
            if ingreso_chip:
                ingreso = ingreso_chip.get_text(strip=True)

        # Buscar enlace del evento y seguir a la página de detalle para hora/lugar/descripcion
        href = find_link(t)
        event_url = urljoin(url, href) if href else None

        fecha = "N/A"
        hora = None
        lugar = None
        descripcion = None

        fecha_block = t.find_next("div")
        if fecha_block:
            fecha_tags = fecha_block.find_all("p", class_="mb-0")
            fecha_text = " ".join([f.get_text(strip=True) for f in fecha_tags]) if fecha_tags else ""
            fecha_match = re.search(r"(\d{1,2}\s+de\s+\w+)", fecha_text, re.IGNORECASE)
            if fecha_match:
                fecha = fecha_match.group(1)

        # Si hay página de detalle, intentar extraer hora, lugar, descripción (solo si FOLLOW_DETAIL=True)
        if event_url and FOLLOW_DETAIL:
            try:
                r = requests.get(event_url, headers=HEADERS, timeout=12)
                r.encoding = 'utf-8'
                det = BeautifulSoup(r.text, 'html.parser')
                text_det = det.get_text(' ', strip=True)
                # JSON-LD
                ld_json = None
                for s in det.find_all('script', type='application/ld+json'):
                    try:
                        data = json.loads(s.string or s.get_text())
                        if isinstance(data, list):
                            for item in data:
                                if isinstance(item, dict) and item.get('@type', '').lower() == 'event':
                                    ld_json = item
                                    break
                        elif isinstance(data, dict) and data.get('@type', '').lower() == 'event':
                            ld_json = data
                            break
                    except Exception:
                        continue

                if ld_json:
                    sd = ld_json.get('startDate') or ld_json.get('datePublished') or ld_json.get('date')
                    if sd:
                        fecha = normalizar_fecha_generica(sd)
                        hm = re.search(r"T(\d{2}:\d{2})", sd)
                        if hm:
                            hora = hm.group(1)

                    loc = ld_json.get('location')
                    if isinstance(loc, dict):
                        lugar = loc.get('name') or loc.get('address') or lugar
                        if isinstance(lugar, dict):
                            lugar = ' '.join(str(v) for v in (lugar.get('streetAddress'), lugar.get('addressLocality')) if v)
                    elif isinstance(loc, str):
                        lugar = loc

                    descripcion = ld_json.get('description') or descripcion

                # Fallbacks
                if not descripcion:
                    meta_desc = det.find('meta', property='og:description') or det.find('meta', attrs={'name': 'description'})
                    if meta_desc and meta_desc.get('content'):
                        descripcion = meta_desc.get('content')

                if not hora:
                    hora_m = re.search(r"(\d{1,2}:\d{2})", text_det)
                    if hora_m:
                        hora = hora_m.group(1)

                if not lugar:
                    lugar_sel = det.find(class_=re.compile(r'lugar|venue|ubicaci[oó]n|address|direccion', re.IGNORECASE))
                    if lugar_sel:
                        lugar = lugar_sel.get_text(' ', strip=True)

                if not descripcion:
                    desc_sel = det.find(class_=re.compile(r'descripci[oó]n|entry-content|content|descripcion|evento', re.IGNORECASE))
                    if desc_sel:
                        descripcion = desc_sel.get_text(' ', strip=True)
                    else:
                        descripcion = text_det[:1200]

                # limpiar boilerplate
                descripcion = limpiar_boilerplate(descripcion)
                # garantizar que lugar siempre exista como cadena
                lugar = limpiar_boilerplate(lugar) or None
                if not lugar:
                    # intentar extraer dirección desde la descripción o texto completo
                    lugar = extract_address_from_text(descripcion or text_det)
                if not lugar:
                    lugar = venue_from_url(event_url)
                if not lugar:
                    lugar = ""  # fallback: campo presente pero vacío
            except Exception:
                pass

        evento = {
            "tipo": normalizar_tipo(tipo),
            "nombre": limpiar_nombre(nombre),
            "fecha": normalizar_fecha_es(fecha),
            "hora": hora,
            "lugar": lugar or "",
            "descripcion": descripcion,
            "ingreso": normalizar_ingreso(ingreso),
            "url": event_url
        }

        eventos_data.append(evento)

    return eventos_data

if __name__ == "__main__":
    eventos = scrape_eventos()
    ruta_salida = os.path.join(BASE_DIR, "scraping_teatropablotobon.json")
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(eventos, f, indent=4, ensure_ascii=False)

    print(json.dumps(eventos, indent=4, ensure_ascii=False))
    print(f"✅ {len(eventos)} eventos normalizados guardados en {ruta_salida}")
