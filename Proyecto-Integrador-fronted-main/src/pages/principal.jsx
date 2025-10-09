import React, { useState } from "react";
import "../styles/principal.css";

const Principal = () => {
  const [messages, setMessages] = useState([
    { sender: "ia", text: "¡Hola! Soy tu asistente de eventos. ¿En qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");
  const [chatOpen, setChatOpen] = useState(true);

  // Estado para el evento activo
  const [eventoActivo, setEventoActivo] = useState(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", text: input }]);
    setInput("");

    // Simulación de respuesta IA
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "ia", text: "¡Gracias por tu mensaje! Pronto recibirás información sobre tu evento." },
      ]);
    }, 800);
  };

  // Datos de los eventos destacados
  const eventosDestacados = [
    {
      id: 1,
      nombre: "Concierto de Rock",
      categoria: "Música",
      lugar: "Boom Bogotá",
      fecha: "3, 10, 17, 24 de septiembre",
      hora: "9:00 pm",
      apertura: "7:00 pm",
      edad: "18 años",
      precio: "$50.000 + $5.000",
      aforo: 100,
    },
    {
      id: 2,
      nombre: "Obra de Teatro",
      categoria: "Teatro",
      lugar: "Teatro Nacional",
      fecha: "5, 12, 19 de septiembre",
      hora: "7:30 pm",
      apertura: "6:30 pm",
      edad: "15 años",
      precio: "$40.000 + $5.000",
      aforo: 80,
    },
    {
      id: 3,
      nombre: "Partido de Fútbol",
      categoria: "Deporte",
      lugar: "Estadio Metropolitano",
      fecha: "6, 13, 20 de septiembre",
      hora: "6:00 pm",
      apertura: "5:00 pm",
      edad: "Todos",
      precio: "$30.000 + $5.000",
      aforo: 150,
    },
  ];

  return (
    <main className="principal-container">
      {/* Barra de búsqueda */}
      <div className="search-bar">
        <select>
          <option>Ciudad</option>
          <option>Bogotá</option>
          <option>Medellín</option>
          <option>Cali</option>
        </select>
        <select>
          <option>Categoría</option>
          <option>Conciertos</option>
          <option>Teatro</option>
          <option>Deportes</option>
        </select>
        <input type="date" />
        <input type="text" placeholder="Buscar por artista, evento..." />
        <button className="btn-search"></button>
      </div>

      {/* Eventos destacados */}
      <section className="destacados">
        <h2>Eventos Destacados</h2>
        <div className="event-grid">
          {eventosDestacados.map((evento) => (
            <div
              key={evento.id}
              className={`event-card ${evento.nombre.toLowerCase().replace(/\s+/g, "")}`}
              onClick={() => setEventoActivo(evento)}
            >
              <h3>{evento.nombre}</h3>
            </div>
          ))}
        </div>
      </section>

     {/* Mini pestaña flotante de detalles */}
{eventoActivo && (
  <div className={`event-details ${eventoActivo ? "open" : "closed"}`}>
    <button className="close-details" onClick={() => setEventoActivo(null)}>×</button>
    <div className="event-details-header">
      <h3>{eventoActivo.nombre}</h3>
      <p className="event-category">{eventoActivo.categoria}</p>
    </div>
    <div className="event-details-body">
      <p><strong>Lugar:</strong> {eventoActivo.lugar}</p>
      <p><strong>Fecha:</strong> {eventoActivo.fecha}</p>
      <p><strong>Hora:</strong> {eventoActivo.hora}</p>
      <p><strong>Apertura de puertas:</strong> {eventoActivo.apertura}</p>
      <p><strong>Edad mínima:</strong> {eventoActivo.edad}</p>
      <hr />
      <p><strong>Precio + Servicio:</strong> {eventoActivo.precio}</p>
      <p><strong>Aforo:</strong> {eventoActivo.aforo}</p>
    </div>
    <div className="event-details-footer">
      <button className="btn-buy">Comprar Entradas</button>
    </div>
  </div>
)}


      {/* Más eventos */}
      <section className="mas-eventos">
        <h2>Más Eventos</h2>
        <div className="event-grid">
          <div className="event-card jazz">
            <h3>Festival de Jazz</h3>
          </div>
          <div className="event-card arte">
            <h3>Exposición de Arte</h3>
          </div>
          <div className="event-card baile">
            <h3>Competencia de Baile</h3>
          </div>
          <div className="event-card maraton">
            <h3>Maratón 10K</h3>
          </div>
          <div className="event-card pop">
            <h3>Concierto Pop</h3>
          </div>
          <div className="event-card comedy">
            <h3>Stand Up Comedy</h3>
          </div>
        </div>
      </section>

      {/* Chat IA flotante */}
      <div className={`chat-float ${chatOpen ? "open" : "closed"}`}>
        <button className="toggle-chat" onClick={() => setChatOpen(!chatOpen)}>
          {chatOpen ? "❌" : "💬"}
        </button>
        {chatOpen && (
          <>
            <h3>Asistente IA</h3>
            <div className="chat-box">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Enviar</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Principal;
