import React, { useState } from "react";
import "../styles/Home.css";
import RegisterPrompt from '../components/RegisterPrompt';

// We intercept "Explorar Eventos" and "Detalles" clicks on the landing page
// to prompt registration. This is a non-destructive change: buttons keep
// their classes and structure, but we add a modal prompt when clicked.
const Home = () => {
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  const requireRegister = (e) => {
    e && e.preventDefault();
    setShowRegisterPrompt(true);
  };

  return (
    <main className="home">
      <section className="hero">
        <h1>Descubre los mejores eventos</h1>
        <p>Explora, reserva y vive experiencias inolvidables.</p>
        <button className="btn" onClick={requireRegister}>Explorar Eventos</button>
      </section>

      <section className="eventos">
        <h2>Próximos Eventos</h2>
        <div className="cards">
          <div className="card">
            <h3>Concierto en Vivo</h3>
            <p>15 Septiembre - Bogotá</p>
            <button className="btn small" onClick={requireRegister}>Detalles</button>
          </div>
          <div className="card">
            <h3>Feria Gastronómica</h3>
            <p>20 Octubre - Medellín</p>
            <button className="btn small" onClick={requireRegister}>Detalles</button>
          </div>
          <div className="card">
            <h3>Festival Cultural</h3>
            <p>5 Noviembre - Cali</p>
            <button className="btn small" onClick={requireRegister}>Detalles</button>
          </div>
        </div>
      </section>

      <RegisterPrompt open={showRegisterPrompt} onClose={() => setShowRegisterPrompt(false)} />
    </main>
  );
};

export default Home;
