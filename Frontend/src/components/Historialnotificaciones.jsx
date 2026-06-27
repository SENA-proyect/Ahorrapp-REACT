
import { useState, useEffect, useCallback } from 'react'
import {
  getNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  archivarNotificacion,
  eliminarNotificacion,
} from '../api'
import { useToast } from './ToastContext'
import { useNotificaciones } from './NotificacionesContext'

const ICONO_POR_TIPO = {
  sistema: '⚙️',
  recordatorio: '⏰',
  sugerencia: '💡',
  alerta_presupuesto: '⚠️',
}

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'no_leidas', label: 'No leídas' },
  { id: 'archivadas', label: 'Archivadas' },
]

const formatearFecha = (isoString) => {
  const fecha = new Date(isoString)
  return fecha.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Historialnotificaciones() {
  const { mostrarToast } = useToast()
  const { refrescarCount } = useNotificaciones()

  const [filtro, setFiltro] = useState('todas')
  const [pagina, setPagina] = useState(1)
  const [notificaciones, setNotificaciones] = useState([])
  const [paginacion, setPaginacion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = { page: String(pagina), limit: '10' }
      if (filtro === 'no_leidas') params.leida = 'false'
      if (filtro === 'archivadas') params.archivada = 'true'

      const { notificaciones: data, paginacion: pag } = await getNotificaciones(params)
      setNotificaciones(data)
      setPaginacion(pag)
    } catch (err) {
      setError('No se pudo cargar el historial de notificaciones.')
    } finally {
      setCargando(false)
    }
  }, [filtro, pagina])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cambiarFiltro = (nuevoFiltro) => {
    setFiltro(nuevoFiltro)
    setPagina(1)
  }

  const handleLeer = async (id) => {
    try {
      await marcarNotificacionLeida(id)
      setNotificaciones(prev => prev.map(n => (n.id === id ? { ...n, leida: true } : n)))
      refrescarCount()
    } catch (err) {
      mostrarToast('No se pudo marcar como leída', 'error')
    }
  }

  const handleLeerTodas = async () => {
    try {
      await marcarTodasNotificacionesLeidas()
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
      refrescarCount()
      mostrarToast('Todas las notificaciones marcadas como leídas')
    } catch (err) {
      mostrarToast('No se pudieron marcar todas como leídas', 'error')
    }
  }

  const handleArchivar = async (id) => {
    try {
      await archivarNotificacion(id)
      setNotificaciones(prev => prev.filter(n => n.id !== id))
      mostrarToast('Notificación archivada')
      refrescarCount()
    } catch (err) {
      mostrarToast('No se pudo archivar la notificación', 'error')
    }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta notificación de forma permanente?')) return
    try {
      await eliminarNotificacion(id)
      setNotificaciones(prev => prev.filter(n => n.id !== id))
      mostrarToast('Notificación eliminada')
      refrescarCount()
    } catch (err) {
      mostrarToast('No se pudo eliminar la notificación', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-[#fbbf24]">📋 Historial de notificaciones</h3>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Aquí encuentras todos los avisos relacionados con tu actividad financiera.
          </p>
        </div>

        <button
          onClick={handleLeerTodas}
          className="px-3.5 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/[0.06] text-[#a1a1aa] hover:bg-white/[0.1] hover:text-white transition-colors duration-150"
        >
          Marcar todas como leídas
        </button>
      </div>

      <div className="flex gap-2">
        {FILTROS.map(f => (
          <button
            key={f.id}
            onClick={() => cambiarFiltro(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors duration-150 ${
              filtro === f.id
                ? 'text-amber-300 bg-amber-400/20 border-amber-400/50'
                : 'text-[#a1a1aa] bg-white/[0.05] border-white/10 hover:bg-white/[0.09]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-zinc-500 text-sm italic">Cargando notificaciones...</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : notificaciones.length === 0 ? (
        <p className="text-zinc-500 italic text-sm">
          {filtro === 'no_leidas'
            ? 'No tienes notificaciones sin leer.'
            : filtro === 'archivadas'
            ? 'No tienes notificaciones archivadas.'
            : 'Aún no tienes notificaciones. Aparecerán aquí conforme uses la app.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {notificaciones.map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors duration-150 ${
                n.leida
                  ? 'border-white/[0.07] bg-white/[0.02]'
                  : 'border-amber-400/20 bg-amber-400/[0.06]'
              }`}
            >
              <span className="text-lg leading-none mt-0.5">
                {ICONO_POR_TIPO[n.tipo] ?? '🔔'}
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.leida ? 'text-[#d4d4d8]' : 'text-white font-semibold'}`}>
                  {n.mensaje}
                </p>
                <p className="text-[0.7rem] text-zinc-500 mt-1">{formatearFecha(n.fecha)}</p>
              </div>

              <div className="flex gap-1.5 shrink-0">
                {!n.leida && !n.archivada && (
                  <button
                    onClick={() => handleLeer(n.id)}
                    title="Marcar como leída"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition-colors duration-150"
                  >
                    ✓
                  </button>
                )}
                {!n.archivada && (
                  <button
                    onClick={() => handleArchivar(n.id)}
                    title="Archivar"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border border-indigo-400/40 bg-indigo-400/10 text-[#818cf8] hover:bg-indigo-400/20 transition-colors duration-150"
                  >
                    🗂
                  </button>
                )}
                <button
                  onClick={() => handleEliminar(n.id)}
                  title="Eliminar"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-xs border border-red-400/40 bg-red-400/10 text-[#f87171] hover:bg-red-400/20 transition-colors duration-150"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {paginacion && paginacion.totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/[0.05] text-[#a1a1aa] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/[0.09] transition-colors duration-150"
          >
            ← Anterior
          </button>
          <span className="text-xs text-[#a1a1aa]">
            Página {paginacion.page} de {paginacion.totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(paginacion.totalPaginas, p + 1))}
            disabled={pagina >= paginacion.totalPaginas}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/[0.05] text-[#a1a1aa] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/[0.09] transition-colors duration-150"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}