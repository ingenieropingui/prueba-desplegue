import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/App.css";

const AUTH_KEY = "eventify_auth";

const Header = () => {
  const navigate = useNavigate();
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY));

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    navigate("/login"); // Te lleva al login al cerrar sesión
  };

  return (
    <header className="header">
      <div className="logo">🎟️ QueHayPaHacer</div>
      <nav className="nav">
        {!auth ? (
          <>
            <Link to="/">Inicio</Link>
            <Link to="/about">Nosotros</Link>
            <Link to="/contact">Contacto</Link>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register" className="register-btn">Registrarse</Link>
          </>
        ) : (
          <>
            <Link to="/principal">Principal</Link>
            <Link to="/about">Nosotros</Link>
            <Link to="/contact">Contacto</Link>
            <Link to="/mi-perfil">Perfil</Link>
            <button onClick={handleLogout} className="logout-btn">Cerrar sesión</button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
