import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/register-prompt.css';

// Modal prompt shown when user must register to access details/explore
// NOTE: This component does not change global selectors. It's mounted in pages that need it.
const RegisterPrompt = ({ open, onClose }) => {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className="rp-backdrop" role="dialog" aria-modal="true" aria-label="Registro requerido">
      <div className="rp-modal">
        <h3>Regístrate para continuar</h3>
        <p>Para ver detalles completos o explorar eventos necesitas crear una cuenta o iniciar sesión.</p>
        <div className="rp-actions">
          <button className="rp-btn rp-primary" onClick={() => navigate('/register')}>Ir a registro</button>
          <button className="rp-btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPrompt;
