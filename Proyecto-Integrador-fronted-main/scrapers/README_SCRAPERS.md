Resumen de cambios - carpeta `scrapers`

Objetivo: corregir extracción de URLs de eventos y añadir extracción de campos: título, fecha, hora, lugar, descripción y URL.

Scrapers modificados:

1) scraping_teatroplasa (1).py y scraping_teatroplasa (2).py
- Qué fallaba: los scrapers solo leían los textos de los <h2> y no buscaban ni convertían los enlaces a las páginas de detalle de los eventos.
- Cambios realizados:
  - Añadida función `find_link(elem)` que busca enlaces cercanos (descendientes, padres, siguientes o previos) al título.
  - Uso de `urllib.parse.urljoin` para convertir href relativos a URLs absolutas.
  - Si se encuentra URL, se hace una petición a la página de detalle para intentar extraer `fecha`, `hora`, `lugar` y `descripcion` usando varios selectores de respaldo.
  - Añadido campo `url` en la salida JSON y renombrado de salida a clave `titulo` para mayor claridad.
  - Añadidos HEADERS (User-Agent) en las peticiones para mejorar compatibilidad.
- Resultado esperado: cada entrada JSON contiene `titulo`, `fecha`, `hora`, `lugar`, `descripcion` y `url` (cuando esté disponible).

2) scraping_teatropablotobon (1).py
- Qué fallaba: el scraper listaba títulos y metadatos (tipo, ingreso, fecha) pero no obtenía ni normalizaba la URL de detalle de cada evento.
- Cambios realizados:
  - Añadida la misma estrategia `find_link(elem)` para localizar hrefs próximos al título.
  - Construcción de `event_url` con `urljoin` y petición a la página de detalle (si existe) para extraer `hora`, `lugar` y `descripcion`.
  - Añadido campo `url` en la salida, y preservados los campos anteriores (`tipo`, `nombre`, `fecha`, `ingreso`).
  - Añadidos HEADERS (User-Agent) en las peticiones para mejorar compatibilidad.
- Resultado esperado: cada evento en la lista incluye `url` (si se encontró) y los campos de detalle cuando la página de evento lo permite.

Notas y recomendaciones de validación
- Ejecuta cada scraper localmente y comprueba el JSON generado, p. ej.:

```powershell
python .\scrapers\"scraping_teatroplasa (2).py"
python .\scrapers\"scraping_teatropablotobon (1).py"
```

- Si el sitio web cambia su estructura (clases o disposición de elementos), los selectores de respaldo pueden necesitar ajustes. Los scrapers intentan ser tolerantes pero no garantizan extracción perfecta ante cambios mayores.
- Si quieres, puedo añadir un script runner que ejecute todos los scrapers y devuelva un único JSON combinado o añadir tests unitarios mínimos para la normalización de fechas.

Cambios realizados por: AI assistant
Fecha: 2025-10-23
