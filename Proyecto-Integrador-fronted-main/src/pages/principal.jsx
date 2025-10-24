import React, { useState, useEffect } from "react";
import "../styles/principal.css";
import ChatBotUI from '../components/ChatBotUI';
import { 
  getAllEvents, 
  getCities, 
  getCategories, 
  filterEvents, 
  getFeaturedEvents,
  formatDate,
  openEventURL 
} from '../utils/eventsUtils';

const Principal = () => {
  const [messages, setMessages] = useState([
    { sender: "ia", text: "¡Hola! Soy tu asistente de eventos. ¿En qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");
  const [chatOpen, setChatOpen] = useState(true);

  // Estado para el evento activo
  const [eventoActivo, setEventoActivo] = useState(null);
  
  // Estados para filtros y eventos
  const [filters, setFilters] = useState({
    ciudad: '',
    categoria: '',
    fecha: '',
    searchTerm: ''
  });
  const [eventosDestacados, setEventosDestacados] = useState([]);
  const [masEventos, setMasEventos] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [favoritos, setFavoritos] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    setAllCities(getCities());
    setAllCategories(getCategories());
    setEventosDestacados(getFeaturedEvents(3));
    // Cargar más eventos (excluyendo los destacados)
    const featured = getFeaturedEvents(3);
    const featuredIds = featured.map(e => `${e.nombre}-${e.fecha}`);
    const all = getAllEvents();
    const more = all.filter(e => !featuredIds.includes(`${e.nombre}-${e.fecha}`)).slice(0, 6);
    setMasEventos(more);
    
    // Cargar favoritos desde localStorage
    const savedFavoritos = localStorage.getItem('eventosFavoritos');
    if (savedFavoritos) {
      setFavoritos(JSON.parse(savedFavoritos));
    }
  }, []);

  // Manejar cambios en los filtros
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Aplicar filtros cuando se hace clic en buscar
  const handleSearch = () => {
    const filtered = filterEvents(filters);
    setMasEventos(filtered);
    setHasSearched(true);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      ciudad: '',
      categoria: '',
      fecha: '',
      searchTerm: ''
    });
    setHasSearched(false);
    // Recargar eventos iniciales
    const featured = getFeaturedEvents(3);
    const featuredIds = featured.map(e => `${e.nombre}-${e.fecha}`);
    const all = getAllEvents();
    const more = all.filter(e => !featuredIds.includes(`${e.nombre}-${e.fecha}`)).slice(0, 6);
    setMasEventos(more);
  };

  // Abrir evento en nueva pestaña
  const handleEventClick = (evento) => {
    if (evento.url) {
      openEventURL(evento.url);
    } else {
      // Si no tiene URL, mostrar detalles
      setEventoActivo(evento);
    }
  };

  // Funciones para manejar favoritos
  const toggleFavorito = (evento, e) => {
    e.stopPropagation(); // Evitar que se abra el evento al hacer clic en el corazón
    
    const eventoId = `${evento.nombre}-${evento.fecha}`;
    const isFavorito = favoritos.some(fav => `${fav.nombre}-${fav.fecha}` === eventoId);
    
    let newFavoritos;
    if (isFavorito) {
      // Remover de favoritos
      newFavoritos = favoritos.filter(fav => `${fav.nombre}-${fav.fecha}` !== eventoId);
    } else {
      // Agregar a favoritos
      newFavoritos = [...favoritos, evento];
    }
    
    setFavoritos(newFavoritos);
    localStorage.setItem('eventosFavoritos', JSON.stringify(newFavoritos));
  };

  const isFavorito = (evento) => {
    const eventoId = `${evento.nombre}-${evento.fecha}`;
    return favoritos.some(fav => `${fav.nombre}-${fav.fecha}` === eventoId);
  };

  return (
    <main className="principal-container">
      {/* Barra de búsqueda */}
      <div className="search-bar">
        <select 
          value={filters.ciudad}
          onChange={(e) => handleFilterChange('ciudad', e.target.value)}
        >
          <option value="">Todas las ciudades</option>
          {allCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <select
          value={filters.categoria}
          onChange={(e) => handleFilterChange('categoria', e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input 
          type="date" 
          value={filters.fecha}
          onChange={(e) => handleFilterChange('fecha', e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Buscar por artista, evento..." 
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
        />
        <button className="btn-search" onClick={handleSearch}>Buscar</button>
      </div>

      {/* Eventos destacados - Solo se muestra cuando NO se ha realizado búsqueda */}
      {!hasSearched && (
        <section className="destacados">
          <h2>Eventos Destacados</h2>
          <div className="event-grid">
            {eventosDestacados.map((evento, index) => (
              <div
                key={`${evento.nombre}-${index}`}
                className="event-card"
                onClick={() => handleEventClick(evento)}
                style={{ cursor: 'pointer' }}
              >
                <button 
                  className={`favorite-btn ${isFavorito(evento) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorito(evento, e)}
                  title={isFavorito(evento) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorito(evento) ? '♥' : '♡'}
                </button>
                <h3>{evento.nombre}</h3>
                <p className="event-category">{evento.categoria}</p>
                <p className="event-city">{evento.ciudad}</p>
                <p className="event-date">{formatDate(evento.fecha)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

     {/* Mini pestaña flotante de detalles */}
{eventoActivo && (
  <div className={`event-details ${eventoActivo ? "open" : "closed"}`}>
    <button className="close-details" onClick={() => setEventoActivo(null)}>×</button>
    <div className="event-details-header">
      <h3>{eventoActivo.nombre}</h3>
      <p className="event-category">{eventoActivo.categoria}</p>
    </div>
    <div className="event-details-body">
      <p><strong>Ciudad:</strong> {eventoActivo.ciudad}</p>
      <p><strong>Lugar:</strong> {eventoActivo.lugar || 'Por confirmar'}</p>
      <p><strong>Fecha:</strong> {formatDate(eventoActivo.fecha)}</p>
      <p><strong>Hora:</strong> {eventoActivo.hora || 'Por confirmar'}</p>
      <p><strong>Descripción:</strong> {eventoActivo.descripcion || 'No disponible'}</p>
      <hr />
      <p><strong>Ingreso:</strong> {eventoActivo.ingreso || 'Consultar'}</p>
    </div>
    <div className="event-details-footer">
      {eventoActivo.url && (
        <button 
          className="btn-buy" 
          onClick={() => openEventURL(eventoActivo.url)}
        >
          Ir al Evento
        </button>
      )}
    </div>
  </div>
)}


      {/* Más eventos */}
      <section className="mas-eventos">
        <div className="section-header">
          <h2>
            {hasSearched ? 'Resultados de Búsqueda' : 'Más Eventos'}
          </h2>
          {hasSearched && (
            <button 
              onClick={clearFilters}
              className="clear-filters-btn"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
        {masEventos.length === 0 && hasSearched ? (
          <div className="empty-state">
            <h3>No se encontraron eventos</h3>
            <p>No hay eventos que coincidan con los criterios seleccionados.</p>
            <p className="empty-state-hint">Intenta ajustar los filtros o buscar en otra ciudad/categoría</p>
          </div>
        ) : (
          <div className="event-grid">
            {masEventos.slice(0, 12).map((evento, index) => (
              <div 
                key={`${evento.nombre}-${index}`}
                className="event-card"
                onClick={() => handleEventClick(evento)}
                style={{ cursor: 'pointer' }}
              >
                <button 
                  className={`favorite-btn ${isFavorito(evento) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorito(evento, e)}
                  title={isFavorito(evento) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorito(evento) ? '♥' : '♡'}
                </button>
                <h3>{evento.nombre}</h3>
                <p className="event-category">{evento.categoria}</p>
                <p className="event-city">{evento.ciudad}</p>
                <p className="event-date">{formatDate(evento.fecha)}</p>
              </div>
            ))}
          </div>
        )}
        {masEventos.length > 12 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
              Mostrando 12 de {masEventos.length} eventos encontrados
            </p>
          </div>
        )}
      </section>

      {/* Chat IA flotante */}
      <ChatBotUI />
    </main>
  );
};

export default Principal;
