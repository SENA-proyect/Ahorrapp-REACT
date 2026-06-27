// src/components/PreferenciasNotificacion.jsx
import { useState, useEffect } from 'react'
import { getPreferenciasNotificacion, actualizarPreferenciasNotificacion } from '../api'
import { useToast } from './ToastContext'

const INFO_TIPOS = {
  sistema: {
    label: 'Mensajes del sistema',
    descripcion: 'Avisos generales de AhorrApp, como bienvenida o mantenimiento.',
  },
  recordatorio: {
    label: 'Recordatorios',
    descripcion: 'Avisos de deudas o metas próximas a vencer.',
  },
  sugerencia: {
    label: 'Sugerencias',
    descripcion: 'Recomendaciones para mejorar tu presupuesto.',
  },
  alerta_presupuesto: {
    label: 'Alertas de presupuesto',
    descripcion: 'Cuando superas un límite o alcanzas una meta.',
  },
}

export default function PreferenciasNotificacion() {
  const { mostrarToast } = useToast()
  const [preferencias, setPreferencias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await getPreferenciasNotificacion()
      setPreferencias(data)
    } catch (err) {
      setError('No se pudieron cargar tus preferencias.')
    } finally {
      setCargando(false)
    }
  }

  const toggle = (tipo) => {
    setPreferencias(prev =>
      prev.map(p => (p.tipo === tipo ? { ...p, activa: !p.activa } : p))
    )
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const respuesta = await actualizarPreferenciasNotificacion(preferencias)
      if (respuesta.ok) {
        mostrarToast('Preferencias guardadas correctamente')
      } else {
        mostrarToast(respuesta.mensaje || 'Error al guardar preferencias', 'error')
      }
    } catch (err) {
      mostrarToast(err.message || 'Error al guardar preferencias', 'error')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <p className="text-zinc-500 text-sm italic">Cargando preferencias...</p>
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-extrabold text-[#fbbf24]">🔔 Preferencias de notificación</h3>
        <p className="text-xs text-[#a1a1aa] mt-1">
          Elige qué tipo de avisos quieres recibir. Puedes cambiar esto cuando quieras.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {preferencias.map(({ tipo, activa }) => {
          const info = INFO_TIPOS[tipo] ?? { label: tipo, descripcion: '' }

          return (
            <div
              key={tipo}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.09] p-4"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div>
                <p className="text-sm font-bold text-[#f4f4f5]">{info.label}</p>
                <p className="text-xs text-[#a1a1aa] mt-0.5">{info.descripcion}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={activa}
                onClick={() => toggle(tipo)}
                className={`relative shrink-0 w-12 h-7 rounded-full border transition-colors duration-200 ${
                  activa
                    ? 'bg-amber-400/80 border-amber-400/80'
                    : 'bg-white/10 border-white/15'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    activa ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={guardar}
        disabled={guardando}
        className="self-start px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border-none text-white hover:-translate-y-px transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
      >
        {guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}