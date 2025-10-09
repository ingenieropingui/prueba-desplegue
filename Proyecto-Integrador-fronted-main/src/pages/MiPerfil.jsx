import React, { useState } from "react";
import "../styles/MiPerfil.css";

const MiPerfil = () => {
  const [perfil, setPerfil] = useState({
    nombre: "Juan Pérez",
    email: "juanperez@example.com",
    telefono: "3001234567",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfil({ ...perfil, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Perfil actualizado con éxito 🎉");
  };

  return (
    <div className="perfil-container">
      <h1>Mi Perfil</h1>
      <form className="perfil-form" onSubmit={handleSubmit}>
        <label>
          Nombre:
          <input
            type="text"
            name="nombre"
            value={perfil.nombre}
            onChange={handleChange}
          />
        </label>
        <label>
          Correo:
          <input
            type="email"
            name="email"
            value={perfil.email}
            onChange={handleChange}
          />
        </label>
        <label>
          Teléfono:
          <input
            type="tel"
            name="telefono"
            value={perfil.telefono}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Guardar Cambios</button>
      </form>
    </div>
  );
};

export default MiPerfil;
