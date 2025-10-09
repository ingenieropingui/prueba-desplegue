import React, { useState } from "react";
import "../styles/about.css";

const About = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "¿Cómo puedo comprar entradas?",
      answer:
        "Puedes comprar tus entradas fácilmente desde la plataforma de QueHayPaHacer con diferentes métodos de pago.",
    },
    {
      question: "¿Qué hago si tengo un problema con mi compra?",
      answer:
        "Nuestro equipo de soporte está disponible para ayudarte en la sección de Asistencia.",
    },
    {
      question: "¿Puedo devolver o cambiar mis entradas?",
      answer:
        "Las políticas de devolución dependen de cada evento, revisa los Términos de Uso para más detalles.",
    },
  ];

  return (
    <div className="about">
      {/* HERO */}
      <section className="about-hero">
        <h1>Sobre Nosotros</h1>
        <p>
          Conectamos a las personas con experiencias únicas en música, teatro,
          deportes y mucho más.
        </p>
      </section>

    {/* PROPÓSITO */}
<section className="about-purpose">
  <div className="text">
    <h2>Nuestro Propósito</h2>
    <p>
      Hacemos que vivir experiencias inolvidables sea más fácil y
      accesible para todos. Cada evento es una oportunidad para compartir,
      disfrutar y crear recuerdos.
    </p>
  </div>
  <div className="image"></div> {/* La imagen se pone con CSS */}
</section>

      {/* FAQ */}
      <section className="faq-section">
        <h2 className="faq-title">Preguntas Frecuentes</h2>
        <div className="faq-items">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                {faq.question}
              </button>
              {openIndex === index && (
                <p className="faq-answer">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <h4>QueHayPaHacer</h4>
          <p>Tu plataforma de eventos en Colombia.</p>
        </div>
        <div>
          <h4>Categorías</h4>
          <p>Conciertos</p>
          <p>Teatro</p>
          <p>Deportes</p>
        </div>
        <div>
          <h4>Contacto</h4>
          <p>NIT. 900.569.193-0</p>
          <p>Bucaramanga</p>
        </div>
        <div>
          <h4>Síguenos</h4>
          <div className="social-icons">
            {/* redes sociales aquí */}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
