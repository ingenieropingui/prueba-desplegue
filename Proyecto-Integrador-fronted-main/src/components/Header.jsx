import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/App.css";
import logo from "../imagenes/Logo.png";

const AUTH_KEY = "eventify_auth";

const Header = () => {
  const navigate = useNavigate();
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="logo">
        <img src={logo} alt="QueHayPaHacer Logo" className="logo-img" />
        QueHayPaHacer
      </div>
      
      {/* Botón hamburguesa */}
      <button 
        className={`hamburger ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay oscuro cuando el menú está abierto */}
      {menuOpen && (
        <div 
          className="menu-overlay" 
          onClick={() => setMenuOpen(false)}
        />
      )}

      <nav className={`nav ${menuOpen ? 'active' : ''}`}>
        <div className="nav-header">
          <span className="nav-title">Menú</span>
        </div>
        {!auth ? (
          <>
            <Link to="/" onClick={closeMenu}>Inicio</Link>
            <Link to="/about" onClick={closeMenu}>Nosotros</Link>
            <Link to="/contact" onClick={closeMenu}>Contacto</Link>
            <Link to="/login" onClick={closeMenu}>Iniciar sesión</Link>
            <Link to="/register" className="register-btn" onClick={closeMenu}>Registrarse</Link>
          </>
        ) : (
          <>
            <Link to="/principal" onClick={closeMenu}>Principal</Link>
            <Link to="/mis-favoritos" onClick={closeMenu}>Mis Favoritos</Link>
            <Link to="/about" onClick={closeMenu}>Nosotros</Link>
            <Link to="/contact" onClick={closeMenu}>Contacto</Link>
            <Link to="/mi-perfil" onClick={closeMenu}>Perfil</Link>
            <button onClick={handleLogout} className="logout-btn">Cerrar sesión</button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
