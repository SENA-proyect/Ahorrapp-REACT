/**
 * RF-11 · Generar reportes financieros (backend)
 * Archivo bajo prueba: Backend/src/controllers/ReportesController.js
 *   → getReporteResumen, getGastosPorCategoria, getGastosPorDependiente,
 *     getIngresosPorCategoria, getIngresosPorFuente, getReporteAhorros, getReporteDeudas,
 *     getImprevistosPorCategoria, getReporteFondoEmergencia, getReportePresupuesto,
 *     getEvolucionTemporal, getEstadoAhorros, getEstadoDeudas, getEstadoFondoEmergencia
 * Rutas: Backend/src/routes/ReportesRoutes.js (montadas en /api/reportes)
 * Estrategia: app Express de prueba; BD mockeada; JWT firmado de verdad.
 * El RF-24 (PDF) consume estos mismos endpoints; ver también test/backend/rf24.
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

const USER_ID = 7;
const BASE = "/api/reportes";
const auth = () => ({ Authorization: `Bearer ${jwt.sign({ id: USER_ID }, process.env.JWT_SECRET)}` });
const RANGO = "fecha_inicio=2026-11-01&fecha_fin=2026-11-30";
const MSG_FECHAS = "Debe proporcionar fecha_inicio y fecha_fin válidas";

// Endpoints de reporte que exigen rango de fechas (RF-11.2)
const CON_RANGO = [
  ["resumen", "/resumen"],
  ["gastos por categoría", "/gastos/categorias"],
  ["gastos por dependiente", "/gastos/dependientes"],
  ["ingresos por categoría", "/ingresos/categorias"],
  ["ingresos por fuente", "/ingresos/fuentes"],
  ["ahorros", "/ahorros"],
  ["deudas", "/deudas"],
  ["imprevistos por categoría", "/imprevistos/categorias"],
  ["fondo de emergencia", "/fondo-emergencia"],
  ["evolución temporal", "/evolucion"],
];
// Endpoints de "estado actual" (sin rango)
const ESTADOS = [
  ["estado de ahorros", "/ahorros/estado"],
  ["estado de deudas", "/deudas/estado"],
  ["estado del fondo de emergencia", "/fondo-emergencia/estado"],
];

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

// ═════════════════════════════════════════════════════════════
describe("RF-11 · Autenticación requerida (precondición: sesión iniciada)", () => {
  const todas = [...CON_RANGO, ...ESTADOS, ["presupuesto de un período", "/presupuesto/5"]];

  it.each(todas)("GET %s sin token → 401 y no consulta la BD", async (_n, ruta) => {
    const res = await request(app).get(`${BASE}${ruta}?${RANGO}`);
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it.each(todas)("GET %s con token inválido → 401", async (_n, ruta) => {
    const res = await request(app).get(`${BASE}${ruta}?${RANGO}`).set("Authorization", "Bearer token.falso.xyz");
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });
});

// ═════════════════════════════════════════════════════════════
//  RF-11.2 · Los reportes de rango exigen fecha de inicio y de fin
// ═════════════════════════════════════════════════════════════
describe("RF-11.2 · Validación del rango de fechas", () => {
  const invalidos = [
    ["sin parámetros", ""],
    ["falta fecha_inicio", "fecha_fin=2026-11-30"],
    ["falta fecha_fin", "fecha_inicio=2026-11-01"],
    ["fecha_inicio vacía", "fecha_inicio=&fecha_fin=2026-11-30"],
    ["fecha_fin vacía", "fecha_inicio=2026-11-01&fecha_fin="],
    ["formato incorrecto (DD/MM/AAAA)", "fecha_inicio=01/11/2026&fecha_fin=30/11/2026"],
    ["fecha inexistente (31 de febrero)", "fecha_inicio=2026-02-31&fecha_fin=2026-03-10"],
    ["mes 13", "fecha_inicio=2026-13-01&fecha_fin=2026-13-20"],
    ["texto no fecha", "fecha_inicio=abc&fecha_fin=xyz"],
    ["ISO con hora (no es AAAA-MM-DD)", "fecha_inicio=2026-11-01T00:00:00&fecha_fin=2026-11-30T00:00:00"],
    ["inicio posterior al fin", "fecha_inicio=2026-11-30&fecha_fin=2026-11-01"],
    ["parámetro repetido (arreglo)", "fecha_inicio=2026-11-01&fecha_inicio=2026-11-02&fecha_fin=2026-11-30"],
  ];

  describe.each(CON_RANGO)("GET %s", (_nombre, ruta) => {
    it.each(invalidos)("%s → 400 sin consultar la BD", async (_n, qs) => {
      const res = await request(app).get(`${BASE}${ruta}?${qs}`).set(auth());
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ ok: false, mensaje: MSG_FECHAS });
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  it("un rango de un solo día (inicio = fin) es válido", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/gastos/categorias?fecha_inicio=2026-11-05&fecha_fin=2026-11-05`).set(auth());
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════
//  Resumen  ·  GET /api/reportes/resumen
// ═════════════════════════════════════════════════════════════
describe("RF-11 · Resumen (GET /api/reportes/resumen)", () => {
  // Orden de consultas: ingresos, gastos, imprevistos, ahorros, deudas, fondo
  const simular = ({ ing = 0, gas = 0, imp = 0, aho = 0, deu = 0, cuotas = 0, apo = 0, ret = 0 } = {}) =>
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: ing }] })
      .mockResolvedValueOnce({ rows: [{ total: gas }] })
      .mockResolvedValueOnce({ rows: [{ total: imp }] })
      .mockResolvedValueOnce({ rows: [{ total: aho }] })
      .mockResolvedValueOnce({ rows: [{ total: deu, cuotas }] })
      .mockResolvedValueOnce({ rows: [{ aportes: apo, retiros: ret }] });

  it("consolida todos los módulos en el rango y calcula el balance", async () => {
    simular({ ing: "3000000", gas: "900000", imp: "200000", aho: "300000", deu: "400000", cuotas: "4", apo: "150000", ret: "50000" });

    const res = await request(app).get(`${BASE}/resumen?${RANGO}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      periodo: { fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30" },
      resumen: {
        ingresos: 3000000,
        gastos: 900000,
        imprevistos: 200000,
        ahorros: 300000,
        pagos_deudas: 400000,
        fondo_emergencia: { aportes: 150000, retiros: 50000, neto: 100000 },
        // 3.000.000 − 900.000 − 200.000 − 300.000 − 400.000 − 150.000 + 50.000
        balance: 1100000,
      },
      deudas: { monto_pagado: 400000, cuotas_pagadas: 4 },
    });
  });

  it("RF-11.3 · cada consulta se filtra por el usuario del token y el rango pedido", async () => {
    simular();
    await request(app).get(`${BASE}/resumen?${RANGO}`).set(auth());

    expect(pool.query).toHaveBeenCalledTimes(6);
    for (const [sql, params] of pool.query.mock.calls) {
      expect(params).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
      expect(sql).toMatch(/\$1/);
      expect(sql).toMatch(/BETWEEN \$2 AND \$3/);
    }
  });

  it("RF-11.6 · sin información registrada todas las secciones salen en 0 (no falla)", async () => {
    simular();
    const res = await request(app).get(`${BASE}/resumen?${RANGO}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.resumen).toEqual({
      ingresos: 0, gastos: 0, imprevistos: 0, ahorros: 0, pagos_deudas: 0,
      fondo_emergencia: { aportes: 0, retiros: 0, neto: 0 },
      balance: 0,
    });
  });

  it("el retiro del fondo vuelve a estar disponible (suma al balance)", async () => {
    simular({ ing: 1000, ret: 400 });
    const res = await request(app).get(`${BASE}/resumen?${RANGO}`).set(auth());
    expect(res.body.resumen.balance).toBe(1400);
  });

  it("un balance negativo se informa tal cual (gastó más de lo que ingresó)", async () => {
    simular({ ing: 100, gas: 500 });
    const res = await request(app).get(`${BASE}/resumen?${RANGO}`).set(auth());
    expect(res.body.resumen.balance).toBe(-400);
  });

  it("error en alguna consulta → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("db caída"));
    const res = await request(app).get(`${BASE}/resumen?${RANGO}`).set(auth());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
  });
});

// ═════════════════════════════════════════════════════════════
//  Reportes por categoría / dependiente / fuente
// ═════════════════════════════════════════════════════════════
describe("RF-11 · Distribuciones por categoría, dependiente y fuente", () => {
  const casos = [
    ["gastos por categoría", "/gastos/categorias", [{ id_categoria: 1, categoria: "Hogar", total: "500000" }]],
    ["gastos por dependiente", "/gastos/dependientes", [{ id_dependientes: 2, dependiente: "Ana", total: "120000" }]],
    ["ingresos por categoría", "/ingresos/categorias", [{ id_categoria: 3, categoria: "Salario", total: "3000000" }]],
    ["ingresos por fuente", "/ingresos/fuentes", [{ fuente: "Empresa SA", total: "3000000" }]],
    ["imprevistos por categoría", "/imprevistos/categorias", [{ id_categoria: 6, categoria: "Hogar", total: "320000" }]],
  ];

  describe.each(casos)("GET %s", (_n, ruta, filas) => {
    it("devuelve el rango consultado y los datos agregados", async () => {
      pool.query.mockResolvedValue({ rows: filas });
      const res = await request(app).get(`${BASE}${ruta}?${RANGO}`).set(auth());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ok: true,
        periodo: { fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30" },
        datos: filas,
      });
    });

    it("RF-11.3 · filtra por el usuario del token y por el rango (consulta de solo lectura)", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await request(app).get(`${BASE}${ruta}?${RANGO}`).set(auth());
      const [sql, params] = pool.query.mock.calls[0];
      expect(params).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
      expect(sql).toMatch(/m\.id_usuario = \$1/);
      expect(sql).toMatch(/BETWEEN \$2 AND \$3/);
    });

    it("RF-11.6 · sin datos → 200 con arreglo vacío", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const res = await request(app).get(`${BASE}${ruta}?${RANGO}`).set(auth());
      expect(res.status).toBe(200);
      expect(res.body.datos).toEqual([]);
    });

    it("error de la BD → 500 genérico", async () => {
      pool.query.mockRejectedValue(new Error("boom"));
      const res = await request(app).get(`${BASE}${ruta}?${RANGO}`).set(auth());
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
    });
  });

  it("los gastos sin categoría se agrupan como 'Sin categoría' (id 0)", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await request(app).get(`${BASE}/gastos/categorias?${RANGO}`).set(auth());
    expect(pool.query.mock.calls[0][0]).toMatch(/COALESCE\(c\.nombre, 'Sin categoría'\)/);
    expect(pool.query.mock.calls[0][0]).toMatch(/COALESCE\(c\.id_categoria, 0\)/);
  });

  it("los resultados se ordenan de mayor a menor total", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await request(app).get(`${BASE}/gastos/categorias?${RANGO}`).set(auth());
    expect(pool.query.mock.calls[0][0]).toMatch(/ORDER BY total DESC/);
  });
});

// ═════════════════════════════════════════════════════════════
//  Ahorros y deudas del rango
// ═════════════════════════════════════════════════════════════
describe("RF-11 · Ahorros del rango (GET /api/reportes/ahorros)", () => {
  it("devuelve los abonos y el total ahorrado del rango", async () => {
    const filas = [{ monto: "100000" }, { monto: "250000.50" }];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get(`${BASE}/ahorros?${RANGO}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.total_ahorrado).toBe(350000.5);
    expect(res.body.datos).toEqual(filas);
    expect(res.body.periodo).toEqual({ fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30" });
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
  });

  it("sin abonos → total 0 y datos vacíos", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/ahorros?${RANGO}`).set(auth());
    expect(res.body).toMatchObject({ ok: true, total_ahorrado: 0, datos: [] });
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/ahorros?${RANGO}`).set(auth());
    expect(res.status).toBe(500);
  });
});

describe("RF-11 · Pagos de deudas del rango (GET /api/reportes/deudas)", () => {
  it("devuelve el historial de pagos con el total pagado y las cuotas", async () => {
    const filas = [
      { id_abono_deuda: 2, monto: "100000", cuotas: 1, fuente: "Banco" },
      { id_abono_deuda: 1, monto: "200000", cuotas: 2, fuente: "Banco" },
    ];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get(`${BASE}/deudas?${RANGO}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.resumen).toEqual({ total_pagado: 300000, cuotas_pagadas: 3 });
    expect(res.body.datos).toEqual(filas);
  });

  it("sin pagos → totales en 0", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/deudas?${RANGO}`).set(auth());
    expect(res.body.resumen).toEqual({ total_pagado: 0, cuotas_pagadas: 0 });
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/deudas?${RANGO}`).set(auth());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  Fondo de emergencia
// ═════════════════════════════════════════════════════════════
describe("RF-11 · Fondo de emergencia del rango (GET /api/reportes/fondo-emergencia)", () => {
  it("devuelve aportes, retiros, movimiento neto y meta", async () => {
    pool.query.mockResolvedValue({ rows: [{ id_fondo: 11, meta: "5000000", aportes: "700000", retiros: "200000" }] });
    const res = await request(app).get(`${BASE}/fondo-emergencia?${RANGO}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.resumen).toEqual({ aportes: 700000, retiros: 200000, movimiento_neto: 500000, meta: 5000000 });
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
  });

  it("usuario sin fondo → 404 (el informe completo lo tolera, ver RF-11.5)", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/fondo-emergencia?${RANGO}`).set(auth());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "El usuario no tiene fondo de emergencia" });
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/fondo-emergencia?${RANGO}`).set(auth());
    expect(res.status).toBe(500);
  });
});

describe("RF-11 · Estado actual del fondo (GET /api/reportes/fondo-emergencia/estado)", () => {
  const fondo = (extra = {}) => ({ id_fondo: 11, meta: "1000000", fecha_creacion: "2026-01-10", aportes: "600000", retiros: "100000", ...extra });

  it("calcula saldo actual y porcentaje de la meta", async () => {
    pool.query.mockResolvedValue({ rows: [fondo()] });
    const res = await request(app).get(`${BASE}/fondo-emergencia/estado`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      id_fondo: 11, meta: 1000000, aportes: 600000, retiros: 100000,
      saldo_actual: 500000, porcentaje_meta: 50, fecha_creacion: "2026-01-10",
    });
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID]);
  });

  it("meta 0 → porcentaje 0 (sin dividir por cero)", async () => {
    pool.query.mockResolvedValue({ rows: [fondo({ meta: "0" })] });
    const res = await request(app).get(`${BASE}/fondo-emergencia/estado`).set(auth());
    expect(res.body.data.porcentaje_meta).toBe(0);
  });

  it("el saldo nunca se informa negativo", async () => {
    pool.query.mockResolvedValue({ rows: [fondo({ aportes: "100", retiros: "500" })] });
    const res = await request(app).get(`${BASE}/fondo-emergencia/estado`).set(auth());
    expect(res.body.data.saldo_actual).toBe(0);
  });

  it("usuario sin fondo → 404", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/fondo-emergencia/estado`).set(auth());
    expect(res.status).toBe(404);
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/fondo-emergencia/estado`).set(auth());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  Estado de ahorros y deudas (sin rango)
// ═════════════════════════════════════════════════════════════
describe("RF-11 · Estado de ahorros (GET /api/reportes/ahorros/estado)", () => {
  it("calcula el cumplimiento por meta y el consolidado", async () => {
    pool.query.mockResolvedValue({
      rows: [
        { id_ahorros: 1, meta: "1000000", monto_acumulado: "250000", total_abonado: "250000", fecha_registro: "2026-10-01", fecha_meta: "2027-01-01", descripcion: "Viaje" },
        { id_ahorros: 2, meta: "500000", monto_acumulado: "500000", total_abonado: "500000", fecha_registro: "2026-09-01", fecha_meta: null, descripcion: null },
      ],
    });

    const res = await request(app).get(`${BASE}/ahorros/estado`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.datos[0]).toMatchObject({ id_ahorro: 1, meta: 1000000, monto_acumulado: 250000, porcentaje_cumplimiento: 25 });
    expect(res.body.datos[1]).toMatchObject({ id_ahorro: 2, porcentaje_cumplimiento: 100 });
    expect(res.body.resumen).toEqual({
      cantidad_metas: 2, meta_total: 1500000, acumulado_total: 750000, porcentaje_cumplimiento: 50,
    });
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID]);
  });

  it("sin metas → resumen en 0", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/ahorros/estado`).set(auth());
    expect(res.body.resumen).toEqual({ cantidad_metas: 0, meta_total: 0, acumulado_total: 0, porcentaje_cumplimiento: 0 });
    expect(res.body.datos).toEqual([]);
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/ahorros/estado`).set(auth());
    expect(res.status).toBe(500);
  });
});

describe("RF-11 · Estado de deudas (GET /api/reportes/deudas/estado)", () => {
  it("calcula lo pagado y lo pendiente por deuda y en total", async () => {
    pool.query.mockResolvedValue({
      rows: [
        { id_deudas: 1, monto_total: "1200000", fuente: "Banco", cuotas_total: 12, cuotas_pagadas: 3, estado: "pendiente", monto_pagado: "300000" },
        { id_deudas: 2, monto_total: "400000", fuente: "Amigo", cuotas_total: 4, cuotas_pagadas: 4, estado: "pagada", monto_pagado: "400000" },
      ],
    });

    const res = await request(app).get(`${BASE}/deudas/estado`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.datos[0]).toMatchObject({
      id_deuda: 1, monto_total: 1200000, monto_pagado: 300000, monto_pendiente: 900000,
      cuotas_pendientes: 9, porcentaje_pagado: 25, estado: "pendiente",
    });
    expect(res.body.datos[1]).toMatchObject({ monto_pendiente: 0, cuotas_pendientes: 0, porcentaje_pagado: 100, estado: "pagada" });
    expect(res.body.resumen).toEqual({
      cantidad_deudas: 2, monto_total: 1600000, monto_pagado: 700000, monto_pendiente: 900000,
      cuotas_total: 16, cuotas_pagadas: 7, cuotas_pendientes: 9, porcentaje_pagado: 43.75,
    });
  });

  it("sin deudas → resumen en 0", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/deudas/estado`).set(auth());
    expect(res.body.resumen).toMatchObject({ cantidad_deudas: 0, monto_total: 0, porcentaje_pagado: 0 });
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/deudas/estado`).set(auth());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  Ejecución del presupuesto (filtro por período de presupuesto, RF-11.1)
// ═════════════════════════════════════════════════════════════
describe("RF-11.1 · Presupuesto de un período (GET /api/reportes/presupuesto/:id_periodo)", () => {
  const periodoBD = {
    id_periodo: 5, id_presupuesto: 3, fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30", estado: "abierto",
    ingreso_estimado: "3000000", saldo_anterior: "200000",
    monto_gastos: "1200000", monto_deudas: "600000", monto_imprevistos: "450000", monto_ahorros: "300000", monto_emergencia: "450000",
    presupuesto: "Mensual", presupuesto_descripcion: "Plan",
    porcentaje_gastos: "40", porcentaje_deudas: "20", porcentaje_imprevistos: "15", porcentaje_ahorros: "10", porcentaje_emergencia: "15",
  };
  // Orden: período, ingresos, gastos, imprevistos, ahorros, deudas, emergencia
  const simular = (t = {}) =>
    pool.query
      .mockResolvedValueOnce({ rows: [periodoBD] })
      .mockResolvedValueOnce({ rows: [{ total: t.ing ?? 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: t.gas ?? 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: t.imp ?? 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: t.aho ?? 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: t.deu ?? 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: t.eme ?? 0 }] });

  it("compara lo planeado con lo ejecutado por módulo usando las fechas del período", async () => {
    simular({ ing: 2800000, gas: 600000, imp: 45000, aho: 150000, deu: 300000, eme: 225000 });

    const res = await request(app).get(`${BASE}/presupuesto/5`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.periodo).toEqual({ id_periodo: 5, id_presupuesto: 3, fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30", estado: "abierto" });
    expect(res.body.presupuesto).toEqual({
      nombre: "Mensual", descripcion: "Plan",
      porcentajes: { gastos: 40, deudas: 20, imprevistos: 15, ahorros: 10, emergencia: 15 },
    });
    expect(res.body.ingresos).toEqual({ estimado: 3000000, real: 2800000 });
    expect(res.body.categorias.gastos).toEqual({ planeado: 1200000, ejecutado: 600000, diferencia: 600000, porcentaje_usado: 50 });
    expect(res.body.categorias.imprevistos).toEqual({ planeado: 450000, ejecutado: 45000, diferencia: 405000, porcentaje_usado: 10 });
    expect(res.body.resumen).toEqual({
      total_planeado: 3000000, total_ejecutado: 1320000, diferencia: 1680000, porcentaje_ejecucion: 44,
    });
    // saldo = anterior + ingreso real − ejecutado total = 200.000 + 2.800.000 − 1.320.000
    expect(res.body.saldo).toEqual({ anterior: 200000, disponible: 1680000 });
    // Las sumas usan el rango del período y el usuario
    expect(pool.query.mock.calls[1][1]).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
  });

  it("el período se busca por id Y por usuario (no se ve el de otro usuario)", async () => {
    simular();
    await request(app).get(`${BASE}/presupuesto/5`).set(auth());
    expect(pool.query.mock.calls[0][1]).toEqual(["5", USER_ID]);
  });

  it("período inexistente o de otro usuario → 404", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/presupuesto/5`).set(auth());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "El periodo de presupuesto no existe" });
  });

  it("período sin movimientos → ejecutado 0 y porcentaje 0", async () => {
    simular();
    const res = await request(app).get(`${BASE}/presupuesto/5`).set(auth());
    expect(res.body.resumen.total_ejecutado).toBe(0);
    expect(res.body.resumen.porcentaje_ejecucion).toBe(0);
  });

  it("si se ejecutó más de lo planeado, la diferencia es negativa y el uso supera 100 %", async () => {
    simular({ gas: 1500000 });
    const res = await request(app).get(`${BASE}/presupuesto/5`).set(auth());
    expect(res.body.categorias.gastos.diferencia).toBe(-300000);
    expect(res.body.categorias.gastos.porcentaje_usado).toBe(125);
  });

  it.each(["abc", "0", "-1", "1.5"])("id_periodo inválido (%s) → 400 sin consultar la BD", async (id) => {
    const res = await request(app).get(`${BASE}/presupuesto/${id}`).set(auth());
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/presupuesto/5`).set(auth());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
  });
});

// ═════════════════════════════════════════════════════════════
//  Evolución temporal
// ═════════════════════════════════════════════════════════════
describe("RF-11 · Evolución temporal (GET /api/reportes/evolucion)", () => {
  it("devuelve una fila por día con valores numéricos y balance acumulado", async () => {
    pool.query.mockResolvedValue({
      rows: [
        { fecha: "2026-11-01", ingresos: "1000", gastos: "200", imprevistos: "0", ahorros: "100", pagos_deudas: "0", aportes_emergencia: "50", retiros_emergencia: "0", balance: "650", balance_acumulado: "650" },
        { fecha: "2026-11-02", ingresos: "0", gastos: "100", imprevistos: "0", ahorros: "0", pagos_deudas: "0", aportes_emergencia: "0", retiros_emergencia: "0", balance: "-100", balance_acumulado: "550" },
      ],
    });

    const res = await request(app).get(`${BASE}/evolucion?fecha_inicio=2026-11-01&fecha_fin=2026-11-02`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.datos).toEqual([
      { fecha: "2026-11-01", ingresos: 1000, gastos: 200, imprevistos: 0, ahorros: 100, pagos_deudas: 0, aportes_emergencia: 50, retiros_emergencia: 0, balance: 650, balance_acumulado: 650 },
      { fecha: "2026-11-02", ingresos: 0, gastos: 100, imprevistos: 0, ahorros: 0, pagos_deudas: 0, aportes_emergencia: 0, retiros_emergencia: 0, balance: -100, balance_acumulado: 550 },
    ]);
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID, "2026-11-01", "2026-11-02"]);
  });

  it("acepta un rango de hasta 1830 días (≈ 5 años)", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    // 2021-01-01 + 1829 días = 2025-12-30 → 1830 días inclusivos
    const res = await request(app).get(`${BASE}/evolucion?fecha_inicio=2021-01-01&fecha_fin=2025-12-30`).set(auth());
    expect(res.status).toBe(200);
  });

  it("un rango mayor a 1830 días → 400 (protege la BD) y no consulta", async () => {
    const res = await request(app).get(`${BASE}/evolucion?fecha_inicio=2000-01-01&fecha_fin=2026-11-30`).set(auth());
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, mensaje: "El rango de la evolución no puede superar 1830 días" });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("sin datos → 200 con arreglo vacío", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/evolucion?${RANGO}`).set(auth());
    expect(res.body.datos).toEqual([]);
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/evolucion?${RANGO}`).set(auth());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  RF-11.4 · Generar el informe no modifica los datos originales
// ═════════════════════════════════════════════════════════════
describe("RF-11.4 · Los reportes son de solo lectura", () => {
  const todos = [
    ...CON_RANGO.map(([n, r]) => [n, `${r}?${RANGO}`]),
    ...ESTADOS.map(([n, r]) => [n, r]),
    ["presupuesto de un período", "/presupuesto/5"],
  ];

  it.each(todos)("GET %s solo ejecuta consultas SELECT/WITH", async (_n, ruta) => {
    pool.query.mockResolvedValue({ rows: [{ total: 0, aportes: 0, retiros: 0, meta: 0, id_periodo: 5, cuotas: 0 }] });
    await request(app).get(`${BASE}${ruta}`).set(auth());

    const escrituras = pool.query.mock.calls.map(([s]) => String(s)).filter((s) => /\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER)\b/i.test(s));
    expect(escrituras).toEqual([]);
    expect(pool.connect).not.toHaveBeenCalled(); // ni siquiera abre transacciones
  });

  it("los reportes solo se exponen por GET (POST/PUT/DELETE → 404)", async () => {
    for (const metodo of ["post", "put", "delete", "patch"]) {
      const res = await request(app)[metodo](`${BASE}/resumen?${RANGO}`).set(auth());
      expect(res.status).toBe(404);
    }
    expect(pool.query).not.toHaveBeenCalled();
  });
});
