import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../hooks/useTheme"

const STORAGE_KEY = 'ahorrapp-sidebar-open'

export default function Sidebar() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, open ? 'true' : 'false')
  }, [open])

  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      return JSON.parse(window.localStorage.getItem('usuario'))
    } catch {
      return null
    }
  })

  // Escuchar cambios en localStorage (cuando se actualiza la foto desde Configuración)
  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = window.localStorage.getItem('usuario')
        setUser(stored ? JSON.parse(stored) : null)
      } catch {
        setUser(null)
      }
    }

    // Sincronizar al abrir/cerrar sidebar
    syncUser()

    // Escuchar cambios de storage desde otras pestañas
    window.addEventListener('storage', syncUser)

    // Escuchar un evento custom para sincronizar en la misma pestaña
    window.addEventListener('usuario-updated', syncUser)

    return () => {
      window.removeEventListener('storage', syncUser)
      window.removeEventListener('usuario-updated', syncUser)
    }
  }, [open])

  const profileName = user?.nombre || user?.Nombre || user?.name || 'Invitado'
  const profileEmail = user?.Email || user?.email || 'usuario@dominio.com'
  const profilePhoto = user?.foto
    ? `http://localhost:3000${user.foto}`
    : null
  const profileAvatar = profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=10b981&color=fff`
  
  const notifications = [
    { id: 1, text: 'Presupuesto excedido', read: false },
    { id: 2, text: 'Meta cumplida', read: false }
  ]
  const unreadCount = notifications.filter(n => !n.read).length

  // Variantes para la animación del sidebar (resorte)
  const sidebarVariants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 100, 
        damping: 20,
        duration: 0.3
      }
    },
    exit: { 
      x: '-100%', 
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  }

  // Variantes para la animación escalonada de los elementos hijos
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  return (
    <>
      {/* Botón para abrir (solo cuando está cerrado) */}
      {!open && (
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed left-4 top-4 z-50 flex items-center justify-center rounded-xl border p-2.5 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 ${
            isDarkMode
              ? 'border-white/10 bg-slate-950/95 text-white shadow-black/20 hover:bg-white/10 hover:border-white/20'
              : 'border-gray-300 bg-white/95 text-gray-800 shadow-gray-200/50 hover:bg-gray-100 hover:border-gray-400'
          }`}
          aria-label="Abrir menú"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay con fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
              transition={{ duration: 0.2 }}
            />

            {/* Sidebar animado */}
            <motion.aside
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`fixed inset-y-0 left-0 z-40 w-[280px] border-r p-5 shadow-2xl backdrop-blur-xl ${
                isDarkMode
                  ? 'border-white/10 bg-slate-950/95 shadow-black/30'
                  : 'border-gray-200 bg-white/95 shadow-gray-300/50'
              }`}
            >
              {/* Contenedor con stagger para los elementos internos */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex h-full flex-col"
              >
                {/* Perfil compacto */}
                <motion.div variants={itemVariants} className={`flex items-center gap-3 border-b pb-4 ${
                  isDarkMode ? 'border-white/10' : 'border-gray-200'
                }`}>
                  <img
                    src={profileAvatar}
                    alt={profileName}
                    className="h-10 w-10 rounded-full border-2 border-green-500/50"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-sm font-bold truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {profileName}
                    </p>
                    <p className={`text-xs truncate ${
                      isDarkMode ? 'text-zinc-400' : 'text-gray-500'
                    }`}>
                      {profileEmail}
                    </p>
                  </div>
                </motion.div>

                {/* Navegación principal */}
                <div className="mt-6 space-y-2">
                  <motion.p variants={itemVariants} className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-zinc-500' : 'text-gray-400'
                  }`}>
                    Finanzas
                  </motion.p>
                  
                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => {
                      navigate('/dashboard')
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(34,197,94,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-green-500/50 hover:bg-green-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700'
                    }`}
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
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => {
                      navigate('/exportar')
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(245,158,11,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-amber-400/50 hover:bg-amber-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700'
                    }`}
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
                        d="M4.5 12.75l7.5 7.5 7.5-7.5M12 4.5v15"
                      />
                    </svg>
                    <span className="hidden sm:inline">Exportar</span>
                  </motion.button>
                </div>

                {/* Sección de Herramientas */}
                <div className="mt-6 space-y-2">
                  <motion.p variants={itemVariants} className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-zinc-500' : 'text-gray-400'
                  }`}>
                    Herramientas
                  </motion.p>

                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => {
                      navigate('/reportes')
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(59,130,246,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-blue-500/50 hover:bg-blue-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'
                    }`}
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Reportes / Estadísticas</span>
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => {
                      navigate('/historial')
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(168,85,247,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-purple-500/50 hover:bg-purple-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700'
                    }`}
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Historial</span>
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => {
                      navigate('/soporte')
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(34,197,94,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-green-500/50 hover:bg-green-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700'
                    }`}
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
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Soporte / Ayuda</span>
                  </motion.button>
                </div>

                {/* Sección de usuario y configuración */}
                <div className="mt-6 space-y-2">
                  <motion.p variants={itemVariants} className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-zinc-500' : 'text-gray-400'
                  }`}>
                    Cuenta
                  </motion.p>

                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => {
                      navigate('/notificaciones')
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(234,179,8,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-yellow-500/50 hover:bg-yellow-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-yellow-500 hover:bg-yellow-50 hover:text-yellow-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
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
                          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Notificaciones</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => {
                      navigate('/configuracion')
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(6,182,212,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-cyan-500/50 hover:bg-cyan-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
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
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Configuración</span>
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={toggleTheme}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-indigo-500/50 hover:bg-indigo-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isDarkMode ? (
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
                            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                          />
                        </svg>
                      ) : (
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
                            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                          />
                        </svg>
                      )}
                      <span className="hidden sm:inline">
                        {isDarkMode ? 'Modo oscuro' : 'Modo claro'}
                      </span>
                    </div>
                    <div className={`h-5 w-9 rounded-full transition-colors ${
                      isDarkMode ? 'bg-green-500' : 'bg-slate-400'
                    }`}>
                      <div className={`h-5 w-5 rounded-full bg-white transition-transform ${
                        isDarkMode ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                  </motion.button>
                </div>

                {/* Cerrar sesión (se queda abajo sin stagger opcional) */}
                <motion.div 
                  variants={itemVariants}
                  className="mt-auto pb-5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('token')
                      localStorage.removeItem('usuario')
                      navigate('/login')
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(239,68,68,0.35)] ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 text-white hover:border-red-500/40 hover:bg-red-600/80'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-red-500 hover:bg-red-50 hover:text-red-700'
                    }`}
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
                    <span className="hidden sm:inline">Cerrar sesión</span>
                  </button>
                </motion.div>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}