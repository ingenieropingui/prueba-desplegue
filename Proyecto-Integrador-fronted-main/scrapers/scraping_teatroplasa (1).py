import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
import re
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Agregar headers para evitar bloqueos simples por User-Agent
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/115.0 Safari/537.36'
}

# Si quieres que el scraper siga a las páginas de detalle para extraer hora/lugar/descripcion,
# cambia FOLLOW_DETAIL a True. Para ejecuciones rápidas o si la red está lenta, mantenlo False.
FOLLOW_DETAIL = True

# ----------------------------
# Funciones de normalización
# ----------------------------
def normalizar_fecha(fecha_raw: str):
    """
    Normaliza fechas al formato 'YYYY-MM-DD' si es posible.
    Si no se puede, devuelve texto capitalizado.
    """
    if not fecha_raw or fecha_raw == "N/A":
        return None

    fecha = fecha_raw.strip().title()

    # Reemplazar nombres de meses a números
    meses = {
        "Enero": "01", "Febrero": "02", "Marzo": "03", "Abril": "04",
        "Mayo": "05", "Junio": "06", "Julio": "07", "Agosto": "08",
        "Septiembre": "09", "Octubre": "10", "Noviembre": "11", "Diciembre": "12"
    }

    patron = re.search(r"(\d{1,2})\s+De\s+([A-Za-z]+)", fecha, re.IGNORECASE)
    if patron:
        dia = patron.group(1).zfill(2)
        mes = meses.get(patron.group(2).capitalize(), None)
        if mes:
            return f"2025-{mes}-{dia}"  # 🔹 año fijo (puedes mejorarlo con datetime.now().year)

    return fecha

def limpiar_nombre(nombre_raw: str):
    """Limpia nombres eliminando números o basura extra."""
    return re.sub(r"\d+", "", nombre_raw).strip()


def limpiar_boilerplate(text: str):
    """Eliminar fragmentos repetitivos o menús que a veces se capturan.
    Si se detecta mucho contenido de navegación, intentar recortar a la sección 'Descripción' o devolver None para forzar fallback.
    """
    if not text:
        return text
    t = text.strip()
    menu_indicators = ['Menú Categorías', 'Buscar', 'Ciudad', 'Menú de cabecera', 'Inicio chevron_right']
    if any(mi in t for mi in menu_indicators) and len(t) > 300:
        for marker in ['Descripción', 'Descripción del evento', 'Información del evento', 'Información', 'Descripción:']:
            idx = t.find(marker)
            if idx != -1:
                return t[idx:].strip()
        return None
    return t


def extract_address_from_text(text: str):
    if not text:
        return None
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

