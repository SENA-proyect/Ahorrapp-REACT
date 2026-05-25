import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const truncate = (text = '', max = 0) => {
  const s = String(text ?? '').trim()
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max).trimEnd() + '…'
}

const iconosPorCategoria = {
  economia: '📈', finanzas: '💳', dolar: '💱', empleo: '🧑‍💼', todos: '',
}

const filtros = [
  { id: 'economia', label: 'Economía' }, { id: 'finanzas', label: 'Finanzas' },
  { id: 'dolar', label: 'Dólar' }, { id: 'empleo', label: 'Empleo' }, { id: 'todos', label: 'Todos' },
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
  const [categoria, setCategoria] = useState('todos')
  const pagina = 1
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const icono = useMemo(() => iconosPorCategoria[categoria] || '', [categoria])

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
    return () => { isMounted = false }
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
    
    // Pequeño delay para asegurar que el DOM ya tiene el ancho correcto
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

  return (
    // 🔥 CONTENEDOR PRINCIPAL: Imita el estilo de "Bolsa de Valores"
    <div className="bg-gray-900/60 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 w-full shadow-2xl mb-8">
      
      {/* Header de Noticias */}
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Últimas Noticias Económicas</h2>
          <p className="mt-1 text-sm text-gray-400">Resumen rápido de titulares recientes</p>
        </div>
        <div className="hidden sm:flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-2xl opacity-80">
          {icono}
        </div>
      </header>

      {/* Filtros */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {filtros.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setCategoria(f.id)}
            className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 ${
              f.id === categoria
                ? 'bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/20 scale-105'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-none w-[280px] sm:w-[320px] rounded-2xl bg-white/5 border border-white/10 p-4 animate-pulse">
              <div className="h-40 w-full rounded-xl bg-white/10" />
              <div className="mt-4 h-5 w-3/4 rounded bg-white/10" />
              <div className="mt-2 h-4 w-full rounded bg-white/10" />
              <div className="mt-2 h-4 w-5/6 rounded bg-white/10" />
              <div className="mt-4 h-10 w-28 rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
          <p className="text-sm font-semibold text-rose-200">️ {error}</p>
        </div>
      )}

      {/* Noticias */}
      {!loading && !error && noticias.length > 0 && (
        <div>
          <div className="mb-4 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
            Mostrando {Math.min(3, noticias.length)} de {noticias.length} noticias
          </div>

          <div className="relative group">
            {/* Botón Izquierdo */}
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Anterior"
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-gray-800 border border-white/10 text-white shadow-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-yellow-500 hover:text-slate-900 hover:scale-110 ${
                canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              disabled={!canScrollLeft}
            >
              ❮
            </button>

            {/* Carrusel */}
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
                  <article key={idx} className="flex-none w-[280px] sm:w-[320px] rounded-2xl bg-gray-800/40 border border-white/10 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-gray-800/60 hover:border-yellow-500/30">
                    <div className="relative h-40 overflow-hidden group/img">
                      <img
                        src={src}
                        alt={n.titulo || 'Noticia'}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget
                          if (target.dataset.fallbackApplied === '1') return
                          target.dataset.fallbackApplied = '1'
                          target.src = fallback
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wide border border-white/10">
                        {fuente}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2 min-h-[40px]">
                        {truncate(n.titulo, 60)}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-3">
                        {truncate(n.descripcion, 90)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (n.url) {
                            window.open(n.url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                        className="mt-4 w-full py-2 rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-slate-900 font-bold text-xs sm:text-sm transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                      >
                        Leer más →
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Botón Derecho */}
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Siguiente"
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-10 h-10 rounded-full bg-gray-800 border border-white/10 text-white shadow-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-yellow-500 hover:text-slate-900 hover:scale-110 ${
                canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              disabled={!canScrollRight}
            >
              ❯
            </button>
          </div>
        </div>
      )}

      {!loading && !error && noticias.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium">📭 No hay noticias disponibles</p>
        </div>
      )}
    </div>
  )
}