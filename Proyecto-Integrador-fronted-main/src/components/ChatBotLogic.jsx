import { useState, useCallback } from 'react';
import scrapedEvents from '../data/scrapers_source_fixed.json';

// Build an indexed structure eventsData[City][Category] => [events]
// helper: if the imported JSON is already hierarchical ([{ciudad, categoria, eventos: []}, ...])
// normalize it into the eventsData structure. Otherwise fall back to the flat-array builder.
function inferCityFromEvent(e) {
  const url = (e.url || '').toLowerCase();
  if ((e.source || '').toLowerCase().includes('pablotobon') || url.includes('medellin') || url.includes('medell')) return 'Medellín';
  if ((e.source || '').toLowerCase().includes('astor') || url.includes('bogota') || url.includes('bogot')) return 'Bogotá';
  if (url.includes('cali')) return 'Cali';
  if (url.includes('bucaramanga')) return 'Bucaramanga';
  if (url.includes('cartagena')) return 'Cartagena';
  if (url.includes('barranquilla')) return 'Barranquilla';
  // fallback unknown
  return 'Bogotá';
}

function inferCategoryFromEvent(e) {
  const text = ((e.tipo || '') + ' ' + (e.nombre || e.titulo || '') + ' ' + (e.descripcion || '')).toLowerCase();
  if (text.match(/m(usica|úsica)|conciert|band|orquesta|cantante|cantor/)) return 'Música';
  if (text.match(/teatro|obra|drama|monólogo|monolog/)) return 'Culturales';
  if (text.match(/conferencia|congreso|foro|seminar|seminario|charla/)) return 'Conferencias';
  if (text.match(/deporte|futbol|baloncesto|carrera|maraton|marat[oó]n/)) return 'Deportes';
  // fallback: if tipo field suggests teatro vs musica
  const tipo = (e.tipo || '').toLowerCase();
  if (tipo.includes('mus') || tipo.includes('música')) return 'Música';
  if (tipo.includes('teatro')) return 'Culturales';
  return 'Culturales';
}

function buildEventsIndex(arr) {
  const out = {};
  arr.forEach((raw) => {
    const city = inferCityFromEvent(raw);
    const category = inferCategoryFromEvent(raw);
    // keep original fields but normalize common aliases and ensure url/lugar exist
    const ev = Object.assign({}, raw);
    ev.nombre = raw.nombre || raw.titulo || ev.nombre || '';
    ev.fecha = raw.fecha || ev.fecha || null;
    ev.hora = raw.hora || ev.hora || null;
    ev.lugar = (raw.lugar || raw.ubicacion || ev.lugar || '') || '';
    ev.descripcion = raw.descripcion || raw.summary || ev.descripcion || '';
    ev.url = raw.url || raw.link || ev.url || '';
    out[city] = out[city] || {};
    out[city][category] = out[city][category] || [];
    out[city][category].push(ev);
  });
  return out;
}

// New: accept two possible source shapes:
// 1) flat array of event objects -> buildEventsIndex(flatArray)
// 2) hierarchical array like the attached `scrapers.json` where each item has
//    { ciudad: 'Name', categoria: 'Cat', eventos: [ ... ] }
function buildEventsIndexFromSource(src) {
  // detect hierarchical structure
  if (Array.isArray(src) && src.length > 0 && src[0] && (src[0].ciudad || src[0].categoria) && src[0].eventos) {
    const out = {};
    src.forEach((block) => {
      const city = block.ciudad || capitalizeFirst(block.city || '');
      const category = block.categoria || block.category || 'General';
      out[city] = out[city] || {};
      out[city][category] = out[city][category] || [];
      const list = Array.isArray(block.eventos) ? block.eventos : (block.events || []);
      list.forEach((raw) => {
        const ev = Object.assign({}, raw);
        ev.nombre = raw.nombre || raw.titulo || ev.nombre || '';
        ev.fecha = raw.fecha || ev.fecha || null;
        ev.hora = raw.hora || ev.hora || null;
        ev.lugar = (raw.lugar || raw.ubicacion || ev.lugar || '') || '';
        ev.descripcion = raw.descripcion || raw.summary || ev.descripcion || '';
        ev.url = raw.url || raw.link || ev.url || '';
        out[city][category].push(ev);
      });
    });
    return out;
  }

  // fallback: flat array of events
  return buildEventsIndex(src || []);
}

