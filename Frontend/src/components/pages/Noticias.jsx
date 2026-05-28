import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/noticias.css"


export default function Noticias() {
  const navigate = useNavigate();

  const handleVolverAtras = () => {
    navigate(-1);
  };

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

  const SkeletonCard = () => {
    return (
      <div className="noticia-card noticia-skeleton" aria-hidden="true">
        <div className="skeleton-img" />
        <div className="skeleton-body">
          <div className="skeleton-line largo" />
          <div className="skeleton-line medio" />
          <div className="skeleton-line corto" />
        </div>
      </div>
    );
  };

  return (
    <div className="noticias-container">
      <button type="button" className="btn-volver-atras" onClick={handleVolverAtras}>
        ← Volver atrás
      </button>

      <div className="noticias-header">
        <div>
          <h1 className="noticias-title">
            <span>📰</span> Noticias Económicas
          </h1>
          <p className="noticias-subtitle">Mantente al tanto del panorama financiero actual</p>
        </div>
        {totalResultados > 0 && (
          <span className="noticias-badge">{totalResultados.toLocaleString()} artículos</span>
        )}
      </div>

      <div className="categorias-bar">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            className={`cat-btn ${categoriaActiva === cat.id ? "activa" : ""}`}
            onClick={() => cambiarCategoria(cat.id)}
            type="button"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="noticias-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button type="button" onClick={() => fetchNoticias(categoriaActiva, pagina)}>
            Reintentar
          </button>
        </div>
      )}

      <div className="noticias-grid">
        {cargando
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : articulos.map((art, idx) => (
              <a
                key={idx}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className="noticia-card"
              >
                <div className="noticia-img-wrap">
                  {!imgErrores[idx] ? (
                    <img
                      src={art.imagen}
                      alt={art.titulo}
                      className="noticia-img"
                      onError={() => setImgErrores((prev) => ({ ...prev, [idx]: true }))}
                    />
                  ) : (
                    <div className="noticia-img-fallback">📰</div>
                  )}
                  <span className="noticia-fuente">{art.fuente}</span>
                </div>

                <div className="noticia-body">
                  <h3 className="noticia-titulo">{art.titulo}</h3>
                  <p className="noticia-desc">{art.descripcion}</p>
                  <div className="noticia-meta">
                    <span className="noticia-tiempo">🕐 {tiempoRelativo(art.fecha)}</span>
                    <span className="noticia-leer">Leer más →</span>
                  </div>
                </div>
              </a>
            ))}
      </div>

      {!cargando && totalPaginas > 1 && (
        <div className="paginacion">
          <button
            className="pag-btn"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
            type="button"
          >
            ← Anterior
          </button>
          <span className="pag-info">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            className="pag-btn"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            type="button"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

