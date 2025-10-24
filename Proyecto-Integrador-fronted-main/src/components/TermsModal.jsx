import React, { useEffect, useRef } from 'react';

export default function TermsModal({ open, onClose, onAccept }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose && onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
      // focus for accessibility
      setTimeout(() => dialogRef.current && dialogRef.current.focus(), 0);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="terms-modal-backdrop" role="presentation" onMouseDown={onClose} style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', zIndex:1300 }}>
      <div
        className="terms-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Términos y condiciones"
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ background:'#fff', padding:16, borderRadius:8, width:'90%', maxWidth:720, maxHeight:'80vh', overflowY:'auto' }}
      >
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0 }}>Términos y Condiciones</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ background:'transparent', border:'none', fontSize:20, cursor:'pointer' }}>×</button>
        </header>
        <div style={{ marginTop:12, lineHeight: '1.6', color: '#374151' }}>
          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>1. Aceptación de los Términos</h4>
          <p>
            Al acceder y utilizar Eventify, usted acepta estar legalmente vinculado por estos términos y condiciones. 
            Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.
          </p>

          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>2. Descripción del Servicio</h4>
          <p>
            Eventify es una plataforma digital que facilita la búsqueda, visualización y gestión de eventos culturales y de entretenimiento. 
            Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento sin previo aviso.
          </p>

          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>3. Registro de Usuario</h4>
          <p>
            Para acceder a ciertas funcionalidades, es necesario crear una cuenta. Usted se compromete a proporcionar información 
            veraz, actual y completa durante el registro. Es su responsabilidad mantener la confidencialidad de su contraseña.
          </p>

          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>4. Uso Apropiado</h4>
          <p>
            Usted acepta utilizar Eventify únicamente con fines lícitos y de manera que no infrinja los derechos de terceros 
            ni restrinja o inhiba el uso del servicio por parte de otros usuarios. Está prohibido:
          </p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Publicar contenido ofensivo, difamatorio o ilegal</li>
            <li>Intentar acceder a cuentas de otros usuarios</li>
            <li>Interferir con el funcionamiento del servicio</li>
            <li>Utilizar bots o sistemas automatizados sin autorización</li>
          </ul>

          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>5. Propiedad Intelectual</h4>
          <p>
            Todo el contenido de Eventify, incluyendo textos, gráficos, logos, imágenes y software, es propiedad de Eventify 
            o sus licenciantes y está protegido por leyes de propiedad intelectual.
          </p>

          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>6. Privacidad y Protección de Datos</h4>
          <p>
            Su privacidad es importante para nosotros. Recopilamos y procesamos sus datos personales de acuerdo con nuestra 
            Política de Privacidad. Al utilizar Eventify, consiente el tratamiento de sus datos según lo establecido en dicha política.
          </p>

          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>7. Limitación de Responsabilidad</h4>
          <p>
            Eventify no se hace responsable por daños directos, indirectos, incidentales o consecuentes que resulten del uso 
            o la imposibilidad de usar el servicio. La información sobre eventos es proporcionada por terceros y no garantizamos 
            su exactitud o disponibilidad.
          </p>

          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>8. Modificaciones</h4>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones serán efectivas 
            inmediatamente después de su publicación. El uso continuado del servicio después de dichas modificaciones constituye 
            su aceptación de los nuevos términos.
          </p>

          <h4 style={{ color: '#f97316', marginTop: '1rem' }}>9. Contacto</h4>
          <p>
            Si tiene alguna pregunta sobre estos términos, puede contactarnos a través de info@eventify.com o visitando 
            nuestra sección de contacto.
          </p>

          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
            <strong>Última actualización:</strong> Octubre 2025
          </p>
        </div>
        <footer style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onAccept && onAccept();
              onClose && onClose();
            }}
          >Aceptar y cerrar</button>
        </footer>
      </div>
    </div>
  );
}
