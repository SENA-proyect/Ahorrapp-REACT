import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotificaciones } from './Notificacionescontext'

const navItems = [
  { href: '/Dashboard', emoji: '📊', label: 'Dashboard' },
  { href: '/ModulosIngresos', emoji: '💰', label: 'Ingresos' },
  { href: '/ModulosGastos', emoji: '💸', label: 'Gastos' },
  { href: '/ModuloAhorros', emoji: '🎯', label: 'Ahorrar' },
  { href: '/ModuloImprevistos', emoji: '🛡️', label: 'Imprevistos' },
  { href: '/ModuloDeudas', emoji: '💳', label: 'Deudas' },
  { href: '/ModulosDependientes', emoji: '👩‍👧‍👦', label: 'Dependientes' },
  { href: '/ModulosCategorias', emoji: '🧩', label: 'Categorias' },
  { href: '/ModulosPresupuestos', emoji: '📋', label: 'Presupuestos' },
  { href: '/Noticias', emoji: '📰', label: 'Noticias' },
  { href: '/Exportar', emoji: '📈', label: 'Reportes' },
]

export default function HeaderModulos({ section = 'Dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { noLeidasCount } = useNotificaciones()

  const navButtonClass = isActive =>
    isActive
      ? 'w-full md:w-auto flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 rounded-xl md:rounded-[10px] text-left font-bold text-amber-300 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.4)] transition-all'
      : 'w-full md:w-auto flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 rounded-xl md:rounded-[10px] text-left font-semibold text-white bg-white/10 border border-white/5 hover:-translate-y-px hover:shadow-[0_1px_8px_rgba(255,187,0,0.4)] transition-all'

  const handleLogout = () => { 
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
  }
  return (
    <header className="relative z-10 w-full flex flex-col items-center pt-4 sm:pt-5">
      <section className="w-full max-w-[1400px] flex flex-col gap-4 px-4 sm:px-6 md:px-10 mb-4 sm:mb-6">
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="justify-self-start flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-green-600 hover:border-green-500/50 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(31,187,31,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-5.25H9V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" /></svg>
            Inicio
          </button>

          <div className="col-span-2 row-start-1 sm:col-span-1 sm:col-start-2 flex flex-col items-center gap-0.5 pointer-events-none">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">
              AhorrApp
            </h1>
            <span className="text-[0.6rem] sm:text-[0.65rem] text-zinc-500 font-semibold tracking-widest uppercase">
              {section}
            </span>
          </div>

          <div className="justify-self-end flex items-center gap-2">
            <button
              onClick={() => {/* TODO: navegar a /Notificaciones cuando la vista exista */}}
              aria-label="Notificaciones"
              className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-amber-500/20 hover:border-amber-400/50 hover:-translate-y-px"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
              {noLeidasCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[0.65rem] font-bold leading-none">
                  {noLeidasCount > 99 ? '99+' : noLeidasCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-red-600 hover:border-red-500/40 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(228,33,33,0.4)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden">Salir</span>
            </button>
          </div>
        </div>
      </section>

      <nav className="w-full px-4 sm:px-6 md:px-10">
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white shadow-[0_2px_8px_rgba(255,255,255,0.1)]"
          >
            <span>Menú</span>
            <span>{menuOpen ? '▲' : '▼'}</span>
          </button>

          {menuOpen && (
            <ul className="mt-3 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-slate-950/85 p-3 backdrop-blur-lg">
              {navItems.map(item => {
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

        <ul className="hidden flex-wrap items-center justify-center gap-3 pb-2 text-sm md:flex lg:gap-4 lg:text-base">
          {navItems.map(item => {
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