import React, { useState, useEffect } from "react";
import "../styles/MiPerfil.css";

const AUTH_KEY = "eventify_auth";
const USERS_KEY = "eventify_users";

const MiPerfil = () => {
  const [perfil, setPerfil] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: "",
    nacimiento: "",
    ciudad: "",
  });
  
  const [mensaje, setMensaje] = useState("");
  const [errors, setErrors] = useState({});

  // Cargar datos del usuario actual
  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (auth && auth.email) {
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      const currentUser = users.find(u => u.correo === auth.email);
      
      if (currentUser) {
        setPerfil({
          nombres: currentUser.nombres || "",
          apellidos: currentUser.apellidos || "",
          correo: currentUser.correo || "",
          telefono: currentUser.telefono || "",
          nacimiento: currentUser.nacimiento || "",
          ciudad: currentUser.ciudad || "",
        });
      }
    }
  }, []);

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarTelefono = (t) => !t || /^[0-9\s()+-]{7,20}$/.test(t);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfil({ ...perfil, [name]: value });
    // Limpiar error del campo al editar
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateAll = () => {
    const e = {};
    if (!perfil.nombres) e.nombres = "Nombre obligatorio.";
    if (!perfil.apellidos) e.apellidos = "Apellidos obligatorios.";
    if (!perfil.correo) e.correo = "Correo obligatorio.";
    else if (!validarEmail(perfil.correo)) e.correo = "Correo inválido.";
    if (perfil.telefono && !validarTelefono(perfil.telefono)) e.telefono = "Teléfono inválido.";
    if (perfil.nacimiento) {
      const d = new Date(perfil.nacimiento);
      if (isNaN(d.getTime())) e.nacimiento = "Fecha inválida.";
      else {
        const today = new Date();
        if (d > today) e.nacimiento = "La fecha no puede ser futura.";
        const age = today.getFullYear() - d.getFullYear();
        if (age < 13) e.nacimiento = "Debes tener al menos 13 años.";
      }
    }
    if (!perfil.ciudad) e.ciudad = "Selecciona una ciudad.";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMensaje("");
    
    if (!validateAll()) {
      setMensaje("Por favor corrige los errores del formulario.");
      return;
    }

    // Actualizar datos en localStorage
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const userIndex = users.findIndex(u => u.correo === auth.email);

    if (userIndex !== -1) {
      // Actualizar datos del usuario manteniendo la contraseña
      users[userIndex] = {
        ...users[userIndex],
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        correo: perfil.correo,
        telefono: perfil.telefono,
        nacimiento: perfil.nacimiento,
        ciudad: perfil.ciudad,
      };
      
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Actualizar también el correo en auth si cambió
      if (auth.email !== perfil.correo) {
        auth.email = perfil.correo;
        localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
      }
      
      setMensaje("Perfil actualizado con éxito");
      setTimeout(() => setMensaje(""), 3000);
    } else {
      setMensaje("Error al actualizar el perfil.");
    }
  };

  return (
    <div className="perfil-container">
      <h1>Mi Perfil</h1>
      <p className="perfil-subtitle">Actualiza tu información personal</p>
      
      <form className="perfil-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label>
            <span className="label-text">Nombre(s) *</span>
            <input
              type="text"
              name="nombres"
              value={perfil.nombres}
              onChange={handleChange}
              aria-invalid={!!errors.nombres}
            />
            {errors.nombres && <div className="field-error">{errors.nombres}</div>}
          </label>

          <label>
            <span className="label-text">Apellidos *</span>
            <input
              type="text"
              name="apellidos"
              value={perfil.apellidos}
              onChange={handleChange}
              aria-invalid={!!errors.apellidos}
            />
            {errors.apellidos && <div className="field-error">{errors.apellidos}</div>}
          </label>
        </div>

        <label>
          <span className="label-text">Correo electrónico *</span>
          <input
            type="email"
            name="correo"
            value={perfil.correo}
            onChange={handleChange}
            aria-invalid={!!errors.correo}
          />
          {errors.correo && <div className="field-error">{errors.correo}</div>}
        </label>

        <div className="form-row">
          <label>
            <span className="label-text">Fecha de nacimiento</span>
            <input
              type="date"
              name="nacimiento"
              value={perfil.nacimiento}
              onChange={handleChange}
              aria-invalid={!!errors.nacimiento}
            />
            {errors.nacimiento && <div className="field-error">{errors.nacimiento}</div>}
          </label>

          <label>
            <span className="label-text">Ciudad / Departamento *</span>
            <select
              name="ciudad"
              value={perfil.ciudad}
              onChange={handleChange}
              aria-invalid={!!errors.ciudad}
            >
              <option value="">Selecciona...</option>
              <option value="Bogotá">Bogotá</option>
              <option value="Medellín">Medellín</option>
              <option value="Cali">Cali</option>
              <option value="Bucaramanga">Bucaramanga</option>
            </select>
            {errors.ciudad && <div className="field-error">{errors.ciudad}</div>}
          </label>
        </div>

        <label>
          <span className="label-text">Teléfono móvil</span>
          <input
            type="tel"
            name="telefono"
            value={perfil.telefono}
            onChange={handleChange}
            placeholder="Ej: 300 123 4567"
            aria-invalid={!!errors.telefono}
          />
          {errors.telefono && <div className="field-error">{errors.telefono}</div>}
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-save">Guardar Cambios</button>
        </div>
      </form>

      {mensaje && (
        <div className={`mensaje ${mensaje.includes("éxito") ? "success" : "error"}`}>
          {mensaje}
        </div>
      )}
    </div>
  );
};

export default MiPerfil;
