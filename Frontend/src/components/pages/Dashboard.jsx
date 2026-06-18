import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HeaderModulos from '../layout/HeaderModulos'
import BolsaWidget from '../widgets/BolsaWidget'
import NewsDashboard from '../widgets/NewsDashboard.jsx'
import { useTheme } from '../../hooks/useTheme'
import { getDashboardData, getPresupuestoVsEjecutado, getFlujoPorSemana } from '../../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const { isDarkMode } = useTheme()
  const [stats, setStats] = useState(null)
  const [presupuestoData, setPresupuestoData] = useState([])
  const [flujoData, setFlujoData] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardData(),
      getPresupuestoVsEjecutado(),
      getFlujoPorSemana(),
    ]).then(([statsRes, presupuestoRes, flujoRes]) => {
      setStats(statsRes)
      setPresupuestoData(presupuestoRes)
      setFlujoData(flujoRes)
    }).catch(() => {}).finally(() => setCargando(false))
  }, [])

  const getLabelColor = (id) => {
    if (isDarkMode) {
      if (id === 'ingresos') return 'text-emerald-400'
      if (id === 'gastos') return 'text-red-400'
      if (id === 'ahorros') return 'text-amber-400'
      if (id === 'balance') return 'text-violet-400'
      return 'text-white'
    }
    if (id === 'ingresos') return 'text-emerald-600'
    if (id === 'gastos') return 'text-red-600'
    if (id === 'ahorros') return 'text-amber-600'
    if (id === 'balance') return 'text-violet-600'
    return 'text-gray-900'
  }

  const statCardsData = [
    { id: 'ingresos', label: 'Ingresos', value: stats ? `$${Number(stats.totalIngresos).toLocaleString('es-CO')}` : '$0', sub: 'Total del período', emoji: '💰', gradient: 'radial-gradient(ellipse at left, rgba(34,197,94,0.15), transparent)' },
    { id: 'gastos', label: 'Gastos', value: stats ? `$${Number(stats.totalGastos).toLocaleString('es-CO')}` : '$0', sub: 'Total del período', emoji: '💸', gradient: 'radial-gradient(ellipse at left, rgba(239,68,68,0.15), transparent)' },
    { id: 'ahorros', label: 'Ahorros', value: stats ? `$${Number(stats.totalAhorros).toLocaleString('es-CO')}` : '$0', sub: 'Total acumulado', emoji: '🎯', gradient: 'radial-gradient(ellipse at left, rgba(245,158,11,0.15), transparent)' },
    { id: 'balance', label: 'Balance', value: stats ? `$${Number(stats.balance).toLocaleString('es-CO')}` : '$0', sub: stats?.sin_periodo ? 'Sin período activo' : 'Disponible este mes', emoji: '💜', gradient: 'radial-gradient(ellipse at left, rgba(168,85,247,0.15), transparent)' },
  ]

  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
    borderRadius: '12px',
    color: isDarkMode ? '#fff' : '#111827',
    fontSize: '13px',
  }

  return (
    <div
      className={`w-full min-h-screen flex flex-col overflow-x-hidden transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at 30% 20%, #1e3a5f 10%, #0f172a 60%, #1a0f2e 100%)'
          : 'linear-gradient(135deg, #f8f9fb 0%, #f0f3f9 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <HeaderModulos section="Dashboard" />

      <div
        className="h-px w-full opacity-70"
        style={{
          background: isDarkMode
            ? 'linear-gradient(to right, transparent, #f59e0b, transparent)'
            : 'linear-gradient(to right, transparent, #60a5fa, transparent)',
        }}
      />

      <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6">
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
            Bienvenido de vuelta
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </section>

        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {statCardsData.map((card) => (
                <article
                  key={card.id}
                  className="rounded-3xl border p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] backdrop-blur-sm"
                  style={{
                    background: card.gradient,
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 231, 235, 1)',
                    boxShadow: isDarkMode
                      ? '0 4px 20px rgba(0,0,0,0.3)'
                      : '0 4px 20px rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${getLabelColor(card.id)}`}>
                        {card.label}
                      </p>
                      <p className="text-3xl font-black">
                        {card.value}
                      </p>
                      <p className={`mt-2 text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {card.sub}
                      </p>
                    </div>
                    <span className="text-4xl opacity-30">{card.emoji}</span>
                  </div>
                </article>
              ))}
            </section>

            <section className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={`rounded-2xl border p-5 transition-colors ${
                isDarkMode ? 'border-white/10 bg-[#242f40]/80' : 'border-gray-200 bg-white/80'
              }`}>
                <h3 className={`mb-4 text-base font-extrabold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                  📊 Presupuesto vs Ejecutado
                </h3>
                {presupuestoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={presupuestoData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : '#eee'} />
                      <XAxis dataKey="categoria" tick={{ fontSize: 12, fill: isDarkMode ? '#a1a1aa' : '#6b7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: isDarkMode ? '#a1a1aa' : '#6b7280' }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${Number(v).toLocaleString('es-CO')}`} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="presupuestado" name="Presupuestado" fill={isDarkMode ? '#fbbf24' : '#f59e0b'} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="ejecutado" name="Ejecutado" fill={isDarkMode ? '#60a5fa' : '#3b82f6'} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <span className="text-5xl opacity-30 mb-3">📊</span>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                      No hay un período activo
                    </p>
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                      Crea un presupuesto en la sección Presupuestos para ver gráficos.
                    </p>
                  </div>
                )}
              </div>

              <div className={`rounded-2xl border p-5 transition-colors ${
                isDarkMode ? 'border-white/10 bg-[#242f40]/80' : 'border-gray-200 bg-white/80'
              }`}>
                <h3 className={`mb-4 text-base font-extrabold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  📈 Flujo Semanal
                </h3>
                {flujoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={flujoData}>
                      <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : '#eee'} />
                      <XAxis dataKey="semana" tick={{ fontSize: 12, fill: isDarkMode ? '#a1a1aa' : '#6b7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: isDarkMode ? '#a1a1aa' : '#6b7280' }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${Number(v).toLocaleString('es-CO')}`} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#34d399" fill="url(#colorIngresos)" strokeWidth={2} />
                      <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f87171" fill="url(#colorGastos)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <span className="text-5xl opacity-30 mb-3">📈</span>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                      Sin datos semanales
                    </p>
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                      Activa un período en Presupuestos para ver el flujo semana a semana.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        <section className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 xl:col-span-8">
            <BolsaWidget />
          </div>
          <div className="lg:col-span-5 xl:col-span-4">
            <NewsDashboard />
          </div>
        </section>
      </main>

      <footer
        className={`border-t py-6 text-center text-[0.7rem] font-mono ${
          isDarkMode ? 'border-white/10 text-zinc-500' : 'border-gray-200 text-gray-500'
        }`}
      >
        <p>
          © <strong className={isDarkMode ? 'text-amber-400' : 'text-blue-600'}>2026 Ahorrapp</strong> — Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
