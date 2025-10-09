import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const USERS_KEY = "eventify_users";
const AUTH_KEY = "eventify_auth";

const getUsers = () => {
  try { 
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []; 
  } catch { 
    return []; 
  }
};

const Login = () => {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!correo || !password) {
      setMensaje("⚠️ Todos los campos son obligatorios.");
      return;
    }

    const users = getUsers();
    const user = users.find(
      (u) => u.correo.toLowerCase() === correo.toLowerCase()
    );

    if (!user || user.password !== password) {
      setMensaje("❌ Correo o contraseña incorrectos.");
      return;
    }

    // Guardar sesión en localStorage
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ correo: user.correo, nombre: user.nombre })
    );

    setMensaje("✅ Inicio de sesión exitoso.");
    setTimeout(() => navigate("/principal"), 800);
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn">Entrar</button>
      </form>
      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
};

export default Login;
