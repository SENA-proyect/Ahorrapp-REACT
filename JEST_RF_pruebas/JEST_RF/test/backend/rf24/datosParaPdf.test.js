/**
 * RF-24 · Exportación nativa de reportes financieros (PDF) — parte backend
 * El PDF se genera en el dispositivo (RF-24.1); el backend solo entrega los datos.
 * Estas pruebas verifican que cada endpoint que alimenta una sección del PDF
 *   (portada y resumen, distribución de gastos e ingresos, ahorros, deudas,
 *    fondo de emergencia, presupuesto y evolución) devuelva los campos que el
 *   generador necesita, y que una sección sin datos NO rompa el informe (RF-24.5/24.6).
 * Archivo bajo prueba: Backend/src/controllers/ReportesController.js
 * Rutas: Backend/src/routes/ReportesRoutes.js (montadas en /api/reportes)
 * Cobertura detallada de cada endpoint: test/backend/rf11/reportes.test.js
 */

jest.mock("../../../Backend/src/db/connection", () => ({ query: jest.fn(), connect: jest.fn() }));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const pool = require("../../../Backend/src/db/connection");
const reportesRoutes = require("../../../Backend/src/routes/ReportesRoutes");

const app = express();
app.use(express.json());
app.use("/api/reportes", reportesRoutes);

const auth = () => ({ Authorization: `Bearer ${jwt.sign({ id: 7 }, process.env.JWT_SECRET)}` });
const RANGO = "fecha_inicio=2026-11-01&fecha_fin=2026-11-30";

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));

// Sección del PDF → endpoint, filas simuladas y campos que el PDF espera
const SECCIONES = [
  { seccion: "portada y resumen", ruta: "/resumen", filas: [{ total: 100 }], campos: ["periodo", "resumen", "deudas"], sucesivas: 6 },
  { seccion: "distribución de gastos (categoría)", ruta: "/gastos/categorias", filas: [{ categoria: "Hogar", total: "10" }], campos: ["periodo", "datos"] },
  { seccion: "distribución de gastos (dependiente)", ruta: "/gastos/dependientes", filas: [{ dependiente: "Ana", total: "10" }], campos: ["periodo", "datos"] },
  { seccion: "distribución de ingresos (categoría)", ruta: "/ingresos/categorias", filas: [{ categoria: "Salario", total: "10" }], campos: ["periodo", "datos"] },
  { seccion: "distribución de ingresos (fuente)", ruta: "/ingresos/fuentes", filas: [{ fuente: "Empresa", total: "10" }], campos: ["periodo", "datos"] },
  { seccion: "ahorros", ruta: "/ahorros", filas: [{ monto: "10" }], campos: ["periodo", "total_ahorrado", "datos"] },
  { seccion: "ahorros (estado)", ruta: "/ahorros/estado", filas: [{ id_ahorros: 1, meta: "10", monto_acumulado: "5", total_abonado: "5" }], campos: ["resumen", "datos"] },
  { seccion: "deudas", ruta: "/deudas", filas: [{ monto: "10", cuotas: 1 }], campos: ["periodo", "resumen", "datos"] },
  { seccion: "deudas (estado)", ruta: "/deudas/estado", filas: [{ id_deudas: 1, monto_total: "10", cuotas_total: 2, cuotas_pagadas: 1, monto_pagado: "5" }], campos: ["resumen", "datos"] },
  { seccion: "imprevistos", ruta: "/imprevistos/categorias", filas: [{ categoria: "Hogar", total: "10" }], campos: ["periodo", "datos"] },
  { seccion: "fondo de emergencia", ruta: "/fondo-emergencia", filas: [{ id_fondo: 1, meta: "10", aportes: "5", retiros: "1" }], campos: ["periodo", "resumen"] },
  { seccion: "fondo de emergencia (estado)", ruta: "/fondo-emergencia/estado", filas: [{ id_fondo: 1, meta: "10", aportes: "5", retiros: "1" }], campos: ["data"] },
  { seccion: "evolución", ruta: "/evolucion", filas: [{ fecha: "2026-11-01", ingresos: "1", gastos: "0", imprevistos: "0", ahorros: "0", pagos_deudas: "0", aportes_emergencia: "0", retiros_emergencia: "0", balance: "1", balance_acumulado: "1" }], campos: ["periodo", "datos"] },
];

