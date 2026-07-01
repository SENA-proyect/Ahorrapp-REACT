// src/components/ToastContext.jsx
import { createContext, useState, useContext, useCallback, useRef } from 'react'

const ToastContext = createContext()

const DURACION_MS = 3000

// Estilos por tipo de toast. 'success' es el caso por defecto
// (acorde al acento ámbar/dorado ya usado en HeaderModulos).
const ESTILOS_POR_TIPO = {
  success: {
    borde: 'border-amber-400/40',
    icono: '✓',
    iconoFondo: 'bg-amber-400/20 text-amber-300',
  },
  error: {
    borde: 'border-red-500/40',
    icono: '✕',
    iconoFondo: 'bg-red-500/20 text-red-400',
  },
  info: {
    borde: 'border-sky-400/40',
    icono: 'ℹ',
    iconoFondo: 'bg-sky-400/20 text-sky-300',
  },
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const idCounterRef = useRef(0)

  const mostrarToast = useCallback((mensaje, tipo = 'success') => {
    idCounterRef.current += 1
    const id = idCounterRef.current

    setToasts((prev) => [...prev, { id, mensaje, tipo }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, DURACION_MS)
  }, [])

  const cerrarToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}

      {/* Banner centrado arriba, debajo del header */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none">
        {toasts.map(({ id, mensaje, tipo }) => {
          const estilo = ESTILOS_POR_TIPO[tipo] ?? ESTILOS_POR_TIPO.success

          return (
            <div
              key={id}
              role="status"
              className={`pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-xl sm:rounded-2xl border ${estilo.borde} bg-slate-950/90 backdrop-blur-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)] animate-[toast-in_0.25s_ease-out]`}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${estilo.iconoFondo}`}>
                {estilo.icono}
              </span>
              <span className="flex-1 text-sm font-medium text-white">
                {mensaje}
              </span>
              <button
                onClick={() => cerrarToast(id)}
                aria-label="Cerrar"
                className="pointer-events-auto text-white/40 hover:text-white/80 transition-colors text-sm font-bold leading-none px-1"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return context
}