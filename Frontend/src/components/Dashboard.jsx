import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'
import HeaderModulos from './HeaderModulos'
import BolsaWidget from './BolsaWidget'
import { getDashboardData, getPresupuestoVsEjecutado, getFlujoPorSemana } from '../api'

// agregado para la seguirdad por roles
import { useAuth } from './AuthContext'

// ── Tooltip personalizado para la gráfica de barras ──────────
const TooltipPresupuesto = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-amber-400 font-bold mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="mb-0.5">
          {p.name}: <span className="text-white font-semibold">${Number(p.value).toLocaleString('es-CO')}</span>
        </p>
      ))}
    </div>
  )
}

// ── Tooltip personalizado para la gráfica de área ────────────
const TooltipFlujo = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-zinc-400 font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="mb-0.5">
          {p.name}: <span className="text-white font-semibold">${Number(p.value).toLocaleString('es-CO')}</span>
        </p>
      ))}
    </div>
  )
}

// ── Estado vacío compartido ───────────────────────────────────
const SinPeriodo = ({ mensaje }) => (
  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
    <span className="text-3xl opacity-40">📊</span>
    <p className="text-zinc-400 text-sm">{mensaje}</p>
  </div>
)

export default function Dashboard() {
  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario'))
    } catch {
      return null
    }
  }, [])

// agregado para la seguirdad por roles
  const { user } = useAuth();

  const [totales, setTotales] = useState({
    totalIngresos: 0,
    totalGastos: 0,
    totalAhorros: 0,
    balance: 0,
    periodo: null,
    sin_periodo: true,
  })
  const [presupuestoData, setPresupuestoData] = useState([])
  const [flujoData, setFlujoData]             = useState([])
  const [loadingPresupuesto, setLoadingPresupuesto] = useState(true)
  const [loadingFlujo, setLoadingFlujo]             = useState(true)

  useEffect(() => {
    getDashboardData()
      .then(setTotales)
      .catch((err) => console.error('Error cargando resumen:', err))

    getPresupuestoVsEjecutado()
      .then(setPresupuestoData)
      .catch((err) => console.error('Error cargando presupuesto:', err))
      .finally(() => setLoadingPresupuesto(false))

    getFlujoPorSemana()
      .then(setFlujoData)
      .catch((err) => console.error('Error cargando flujo:', err))
      .finally(() => setLoadingFlujo(false))
  }, [])

  const statCards = useMemo(() => [
    {
      id: 'ingresos',
      label: 'Ingresos',
      value: `$${totales.totalIngresos.toLocaleString('es-CO')}`,
      sub: totales.periodo ? `Período: ${totales.periodo.fecha_inicio}` : 'Histórico total',
      emoji: '💰',
      color: 'text-emerald-400',
      gradient: 'radial-gradient(ellipse at left, rgba(34,197,94,0.527), rgba(16,185,129,0.05))',
    },
    {
      id: 'gastos',
      label: 'Gastos',
      value: `$${totales.totalGastos.toLocaleString('es-CO')}`,
      sub: totales.periodo ? `Período activo` : 'Histórico total',
      emoji: '💸',
      color: 'text-red-400',
      gradient: 'radial-gradient(ellipse at left, rgba(239,68,68,0.527), rgba(220,38,38,0.05))',
    },
    {
      id: 'ahorros',
      label: 'Ahorros',
      value: `$${totales.totalAhorros.toLocaleString('es-CO')}`,
      sub: totales.periodo ? `Período activo` : 'Histórico total',
      emoji: '🎯',
      color: 'text-amber-400',
      gradient: 'radial-gradient(ellipse at left, rgba(245,158,11,0.527), rgba(249,115,22,0.05))',
    },
    {
      id: 'balance',
      label: 'Balance',
      value: `$${totales.balance.toLocaleString('es-CO')}`,
      sub: 'Disponible este período',
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

        {/* ── Gráfica 1: Presupuestado vs Ejecutado ── */}
        <section className="w-full bg-white/5 backdrop-blur-lg rounded-2xl px-4 py-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-amber-400">
              Presupuesto vs Ejecutado
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {totales.periodo
                ? `Período: ${totales.periodo.fecha_inicio} → ${totales.periodo.fecha_fin}`
                : 'Comparación del período activo'}
            </p>
          </div>

          {loadingPresupuesto ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-zinc-500 text-sm animate-pulse">Cargando...</span>
            </div>
          ) : presupuestoData.length === 0 ? (
            <SinPeriodo mensaje="Abre un período de presupuesto para ver esta gráfica." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={presupuestoData} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="categoria"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<TooltipPresupuesto />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#a1a1aa', paddingTop: 12 }}
                />
                <Bar dataKey="presupuestado" name="Presupuestado" fill="rgba(245,158,11,0.7)"  radius={[4, 4, 0, 0]} />
                <Bar dataKey="ejecutado"     name="Ejecutado"     fill="rgba(239,68,68,0.75)"  radius={[4, 4, 0, 0]} />
                <Bar dataKey="disponible"    name="Disponible"    fill="rgba(99,102,241,0.6)"  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* ── Gráfica 2: Flujo semanal ── */}
        <section className="w-full bg-white/5 backdrop-blur-lg rounded-2xl px-4 py-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-amber-400">
              Flujo Semanal
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ingresos vs gastos semana a semana en el período activo
            </p>
          </div>

          {loadingFlujo ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-zinc-500 text-sm animate-pulse">Cargando...</span>
            </div>
          ) : flujoData.length === 0 ? (
            <SinPeriodo mensaje="Abre un período de presupuesto para ver esta gráfica." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={flujoData}>
                <defs>
                  <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="semana"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<TooltipFlujo />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa', paddingTop: 12 }} />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#34d399" strokeWidth={2} fill="url(#gradIngresos)" />
                <Area type="monotone" dataKey="gastos"   name="Gastos"   stroke="#f87171" strokeWidth={2} fill="url(#gradGastos)" />
                <Area type="monotone" dataKey="balance"  name="Balance"  stroke="#a78bfa" strokeWidth={2} fill="url(#gradBalance)" strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>
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