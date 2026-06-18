import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";

export default function Noticias() {
  const { isDarkMode } = useTheme();

  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [imgErrores, setImgErrores] = useState({});
  const token = localStorage.getItem("token");

  const CATEGORIAS = useMemo(
    () => [
      { id: "economia", label: "Economía" },
      { id: "finanzas", label: "Finanzas" },
      { id: "dolar", label: "Dólar" },
      { id: "empleo", label: "Empleo" },
      { id: "todos", label: "Todos" },
    ],
    []
  );

  const tiempoRelativo = useCallback((fecha) => {
    if (!fecha) return "—";
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "—";
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "hace instantes";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    return `hace ${diffD} d`;
  }, []);

  const fetchNoticias = useCallback(
    async (categoria, pag) => {
      setCargando(true);
      setError(null);
      try {
        const res = await fetch(`/api/noticias?categoria=${categoria}&pagina=${pag}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al cargar noticias");
        }
        const data = await res.json();
        setArticulos(Array.isArray(data.articulos) ? data.articulos : []);
        setTotalResultados(Number(data.total) || 0);
      } catch (err) {
        setError(err?.message || "Error al cargar noticias");
      } finally {
        setCargando(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchNoticias(categoriaActiva, pagina);
  }, [categoriaActiva, pagina, fetchNoticias]);

  const cambiarCategoria = (id) => {
    setCategoriaActiva(id);
    setPagina(1);
    setImgErrores({});
  };

  const totalPaginas = Math.min(Math.ceil(totalResultados / 12), 10);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.2, type: "spring", stiffness: 400, damping: 25 },
    }),
    hover: {
      y: -5,
      scale: 1.01,
      transition: { type: "spring", stiffness: 500, damping: 20, duration: 0.15 },
    },
    tap: { scale: 0.99, duration: 0.05 },
  };

  const filterVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.15, type: "spring", stiffness: 500 },
    }),
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`mx-auto w-full max-w-7xl rounded-2xl border p-6 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-colors duration-300 ${
        isDarkMode ? "border-white/10 bg-white/[0.04]" : "border-gray-200 bg-white/70"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -5, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20, duration: 0.2 }}
            className={`grid h-12 w-12 place-items-center rounded-xl border font-black ${
              isDarkMode ? "border-yellow-300/20 bg-yellow-400/10 text-yellow-100" : "border-yellow-300 bg-yellow-100 text-yellow-700"
            }`}
          >
            📰
          </motion.div>
          <div>
            <h2 className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>Noticias Económicas</h2>
            <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              Mantente al tanto del panorama financiero actual
            </p>
          </div>
        </div>
        {totalResultados > 0 && (
          <motion.span
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.1 }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              isDarkMode ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-green-300 bg-green-50 text-green-700"
            }`}
          >
            {totalResultados.toLocaleString()} artículos
          </motion.span>
        )}
      </div>

      <motion.div className="mb-6 mt-6 flex flex-wrap items-center gap-2">
        {CATEGORIAS.map((cat, i) => (
          <motion.button
            key={cat.id}
            custom={i}
            variants={filterVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => cambiarCategoria(cat.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 sm:text-sm ${
              categoriaActiva === cat.id
                ? isDarkMode
                  ? "bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/20"
                  : "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                : isDarkMode
                ? "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                : "border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            {cat.label}
          </motion.button>
        ))}
      </motion.div>

      <div className="min-h-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                isDarkMode ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>⚠️ {error}</span>
                <button
                  type="button"
                  onClick={() => fetchNoticias(categoriaActiva, pagina)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold ${
                    isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Reintentar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cargando
          ? Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className={`overflow-hidden rounded-2xl border ${
                  isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
                }`}
              >
                <div className={`h-40 w-full animate-pulse ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />
                <div className="space-y-2 p-4">
                  <div className={`h-4 w-3/4 animate-pulse rounded ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />
                  <div className={`h-3 w-full animate-pulse rounded ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />
                  <div className={`h-3 w-5/6 animate-pulse rounded ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />
                </div>
              </motion.div>
            ))
          : articulos.map((art, idx) => (
              <motion.a
                key={idx}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isDarkMode
                    ? "border-white/10 bg-white/5 hover:border-yellow-500/30 hover:bg-white/10"
                    : "border-gray-200 bg-white hover:border-yellow-400 hover:bg-gray-50"
                }`}
              >
                <div className="relative h-40 overflow-hidden">
                  {!imgErrores[idx] ? (
                    <img
                      src={art.imagen}
                      alt={art.titulo}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => setImgErrores((prev) => ({ ...prev, [idx]: true }))}
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center text-5xl ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}>
                      📰
                    </div>
                  )}
                  <span
                    className={`absolute bottom-2 left-2 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md ${
                      isDarkMode ? "border-white/10 bg-black/60 text-white" : "border-white bg-white/80 text-gray-900"
                    }`}
                  >
                    {art.fuente}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3
                      className={`line-clamp-2 text-sm font-bold leading-tight sm:text-base ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {art.titulo}
                    </h3>
                    <p
                      className={`mt-2 line-clamp-3 text-xs leading-relaxed sm:text-sm ${
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {art.descripcion}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}>
                      🕐 {tiempoRelativo(art.fecha)}
                    </span>
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isDarkMode ? "text-yellow-400 group-hover:text-yellow-300" : "text-yellow-600 group-hover:text-yellow-500"
                      }`}
                    >
                      Leer más →
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
      </div>

      {!cargando && totalPaginas > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isDarkMode
                ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            ← Anterior
          </motion.button>
          <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
            Página {pagina} de {totalPaginas}
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isDarkMode
                ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Siguiente →
          </motion.button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.15 }}
        className={`mt-5 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between ${
          isDarkMode ? "text-slate-500" : "text-gray-600"
        }`}
      >
        <span>Contenido actualizado en tiempo real</span>
        <span>Haz clic en una noticia para leer el artículo completo</span>
      </motion.div>
    </motion.div>
  );
}