# ----------------------------
# Scraping
# ----------------------------
def scrape_teatroplaza():
    url = "https://teatroastorplaza.com"
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.encoding = "utf-8"
    soup = BeautifulSoup(response.text, "html.parser")

    eventos = []
    nombres = soup.find_all("h2", class_="elementor-heading-title")

    def find_link(elem):
        # Buscar enlace relativo cercano al título
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

    for nombre_elem in nombres:
        try:
            titulo_raw = nombre_elem.get_text(strip=True)
            nombre = limpiar_nombre(titulo_raw)

            href = find_link(nombre_elem)
            event_url = urljoin(url, href) if href else None

            fecha = None
            hora = None
            lugar = None
            descripcion = None

            if event_url and FOLLOW_DETAIL:
                try:
                    r = requests.get(event_url, headers=HEADERS, timeout=12)
                    r.encoding = 'utf-8'
                    detail = BeautifulSoup(r.text, 'html.parser')

                    fecha_sel = (
                        detail.find('time') or
                        detail.find(class_=re.compile(r'date|fecha', re.IGNORECASE)) or
                        detail.find('span', class_=re.compile(r'date|fecha', re.IGNORECASE))
                    )
                    if fecha_sel:
                        fecha_text = fecha_sel.get_text(' ', strip=True)
                        fecha = normalizar_fecha(fecha_text)

                    text_detail = detail.get_text(' ', strip=True)
                    hora_match = re.search(r"(\d{1,2}:\d{2})", text_detail)
                    if hora_match:
                        hora = hora_match.group(1)

                    lugar_sel = (
                        detail.find(class_=re.compile(r'lugar|venue|sitio|lugar-evento', re.IGNORECASE)) or
                        detail.find('address') or
                        detail.find(class_=re.compile(r'ubicacion|ubicaci[oó]n', re.IGNORECASE))
                    )
                    if lugar_sel:
                        lugar = lugar_sel.get_text(' ', strip=True)

                    desc_sel = (
                        detail.find(class_=re.compile(r'descripci[oó]n|entry-content|content|descripcion', re.IGNORECASE)) or
                        detail.find('article') or
                        detail.find('div', id=re.compile(r'content', re.IGNORECASE))
                    )
                    if desc_sel:
                        descripcion = desc_sel.get_text(' ', strip=True)
                    else:
                        descripcion = text_detail[:800].strip() if text_detail else None
                except Exception:
                    pass
                    try:
                        r = requests.get(event_url, headers=HEADERS, timeout=12)
                        r.encoding = 'utf-8'
                        detail = BeautifulSoup(r.text, 'html.parser')

                        # JSON-LD
                        ld_json = None
                        for s in detail.find_all('script', type='application/ld+json'):
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
                                fecha = normalizar_fecha(sd)
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

                        if not descripcion:
                            meta_desc = detail.find('meta', property='og:description') or detail.find('meta', attrs={'name': 'description'})
                            if meta_desc and meta_desc.get('content'):
                                descripcion = meta_desc.get('content')

                        # limpiar boilerplate
                        descripcion = limpiar_boilerplate(descripcion)
                        lugar = limpiar_boilerplate(lugar) or None
                        # heurísticas para asegurar que 'lugar' exista
                        if not lugar:
                            lugar = extract_address_from_text(descripcion or text_detail)
                        if not lugar:
                            lugar = venue_from_url(event_url)
                        if not lugar:
                            lugar = ""

                        if not fecha:
                            fecha_sel = (detail.find('time') or detail.find(class_=re.compile(r'date|fecha', re.IGNORECASE)) or detail.find('span', class_=re.compile(r'date|fecha', re.IGNORECASE)))
                            if fecha_sel:
                                fecha_text = fecha_sel.get_text(' ', strip=True)
                                fecha = normalizar_fecha(fecha_text)

                        if not hora:
                            text_detail = detail.get_text(' ', strip=True)
                            hora_match = re.search(r"(\d{1,2}:\d{2})", text_detail)
                            if hora_match:
                                hora = hora_match.group(1)

                        if not lugar:
                            lugar_sel = (detail.find(class_=re.compile(r'lugar|venue|sitio|lugar-evento|address|direccion|ubicaci[oó]n', re.IGNORECASE)) or detail.find('address'))
                            if lugar_sel:
                                lugar = lugar_sel.get_text(' ', strip=True)

                        if not descripcion:
                            desc_sel = (detail.find(class_=re.compile(r'descripci[oó]n|entry-content|content|descripcion|evento', re.IGNORECASE)) or detail.find('article') or detail.find('div', id=re.compile(r'content', re.IGNORECASE)))
                            if desc_sel:
                                descripcion = desc_sel.get_text(' ', strip=True)
                            else:
                                text_detail = detail.get_text(' ', strip=True)
                                descripcion = text_detail[:1200].strip() if text_detail else None
                    except Exception:
                        pass

            if not fecha:
                possible_fecha = nombre_elem.find_next('span', style=re.compile(r'vertical-align', re.IGNORECASE))
                if possible_fecha:
                    fecha = normalizar_fecha(possible_fecha.get_text(strip=True))

            if nombre:
                evento = {
                    "titulo": nombre,
                    "fecha": fecha,
                    "hora": hora,
                    "lugar": lugar or "",
                    "descripcion": descripcion,
                    "url": event_url
                }
                eventos.append(evento)
        except Exception:
            continue

    # Guardar en archivo JSON
    archivo_salida = os.path.join(BASE_DIR, "scraping_teatroplasa.json")
    with open(archivo_salida, "w", encoding="utf-8") as f:
        json.dump(eventos, f, indent=4, ensure_ascii=False)

    print(json.dumps(eventos, indent=4, ensure_ascii=False))
    print(f"✅ Archivo JSON creado: {archivo_salida}")

if __name__ == "__main__":
    scrape_teatroplaza()
