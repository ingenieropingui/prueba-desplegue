import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

const USERS_KEY = "eventify_users";

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const Register = () => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarPassword = (pass) =>
    pass.length >= 8 && /[A-Z]/.test(pass) && /\d/.test(pass);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre || !correo || !password) {
      setMensaje("⚠️ Todos los campos son obligatorios.");
      return;
    }
    if (!validarEmail(correo)) {
      setMensaje("⚠️ El correo no tiene un formato válido.");
      return;
    }
    if (!validarPassword(password)) {
      setMensaje("⚠️ La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");
      return;
    }

    const users = getUsers();
    const existe = users.some(u => u.correo.toLowerCase() === correo.toLowerCase());
    if (existe) {
      setMensaje("⚠️ Este correo ya está registrado.");
      return;
    }

    users.push({ nombre, correo, password }); // ⚠️ Solo para demo
    saveUsers(users);

    setMensaje("✅ Registro exitoso. Redirigiendo a inicio de sesión...");
    setTimeout(() => navigate("/login"), 1200);
  };

  return (
    <div className="register-container">
      <h2>Crear Cuenta</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
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
        <button type="submit" className="btn">Registrarse</button>
      </form>
      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
};

export default Register;
