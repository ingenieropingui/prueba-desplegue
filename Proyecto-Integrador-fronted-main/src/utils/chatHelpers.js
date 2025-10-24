// Utilities for chatbot logic. Keep pure functions and no DOM side-effects.
export function formatDate(dateStr) {
  // Accepts dates already in DD/MM/YYYY or ISO; returns DD/MM/YYYY
  if (!dateStr) return '';
  // If already in DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function genId(prefix = 'id') {
  // Simple unique id generator, safe to use locally
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// parseIntent: simple rule-based parser returning city, category, action, query
export function parseIntent(text) {
  if (!text) return { intent: 'unknown', confidence: 0 };

  // Normalization pipeline: lowercase, NFD normalize, remove diacritics, replace corrupt/non-letter chars with spaces,
  // collapse spaces and punctuation.
  const normalize = (s) => {
    if (!s) return '';
    // replace common corrupted characters (boxes) with space, keep letters/numbers and spaces
    let t = String(s).trim().toLowerCase();
    // NFD + remove accents
    t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // replace non-letter/digit/space with space (removes weird boxes, control chars, punctuation)
    t = t.replace(/[^a-z0-9\sñüáéíóú-]/g, ' ');
    // collapse multiple spaces and dashes
    t = t.replace(/[\-\_]+/g, ' ');
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  };

  const raw = normalize(text);

  // Known cities and categories (keep aligned with events data)
  const CITIES = ['bogota', 'medellin', 'cali', 'bucaramanga', 'cartagena', 'barranquilla'];
  const CATEGORY_MAP = {
    musica: ['musica', 'musical', 'concierto', 'pop', 'rock', 'jazz', 'indie'],
    deportes: ['deporte', 'deportes', 'partido', 'maraton', 'ciclismo', 'futbol', 'futbol'],
    culturales: ['cultural', 'cultura', 'teatro', 'exposicion', 'exposiciones', 'arte', 'museo'],
    conferencias: ['conferencia', 'conferencias', 'foro', 'seminario', 'talk', 'charla']
  };

  // Levenshtein distance for fuzzy matching small typos
  function levenshtein(a, b) {
    if (!a || !b) return Infinity;
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
      }
    }
    return dp[m][n];
  }

  // helper fuzzy contains: checks tokens against target allowing small edits
  function fuzzyContains(haystack, needle) {
    if (!haystack || !needle) return false;
    if (haystack.includes(needle)) return true;
    const tokens = haystack.split(/\s+/);
    for (const t of tokens) if (levenshtein(t, needle) <= 1) return true;
    return false;
  }

  // Intent detectors (ordered by priority)
  // greetings
  if (/^\b(hola|holaa|buenos dias|buenas dias|buenas tardes|buenas noches|que tal|qué tal|hey|buenas)\b/.test(raw)) {
    return { intent: 'greeting', detected: 'greeting', confidence: 0.95 };
  }

  // ver ciudades
  if (/\b(ver ciudades|mostrar ciudades|ciudades|ver la lista de ciudades)\b/.test(raw)) {
    return { intent: 'list_cities', detected: 'ver_ciudades', confidence: 0.9 };
  }

  // ayuda
  if (/\b(ayuda|que puedo hacer|qué puedo hacer|help)\b/.test(raw)) {
    return { intent: 'help', detected: 'ayuda', confidence: 0.9 };
  }

  // ver mas / pagination
  if (/\b(ver mas|ver mas|ver más|mostrar siguiente|siguiente|otro resultado|otro)\b/.test(raw)) {
    return { intent: 'show_more', detected: 'ver_mas', confidence: 0.9 };
  }

  // volver al inicio
  if (/\b(volver al inicio|volver|inicio|empezar|reiniciar)\b/.test(raw)) {
    return { intent: 'restart', detected: 'volver_inicio', confidence: 0.9 };
  }

  // explicit 'ver <ciudad>' when user just names a city or writes 'ver bogota'
  for (const c of CITIES) {
    if (raw === c || raw === `ver ${c}` || fuzzyContains(raw, c)) {
      // treat as choose_city
      return { intent: 'choose_city', detected: 'ver_ciudad', city: capitalize(c), confidence: 0.9 };
    }
  }

  // explicit search patterns: buscar <term>, busca <term>, quiero ver <term>, quiero <term>
  const searchMatch = raw.match(/^(?:buscar|busca|buscarme|buscame|buscar por|quiero ver|quiero|quiero buscar|muéstrame|muestrame|mostrar|ver|dime)\s+(.+)$/);
  if (searchMatch) {
    const rest = searchMatch[1].trim();
    // try to extract city or category inside the rest using 'en <city>' or 'en <city> de <category>'
    let city = null, category = null, query = rest;
    const enMatch = rest.match(/(.+)\s+en\s+([a-z\s]+)$/);
    if (enMatch) {
      query = enMatch[1].trim();
      const candidate = enMatch[2].trim();
      for (const c of CITIES) if (fuzzyContains(candidate, c)) { city = capitalize(c); }
    }
    // detect category keywords inside query
    for (const [catKey, variants] of Object.entries(CATEGORY_MAP)) {
      for (const v of variants) {
        if (fuzzyContains(query, v)) { category = catKey; break; }
      }
      if (category) break;
    }
    // if we detected city+category -> search (category+city)
    if (city && category) return { intent: 'search', detected: 'buscar', city, category, query, confidence: 0.95 };
    // if just a free text search, map to search_query
    return { intent: 'search_query', detected: 'buscar', query: rest, confidence: 0.9 };
  }

  // detect category + city patterns like 'musica en bogota' or 'musica bogota'
  // look for category tokens first
  let foundCategory = null;
  for (const [catKey, variants] of Object.entries(CATEGORY_MAP)) {
    for (const v of variants) {
      if (fuzzyContains(raw, v)) { foundCategory = catKey; break; }
    }
    if (foundCategory) break;
  }
  let foundCity = null;
  for (const c of CITIES) if (fuzzyContains(raw, c)) { foundCity = c; break; }
  if (foundCategory && foundCity) {
    return { intent: 'search', detected: 'buscar', city: capitalize(foundCity), category: foundCategory, confidence: 0.95 };
  }

  // if the user wrote only a city token somewhere, treat as choose_city (e.g. 'Bogota')
  if (foundCity && !foundCategory) return { intent: 'choose_city', detected: 'ver_ciudad', city: capitalize(foundCity), confidence: 0.85 };
  if (foundCategory && !foundCity) return { intent: 'choose_category', detected: 'categoria', category: foundCategory, confidence: 0.85 };

  // if the user typed one-word commands like 'ciudades'
  if (raw === 'ciudades') return { intent: 'list_cities', detected: 'ver_ciudades', confidence: 0.9 };

  // fallback: low-confidence unknown; log it for later inspection and return unknown with low confidence
  try {
    // lightweight logging of unrecognized inputs for telemetry during dev
    // Keep as console.warn to avoid breaking environments; these can be collected if needed.
    console.warn('chat-intent-unrecognized', { text: text, normalized: raw });
  } catch (e) {
    // swallow
  }
  return { intent: 'unknown', detected: 'unknown', confidence: 0.3 };
}

// helper to capitalize city display
function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
