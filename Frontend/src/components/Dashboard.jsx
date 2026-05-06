import { useNavigate } from 'react-router-dom'

const navItems = [
  { href: '/ModulosIngresos',     emoji: '💰', label: 'Ingresos'     },
  { href: '/ModulosGastos',       emoji: '💸', label: 'Gastos'       },
  { href: '/ModulosAhorros',      emoji: '🎯', label: 'Ahorrar'      },
  { href: '/ModulosImprevistos',  emoji: '🛡️', label: 'Imprevistos'  },
  { href: '/ModulosDeudas',       emoji: '💳', label: 'Deudas'       },
  { href: '/ModulosDependientes', emoji: '👩‍👧‍👦', label: 'Dependientes' },
  { href: '/ModulosCategorias',   emoji: '🧩', label: 'Categorias'   },
]

const statCards = [
  {
    id:        'ingresos',
    label:     'Ingresos',
    value:     '$4,200',
    sub:       '+12% vs. mes anterior',
    emoji:     '💰',
    color:     'text-emerald-400',
    gradient:  'radial-gradient(ellipse at left, rgba(34,197,94,0.527), rgba(16,185,129,0.05))',
  },
  {
    id:        'gastos',
    label:     'Gastos',
    value:     '$2,850',
    sub:       '−5% vs. mes anterior',
    emoji:     '💸',
    color:     'text-red-400',
    gradient:  'radial-gradient(ellipse at left, rgba(239,68,68,0.527), rgba(220,38,38,0.05))',
  },
  {
    id:        'ahorros',
    label:     'Ahorros',
    value:     '$980',
    sub:       'Meta: $1,500 / mes',
    emoji:     '🎯',
    color:     'text-amber-400',
    gradient:  'radial-gradient(ellipse at left, rgba(245,158,11,0.527), rgba(249,115,22,0.05))',
  },
  {
    id:        'balance',
    label:     'Balance',
    value:     '$1,350',
    sub:       'Disponible este mes',
    emoji:     '💜',
    color:     'text-violet-400',
    gradient:  'radial-gradient(ellipse at left, rgba(168,85,247,0.527), rgba(147,51,234,0.05))',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div
      className="w-full min-h-screen flex flex-col text-white overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)' }}
    >

      {/* ── HEADER ── */}
      <header className="relative z-10 w-full flex flex-col items-center pt-5 pb-0">

        <section className="w-full flex items-center justify-between px-6 md:px-10 mb-6">

          {/* Botón Inicio */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-green-600 hover:border-green-500/50 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(31,187,31,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-5.25H9V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
            Inicio
          </button>

          {/* Título */}
          <div className="flex flex-col items-center gap-0.5">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">
              Ahorrapp
            </h1>
            <span className="text-[0.65rem] text-zinc-500 font-semibold tracking-widest uppercase">Dashboard</span>
          </div>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-2xl border border-white/10 bg-transparent text-white transition-all duration-300 hover:bg-red-600 hover:border-red-500/40 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(228,33,33,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>

        </section>

        {/* ── NAV ── */}
        <nav className="w-full px-4">
          <ul className="flex flex-wrap justify-center gap-4 items-center text-md min-w-max mx-auto pb-2">
            {navItems.map(item => (
              <li
                key={item.href}
                onClick={() => navigate(item.href)}
                className="px-3 py-1 rounded-[10px] text-white cursor-pointer transition-all duration-300 bg-white/10 shadow-[0_2px_8px_rgba(255,255,255,0.1)] hover:-translate-y-px hover:shadow-[0_1px_8px_rgba(255,187,0,0.4)]"
              >
                {item.emoji} {item.label}
              </li>
            ))}
          </ul>
        </nav>

      </header>

      {/* Separador */}
      <hr className="my-1 border-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col w-full max-w-screen-xl mx-auto items-center justify-center p-8 gap-4">

        {/* Bienvenida */}
        <div className="flex flex-col w-full items-start">
          <p className="text-zinc-400 text-sm">Bienvenido de vuelta</p>
          <h2 className="text-2xl font-bold text-white">Santiago <span>👋.</span></h2>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
          {statCards.map(card => (
            <article
              key={card.id}
              className="p-10 rounded-2xl border border-white/10 shadow-[0_2px_8px_rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)]"
              style={{ background: card.gradient }}
            >
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${card.color}`}>{card.label}</p>
              <p className="text-2xl font-black text-white">{card.value}</p>
              <p className="text-xs text-zinc-400 mt-1">{card.sub}</p>
              <span className="flex justify-end items-end text-3xl opacity-30">{card.emoji}</span>
            </article>
          ))}
        </div>

        {/* Secciones de resumen */}
        {[0, 1].map(i => (
          <section
            key={i}
            className="w-full h-auto bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center"
          >
            <h2 className="text-3xl mb-4 font-bold text-amber-400">Resumen General</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, atque praesentium mollitia illo recusandae velit dolorum saepe doloremque debitis accusamus voluptatum cum quos impedit deserunt in suscipit dolor. Rerum, soluta.
            </p>
          </section>
        ))}

      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full py-6 text-center text-zinc-400 text-[0.7rem] font-mono">
        <p>&copy; <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos reservados.</p>
      </footer>

    </div>
  )
}