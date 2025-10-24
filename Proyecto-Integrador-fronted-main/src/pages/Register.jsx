import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TermsModal from "../components/TermsModal";
import "../styles/register.css";

const USERS_KEY = "eventify_users";

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: 'Muy débil' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Muy débil','Débil','Media','Fuerte','Muy fuerte'];
  return { score, label: labels[score] || 'Muy débil' };
}

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombres: '', apellidos: '', correo: '', password: '', confirm: '', nacimiento: '', ciudad: '', telefono: '', aceptar: false, newsletter: false
  });
  const [errors, setErrors] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [termsOpen, setTermsOpen] = useState(false);

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarPassword = (pass) => pass.length >= 8 && /[A-Z]/.test(pass) && /\d/.test(pass) && /[^A-Za-z0-9]/.test(pass);
  const validarTelefono = (t) => /^[0-9\s()+-]{7,20}$/.test(t);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const validateAll = () => {
    const e = {};
    if (!form.nombres) e.nombres = 'Nombre obligatorio.';
    if (!form.apellidos) e.apellidos = 'Apellidos obligatorios.';
    if (!form.correo) e.correo = 'Correo obligatorio.';
    else if (!validarEmail(form.correo)) e.correo = 'Correo inválido.';
    if (!form.password) e.password = 'Contraseña obligatoria.';
    else if (!validarPassword(form.password)) e.password = 'La contraseña debe tener mínimo 8 caracteres, mayúscula, número y especial.';
    if (form.password !== form.confirm) e.confirm = 'Las contraseñas no coinciden.';
    if (form.telefono && !validarTelefono(form.telefono)) e.telefono = 'Teléfono inválido.';
    if (form.nacimiento) {
      const d = new Date(form.nacimiento);
      if (isNaN(d.getTime())) e.nacimiento = 'Fecha inválida.';
      else {
        const today = new Date();
        if (d > today) e.nacimiento = 'La fecha no puede ser futura.';
        // age check example: must be >=13
        const age = today.getFullYear() - d.getFullYear();
        if (age < 13) e.nacimiento = 'Debes tener al menos 13 años.';
      }
    }
    if (!form.ciudad) e.ciudad = 'Selecciona una ciudad.';
    if (!form.aceptar) e.aceptar = 'Debes aceptar los Términos y Condiciones.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitRegistration = async (data) => {
    // TODO: integrar con backend real (fetch/axios). Por ahora guardamos en localStorage para demo.
    const users = getUsers();
    const existe = users.some(u => u.correo.toLowerCase() === data.correo.toLowerCase());
    if (existe) return { ok: false, field: 'correo', message: 'Este correo ya está registrado.' };
    // NEVER store plain passwords in production. Here it's a demo only.
    users.push({ ...data });
    saveUsers(users);
    return { ok: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    if (!validateAll()) return;
    const data = { ...form };
    delete data.confirm;
    const res = await submitRegistration(data);
    if (!res.ok) {
      setErrors(prev => ({ ...prev, [res.field || '_global']: res.message || 'Error en el servidor.' }));
      return;
    }
    setMensaje('✅ Registro exitoso. Revisa tu correo para confirmar tu cuenta.');
    setTimeout(() => navigate('/login'), 1800);
  };

  return (
    <div className="register-container">
      <h2>Crear Cuenta</h2>
      <form className="register-form" onSubmit={handleSubmit} noValidate aria-live="polite">
        <div className="row two">
          <label>
            <span className="label-text">Nombre(s)</span>
            <input type="text" value={form.nombres} onChange={e=>setForm({...form,nombres:e.target.value})} aria-invalid={!!errors.nombres} />
            {errors.nombres && <div className="field-error">{errors.nombres}</div>}
          </label>
          <label>
            <span className="label-text">Apellidos</span>
            <input type="text" value={form.apellidos} onChange={e=>setForm({...form,apellidos:e.target.value})} aria-invalid={!!errors.apellidos} />
            {errors.apellidos && <div className="field-error">{errors.apellidos}</div>}
          </label>
        </div>

        <label>
          <span className="label-text">Correo electrónico</span>
          <input type="email" value={form.correo} onChange={e=>setForm({...form,correo:e.target.value})} aria-invalid={!!errors.correo} />
          {errors.correo && <div className="field-error">{errors.correo}</div>}
        </label>

        <div className="row two">
          <label>
            <span className="label-text">Contraseña</span>
            <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} aria-invalid={!!errors.password} />
            <div className="pw-meta">{strength.label} • Recomendado: mínimo 8 caracteres, mayúscula, número y carácter especial.</div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </label>
          <label>
            <span className="label-text">Confirmar contraseña</span>
            <input type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} aria-invalid={!!errors.confirm} />
            {errors.confirm && <div className="field-error">{errors.confirm}</div>}
          </label>
        </div>

        <div className="row two">
          <label>
            <span className="label-text">Fecha de nacimiento</span>
            <input type="date" value={form.nacimiento} onChange={e=>setForm({...form,nacimiento:e.target.value})} aria-invalid={!!errors.nacimiento} />
            {errors.nacimiento && <div className="field-error">{errors.nacimiento}</div>}
          </label>
          <label>
            <span className="label-text">Ciudad / Departamento</span>
            <select value={form.ciudad} onChange={e=>setForm({...form,ciudad:e.target.value})} aria-invalid={!!errors.ciudad}>
              <option value="">Selecciona...</option>
              <option value="Bogotá">Bogotá</option>
              <option value="Medellín">Medellín</option>
              <option value="Cali">Cali</option>
              <option value="Bucaramanga">Bucaramanga</option>
            </select>
            {errors.ciudad && <div className="field-error">{errors.ciudad}</div>}
          </label>
        </div>

        <div className="row">
          <label>
            <span className="label-text">Teléfono móvil</span>
            <input type="tel" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} aria-invalid={!!errors.telefono} />
            {errors.telefono && <div className="field-error">{errors.telefono}</div>}
          </label>
        </div>

        <label className="terms-row">
          <input type="checkbox" checked={form.aceptar} onChange={e=>setForm({...form,aceptar: e.target.checked})} aria-invalid={!!errors.aceptar} />
          <span className="terms-text">He leído y acepto los <button type="button" className="link-like" onClick={()=>setTermsOpen(true)}>Términos y Condiciones</button> y la <a href="/privacy" target="_blank" rel="noreferrer">Política de Privacidad</a>.</span>
        </label>
        {errors.aceptar && <div className="field-error">{errors.aceptar}</div>}

        <label className="newsletter-row">
          <input type="checkbox" checked={form.newsletter} onChange={e=>setForm({...form,newsletter: e.target.checked})} />
          <span className="terms-text">Deseo recibir novedades y promociones (opcional).</span>
        </label>

        <div className="actions">
          <button className="btn btn-secondary" type="button" onClick={()=>{ setForm({nombres:'',apellidos:'',correo:'',password:'',confirm:'',nacimiento:'',ciudad:'',telefono:'',rol:'Visitante',aceptar:false,newsletter:false}); setErrors({}); setMensaje(''); }}>Limpiar</button>
          <button className="btn btn-primary" type="submit" disabled={!(form.aceptar && form.nombres && form.apellidos && form.correo && form.password && form.confirm)} aria-disabled={!(form.aceptar && form.nombres && form.apellidos && form.correo && form.password && form.confirm)}>Registrarse</button>
        </div>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <TermsModal open={termsOpen} onClose={()=>setTermsOpen(false)} onAccept={() => setForm(f=>({ ...f, aceptar: true }))} />
    </div>
  );
};

export default Register;
