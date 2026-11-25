const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const noticiasRoutes = require("../../../Backend/src/routes/noticiasRoutes");
const alphaVantageRoutes = require("../../../Backend/src/routes/alphaVantageRoutes");

const app = express();
app.use(express.json());
app.use("/api/noticias", noticiasRoutes);
app.use("/api", alphaVantageRoutes);

const auth = () => ({
  Authorization: `Bearer ${jwt.sign({ id: 52 }, process.env.JWT_SECRET)}`,
});

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RF-29 · Noticias e indicadores de mercado", () => {
  it("consulta noticias en español, pagina y filtra artículos incompletos", async () => {
    const fetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        totalResults: 3,
        articles: [
          {
            title: "Economía local",
            description: "Resumen financiero",
            url: "https://news.example/article",
            urlToImage: "https://news.example/image.jpg",
            source: { name: "Diario" },
            publishedAt: "2026-11-25T10:00:00Z",
            author: "Redacción",
          },
          {
            title: "[Removed]",
            description: "Artículo retirado",
            url: "https://news.example/removed",
            urlToImage: "https://news.example/removed.jpg",
          },
          {
            title: "Sin imagen",
            description: "No cumple los requisitos de visualización",
            url: "https://news.example/no-image",
            urlToImage: null,
          },
        ],
      }),
    });

    const response = await request(app)
      .get("/api/noticias?categoria=finanzas&pagina=2")
      .set(auth());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 3,
      pagina: 2,
      articulos: [
        {
          titulo: "Economía local",
          descripcion: "Resumen financiero",
          url: "https://news.example/article",
          imagen: "https://news.example/image.jpg",
          fuente: "Diario",
          fecha: "2026-11-25T10:00:00Z",
          autor: "Redacción",
        },
      ],
    });
    const requestedUrl = new URL(fetch.mock.calls[0][0]);
    expect(requestedUrl.searchParams.get("language")).toBe("es");
    expect(requestedUrl.searchParams.get("page")).toBe("2");
    expect(requestedUrl.searchParams.get("q")).toContain("finanzas personales");
  });

  it("entrega la cotización USD/COP de Finnhub cuando está disponible", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ quote: { COP: 4125.5 } }),
    });

    const response = await request(app).get("/api/bolsa/trm/usd-cop");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, trm: 4125.5 });
  });

  it("usa la TRM de respaldo cuando el servicio externo no la devuelve", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "No disponible" }),
    });

    const response = await request(app).get("/api/bolsa/trm/usd-cop");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: false,
      mensaje: "No disponible",
      trm: 4200,
    });
  });

  it("requiere autenticación para consultar noticias", async () => {
    const fetch = jest.spyOn(global, "fetch");

    const response = await request(app).get("/api/noticias");

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
});
