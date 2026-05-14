import { useNavigate } from 'react-router-dom'
import BolsaWidget from './BolsaWidget'

const navItems = [
  { href: '/ModulosIngresos',      emoji: '💰', label: 'Ingresos' },
  { href: '/ModulosGastos',        emoji: '💸', label: 'Gastos' },
  { href: '/ModuloAhorros',        emoji: '🎯', label: 'Ahorrar' },
  { href: '/ModuloImprevistos',    emoji: '🛡️', label: 'Imprevistos' },
  { href: '/ModuloDeudas',         emoji: '💳', label: 'Deudas' },
  { href: '/ModulosDependientes',  emoji: '👩‍👧‍👦', label: 'Dependientes' },
  { href: '/ModulosCategorias',    emoji: '🧩', label: 'Categorias' },
  { href: '/movimientos/nuevo',    emoji: '➕', label: 'Nuevo Movimiento' },
  { href: '/Noticias',             emoji: '📰', label: 'Noticias' },
  { href: '/exportar',             emoji: '📤', label: 'Exportar' },
]

const usuario = JSON.parse(localStorage.getItem('usuario'))

const statCards = [
  {
    id: 'ingresos',
    label: 'Ingresos',
    value: '$4,200',
    sub: '+12% vs. mes anterior',
    emoji: '💰',
    color: 'text-emerald-400',
    gradient:
      'radial-gradient(ellipse at left, rgba(34,197,94,0.527), rgba(16,185,129,0.05))',
  },
  {
    id: 'gastos',
    label: 'Gastos',
    value: '$2,850',
    sub: '−5% vs. mes anterior',
    emoji: '💸',
    color: 'text-red-400',
    gradient:
      'radial-gradient(ellipse at left, rgba(239,68,68,0.527), rgba(220,38,38,0.05))',
  },
  {
    id: 'ahorros',
    label: 'Ahorros',
    value: '$980',
    sub: 'Meta: $1,500 / mes',
    emoji: '🎯',
    color: 'text-amber-400',
    gradient:
      'radial-gradient(ellipse at left, rgba(245,158,11,0.527), rgba(249,115,22,0.05))',
  },
  {
    id: 'balance',
    label: 'Balance',
    value: '$1,350',
    sub: 'Disponible este mes',
    emoji: '💜',
    color: 'text-violet-400',
    gradient:
      'radial-gradient(ellipse at left, rgba(168,85,247,0.527), rgba(147,51,234,0.05))',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div
      className="w-full min-h-screen flex flex-col overflow-x-hidden text-white"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)',
      }}
    >
      {/* ───────────────── HEADER ───────────────── */}
      <header className="relative z-10 w-full border-b border-white/5 backdrop-blur-sm">
        <section className="w-full flex items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          
          {/* Inicio */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-px hover:border-green-500/50 hover:bg-green-600/80 hover:shadow-[0_4px_12px_rgba(34,197,94,0.35)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-5.25H9V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"
              />
            </svg>

            <span className="hidden sm:inline">Inicio</span>
          </button>

          {/* Logo */}
          <div className="flex flex-col items-center">
            <h1 className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
              Ahorrapp
            </h1>

            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-zinc-500">
              Dashboard
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-px hover:border-red-500/40 hover:bg-red-600/80 hover:shadow-[0_4px_12px_rgba(239,68,68,0.35)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>

            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </section>

        {/* NAV */}
        <nav className="w-full px-3 pb-4 sm:px-5">
          <ul className="flex flex-wrap justify-center gap-3">
            {navItems.map(item => (
              <li
                key={item.href}
                onClick={() => navigate(item.href)}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-px hover:border-amber-400/30 hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              >
                <span className="mr-1">{item.emoji}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Línea decorativa */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-70" />

      {/* ───────────────── MAIN ───────────────── */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Bienvenida */}
        <section className="mb-6">
          <p className="text-sm text-zinc-400">
            Bienvenido de vuelta
          </p>

          <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(card => (
            <article
              key={card.id}
              className="rounded-3xl border border-white/10 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
              style={{ background: card.gradient }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${card.color}`}
                  >
                    {card.label}
                  </p>

                  <p className="text-3xl font-black text-white">
                    {card.value}
                  </p>

                  <p className="mt-2 text-xs text-zinc-400">
                    {card.sub}
                  </p>
                </div>

                <span className="text-4xl opacity-30">
                  {card.emoji}
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* Bolsa Widget */}
        <section className="mt-7 w-full">
          <BolsaWidget />
        </section>

        {/* Resumen */}
        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          {[0, 1].map(i => (
            <article
              key={i}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg shadow-2xl"
            >
              <h3 className="mb-4 text-2xl font-black text-amber-400">
                Resumen General
              </h3>

              <p className="leading-relaxed text-zinc-300">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, atque praesentium mollitia illo recusandae velit
                dolorum saepe doloremque debitis accusamus voluptatum cum quos
                impedit deserunt in suscipit dolor. Rerum, soluta.
              </p>
            </article>
          ))}
        </section>
      </main>

      {/* ───────────────── FOOTER ───────────────── */}
      <footer className="border-t border-white/5 py-6 text-center text-[0.7rem] font-mono text-zinc-500">
        <p>
          &copy;{' '}
          <strong className="text-amber-400">
            2026 Ahorrapp
          </strong>{' '}
          — Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}