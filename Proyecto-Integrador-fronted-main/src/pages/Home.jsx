import React from "react";
import "../styles/Home.css";

const Home = () => {
  return (
    <main className="home">
      <section className="hero">
        <h1>Descubre los mejores eventos</h1>
        <p>Explora, reserva y vive experiencias inolvidables.</p>
        <button className="btn">Explorar Eventos</button>
      </section>

      <section className="eventos">
        <h2>Próximos Eventos</h2>
        <div className="cards">
          <div className="card">
            <h3>Concierto en Vivo</h3>
            <p>15 Septiembre - Bogotá</p>
            <button className="btn small">Detalles</button>
          </div>
          <div className="card">
            <h3>Feria Gastronómica</h3>
            <p>20 Octubre - Medellín</p>
            <button className="btn small">Detalles</button>
          </div>
          <div className="card">
            <h3>Festival Cultural</h3>
            <p>5 Noviembre - Cali</p>
            <button className="btn small">Detalles</button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
