import React from "react";
import "../styles/Contact.css";

function Contact() {
  return (
    <div className="contact">
      <h1>Contáctanos</h1>
      <p>
        Si tienes dudas, sugerencias o simplemente quieres saludar, ¡escríbenos!
      </p>

      <form className="contact-form">
        <label htmlFor="name">Nombre</label>
        <input type="text" id="name" placeholder="Tu nombre" />

        <label htmlFor="email">Correo</label>
        <input type="email" id="email" placeholder="Tu correo electrónico" />

        <label htmlFor="message">Mensaje</label>
        <textarea id="message" rows="5" placeholder="Escribe tu mensaje..." />

        <button type="submit">Enviar</button>
      </form>

      <div className="contact-info">
        <div className="info-card">
          <h3>📍 Dirección</h3>
          <p>Cra octava #78-54, Bucaramanga, Colombia</p>
        </div>
        <div className="info-card">
          <h3>📧 Correo</h3>
          <p>QueHayPaHacer@gmail.com</p>
        </div>
        <div className="info-card">
          <h3>📞 Teléfono</h3>
          <p>+57 300 123 4567</p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