const eventsData = buildEventsIndexFromSource(scrapedEvents || []);
import { genId, formatDate, parseIntent, sleep } from '../utils/chatHelpers';

// NOTE: Do not change selector names or external classes. This module is pure logic.

// Derivar dinámicamente las ciudades y categorías a partir de los datos scrapeados
function getCities() {
  return Object.keys(eventsData).sort();
}

function getCategoriesForCity(city) {
  if (!city) return [];
  return Object.keys(eventsData[city] || {}).sort();
}

export function useChatBot() {
  const PAGE_SIZE = 5; // configurable page size (mostrar X por acción) — ahora mostramos varios eventos por petición

  const [open, setOpen] = useState(true);
  const [state, setState] = useState('idle'); // idle | esperandoCiudad | esperandoCategoria | mostrandoEventos
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [messages, setMessages] = useState(() => [
    { id: genId('msg'), sender: 'ia', text: '¡Hola! Soy tu asistente de eventos — encantado de ayudarte. ¿En qué ciudad te gustaría buscar?', time: new Date().toISOString() },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // pagination index per city|category key
  const [pages, setPages] = useState({});
  // keep a pending city context when bot asked for category but selectedCity may not be set yet
  const [pendingCity, setPendingCity] = useState(null);

  const pushMessage = useCallback((sender, text) => {
    const msg = { id: genId('msg'), sender, text, time: new Date().toISOString() };
    setMessages((m) => [...m, msg]);
    return msg;
  }, []);

  // Helper to simulate typing and then send one or multiple bot messages
  const botReply = useCallback((items = [], delay = 600) => {
    // items: array of message objects to push after typing
    (async () => {
      setIsTyping(true);
      // push typing indicator (UI will render the animated dots)
      const typingId = genId('typing');
      setMessages((m) => [...m, { id: typingId, sender: 'ia', type: 'typing', text: 'Un momento, busco lo mejor para ti 😊' }]);
      await sleep(delay);
      // remove typing indicator and append items
      setMessages((prev) => prev.filter((x) => x.id !== typingId).concat(items.map((it) => ({ id: genId('msg'), sender: 'ia', ...it, time: new Date().toISOString() }))));
      setIsTyping(false);
    })();
  }, []);

  const listCities = useCallback(() => {
    setState('esperandoCiudad');
    // send a text prompt listing cities (conversational, user must type the city name)
    const cities = getCities();
    botReply([
      { text: `Selecciona una ciudad: ${cities.join(', ')}. Escribe el nombre de la ciudad para continuar.` },
    ], 700);
  }, [pushMessage]);

  const listCategories = useCallback((city) => {
    setState('esperandoCategoria');
    setPendingCity(city);
    const cats = getCategoriesForCity(city);
    const catsText = cats.length ? cats.join(', ') : 'No hay categorías predefinidas para esta ciudad; puedes escribir palabras como Música, Teatro, Deportes.';
    botReply([
      { text: `Has seleccionado ${city}. ¿Qué categoría quieres ver? ${catsText}. Escribe la categoría.` },
    ], 700);
  }, [pushMessage]);

  const showEvents = useCallback((city, category) => {
    setState('mostrandoEventos');
    setSelectedCity(city);
    setSelectedCategory(category);

    const key = `${city}|${category}`;
  const cityData = eventsData[city] || {};
  const list = cityData[category] || [];

    // initialize page index if needed
    setPages((p) => ({ ...p, [key]: p[key] ? p[key] : 0 }));

    if (list.length === 0) {
      botReply([
        { text: `Ups — no encuentro ${category} en ${city} ahora mismo. Puedes escribir otra ciudad, otra categoría, o "volver" para reiniciar.` },
      ], 600);
      return;
    }

    // show PAGE_SIZE items starting from pages[key]
    // read current page index from state (pages may have been initialized above)
    const start = (pages[key] || 0);
    const slice = list.slice(start, start + PAGE_SIZE);
    const items = [];
    // Use a neutral, non-counting intro to avoid revealing small totals.
    items.push({ text: `Aquí tienes algunos eventos en ${category} · ${city}:` });
    slice.forEach((ev) => {
      // return the full event object as stored in the index, but format fecha
      const formatted = Object.assign({}, ev);
      try {
        formatted.fecha = formatDate(ev.fecha);
      } catch (err) {
        formatted.fecha = ev.fecha || null;
      }
      items.push({ type: 'event', payload: formatted });
    });
    // guidance for next steps (conversational)
    const guidance = [];
    if (start + PAGE_SIZE < list.length) guidance.push('Si quieres ver más, escribe "ver más".');
    // allow user to request the full list explicitly
    if (list.length > PAGE_SIZE) guidance.push('Para ver todos los eventos de esta lista, escribe "ver todos" o "mostrar todos".');
    guidance.push('Para cambiar de ciudad escribe el nombre de la ciudad. Escribe "volver" para volver al inicio.');
    items.push({ text: guidance.join(' ') });
    botReply(items, 800);
  }, [pushMessage]);

  // show all events for a city/category (no pagination)
  const showAllEvents = useCallback((city, category) => {
    setState('mostrandoEventos');
    setSelectedCity(city);
    setSelectedCategory(category);
    const cityData = eventsData[city] || {};
    const list = cityData[category] || [];
    if (list.length === 0) {
      botReply([{ text: `No encontré ${category} en ${city}. Puedes escribir otra categoría o ciudad.` }], 500);
      return;
    }
    const items = [];
    items.push({ text: `Mostrando todos los eventos en ${category} · ${city} (${list.length}):` });
    list.forEach((ev) => {
      const formatted = Object.assign({}, ev);
      try { formatted.fecha = formatDate(ev.fecha); } catch (err) { formatted.fecha = ev.fecha || null; }
      items.push({ type: 'event', payload: formatted });
    });
    items.push({ text: 'Ya están todos los eventos listados. Puedes escribir otra ciudad, categoría, o "volver" para reiniciar.' });
    botReply(items, 900);
  }, [pushMessage]);
  // note: showEvents depends on pages state (used to compute start index). We rely
  // on reading `pages` directly inside the callback so include it in the dependency
  // chain where this hook is recreated when pages changes. To avoid linter noise
  // we could list [pushMessage, pages], but we intentionally keep the body simple
  // and update pages via setPages when advancing. If you see stale page indices,
  // we can refactor to accept an explicit page offset parameter.

  const handleText = useCallback((text) => {
    if (!text || !text.trim()) return;
    const t = text.trim();
    pushMessage('user', t);
    // use parseIntent from helpers
    const intent = parseIntent(t);

    // If parser returned a confidence score, use it to decide clarifications
    const confidence = (typeof intent.confidence === 'number') ? intent.confidence : 1.0;

    // Merge parsed city/category into conversation state (do not overwrite existing unless explicit change requested)
    const parsedCity = intent.city || null;
    const parsedCategory = intent.category || null;

    // helpers to map parsed tokens into canonical keys used by eventsData
    function mapCity(raw) {
      if (!raw) return null;
      // prefer normalizeCityName if it maps
      const byName = normalizeCityName(raw);
      if (byName && eventsData[byName]) return byName;
      const target = normalizeString(raw);
      for (const k of Object.keys(eventsData)) {
        if (normalizeString(k).startsWith(target)) return k;
      }
      return byName || capitalizeFirst(raw);
    }

    function mapCategory(raw, cityForLookup) {
      if (!raw) return null;
      // if we have a city, prefer finding a category key within that city
      if (cityForLookup) {
        const found = findCategoryKeyForCity(cityForLookup, raw);
        if (found) return found;
      }
      // otherwise search globally across cities for a matching category key
      const target = normalizeString(raw);
      for (const cityKey of Object.keys(eventsData)) {
        const cats = Object.keys(eventsData[cityKey] || {});
        for (const c of cats) {
          if (normalizeString(c).startsWith(target) || normalizeString(c) === target) return c;
        }
      }
      // fallback: return capitalized raw
      return capitalizeFirst(raw);
    }

    // Determine mapped values (do not commit to state yet)
    const mappedCity = parsedCity ? mapCity(parsedCity) : null;
    const mappedCategory = parsedCategory ? mapCategory(parsedCategory, mappedCity || selectedCity) : null;

    // detect explicit change request keywords in user's message (approximate)
    const lowerRaw = (t || '').toLowerCase();
    const explicitChange = /\b(cambiar|cambio|cambia|nuevo|otra ciudad|otra categoria|otra categoría|cambiar a)\b/.test(lowerRaw);

  // detect explicit 'show all' request
  const wantsAll = /\b(ver todos|mostrar todos|todos\b|ver todo)\b/.test(lowerRaw);

    // Apply parsed city if we don't have one yet or user explicitly asked to change
    if (mappedCity) {
      if (!selectedCity) {
        setSelectedCity(mappedCity);
      } else if (selectedCity !== mappedCity && explicitChange) {
        setSelectedCity(mappedCity);
      }
    }

    // Apply parsed category if we don't have one yet or user explicitly asked to change
    if (mappedCategory) {
      if (!selectedCategory) {
        setSelectedCategory(mappedCategory);
      } else if (selectedCategory !== mappedCategory && explicitChange) {
        setSelectedCategory(mappedCategory);
      }
    }

    // If after applying parsed tokens we have both city and category, perform immediate search
    const finalCity = mappedCity || selectedCity;
    const finalCategory = mappedCategory || selectedCategory;
    // If user requested all results explicitly, handle it
    if (wantsAll) {
      if (finalCity && finalCategory) {
        // show everything for this city/category
        setPages((p) => ({ ...p, [`${finalCity}|${finalCategory}`]: 0 }));
        setSelectedCity(finalCity);
        setSelectedCategory(finalCategory);
        botReply([{ text: `Perfecto — mostrando todos los ${finalCategory} en ${finalCity}...` }], 400);
        setTimeout(() => showAllEvents(finalCity, finalCategory), 600);
        return;
      }
      // If missing city or category, ask for the missing one
      if (!finalCity) { listCities(); return; }
      if (!finalCategory) { listCategories(finalCity); return; }
    }
    if (finalCity && finalCategory) {
      // ensure pagination cursor reset for this pair
      const key = `${finalCity}|${finalCategory}`;
      setPages((p) => ({ ...p, [key]: 0 }));
      setSelectedCity(finalCity);
      setSelectedCategory(finalCategory);
      // Show first event immediately
      botReply([{ text: `Perfecto — buscando ${finalCategory} en ${finalCity}...` }], 400);
      // slight delay then show events (showEvents will simulate typing too)
      setTimeout(() => showEvents(finalCity, finalCategory), 600);
      return;
    }

    // If user typed a city name as free text, map to a known city using eventsData
    if (!mappedCity && !selectedCity) {
      // try to match raw text to a city present in eventsData
      const candidate = Object.keys(eventsData).find(k => normalizeString(k) === normalizeString(t) || normalizeString(k).startsWith(normalizeString(t)));
      if (candidate) {
        // ask for category for that city
        listCategories(candidate);
        return;
      }
    }

    // If we only have category, ask for city
    if ((mappedCategory || selectedCategory) && !(mappedCity || selectedCity)) {
      const catToAsk = mappedCategory || selectedCategory;
      botReply([{ text: `¿En qué ciudad quieres buscar ${catToAsk}? Por ejemplo Bogotá, Medellín, Cali o Bucaramanga.` }], 500);
      return;
    }

    // If we only have city, ask for category
    if ((mappedCity || selectedCity) && !(mappedCategory || selectedCategory)) {
      const cityToAsk = mappedCity || selectedCity;
      botReply([{ text: `Genial — ¿qué categoría te interesa en ${cityToAsk} (por ejemplo Música, Deportes, Culturales)?` }], 500);
      return;
    }

    if (intent.intent === 'list_cities') { listCities(); return; }
    // greetings -> friendly human reply and open question
    if (intent.intent === 'greeting') {
      botReply([{ text: '¡Hola! 😊 ¿En qué ciudad te gustaría buscar eventos o escribe "buscar <texto>" para una búsqueda rápida?' }], 500);
      return;
    }
    if (intent.intent === 'help') {
      botReply([
        { text: 'Puedo ayudarte a encontrar eventos. Prueba escribir: "ver ciudades", "buscar <texto>", el nombre de una ciudad (p.e. Bogotá), "ver más" o "volver" para reiniciar.' }
      ], 600);
      return;
    }
    // user asked to see events -> start the city selection flow
    if (intent.intent === 'list_events') { listCities(); return; }
    if (intent.intent === 'restart') { restart(); return; }
    if (intent.intent === 'show_more') { selectOption('showMore'); return; }

    if (intent.intent === 'search_query') {
      // show intermediate typing message
      botReply([{ text: `Perfecto — busco "${intent.query}"...` }], 500);
      // do a search across events and show first match (paged)
      const q = intent.query.toLowerCase();
      const results = [];
      Object.keys(eventsData).forEach((city) => {
        Object.keys(eventsData[city]).forEach((cat) => {
          eventsData[city][cat].forEach((ev) => {
            const hay = `${ev.nombre} ${ev.artista || ''} ${ev.lugar || ''} ${ev.descripcion || ''}`.toLowerCase();
            if (hay.includes(q)) results.push({ city, category: cat, event: ev });
          });
        });
      });
      if (results.length === 0) {
        botReply([{ text: `No encontré nada para "${intent.query}". ¿Quieres que muestre ciudades, intentes otra búsqueda o pidas ayuda? Escribe ver ciudades, buscar <texto> o ayuda.` }], 800);
      } else {
        // show first found as event (and set pagination state for that city|category)
        const r = results[0];
        const city = capitalizeFirst(r.city);
        const cat = capitalizeFirst(r.category);
        // set pages index so showMore continues in that list
        const key = `${city}|${cat}`;
        setPages((p) => ({ ...p, [key]: 0 }));
        botReply([{ text: `Resultado para "${intent.query}" en ${city} — ${cat}:` }, { type: 'event', payload: { ...r.event, fecha: formatDate(r.event.fecha) } }, { text: 'Escribe "ver más" para ver otro resultado, o "volver" para reiniciar.' }], 700);
      }
      return;
    }

    if (intent.intent === 'search') {
      // robust mapping: normalize keys (remove accents) and match
      const wantedCity = normalizeString(intent.city);
      const wantedCat = normalizeString(intent.category);
      let cityKey = null;
      for (const k of Object.keys(eventsData)) {
        if (normalizeString(k).startsWith(wantedCity)) { cityKey = k; break; }
      }
      let categoryKey = null;
      if (cityKey) {
        categoryKey = findCategoryKeyForCity(cityKey, intent.category) || Object.keys(eventsData[cityKey]).find(k => normalizeString(k).startsWith(wantedCat));
      }
      if (cityKey && categoryKey) {
        // show first event and setup pagination for the proper key names
        const catDisplay = categoryKey;
        const pageKey = `${cityKey}|${catDisplay}`;
        setPages((p) => ({ ...p, [pageKey]: 0 }));
        setSelectedCity(cityKey);
        setSelectedCategory(catDisplay);
        showEvents(cityKey, catDisplay);
      } else {
        const cityPretty = capitalizeFirst(intent.city);
        const catPretty = capitalizeFirst(intent.category);
        botReply([{ text: `Lo siento — no tengo toda la info exacta para ${cityPretty} y ${catPretty} ahora mismo. Escribe "ver ciudades" para ver opciones o intenta otra búsqueda.` }], 600);
      }
      return;
    }

    if (intent.intent === 'choose_city') {
      // normalize incoming city name
      const rawCity = intent.city;
      const city = capitalizeFirst(rawCity);

      // If we already had a selected city, user is switching city mid-conversation
      if (selectedCity && selectedCity !== city) {
        // Attempt to preserve category filter if possible
        if (selectedCategory) {
          const validCat = findCategoryKeyForCity(city, selectedCategory);
          if (validCat) {
            // Reset pagination for new city+category then show first page
            const key = `${city}|${validCat}`;
            setPages((p) => ({ ...p, [key]: 0 }));
            setSelectedCity(city);
            setSelectedCategory(validCat);
            botReply([{ text: `Perfecto — ahora busco eventos en ${city}. Mantengo la categoría ${validCat}.` }], 600);
            // show first item
            showEvents(city, validCat);
            return;
          } else {
            // category not available in new city: inform and offer alternatives
            setSelectedCity(city);
            setSelectedCategory(null);
            const available = getCategoriesForCity(city);
            const options = available.length ? available.concat(['Ver todos']) : ['Música', 'Culturales', 'Deportes', 'Conferencias'];
            botReply([
              { text: `Cambié a ${city}, pero no encontré la categoría ${selectedCategory} allí.` },
                { text: `Puedes elegir otra categoría: ${options.join(', ')}. Escribe la categoría que prefieras.` },
            ], 700);
            return;
          }
        }
  // No category to preserve — just update city and ask what to do next
  setSelectedCity(city);
  setPendingCity(null);
  const cityCats = getCategoriesForCity(city);
  const catsText = cityCats.length ? cityCats.join(', ') : 'Música, Culturales, Deportes, Conferencias';
  botReply([{ text: `Perfecto — ahora busco eventos en ${city}. ¿Qué categoría te interesa? ${catsText}. Escribe la categoría.` }], 600);
        return;
      }

      // default behavior (no selectedCity previously): show categories for chosen city
      listCategories(city);
      return;
    }

    if (intent.intent === 'choose_category') {
      const rawCat = intent.category;
      // find a valid category key in the currently selected city or pendingCity
      const cityForLookup = selectedCity || pendingCity;
      const validCat = cityForLookup ? findCategoryKeyForCity(cityForLookup, rawCat) : null;
      if (validCat && cityForLookup) {
        // reset pagination for this city|category
        const key = `${cityForLookup}|${validCat}`;
        setPages((p) => ({ ...p, [key]: 0 }));
        setSelectedCategory(validCat);
        setSelectedCity(cityForLookup);
        showEvents(cityForLookup, validCat);
      } else if (selectedCity && !validCat) {
        // selected city exists but category not found there
        const available = getCategoriesForCity(selectedCity);
        const options = available.length ? available.concat(['Ver todos']) : ['Música', 'Culturales', 'Deportes', 'Conferencias'];
        botReply([{ text: `No encontré la categoría solicitada en ${selectedCity}. Puedes elegir otra categoría: ${options.join(', ')}. Escribe la que prefieras.` }], 600);
      } else {
        const cities = getCities();
        botReply([{ text: `Has pedido la categoría ${capitalizeFirst(rawCat)}. Primero, selecciona una ciudad: ${cities.join(', ')}. Escribe la ciudad.` }], 600);
      }
      return;
    }
    // fallback: use confidence to decide whether to clarify or perform a best-effort
    if (confidence < 0.6) {
      botReply([{ text: 'No estoy seguro de qué quieres decir — ¿Quieres que muestre ciudades, buscar por texto o ver ayuda? Escribe "ver ciudades", "buscar <texto>" o "ayuda".' }], 600);
    } else {
      // try a friendly fallback that asks a clarifying question
      botReply([{ text: '¿Quieres que muestre ciudades, busque por texto o te muestre ayuda? Escribe ver ciudades, buscar <texto> o ayuda.' }], 600);
    }
  }, [listCities, listCategories, pushMessage, selectedCity, showEvents]);

  

  // API requested: sendText, selectOption, resetConversation
  const sendText = useCallback((text) => {
    handleText(text);
  }, [handleText]);

  const selectOption = useCallback((type, value) => {
    // type: 'city'|'category'|'action'|'showMore'
    if (type === 'city') { selectCity(value); return; }
    if (type === 'category') { selectCategory(value); return; }
    if (type === 'action' && (value||'').toLowerCase().includes('volver')) { restart(); return; }
      if (type === 'showMore' || (type === 'action' && (value||'').toLowerCase().includes('ver m'))) {
      // advance pagination for current selection
      const city = selectedCity;
      const category = selectedCategory;
      if (!city || !category) { botReply([{ text: 'Primero selecciona una ciudad y categoría. Escribe "ver ciudades" para ver la lista de ciudades.' }], 500); return; }
      const key = `${city}|${category}`;
      const cityData = eventsData[city] || {};
      const list = cityData[category] || [];
      const current = pages[key] || 0;
      const next = current + PAGE_SIZE;
      if (next >= list.length) {
        botReply([{ text: `No hay más eventos en ${category} para ${city}. Puedes escribir otra categoría o ciudad, o "volver" para reiniciar.` }], 600);
        return;
      }
      // advance page index then show next PAGE_SIZE items
      setPages((p) => ({ ...p, [key]: next }));
      // show events from next index
      const slice = list.slice(next, next + PAGE_SIZE);
      const items = [{ text: `Aquí tienes más eventos en ${category} · ${city}:` }];
      slice.forEach((ev) => items.push({ type: 'event', payload: { ...ev, fecha: formatDate(ev.fecha) } }));
      items.push({ text: (next + PAGE_SIZE < list.length) ? 'Escribe "ver más" para seguir viendo eventos.' : 'No quedan más eventos en esta lista. Escribe otra categoría o ciudad, o "volver".' });
      botReply(items, 700);
      return;
    }
    if (type === 'showAll' || (type === 'action' && (value||'').toLowerCase().includes('ver todo') || (value||'').toLowerCase().includes('ver todos') ) ) {
      const city = selectedCity;
      const category = selectedCategory;
      if (!city || !category) { botReply([{ text: 'Primero selecciona una ciudad y categoría. Escribe "ver ciudades" para ver la lista de ciudades.' }], 500); return; }
      showAllEvents(city, category);
      return;
    }
  }, [listCategories, pushMessage, showEvents, selectedCity, selectedCategory, pages, PAGE_SIZE, botReply]);

  // helper functions local to hook
  function capitalizeFirst(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  function normalizeString(s) {
    if (!s) return '';
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function normalizeCityName(raw) {
    if (!raw) return raw;
    const r = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (r.startsWith('medell')) return 'Medellín';
  if (r.startsWith('bogo')) return 'Bogotá';
  if (r.startsWith('cali')) return 'Cali';
  if (r.startsWith('bucara')) return 'Bucaramanga';
  if (r.startsWith('cart') || r.startsWith('cartag')) return 'Cartagena';
  if (r.startsWith('barra') || r.startsWith('barran')) return 'Barranquilla';
    return raw;
  }

  // find a category key in a city by comparing normalized strings (handles accents)
  function findCategoryKeyForCity(city, catLike) {
    if (!city || !catLike) return null;
    const cityData = eventsData[city] || {};
    const cats = Object.keys(cityData || {});
    const target = catLike.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const k of cats) {
      const nk = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (nk === target || nk.startsWith(target)) return k;
    }
    return null;
  }

  const selectCity = useCallback((city) => {
    if (!city) return;
    setSelectedCity(city);
    listCategories(city);
  }, [listCategories]);

  const selectCategory = useCallback((category) => {
    if (!category) return;
    const cityToUse = selectedCity || pendingCity;
    if (!cityToUse) {
      pushMessage('ia', 'Primero, elige una ciudad para buscar.');
      listCities();
      return;
    }
    // clear pendingCity after consuming
    setPendingCity(null);
    showEvents(cityToUse, category);
  }, [selectedCity, pendingCity, pushMessage, listCities, showEvents]);

  const restart = useCallback(() => {
    setState('idle');
    setSelectedCity(null);
    setSelectedCategory(null);
    setMessages([{ id: genId('msg'), sender: 'ia', text: '¡Hola de nuevo! Dime en qué ciudad buscas y preparo algunas opciones para ti.', time: new Date().toISOString() }]);
  }, []);

  const toggleOpen = useCallback(() => setOpen((o) => !o), []);

  return {
    open,
    state,
    selectedCity,
    selectedCategory,
    messages,
    isTyping,
    // API methods requested
    sendText: sendText,
    selectOption: selectOption,
    resetConversation: restart,
    toggleOpen,
    // legacy actions object for UI compatibility
    actions: {
      pushMessage,
      handleText,
      listCities,
      listCategories,
      selectCity,
      selectCategory,
      showEvents,
      restart,
      toggleOpen,
      // expose newer API on actions for backward compatibility
      selectOption,
      sendText,
      resetConversation: restart,
    },
  };
}

export default useChatBot;
