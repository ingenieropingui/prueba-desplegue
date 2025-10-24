// Utilidades para manejar eventos de los scrapers
import scrapersData from '../data/scrapers.json';

/**
 * Obtiene todos los eventos de todos los scrapers en un array plano
 * @returns {Array} Array de eventos con ciudad y categoría incluidas
 */
export const getAllEvents = () => {
  const allEvents = [];
  
  scrapersData.forEach(scraper => {
    const { ciudad, categoria, eventos } = scraper;
    eventos.forEach(evento => {
      allEvents.push({
        ...evento,
        ciudad,
        categoria
      });
    });
  });
  
  return allEvents;
};

/**
 * Obtiene todas las ciudades únicas disponibles
 * @returns {Array} Array de strings con nombres de ciudades
 */
export const getCities = () => {
  const cities = [...new Set(scrapersData.map(s => s.ciudad))];
  return cities.sort();
};

/**
 * Obtiene todas las categorías únicas disponibles
 * @returns {Array} Array de strings con nombres de categorías
 */
export const getCategories = () => {
  const categories = [...new Set(scrapersData.map(s => s.categoria))];
  return categories.sort();
};

/**
 * Filtra eventos por ciudad, categoría y fecha
 * @param {Object} filters - Objeto con filtros
 * @param {string} filters.ciudad - Ciudad a filtrar (opcional)
 * @param {string} filters.categoria - Categoría a filtrar (opcional)
 * @param {string} filters.fecha - Fecha a filtrar en formato YYYY-MM-DD (opcional)
 * @param {string} filters.searchTerm - Término de búsqueda libre (opcional)
 * @returns {Array} Array de eventos filtrados
 */
export const filterEvents = (filters = {}) => {
  const { ciudad, categoria, fecha, searchTerm } = filters;
  let events = getAllEvents();
  
  // Filtrar por ciudad
  if (ciudad && ciudad !== 'todas' && ciudad !== '') {
    events = events.filter(e => 
      e.ciudad.toLowerCase() === ciudad.toLowerCase()
    );
  }
  
  // Filtrar por categoría
  if (categoria && categoria !== 'todas' && categoria !== '') {
    events = events.filter(e => 
      e.categoria.toLowerCase() === categoria.toLowerCase()
    );
  }
  
  // Filtrar por fecha
  if (fecha && fecha !== '') {
    events = events.filter(e => {
      if (!e.fecha) return false;
      // Normalizar fechas al formato YYYY-MM-DD
      const eventDate = e.fecha.split('T')[0]; // Por si viene con hora
      return eventDate === fecha;
    });
  }
  
  // Filtrar por término de búsqueda
  if (searchTerm && searchTerm.trim() !== '') {
    const term = searchTerm.toLowerCase();
    events = events.filter(e => {
      const searchableText = `
        ${e.nombre || ''} 
        ${e.descripcion || ''} 
        ${e.lugar || ''} 
        ${e.ciudad || ''} 
        ${e.categoria || ''}
      `.toLowerCase();
      return searchableText.includes(term);
    });
  }
  
  return events;
};

/**
 * Obtiene eventos destacados (primeros N eventos de cada ciudad)
 * @param {number} count - Cantidad de eventos por ciudad
 * @returns {Array} Array de eventos destacados
 */
export const getFeaturedEvents = (count = 3) => {
  const featured = [];
  const cities = getCities();
  
  cities.forEach(ciudad => {
    const cityEvents = filterEvents({ ciudad });
    // Tomar los primeros 'count' eventos de esta ciudad
    featured.push(...cityEvents.slice(0, count));
  });
  
  return featured;
};

/**
 * Formatea una fecha al formato legible
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Fecha por definir';
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    };
    return date.toLocaleDateString('es-ES', options);
  } catch (error) {
    return dateString;
  }
};

/**
 * Abre la URL de un evento en una nueva pestaña
 * @param {string} url - URL del evento
 */
export const openEventURL = (url) => {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Obtiene eventos por ciudad específica
 * @param {string} ciudad - Nombre de la ciudad
 * @returns {Array} Array de eventos de esa ciudad
 */
export const getEventsByCity = (ciudad) => {
  return filterEvents({ ciudad });
};

/**
 * Obtiene eventos por categoría específica
 * @param {string} categoria - Nombre de la categoría
 * @returns {Array} Array de eventos de esa categoría
 */
export const getEventsByCategory = (categoria) => {
  return filterEvents({ categoria });
};
