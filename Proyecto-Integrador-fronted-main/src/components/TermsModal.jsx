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
        <div style={{ marginTop:12 }}>
          <p>
            Aquí iría el texto completo de los Términos y Condiciones y la Política de Privacidad.
            Para esta implementación de ejemplo, puedes pegar el contenido real o enlazar a una
            página externa si ya existe.
          </p>
          <p>
            Al pulsar "Aceptar y cerrar" indicarás que has leído y aceptado los términos.
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
