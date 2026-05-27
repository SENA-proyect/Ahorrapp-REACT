import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

const truncate = (text = '', max = 0) => {
  const s = String(text ?? '').trim()
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max).trimEnd() + '…'
}

const iconosPorCategoria = { economia: '📈', finanzas: '💳', dolar: '💱', empleo: '🧑‍💼', todos: '📰' }
const filtros = [
  { id: 'economia', label: 'Economía' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'dolar', label: 'Dólar' },
  { id: 'empleo', label: 'Empleo' },
  { id: 'todos', label: 'Todos' },
]
const placeholders = {
  economia: 'https://images.unsplash.com/photo-1556761175-129418cb2dfe?auto=format&fit=crop&w=1200&q=60',
  finanzas: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1200&q=60',
  dolar: 'https://images.unsplash.com/photo-1625104697168-2baf2e8f9c2e?auto=format&fit=crop&w=1200&q=60',
  empleo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=60',
  todos: 'https://images.unsplash.com/photo-1559523405-9c3d8f5f1e8a?auto=format&fit=crop&w=1200&q=60',
}

export default function NewsDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const { isDarkMode } = useTheme()
  const [categoria, setCategoria] = useState('todos')
  const pagina = 1
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const icono = useMemo(() => iconosPorCategoria[categoria] || '📰', [categoria])
  const containerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchNoticias = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/noticias?categoria=${categoria}&pagina=${pagina}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Error al cargar noticias')
        const data = await res.json()
        const list = Array.isArray(data?.articulos) ? data.articulos : []
        if (!isMounted) return
        setNoticias(list.slice(0, 12))
      } catch (e) {
        if (!isMounted) return
        setError(e?.message || 'Error al cargar noticias')
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    }
    fetchNoticias()
    return () => {
      isMounted = false
    }
  }, [categoria, pagina, token])

  const updateScrollButtons = () => {
    const el = containerRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
    const epsilon = 2
    setCanScrollLeft(scrollLeft > epsilon)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - epsilon)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const timer = setTimeout(() => updateScrollButtons(), 100)
    const onScroll = () => updateScrollButtons()
    const onResize = () => updateScrollButtons()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [noticias, loading])

  const scrollLeft = () => containerRef.current?.scrollBy({ left: -320, behavior: 'smooth' })
  const scrollRight = () => containerRef.current?.scrollBy({ left: 320, behavior: 'smooth' })

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  }

  const filterVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.2, type: 'spring', stiffness: 500 }
    })
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 15 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { delay: i * 0.04, duration: 0.25, type: 'spring', stiffness: 400, damping: 25 }
    }),
    hover: {
      y: -6,
      scale: 1.02,
      transition: { type: 'spring', stiffness: 500 }
    }
  }

  const loadingItemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.05, duration: 0.2 }
    })
  }

  const scrollButtonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
    hover: { scale: 1.15, transition: { type: 'spring', stiffness: 400 } },
    tap: { scale: 0.9 }
  }

  const iconVariants = {
    hidden: { rotate: -15, scale: 0.8 },
    visible: { rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 600, damping: 15 } }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`backdrop-blur-md rounded-3xl border p-6 shadow-2xl mb-8 w-full transition-colors duration-300 sm:p-8 ${
        isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white/70'
      }`}
    >
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Últimas Noticias Económicas
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Resumen rápido de titulares recientes
          </motion.p>
        </div>
        <motion.div
          variants={iconVariants}
          initial="hidden"
          animate="visible"
          className={`hidden items-center justify-center rounded-xl border px-4 py-2 text-2xl opacity-80 sm:flex ${
            isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-300 bg-gray-100'
          }`}
        >
          {icono}
        </motion.div>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        {filtros.map((f, idx) => (
          <motion.button
            key={f.id}
            custom={idx}
            variants={filterVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setCategoria(f.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 sm:text-sm ${
              f.id === categoria
                ? 'scale-105 bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/20'
                : isDarkMode
                ? 'border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                : 'border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                custom={i}
                variants={loadingItemVariants}
                initial="hidden"
                animate="visible"
                className={`flex-none w-[280px] rounded-2xl border p-4 sm:w-[320px] ${
                  isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100'
                }`}
              >
                <div className={`h-40 w-full animate-pulse rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                <div className={`mt-4 h-5 w-3/4 animate-pulse rounded ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                <div className={`mt-2 h-4 w-full animate-pulse rounded ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                <div className={`mt-2 h-4 w-5/6 animate-pulse rounded ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                <div className={`mt-4 h-10 w-28 animate-pulse rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`rounded-xl border p-5 text-center ${
              isDarkMode ? 'border-rose-500/30 bg-rose-500/10' : 'border-red-300 bg-red-50'
            }`}
          >
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-rose-200' : 'text-red-700'}`}>⚠️ {error}</p>
          </motion.div>
        )}

        {!loading && !error && noticias.length > 0 && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`mb-4 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Mostrando {Math.min(3, noticias.length)} de {noticias.length} noticias
            </div>
            <div className="relative group">
              <motion.button
                type="button"
                onClick={scrollLeft}
                aria-label="Anterior"
                variants={scrollButtonVariants}
                initial="hidden"
                animate={canScrollLeft ? "visible" : "hidden"}
                whileHover="hover"
                whileTap="tap"
                className={`absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border text-white shadow-xl transition-colors duration-200 ${
                  isDarkMode ? 'border-white/10 bg-gray-800' : 'border-gray-400 bg-gray-300'
                }`}
                disabled={!canScrollLeft}
              >
                ❮
              </motion.button>

              <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {noticias.map((n, idx) => {
                  const imgSrc = n.image_url || n.imagen || n.imageUrl
                  const fuente = n.fuente || 'Desconocida'
                  const fallback = placeholders[categoria] || placeholders.todos
                  const src = imgSrc || fallback
                  return (
                    <motion.article
                      key={idx}
                      custom={idx}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      className={`flex-none w-[280px] cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 sm:w-[320px] ${
                        isDarkMode
                          ? 'border-white/10 bg-gray-800/40 hover:border-yellow-500/30 hover:bg-gray-800/60'
                          : 'border-gray-200 bg-white hover:border-yellow-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative h-40 overflow-hidden group/img">
                        <motion.img
                          src={src}
                          alt={n.titulo || 'Noticia'}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget
                            if (target.dataset.fallbackApplied === '1') return
                            target.dataset.fallbackApplied = '1'
                            target.src = fallback
                          }}
                          className="h-full w-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02, duration: 0.2 }}
                          className={`absolute bottom-2 left-2 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md ${
                            isDarkMode ? 'border-white/10 bg-black/60 text-white' : 'border-white bg-white/80 text-gray-900'
                          }`}
                        >
                          {fuente}
                        </motion.div>
                      </div>
                      <div className="p-4">
                        <h3 className={`min-h-[40px] line-clamp-2 text-sm font-bold leading-tight sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {truncate(n.titulo, 60)}
                        </h3>
                        <p className={`mt-2 line-clamp-3 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {truncate(n.descripcion, 90)}
                        </p>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (n.url) window.open(n.url, '_blank', 'noopener,noreferrer')
                          }}
                          className={`mt-4 w-full rounded-lg py-2 text-xs font-bold transition-all hover:shadow-lg sm:text-sm ${
                            isDarkMode
                              ? 'bg-cyan-500/90 text-slate-900 hover:bg-cyan-400 hover:shadow-cyan-500/20'
                              : 'bg-cyan-400 text-white hover:bg-cyan-500 hover:shadow-cyan-400/20'
                          }`}
                        >
                          Leer más →
                        </motion.button>
                      </div>
                    </motion.article>
                  )
                })}
              </div>

              <motion.button
                type="button"
                onClick={scrollRight}
                aria-label="Siguiente"
                variants={scrollButtonVariants}
                initial="hidden"
                animate={canScrollRight ? "visible" : "hidden"}
                whileHover="hover"
                whileTap="tap"
                className={`absolute right-0 top-1/2 z-20 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border text-white shadow-xl transition-colors duration-200 ${
                  isDarkMode ? 'border-white/10 bg-gray-800' : 'border-gray-400 bg-gray-300'
                }`}
                disabled={!canScrollRight}
              >
                ❯
              </motion.button>
            </div>
          </motion.div>
        )}

        {!loading && !error && noticias.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`py-8 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}
          >
            <p className="text-lg font-medium">📭 No hay noticias disponibles</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}