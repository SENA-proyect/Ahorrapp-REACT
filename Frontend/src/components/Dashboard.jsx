import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HeaderModulos from './HeaderModulos'
import BolsaWidget from './BolsaWidget'
import NewsDashboard from './NewsDashboard.jsx'
import { useTheme } from '../hooks/useTheme'

const navItems = [
  { href: '/ModulosIngresos', emoji: '💰', label: 'Ingresos' },
  { href: '/ModulosGastos', emoji: '💸', label: 'Gastos' },
  { href: '/ModuloAhorros', emoji: '🎯', label: 'Ahorrar' },
  { href: '/ModuloImprevistos', emoji: '🛡️', label: 'Imprevistos' },
  { href: '/ModuloDeudas', emoji: '💳', label: 'Deudas' },
  { href: '/ModulosDependientes', emoji: '👩👧‍', label: 'Dependientes' },
  { href: '/ModulosCategorias', emoji: '', label: 'Categorias' },
  { href: '/movimientos/nuevo', emoji: '➕', label: 'Nuevo Movimiento' },
  { href: '/exportar', emoji: '', label: 'Exportar' },
]

// Definimos solo los datos puros, sin clases de colores mezcladas
const statCardsData = [
  { id: 'ingresos', label: 'Ingresos', value: '$4,200', sub: '+12% vs. mes anterior', emoji: '💰', gradient: 'radial-gradient(ellipse at left, rgba(34,197,94,0.15), transparent)' },
  { id: 'gastos', label: 'Gastos', value: '$2,850', sub: '−5% vs. mes anterior', emoji: '', gradient: 'radial-gradient(ellipse at left, rgba(239,68,68,0.15), transparent)' },
  { id: 'ahorros', label: 'Ahorros', value: '$980', sub: 'Meta: $1,500 / mes', emoji: '', gradient: 'radial-gradient(ellipse at left, rgba(245,158,11,0.15), transparent)' },
  { id: 'balance', label: 'Balance', value: '$1,350', sub: 'Disponible este mes', emoji: '💜', gradient: 'radial-gradient(ellipse at left, rgba(168,85,247,0.15), transparent)' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const { isDarkMode } = useTheme()

  // Helper para asignar colores según el ID y el modo
  const getLabelColor = (id) => {
    if (isDarkMode) {
      if (id === 'ingresos') return 'text-emerald-400'
      if (id === 'gastos') return 'text-red-400'
      if (id === 'ahorros') return 'text-amber-400'
      if (id === 'balance') return 'text-violet-400'
      return 'text-white'
    }
    // Modo claro
    if (id === 'ingresos') return 'text-emerald-600'
    if (id === 'gastos') return 'text-red-600'
    if (id === 'ahorros') return 'text-amber-600'
    if (id === 'balance') return 'text-violet-600'
    return 'text-gray-900'
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
      
      {/* Línea separadora */}
      <div
        className="h-px w-full opacity-70"
        style={{
          background: isDarkMode
            ? 'linear-gradient(to right, transparent, #f59e0b, transparent)'
            : 'linear-gradient(to right, transparent, #60a5fa, transparent)',
        }}
      />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Bienvenida */}
        <section className="mb-6">
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
            Bienvenido de vuelta
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            {usuario?.nombre || 'Usuario'} <span>👋</span>
          </h2>
        </section>

        {/* Stats */}
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

        {/* Sección inferior */}
        <section className="mt-7 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 xl:col-span-8 min-h-[400px]">
              <div className="h-full">
                <BolsaWidget />
              </div>
            </div>
            <div className="lg:col-span-5 xl:col-span-4 min-h-[400px]">
              <div className="h-full overflow-y-auto max-h-[600px]">
                <NewsDashboard />
              </div>
            </div>
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