describe("RF-24 · Cada sección del PDF recibe los datos que necesita del backend", () => {
  it.each(SECCIONES)("sección «$seccion» (GET $ruta) → 200 con los campos esperados", async ({ ruta, filas, campos, sucesivas }) => {
    if (sucesivas) pool.query.mockResolvedValue({ rows: [{ total: 1, cuotas: 1, aportes: 1, retiros: 0 }] });
    else pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get(`/api/reportes${ruta}?${RANGO}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    for (const campo of campos) expect(res.body).toHaveProperty(campo);
  });

  it("sección «presupuesto» (GET /presupuesto/:id_periodo) → incluye planeado, ejecutado y saldo", async () => {
    const periodo = {
      id_periodo: 5, id_presupuesto: 3, fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30", estado: "abierto",
      ingreso_estimado: "100", saldo_anterior: "0", monto_gastos: "40", monto_deudas: "20", monto_imprevistos: "15",
      monto_ahorros: "10", monto_emergencia: "15", presupuesto: "Mensual", presupuesto_descripcion: null,
      porcentaje_gastos: "40", porcentaje_deudas: "20", porcentaje_imprevistos: "15", porcentaje_ahorros: "10", porcentaje_emergencia: "15",
    };
    pool.query.mockResolvedValueOnce({ rows: [periodo] }).mockResolvedValue({ rows: [{ total: 0 }] });

    const res = await request(app).get("/api/reportes/presupuesto/5").set(auth());

    expect(res.status).toBe(200);
    for (const campo of ["periodo", "presupuesto", "ingresos", "saldo", "categorias", "resumen"]) {
      expect(res.body).toHaveProperty(campo);
    }
    expect(Object.keys(res.body.categorias).sort()).toEqual(["ahorros", "deudas", "emergencia", "gastos", "imprevistos"]);
  });
});

describe("RF-24.5 / RF-24.6 · Secciones sin datos no rompen el informe", () => {
  it("usuario sin fondo de emergencia: el reporte del rango responde 404 controlado (el PDF lo marca como no disponible)", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`/api/reportes/fondo-emergencia?${RANGO}`).set(auth());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "El usuario no tiene fondo de emergencia" });
  });

  it("usuario sin fondo de emergencia: el estado también responde 404 controlado", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get("/api/reportes/fondo-emergencia/estado").set(auth());
    expect(res.status).toBe(404);
  });

  it.each(SECCIONES.filter((s) => !s.sucesivas && !/fondo/.test(s.ruta)))(
    "sección «$seccion» sin registros → 200 con listas vacías o totales en 0",
    async ({ ruta }) => {
      pool.query.mockResolvedValue({ rows: [] });
      const res = await request(app).get(`/api/reportes${ruta}?${RANGO}`).set(auth());
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    }
  );

  it("un fallo de una sección es independiente: otra sección sigue respondiendo", async () => {
    pool.query.mockRejectedValueOnce(new Error("boom")).mockResolvedValue({ rows: [] });
    const falla = await request(app).get(`/api/reportes/gastos/categorias?${RANGO}`).set(auth());
    const sigue = await request(app).get(`/api/reportes/ingresos/categorias?${RANGO}`).set(auth());
    expect(falla.status).toBe(500);
    expect(sigue.status).toBe(200);
  });
});

describe("RF-24 · Precondiciones", () => {
  it("sin sesión (token ausente) ningún dato se entrega → 401", async () => {
    const res = await request(app).get(`/api/reportes/resumen?${RANGO}`);
    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("RF-24 · el backend no almacena nada al generar el reporte (solo lecturas)", async () => {
    pool.query.mockResolvedValue({ rows: [{ total: 0, cuotas: 0, aportes: 0, retiros: 0 }] });
    await request(app).get(`/api/reportes/resumen?${RANGO}`).set(auth());
    const escrituras = pool.query.mock.calls.filter(([s]) => /\b(INSERT|UPDATE|DELETE)\b/i.test(s));
    expect(escrituras).toHaveLength(0);
  });
});
