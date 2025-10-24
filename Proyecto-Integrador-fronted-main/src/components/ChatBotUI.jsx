import React, { useState, useRef, useEffect } from 'react';
import useChatBot from './ChatBotLogic';
import '../styles/principal.css'; // existing styles control .chat-float, .chat-box, etc.
import '../styles/chatbot.override.css';

// IMPORTANT: This component must NOT change existing classes or IDs used by CSS.
// It renders inside the existing chat container markup and only adds data- attributes
// where necessary for wiring. Do not move or rename '.chat-float', '.toggle-chat', '.chat-box', '.chat-input'.

const ChatBotUI = () => {
  const { open, state, selectedCity, selectedCategory, messages, actions } = useChatBot();
  const [input, setInput] = useState('');
  const boxRef = useRef(null);

  useEffect(() => {
    // scroll to bottom when messages change
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  const onSend = () => {
    if (!input.trim()) return;
    actions.handleText(input.trim());
    setInput('');
  };

  return (
    <div className={`chat-float ${open ? 'open' : 'closed'}`} id="chat-flotante" data-component="chatbot-root">
      <button className="toggle-chat chat-button" onClick={actions.toggleOpen} aria-expanded={open} aria-controls="chat-ventana" aria-hidden={open}>
        {open ? '❌' : '💬'}
      </button>
      {open && (
        <div className="chat-ventana" id="chat-ventana">
          <h3 className="chat-title">Asistente IA</h3>
          <div className="chat-box chat-mensajes" ref={boxRef} aria-live="polite">
            {messages.map((msg) => {
              // typing indicator
              if (msg.type === 'typing') {
                return (
                  <div key={msg.id} className="chat-message ia typing">
                    <div className="typing-dots" aria-hidden>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                );
              }

              // event card inside thread
              if (msg.type === 'event' && msg.payload) {
                const ev = msg.payload;
                const openEventUrl = (e) => {
                  // allow clicks on links to behave normally
                  const tag = e.target && e.target.tagName && e.target.tagName.toLowerCase();
                  if (tag === 'a' || tag === 'button') return;
                  if (ev.url) window.open(ev.url, '_blank', 'noopener');
                };

                const onKey = (e) => {
                  if (!ev.url) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.open(ev.url, '_blank', 'noopener');
                  }
                };

                return (
                  <div
                    key={msg.id}
                    className="chat-message ia event-card"
                    data-event-id={ev.id}
                    role={ev.url ? 'link' : 'group'}
                    tabIndex={0}
                    onClick={openEventUrl}
                    onKeyDown={onKey}
                    aria-label={ev.url ? `Abrir evento ${ev.nombre}` : `Evento ${ev.nombre}`}
                  >
                    <div className="event-card-content">
                      <h4 className="event-name">{ev.nombre}</h4>
                      <p className="event-meta">{ev.fecha} {ev.hora ? `· ${ev.hora}` : ''}</p>
                      {ev.lugar ? <p className="event-location">{ev.lugar}</p> : null}
                      {ev.descripcion ? <p className="event-desc">{ev.descripcion}</p> : null}
                      {ev.url ? (
                        <p className="event-link"><a href={ev.url} target="_blank" rel="noopener noreferrer">Ver detalle / Comprar entradas</a></p>
                      ) : null}
                    </div>
                  </div>
                );
              }

              // options message (legacy) — render as simple text guidance (conversational)
              if (msg.type === 'options' && msg.payload) {
                return (
                  <div key={msg.id} className="chat-message ia options">
                    <div className="options-text">{msg.text}</div>
                  </div>
                );
              }

              // default text message
              return (
                <div key={msg.id} className={`chat-message ${msg.sender}`}>
                  {msg.text}
                </div>
              );
            })}
          </div>

          <div className="chat-actions">
              <div className="chat-input" role="form">
              <input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSend()}
                aria-label="Mensaje"
                className="chat-input-field"
              />
              <button id="chat-send" type="button" onClick={onSend} className="chat-send">Enviar</button>
            </div>

            <div className="chat-footer">
              <button className="restart-btn" onClick={() => actions.restart()} data-action="volver-inicio">Volver al inicio</button>
              <div className="current-state">{selectedCity ? `Ciudad: ${selectedCity}` : ''} {selectedCategory ? ` · ${selectedCategory}` : ''}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBotUI;
