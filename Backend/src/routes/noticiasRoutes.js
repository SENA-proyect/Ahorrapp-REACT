// routes/noticias.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = "https://newsapi.org/v2/everything";

// GET /api/noticias?categoria=economia&pagina=1
router.get("/", verifyToken, async (req, res) => {
  const { categoria = "economia finanzas", pagina = 1 } = req.query;

  // Mapeo de categorías a queries de búsqueda (puedes expandir)
  const queries = {
    economia: "economía inflación PIB Colombia",
    finanzas: "finanzas personales ahorro inversión",
    dolar: "dólar tipo de cambio Colombia peso",
    empleo: "empleo trabajo desempleo Colombia",
    todos: "economía finanzas Colombia mercados",
  };

  const queryString = queries[categoria] || queries["todos"];

  try {
    const url = new URL(NEWS_API_URL);
    url.searchParams.set("q", queryString);
    url.searchParams.set("language", "es");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "12");
    url.searchParams.set("page", pagina);
    url.searchParams.set("apiKey", NEWS_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      console.error("NewsAPI error:", errorData);
      return res.status(response.status).json({
        error: "Error al obtener noticias",
        detalle: errorData.message,
      });
    }

    const data = await response.json();

    // Filtrar artículos sin imagen o con fuente "[Removed]"
    const articulosFiltrados = data.articles
      .filter(
        (a) =>
          a.title !== "[Removed]" &&
          a.description &&
          a.url &&
          a.urlToImage
      )
      .map((a) => ({
        titulo: a.title,
        descripcion: a.description,
        url: a.url,
        imagen: a.urlToImage,
        fuente: a.source?.name || "Desconocida",
        fecha: a.publishedAt,
        autor: a.author || null,
      }));

    res.json({
      total: data.totalResults,
      pagina: parseInt(pagina),
      articulos: articulosFiltrados,
    });
  } catch (error) {
    console.error("Error en /api/noticias:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;