import { useState, useEffect, useMemo } from 'react'
import HeaderModulos from './HeaderModulos'
import BolsaWidget from './BolsaWidget'
import { getDashboardData } from '../api'

export default function Dashboard() {
  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario'))
    } catch {
      return null
    }
  }, [])

  const [totales, setTotales] = useState({
    totalIngresos: 0,
    totalGastos: 0,
    totalAhorros: 0,
    balance: 0,
  })

  useEffect(() => {
    getDashboardData()
      .then(setTotales)
      .catch((err) => console.error('Error cargando dashboard:', err))
  }, [])

  const statCards = useMemo(() => [
    {
      id: 'ingresos',
      label: 'Ingresos',
      value: `$${totales.totalIngresos.toLocaleString('es-CO')}`,
      sub: '+12% vs. mes anterior',
      emoji: '💰',
      color: 'text-emerald-400',
      gradient: 'radial-gradient(ellipse at left, rgba(34,197,94,0.527), rgba(16,185,129,0.05))',
    },
    {
      id: 'gastos',
      label: 'Gastos',
      value: `$${totales.totalGastos.toLocaleString('es-CO')}`,
      sub: '−5% vs. mes anterior',
      emoji: '💸',
      color: 'text-red-400',
      gradient: 'radial-gradient(ellipse at left, rgba(239,68,68,0.527), rgba(220,38,38,0.05))',
    },
    {
      id: 'ahorros',
      label: 'Ahorros',
      value: `$${totales.totalAhorros.toLocaleString('es-CO')}`,
      sub: 'Meta: $1,500 / mes',
      emoji: '🎯',
      color: 'text-amber-400',
      gradient: 'radial-gradient(ellipse at left, rgba(245,158,11,0.527), rgba(249,115,22,0.05))',
    },
    {
      id: 'balance',
      label: 'Balance',
      value: `$${totales.balance.toLocaleString('es-CO')}`,
      sub: 'Disponible este mes',
      emoji: '💜',
      color: 'text-violet-400',
      gradient: 'radial-gradient(ellipse at left, rgba(168,85,247,0.527), rgba(147,51,234,0.05))',
    },
  ], [totales])

  return (
    <div
      className="w-full min-h-screen flex flex-col text-white overflow-x-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)',
      }}
    >
      <HeaderModulos section="Dashboard" />

      <hr className="my-1 border-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <main className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto items-stretch px-4 py-5 sm:px-6 sm:py-6 md:p-8 gap-4 sm:gap-6">
        <div className="flex flex-col w-full items-start">
          <p className="text-zinc-400 text-sm">Bienvenido de vuelta</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white break-words">
            {usuario?.nombre ?? 'Usuario'} <span>👋.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
          {statCards.map((card) => (
            <article
              key={card.id}
              className="min-w-0 p-5 sm:p-6 lg:p-8 rounded-2xl border border-white/10 shadow-[0_2px_8px_rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)]"
              style={{ background: card.gradient }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${card.color}`}>
                    {card.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-white break-words">
                    {card.value}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">
                    {card.sub}
                  </p>
                </div>
                <span className="text-3xl opacity-30 shrink-0">{card.emoji}</span>
              </div>
            </article>
          ))}
        </div>

        <section className="w-full min-w-0 overflow-hidden">
          <BolsaWidget />
        </section>

        {[0, 1].map((i) => (
          <section
            key={i}
            className="w-full bg-white/5 backdrop-blur-lg rounded-2xl px-4 py-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center"
          >
            <h2 className="text-2xl sm:text-3xl mb-3 sm:mb-4 font-bold text-amber-400">
              Resumen General
            </h2>
            <p className="text-sm sm:text-lg text-zinc-300 leading-relaxed max-w-4xl">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, atque praesentium
              mollitia illo recusandae velit dolorum saepe doloremque debitis accusamus voluptatum
              cum quos impedit deserunt in suscipit dolor. Rerum, soluta.
            </p>
          </section>
        ))}
      </main>

      <footer className="w-full px-4 py-6 text-center text-zinc-400 text-[0.7rem] font-mono">
        <p>
          &copy; <strong className="text-amber-400">2026 Ahorrapp</strong>. Todos los derechos
          reservados.
        </p>
      </footer>
    </div>
  )
}