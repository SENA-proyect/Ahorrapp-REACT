import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import HeaderModulos from './HeaderModulos'
import Historialnotificaciones from './Historialnotificaciones'
import Preferenciasnotificaciones from './Preferenciasnotificaciones'

const SECCIONES = [
  { id: 'notificaciones', label: 'Notificaciones', emoji: '🔔' },
  { id: 'preferencias', label: 'Preferencias', emoji: '🎛️' },
  // { id: 'cuenta', label: 'Mi cuenta', emoji: '👤', proximamente: true },
]

export default function Configuracion() {
  const [searchParams] = useSearchParams()
  const tabInicial = searchParams.get('tab')
  const [seccionActiva, setSeccionActiva] = useState(
    SECCIONES.some(s => s.id === tabInicial) ? tabInicial : 'notificaciones'
  )

  useEffect(() => {
    if (tabInicial && SECCIONES.some(s => s.id === tabInicial)) {
      setSeccionActiva(tabInicial)
    }
  }, [tabInicial])

  return (
    <div className="min-h-screen w-full flex flex-col text-white overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }}>

      <HeaderModulos section="configuración" />

      <hr className="my-1 border-none h-px"
        style={{ background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }} />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <nav className="md:w-56 shrink-0">
            <ul className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
              {SECCIONES.map(s => (
                <li key={s.id} className="shrink-0 md:shrink">
                  <button
                    type="button"
                    disabled={s.proximamente}
                    onClick={() => setSeccionActiva(s.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all duration-200 ${
                      s.proximamente
                        ? 'text-zinc-600 bg-white/[0.02] border border-white/5 cursor-not-allowed'
                        : seccionActiva === s.id
                        ? 'text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                        : 'text-white bg-white/[0.05] border border-white/10 hover:bg-white/[0.09]'
                    }`}
                  >
                    <span>{s.emoji}</span>
                    <span className="whitespace-nowrap">{s.label}</span>
                    {s.proximamente && (
                      <span className="ml-auto text-[0.6rem] uppercase tracking-wide text-zinc-600">
                        Próx.
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contenido */}
          <section className="flex-1 w-full rounded-2xl border border-white/10 p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
            {seccionActiva === 'notificaciones' && <Historialnotificaciones />}
            {seccionActiva === 'preferencias' && <Preferenciasnotificaciones />}
          </section>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-zinc-700 text-[0.7rem] font-mono">
        <p>© <strong className="text-[#fbbf24]">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}