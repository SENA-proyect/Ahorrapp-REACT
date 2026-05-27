import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

const navItems = [
  { href: '/Dashboard',           emoji: '📊', label: 'Dashboard' },
  { href: '/ModulosIngresos',     emoji: '💰', label: 'Ingresos' },
  { href: '/ModulosGastos',       emoji: '💸', label: 'Gastos' },
  { href: '/ModuloAhorros',       emoji: '', label: 'Ahorrar' },
  { href: '/ModuloImprevistos',   emoji: '🛡️', label: 'Imprevistos' },
  { href: '/ModuloDeudas',        emoji: '💳', label: 'Deudas' },
  { href: '/ModulosDependientes', emoji: '👩‍👧‍👦', label: 'Dependientes' },
  { href: '/ModulosCategorias',   emoji: '', label: 'Categorias' },
  { href: '/movimientos/nuevo',   emoji: '➕', label: 'Nuevo Movimiento' },
]

export default function HeaderModulos({ section = 'Dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkMode } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  // Función para generar clases de botones según el tema y estado activo
  const navButtonClass = (isActive) => {
    const baseClass = 'w-full md:w-auto flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 rounded-xl md:rounded-[10px] text-left font-bold transition-all duration-300'
    
    if (isActive) {
      return isDarkMode
        ? `${baseClass} text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)]`
        : `${baseClass} text-blue-700 bg-blue-100 border border-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]`
    }

    return isDarkMode
      ? `${baseClass} text-white bg-white/5 border border-white/10 hover:-translate-y-px hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(255,187,0,0.2)]`
      : `${baseClass} text-gray-700 bg-gray-100 border border-gray-300 hover:-translate-y-px hover:bg-gray-200 hover:shadow-[0_4px_12px_rgba(59,130,246,0.15)]`
  }

  // Definimos los fondos exactamente como están en Dashboard.jsx
  const headerBackground = isDarkMode
    ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
    : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)'

  return (
    <header
      // Mantenemos el backdrop-blur para que se vea moderno, pero aplicamos el fondo exacto
      className={`relative z-10 w-full flex flex-col items-center pt-4 sm:pt-5 transition-colors duration-300 backdrop-blur-md border-b ${
        isDarkMode ? 'border-white/10' : 'border-gray-200'
      }`}
      style={{ background: headerBackground }}
    >
      <section className="w-full max-w-[1400px] px-4 sm:px-6 md:px-10 mb-4 sm:mb-6">
        <div className="flex flex-col items-center gap-2">
          {/* Logo con gradiente dinámico */}
          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent ${
              isDarkMode
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600'
            }`}
          >
            Ahorrapp
          </h1>
          
          {/* Sección actual */}
          <span
            className={`text-[0.6rem] sm:text-[0.65rem] font-semibold tracking-widest uppercase ${
              isDarkMode ? 'text-zinc-500' : 'text-gray-500'
            }`}
          >
            {section}
          </span>
        </div>
      </section>

      <nav className="w-full px-4 sm:px-6 md:px-10 pb-2">
        {/* Menú Móvil */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 font-bold shadow-sm transition-colors ${
              isDarkMode
                ? 'border-white/10 bg-white/5 text-white'
                : 'border-gray-300 bg-gray-50 text-gray-900'
            }`}
          >
            <span>Menú</span>
            <span>{menuOpen ? '▲' : '▼'}</span>
          </button>

          {menuOpen && (
            <ul
              className={`mt-3 grid grid-cols-1 gap-2 rounded-2xl border p-3 backdrop-blur-lg ${
                isDarkMode
                  ? 'border-white/10 bg-slate-950/95'
                  : 'border-gray-200 bg-white/95'
              }`}
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(item.href)
                        setMenuOpen(false)
                      }}
                      className={navButtonClass(isActive)}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Menú Escritorio */}
        <ul className="hidden flex-wrap items-center justify-center gap-3 pb-2 text-sm md:flex lg:gap-4 lg:text-base">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={navButtonClass(isActive)}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}