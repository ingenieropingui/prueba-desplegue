import React, { useState, useEffect } from "react";
import "../styles/principal.css";
import { formatDate, openEventURL } from '../utils/eventsUtils';

const MisFavoritos = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [eventoActivo, setEventoActivo] = useState(null);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    const savedFavoritos = localStorage.getItem('eventosFavoritos');
    if (savedFavoritos) {
      setFavoritos(JSON.parse(savedFavoritos));
    }
  }, []);

  // Función para quitar de favoritos
  const toggleFavorito = (evento, e) => {
    e.stopPropagation();
    
    const eventoId = `${evento.nombre}-${evento.fecha}`;
    const newFavoritos = favoritos.filter(fav => `${fav.nombre}-${fav.fecha}` !== eventoId);
    
    setFavoritos(newFavoritos);
    localStorage.setItem('eventosFavoritos', JSON.stringify(newFavoritos));
  };

  // Abrir evento en nueva pestaña
  const handleEventClick = (evento) => {
    if (evento.url) {
      openEventURL(evento.url);
    } else {
      setEventoActivo(evento);
    }
  };

  return (
    <main className="principal-container">
      <section className="favoritos">
        <h2>Mis Eventos Favoritos</h2>
        
        {favoritos.length === 0 ? (
          <div className="empty-favorites">
            <h3>Aún no tienes eventos favoritos</h3>
            <p>Explora eventos y haz clic en el corazón para agregarlos a tus favoritos.</p>
            <a href="/principal" className="btn-explore">Explorar Eventos</a>
          </div>
        ) : (
          <>
            <div className="favorites-header">
              <p className="favorites-count-text">
                {favoritos.length} {favoritos.length === 1 ? 'evento guardado' : 'eventos guardados'}
              </p>
            </div>
            
            <div className="event-grid">
              {favoritos.map((evento, index) => (
                <div 
                  key={`${evento.nombre}-${index}`}
                  className="event-card"
                  onClick={() => handleEventClick(evento)}
                  style={{ cursor: 'pointer' }}
                >
                  <button 
                    className="favorite-btn active"
                    onClick={(e) => toggleFavorito(evento, e)}
                    title="Quitar de favoritos"
                  >
                    ♥
                  </button>
                  <h3>{evento.nombre}</h3>
                  <p className="event-category">{evento.categoria}</p>
                  <p className="event-city">{evento.ciudad}</p>
                  <p className="event-date">{formatDate(evento.fecha)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Mini pestaña flotante de detalles */}
      {eventoActivo && (
        <div className="event-details open">
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
    </main>
  );
};

export default MisFavoritos;
