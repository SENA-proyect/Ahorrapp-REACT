import { useState, useEffect } from 'react'
import { getHistorial } from '../services/api'
import InfoActividad from '../components/modals/InfoActividad'

export default function PanelHistorial() {
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarInfo, setMostrarInfo] = useState(false)

  useEffect(() => {
    getHistorial()
      .then((data) => setHistorial(data ?? []))
      .catch((err) => {
        console.error('Error cargando historial:', err)
        setError('No se pudo cargar el historial')
      })
      .finally(() => setCargando(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #0d1a0d)' }} >

      <div className="inf-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2>Historial de Acciones</h2>
          <button
            type="button"
            onClick={() => setMostrarInfo(true)}
            aria-label="Acerca de este módulo"
            style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', cursor: 'pointer', background: 'transparent' }}
          >
            ℹ
          </button>
        </div>

        {mostrarInfo && <InfoActividad onClose={() => setMostrarInfo(false)} />}

        {cargando ? (
          <p>Cargando historial...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <div className="inf-listas">
            {historial.length === 0 ? (
              <p>No hay historial registrado.</p>
            ) : (
              historial.map((log) => (
                <div className="general-card log-card" key={log.id_historial}>
                  <p><strong>Fecha:</strong> {log.fecha ? new Date(log.fecha).toLocaleString('es-ES') : 'N/A'}</p>
                  <p><strong>Usuario:</strong> {log.usuario_nombre} {log.usuario_apellido || ''} <span style={{ opacity: 0.6 }}>(ID {log.ID_usuario})</span></p>
                  <p><strong>Acción:</strong> <span className="txt-accion">{log.accion}</span></p>
                  <p><strong>Detalles:</strong> <em>{log.detalles || 'Sin detalles'}</em></p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  )
}