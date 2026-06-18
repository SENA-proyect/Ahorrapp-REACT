import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'

export default function Index() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  
  const handleSubmit = e => {
    e.preventDefault()
    console.log('Formulario enviado')
  }
  
  const features = [
    ['Gestión de ingresos',   'Registra y monitorea todos tus ingresos de manera organizada',   '💰'],
    ['Gestión de gastos',     'Controla tus gastos y evita exceder tu presupuesto',              '📊'],
    ['Metas de Ahorro',       'Establece objetivos financieros y sigue tu progreso',             '🎯'],
    ['Fondo de Imprevistos',  'Prepárate para gastos inesperados',                               '🛡️'],
    ['Control de Deudas',     'Administra tus deudas y programa pagos estratégicos',             '💳'],
    ['Personas a Cargo',      'Organiza información y gastos de tus dependientes',               '👨‍‍👧'],
    ['Reportes Detallados',   'Genera análisis completos con recomendaciones',                   '📈'],
    ['Dashboard Inteligente', 'Visualiza tus finanzas con gráficos en tiempo real',              '📱'],
  ]
  
  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden transition-colors duration-300"
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Background glows — solo en modo oscuro */}
      {isDarkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'rgba(34,197,94,0.07)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'rgba(251,191,36,0.07)' }} />
        </div>
      )}
      
      {/* ───────────────── HEADER ───────────────── */}
      <header className={`relative z-10 w-full border-b backdrop-blur-sm sticky top-0 transition-colors duration-300 ${
        isDarkMode ? 'border-white/5' : 'border-gray-200'
      }`}>
        <section className="w-full flex items-center justify-between px-6 py-5 md:px-12">
          
          {/* Logo — mismo estilo que el Dashboard */}
          <div className="flex flex-col">
            <h1 className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-3xl font-black tracking-tight text-transparent">
              Ahorrapp
            </h1>
            <span className={`text-[0.6rem] font-semibold uppercase tracking-[0.25em] ${
              isDarkMode ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              Tu aliado financiero
            </span>
          </div>
          
          {/* Botones de sesión y toggle de tema */}
          <div className="flex items-center gap-3">
            {/* Toggle de tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-px ${
                isDarkMode
                  ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
              <span className="hidden sm:inline">{isDarkMode ? 'Oscuro' : 'Claro'}</span>
            </button>
            
            <Link to="/login">
              <button className={`cursor-pointer rounded-xl border px-5 py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)] ${
                isDarkMode
                  ? 'border-white/10 bg-white/5 text-white hover:border-amber-400/30 hover:bg-white/10'
                  : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-amber-400 hover:bg-gray-200'
              }`}>
                Iniciar sesión
              </button>
            </Link>
            <Link to="/registro">
              <button className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-sm font-bold text-slate-950 transition-all duration-300 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(251,191,36,0.3)]">
                Registrarse
              </button>
            </Link>
          </div>
        </section>
        
        {/* Línea decorativa amber — igual al Dashboard */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-70" />
      </header>
      
      <main className="relative">
        
        {/* ───────────────── HERO ───────────────── */}
        <section className="relative w-full overflow-hidden px-6 py-32 md:px-12 md:py-40">
          <div className="mx-auto max-w-6xl text-center">
            
            {/* Badge */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
              style={{
                borderColor: isDarkMode ? 'rgba(251,191,36,0.25)' : 'rgba(245,158,11,0.3)',
                background: isDarkMode ? 'rgba(251,191,36,0.08)' : 'rgba(245,158,11,0.1)',
                color: isDarkMode ? '#fbbf24' : '#d97706',
              }}
            >
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Tu aliado financiero inteligente
            </div>
            
            <h1 className={`mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl lg:text-8xl ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Controla tus{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Finanzas
              </span>
              <br />
              Personales
            </h1>
            
            <p className={`mx-auto mb-10 max-w-2xl text-lg md:text-xl leading-relaxed ${
              isDarkMode ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              Una aplicación completa para gestionar tus ingresos, gastos, ahorros, deudas y más.
              Todo en un solo lugar, con un diseño minimalista y herramientas avanzadas de análisis financiero.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login">
                <button className="group cursor-pointer rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-8 py-4 text-base font-bold text-slate-950 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/25">
                  Comenzar gratis
                  <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                </button>
              </Link>
            </div>
            

          </div>
        </section>
        
        {/* ───────────────── FEATURES ───────────────── */}
        <section className={`relative w-full border-t px-6 py-24 md:px-12 md:py-32 ${
          isDarkMode ? 'border-white/5' : 'border-gray-200'
        }`}
        style={{ 
          background: isDarkMode 
            ? 'rgba(255,255,255,0.02)' 
            : 'rgba(255,255,255,0.5)' 
        }}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className={`mb-4 text-4xl font-extrabold tracking-tight md:text-5xl ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Características{' '}
                <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
                  principales
                </span>
              </h2>
              <p className={`mx-auto max-w-2xl text-lg ${
                isDarkMode ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                Todo lo que necesitas para tomar el control de tu vida financiera
              </p>
            </div>
            
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(([title, description, icon]) => (
                <article
                  key={title}
                  className={`group relative overflow-hidden rounded-3xl border p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] ${
                    isDarkMode ? 'border-white/10' : 'border-gray-200'
                  }`}
                  style={{
                    background: isDarkMode
                      ? 'radial-gradient(ellipse at left, rgba(245,158,11,0.12), rgba(15,23,42,0.6))'
                      : 'radial-gradient(ellipse at left, rgba(245,158,11,0.05), rgba(255,255,255,0.8))',
                  }}
                >
                  <span className="mb-4 block text-3xl opacity-80">{icon}</span>
                  <h3 className={`mb-2 text-base font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? 'text-zinc-400' : 'text-gray-600'
                  }`}>{description}</p>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </article>
              ))}
            </div>
          </div>
        </section>
        
        {/* ───────────────── CTA ───────────────── */}
        <section className="relative w-full overflow-hidden px-6 py-24 md:px-12 md:py-32">
          <div className="absolute inset-0 pointer-events-none"
            style={{ 
              background: isDarkMode
                ? 'radial-gradient(ellipse at center, rgba(245,158,11,0.12) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(245,158,11,0.05) 0%, transparent 70%)'
            }} />
          
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 className={`mb-6 text-4xl font-extrabold tracking-tight md:text-5xl ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Comienza a gestionar tus finanzas{' '}
              <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
                hoy mismo
              </span>
            </h2>
            <p className={`mb-10 text-lg md:text-xl ${
              isDarkMode ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              Únete a miles de usuarios que ya están tomando el control de su dinero
            </p>
            <Link to="/registro">
              <button className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-10 py-4 text-lg font-bold text-slate-950 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(251,191,36,0.35)]">
                Crear cuenta gratis →
              </button>
            </Link>
          </div>
        </section>
      </main>
      
      {/* ───────────────── FOOTER ───────────────── */}
      <footer className={`relative border-t px-6 py-16 md:px-12 ${
        isDarkMode ? 'border-white/5' : 'border-gray-200'
      }`}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1fr_1.5fr]">
            
            {/* Marca */}
            <div>
              <h3 className="mb-1 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-2xl font-black text-transparent">
                Ahorrapp
              </h3>
              <span className={`block mb-4 text-[0.6rem] font-semibold uppercase tracking-[0.25em] ${
                isDarkMode ? 'text-zinc-500' : 'text-gray-500'
              }`}>
                Tu aliado financiero
              </span>
              <p className={`leading-relaxed text-sm ${
                isDarkMode ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                Toma el control de tus finanzas personales con herramientas poderosas y fáciles de usar.
              </p>
            </div>
            
            {/* Formulario de contacto */}
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-amber-400">
                Contáctanos
              </h4>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className={`rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 focus:border-amber-400/40 focus:shadow-[0_4px_12px_rgba(251,191,36,0.1)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white focus:bg-white/8'
                        : 'border-gray-300 bg-gray-50 text-gray-900 focus:bg-white'
                    }`}
                    type="text" name="nombre" placeholder="Nombre" required
                  />
                  <input
                    className={`rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 focus:border-amber-400/40 focus:shadow-[0_4px_12px_rgba(251,191,36,0.1)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white focus:bg-white/8'
                        : 'border-gray-300 bg-gray-50 text-gray-900 focus:bg-white'
                    }`}
                    type="email" name="email" placeholder="Email" required
                  />
                </div>
                
                <textarea
                  name="mensaje"
                  className={`w-full resize-y rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 focus:border-amber-400/40 focus:shadow-[0_4px_12px_rgba(251,191,36,0.1)] ${
                    isDarkMode
                      ? 'border-white/10 bg-white/5 text-white focus:bg-white/8'
                      : 'border-gray-300 bg-gray-50 text-gray-900 focus:bg-white'
                  }`}
                  rows="3"
                  placeholder="¿En qué podemos ayudarte?"
                  required
                />
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    isDarkMode ? 'text-zinc-600' : 'text-gray-500'
                  }`}>Tus datos están seguros 🔒</span>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-bold text-slate-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(251,191,36,0.3)]"
                  >
                    Enviar mensaje →
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Copyright — igual al Dashboard */}
          <div className={`mt-12 border-t pt-8 text-center text-[0.7rem] font-mono ${
            isDarkMode ? 'border-white/5 text-zinc-500' : 'border-gray-200 text-gray-500'
          }`}>
            <p>
              &copy;{' '}
              <strong className="text-amber-400">
                {new Date().getFullYear()} Ahorrapp
              </strong>{' '}
              — Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}