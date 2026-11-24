/**
 * RF-07 · Gestionar deudas (backend)
 * Archivos bajo prueba:
 *   Backend/src/controllers/movimientosController.js
 *     → crearMovimiento (subtipo "Deuda"), getDeudas, updateDeudas, deleteDeudas,
 *       abonarDeuda, getAbonosDeuda
 *   Backend/src/service/NotificacionesService.js → verificarDeudasProximasAVencer (RF-07.11)
 *   Backend/src/service/jobs/DeudasJob.js → tarea diaria 06:00 (RF-07.11)
 * Rutas: Backend/src/routes/movimientosRoutes.js (montadas en /api/movimientos)
 * Estrategia: app Express de prueba; BD y servicios mockeados; JWT firmado de verdad.
 */

jest.mock("../../../Backend/src/db/connection", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("../../../Backend/src/config/firebase", () => ({
  messaging: () => ({ sendEachForMulticast: jest.fn().mockResolvedValue({ responses: [] }) }),
}));
jest.mock("node-cron", () => ({ schedule: jest.fn() }));
jest.mock("../../../Backend/src/controllers/PresupuestosController", () => ({
  actualizarIngresoReal: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../../Backend/src/service/OperacionesMovilesService", () => ({
  isOperationId: jest.fn(),
  reserve: jest.fn(),
  confirm: jest.fn(),
  withOperationIds: jest.fn(async (_pool, _usuario, rows) => rows),
}));
jest.mock("../../../Backend/src/service/NotificacionesService", () => ({
  verificarUmbralGastos: jest.fn(),
  verificarUmbralImprevistos: jest.fn(),
  verificarUmbralDeudas: jest.fn().mockResolvedValue(undefined),
  verificarUmbralAhorros: jest.fn(),
  verificarMetaAhorroAlcanzada: jest.fn(),
  verificarDeudasProximasAVencer: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../../Backend/src/controllers/sincronizacionController", () => ({
  capacidades: jest.fn(),
  consultarOperacion: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");

const pool = require("../../../Backend/src/db/connection");
const {
  verificarUmbralDeudas,
  verificarDeudasProximasAVencer,
} = require("../../../Backend/src/service/NotificacionesService");
const movimientosRoutes = require("../../../Backend/src/routes/movimientosRoutes");
const { iniciarJobDeudas } = require("../../../Backend/src/service/jobs/DeudasJob");

const app = express();
app.use(express.json());
app.use("/api/movimientos", movimientosRoutes);

const USER_ID = 7;
const auth = () => ({ Authorization: `Bearer ${jwt.sign({ id: USER_ID }, process.env.JWT_SECRET)}` });

const client = { query: jest.fn(), release: jest.fn() };
const sqls = () => client.query.mock.calls.map(([s]) => String(s).replace(/\s+/g, " ").trim());
const llamada = (patron) => client.query.mock.calls.find(([s]) => patron.test(String(s)));
const pgError = (code) => Object.assign(new Error(`pg ${code}`), { code });

const flujoCrear = (sql) => {
  if (/INSERT INTO movimientos/.test(sql)) return { rows: [{ id_movimiento: 10 }] };
  if (/INSERT INTO salida/.test(sql)) return { rows: [{ id_salida: 21 }] };
  if (/INSERT INTO deudas/.test(sql)) return { rows: [{ id_deudas: 60 }] };
  return { rows: [] };
};

const bodyValido = (datos = {}) => ({
  tipo_flujo: "Salida",
  subtipo_modulo: "Deuda",
  datos: {
    monto: 1200000,
    fuente: "Banco Andino",
    descripcion: "Crédito de libre inversión",
    cuotas_total: 12,
    fecha_inicio: "2026-11-01",
    fecha_fin: "2027-10-31",
    id_categoria: 8,
    ...datos,
  },
});

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  pool.connect.mockResolvedValue(client);
  client.query.mockImplementation(async (sql) => flujoCrear(String(sql)));
  verificarUmbralDeudas.mockResolvedValue(undefined);
  verificarDeudasProximasAVencer.mockResolvedValue(undefined);
});

// ═════════════════════════════════════════════════════════════
describe("RF-07 · Autenticación requerida", () => {
  const rutas = [
    ["POST", "/api/movimientos", "post"],
    ["GET", "/api/movimientos/deudas", "get"],
    ["PUT", "/api/movimientos/deudas/1", "put"],
    ["DELETE", "/api/movimientos/deudas/1", "delete"],
    ["PATCH", "/api/movimientos/deudas/1/abonar", "patch"],
    ["GET", "/api/movimientos/deudas/abonos", "get"],
  ];
  it.each(rutas)("%s %s sin token → 401", async (_m, url, metodo) => {
    const res = await request(app)[metodo](url);
    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
    expect(pool.connect).not.toHaveBeenCalled();
  });
  it.each(rutas)("%s %s con token inválido → 401", async (_m, url, metodo) => {
    const res = await request(app)[metodo](url).set("Authorization", "Bearer token.falso.xyz");
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });
});

// ═════════════════════════════════════════════════════════════
//  Registrar deuda  ·  POST /api/movimientos (Salida / Deuda)
// ═════════════════════════════════════════════════════════════
describe("RF-07 · Registrar deuda (POST /api/movimientos)", () => {
  it("crea la deuda con datos completos → 201 y transacción confirmada", async () => {
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      ok: true,
      mensaje: "Movimiento registrado exitosamente",
      ID_movimiento: 10,
      ID_detalle: 60,
    });
    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");
    expect(llamada(/INSERT INTO movimientos/)[1]).toEqual([USER_ID, "Salida", "Deuda"]);
    // [id_salida, id_categoria, monto, fuente, descripcion, cuotas_total, fecha_inicio, fecha_fin]
    expect(llamada(/INSERT INTO deudas/)[1]).toEqual([
      21, 8, 1200000, "Banco Andino", "Crédito de libre inversión", 12, "2026-11-01", "2027-10-31",
    ]);
  });

  it("no envía cuotas_pagadas ni estado: la BD los inicia (0 y 'pendiente')", async () => {
    await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    const sql = llamada(/INSERT INTO deudas/)[0];
    expect(sql).not.toMatch(/cuotas_pagadas|estado/);
  });

  it("tras el COMMIT evalúa umbral de deudas y vencimientos próximos (RF-07.11)", async () => {
    await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(verificarUmbralDeudas).toHaveBeenCalledWith(USER_ID);
    expect(verificarDeudasProximasAVencer).toHaveBeenCalledWith(USER_ID);
  });

  it("acepta cuotas y monto como texto numérico y recorta la fuente", async () => {
    await request(app).post("/api/movimientos").set(auth())
      .send(bodyValido({ monto: "500000.50", cuotas_total: "6", fuente: "  Tarjeta  " }));
    const params = llamada(/INSERT INTO deudas/)[1];
    expect(params[2]).toBe(500000.5);
    expect(params[3]).toBe("Tarjeta");
    expect(params[5]).toBe(6);
  });

  it("sin cuotas ni fechas (pago único) → guarda null en cuotas_total y fechas", async () => {
    const res = await request(app).post("/api/movimientos").set(auth())
      .send({ tipo_flujo: "Salida", subtipo_modulo: "Deuda", datos: { monto: 300000, fuente: "Amigo" } });

    expect(res.status).toBe(201);
    expect(llamada(/INSERT INTO deudas/)[1]).toEqual([21, null, 300000, "Amigo", null, null, null, null]);
  });

  it("RF-07.7 · fecha de fin igual a la de inicio es válida", async () => {
    const res = await request(app).post("/api/movimientos").set(auth())
      .send(bodyValido({ fecha_inicio: "2026-11-01", fecha_fin: "2026-11-01" }));
    expect(res.status).toBe(201);
  });

  describe("validaciones → 400 sin abrir conexión a la BD", () => {
    const casos = [
      ["RF-07.1 fuente ausente", () => bodyValido({ fuente: undefined }), "La fuente de la deuda es requerida"],
      ["RF-07.1 fuente vacía", () => bodyValido({ fuente: "" }), "La fuente de la deuda es requerida"],
      ["RF-07.1 fuente solo espacios", () => bodyValido({ fuente: "   " }), "La fuente de la deuda es requerida"],
      ["RF-07.2 monto ausente", () => { const b = bodyValido(); delete b.datos.monto; return b; }, "El campo monto es requerido"],
      ["RF-07.2 monto 0", () => bodyValido({ monto: 0 }), "El monto debe ser mayor que cero"],
      ["RF-07.2 monto negativo", () => bodyValido({ monto: -100 }), "El monto debe ser mayor que cero"],
      ["monto no numérico", () => bodyValido({ monto: "abc" }), "El monto debe ser un número válido"],
      ["monto sobre el máximo", () => bodyValido({ monto: 1000000000001 }), "no puede superar"],
      ["RF-07.3 cuotas 0", () => bodyValido({ cuotas_total: 0 }), "El número de cuotas debe ser un entero mayor que cero"],
      ["RF-07.3 cuotas negativas", () => bodyValido({ cuotas_total: -3 }), "El número de cuotas debe ser un entero mayor que cero"],
      ["RF-07.3 cuotas decimales", () => bodyValido({ cuotas_total: 2.5 }), "El número de cuotas debe ser un entero mayor que cero"],
      ["RF-07.3 cuotas no numéricas", () => bodyValido({ cuotas_total: "abc" }), "El número de cuotas debe ser un entero mayor que cero"],
      ["fuente > 150", () => bodyValido({ fuente: "f".repeat(151) }), "La fuente no puede superar 150 caracteres"],
      ["descripción > 255", () => bodyValido({ descripcion: "d".repeat(256) }), "La descripción no puede superar 255 caracteres"],
      ["fecha de inicio inválida", () => bodyValido({ fecha_inicio: "2026-02-30" }), "La fecha de inicio no es válida (use AAAA-MM-DD)"],
      ["fecha de fin inválida", () => bodyValido({ fecha_fin: "31/12/2027" }), "La fecha de fin no es válida (use AAAA-MM-DD)"],
      [
        "RF-07.7 fecha de fin anterior a la de inicio",
        () => bodyValido({ fecha_inicio: "2026-11-10", fecha_fin: "2026-11-09" }),
        "La fecha de fin no puede ser anterior a la fecha de inicio",
      ],
    ];
    it.each(casos)("%s", async (_n, armar, mensaje) => {
      const res = await request(app).post("/api/movimientos").set(auth()).send(armar());
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.mensaje).toEqual(expect.stringContaining(mensaje));
      expect(pool.connect).not.toHaveBeenCalled();
    });
  });

  it("categoría inexistente (23503) → 400 con ROLLBACK", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO deudas/.test(sql)) throw pgError("23503");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(400);
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("violación del CHECK de la BD (23514) → 400", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO deudas/.test(sql)) throw pgError("23514");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(400);
  });

  it("error inesperado → 500 genérico con ROLLBACK", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO deudas/.test(sql)) throw new Error("boom");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
    expect(sqls()).toContain("ROLLBACK");
  });

  it("si fallan las notificaciones posteriores, la creación sigue siendo 201", async () => {
    verificarUmbralDeudas.mockRejectedValue(new Error("fallo"));
    verificarDeudasProximasAVencer.mockRejectedValue(new Error("fallo"));
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(201);
  });
});

// ═════════════════════════════════════════════════════════════
//  Consultar deudas  ·  GET /api/movimientos/deudas
// ═════════════════════════════════════════════════════════════
describe("RF-07 · Consultar deudas (GET /api/movimientos/deudas)", () => {
  it("devuelve las deudas del usuario con cuotas y estado", async () => {
    const filas = [{ id: 1, monto: "1200000", fuente: "Banco", cuotas_total: 12, cuotas_pagadas: 3, estado: "pendiente" }];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get("/api/movimientos/deudas").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(filas);
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
    expect(sql).toMatch(/d\.cuotas_pagadas AS cuotas_pagadas/);
    expect(sql).toMatch(/d\.estado AS estado/);
    expect(sql).toMatch(/WHERE m\.id_usuario = \$1/);
  });

  it("usuario sin deudas → 200 y arreglo vacío", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get("/api/movimientos/deudas").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("error de la BD → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get("/api/movimientos/deudas").set(auth());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  Modificar deuda  ·  PUT /api/movimientos/deudas/:id
// ═════════════════════════════════════════════════════════════
describe("RF-07 · Modificar deuda (PUT /api/movimientos/deudas/:id)", () => {
  const cuerpo = (extra = {}) => ({
    monto: 1200000,
    fuente: "Banco Andino",
    descripcion: "Crédito",
    cuotas_total: 12,
    fecha_inicio: "2026-11-01",
    fecha_fin: "2027-10-31",
    id_categoria: 8,
    ...extra,
  });
  // 1ª consulta: SELECT cuotas_pagadas actuales; 2ª: UPDATE
  const simular = (pagadas = 2, existe = true) =>
    pool.query.mockImplementation(async (sql) =>
      /^\s*SELECT/.test(sql) ? { rows: existe ? [{ cuotas_pagadas: pagadas }] : [] } : { rows: [], rowCount: 1 }
    );
  const update = () => pool.query.mock.calls.find(([s]) => /^\s*UPDATE deudas/.test(s));

  it("deuda propia → 200; conserva las cuotas pagadas y deriva el estado 'pendiente'", async () => {
    simular(2);
    const res = await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Deuda actualizada exitosamente" });
    expect(pool.query.mock.calls[0][1]).toEqual(["5", USER_ID]); // búsqueda restringida al dueño
    // [monto, fuente, descripcion, cuotas_total, cuotas_pagadas, inicio, fin, estado, categoria, id]
    expect(update()[1]).toEqual([1200000, "Banco Andino", "Crédito", 12, 2, "2026-11-01", "2027-10-31", "pendiente", 8, "5"]);
    expect(verificarUmbralDeudas).toHaveBeenCalledWith(USER_ID);
    expect(verificarDeudasProximasAVencer).toHaveBeenCalledWith(USER_ID);
  });

  it("RF-07.9 · si las cuotas pagadas igualan el total → estado 'pagada'", async () => {
    simular(2);
    const res = await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo({ cuotas_pagadas: 12 }));
    expect(res.status).toBe(200);
    expect(update()[1][4]).toBe(12);
    expect(update()[1][7]).toBe("pagada");
  });

  it("reducir el total de cuotas hasta igualar lo pagado marca la deuda 'pagada'", async () => {
    simular(2);
    await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo({ cuotas_total: 2 }));
    expect(update()[1][7]).toBe("pagada");
  });

  it("RF-07.4 · cuotas pagadas mayores al total → 400 sin actualizar", async () => {
    simular(2);
    const res = await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo({ cuotas_pagadas: 13 }));
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("Las cuotas pagadas no pueden superar el total de cuotas");
    expect(update()).toBeUndefined();
  });

  it("RF-07.4 · reducir el total por debajo de lo ya pagado → 400", async () => {
    simular(5);
    const res = await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo({ cuotas_total: 3 }));
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("Las cuotas pagadas no pueden superar el total de cuotas");
    expect(update()).toBeUndefined();
  });

  it.each([
    ["negativas", -1],
    ["decimales", 1.5],
    ["no numéricas", "abc"],
  ])("cuotas pagadas %s → 400 sin consultar la BD", async (_n, valor) => {
    const res = await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo({ cuotas_pagadas: valor }));
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("Las cuotas pagadas deben ser un entero mayor o igual a cero");
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("pago único (sin cuotas_total): con 1 cuota pagada queda 'pagada'", async () => {
    simular(0);
    await request(app).put("/api/movimientos/deudas/5").set(auth())
      .send(cuerpo({ cuotas_total: null, cuotas_pagadas: 1 }));
    expect(update()[1][3]).toBeNull();
    expect(update()[1][7]).toBe("pagada");
  });

  it("deuda inexistente o de otro usuario → 404", async () => {
    simular(0, false);
    const res = await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "Deuda no encontrada" });
    expect(update()).toBeUndefined();
  });

  it.each(["abc", "0", "-1", "1.5"])("id de ruta inválido (%s) → 400 sin consultar la BD", async (id) => {
    const res = await request(app).put(`/api/movimientos/deudas/${id}`).set(auth()).send(cuerpo());
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  const invalidos = [
    ["RF-07.1 fuente vacía", { fuente: "" }],
    ["RF-07.2 monto 0", { monto: 0 }],
    ["RF-07.2 monto negativo", { monto: -1 }],
    ["RF-07.3 cuotas totales negativas", { cuotas_total: -2 }],
    ["RF-07.3 cuotas totales decimales", { cuotas_total: 2.5 }],
    ["RF-07.7 fecha de fin anterior a la de inicio", { fecha_inicio: "2026-11-10", fecha_fin: "2026-11-01" }],
    ["fecha inválida", { fecha_inicio: "2026-13-01" }],
  ];
  it.each(invalidos)("%s → 400 sin consultar la BD", async (_n, extra) => {
    const res = await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo(extra));
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("error inesperado → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).put("/api/movimientos/deudas/5").set(auth()).send(cuerpo());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  Eliminar deuda  ·  DELETE /api/movimientos/deudas/:id
// ═════════════════════════════════════════════════════════════
describe("RF-07 · Eliminar deuda (DELETE /api/movimientos/deudas/:id)", () => {
  it("deuda propia → 200; borra deudas → salida → movimientos y recalcula el umbral", async () => {
    client.query.mockImplementation(async (sql) =>
      /SELECT p\.id_salida/.test(sql) ? { rows: [{ id_salida: 21, id_movimiento: 10 }] } : { rows: [] }
    );
    const res = await request(app).delete("/api/movimientos/deudas/5").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Deuda eliminada exitosamente" });
    const lista = sqls();
    expect(lista[lista.length - 1]).toBe("COMMIT");
    const orden = ["DELETE FROM deudas", "DELETE FROM salida", "DELETE FROM movimientos"].map((p) =>
      lista.findIndex((s) => s.startsWith(p))
    );
    expect(orden.every((i) => i > 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    expect(verificarUmbralDeudas).toHaveBeenCalledWith(USER_ID);
  });

  it("deuda inexistente o de otro usuario → 404, ROLLBACK y sin borrados", async () => {
    client.query.mockImplementation(async () => ({ rows: [] }));
    const res = await request(app).delete("/api/movimientos/deudas/5").set(auth());
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("Deuda no encontrado");
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("DELETE"))).toBe(false);
  });

  it.each(["abc", "0", "-1"])("id de ruta inválido (%s) → 400", async (id) => {
    const res = await request(app).delete(`/api/movimientos/deudas/${id}`).set(auth());
    expect(res.status).toBe(400);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("error durante el borrado → 500, ROLLBACK y conexión liberada", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/SELECT p\.id_salida/.test(sql)) return { rows: [{ id_salida: 21, id_movimiento: 10 }] };
      if (/^\s*DELETE FROM deudas/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });
    const res = await request(app).delete("/api/movimientos/deudas/5").set(auth());
    expect(res.status).toBe(500);
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});

// ═════════════════════════════════════════════════════════════
//  Pagar cuotas  ·  PATCH /api/movimientos/deudas/:id/abonar
// ═════════════════════════════════════════════════════════════
describe("RF-07 · Registrar pago (PATCH /api/movimientos/deudas/:id/abonar)", () => {
  const deuda = (extra = {}) => ({
    id_deudas: 5, monto: "1200000", cuotas_total: 12, cuotas_pagadas: 0, estado: "pendiente", ...extra,
  });
  const conDeuda = (fila) =>
    client.query.mockImplementation(async (sql) => (/FOR UPDATE/.test(sql) ? { rows: fila ? [fila] : [] } : { rows: [] }));
  const abono = () => llamada(/INSERT INTO abonos_deuda/)[1];
  const actualiza = () => llamada(/UPDATE deudas SET cuotas_pagadas/)[1];
  const pagar = (cuerpo = {}) => request(app).patch("/api/movimientos/deudas/5/abonar").set(auth()).send(cuerpo);

  it("RF-07.8 · una cuota = monto ÷ cuotas totales; actualiza cuotas pagadas", async () => {
    conDeuda(deuda());
    const res = await pagar({ cuotas: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      mensaje: "Cuota registrada",
      cuotas_pagadas: 1,
      cuotas_total: 12,
      monto_abono: 100000,
      estado: "pendiente",
    });
    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");
    // [id_deuda, cuotas, monto_abono, descripcion]
    expect(abono()).toEqual(["5", 1, 100000, null]);
    expect(actualiza()).toEqual([1, "pendiente", "5"]);
    expect(llamada(/FOR UPDATE/)[1]).toEqual(["5", USER_ID]); // solo deudas del usuario
  });

  it("RF-07.8 · varias cuotas: monto ÷ cuotas totales × cuotas pagadas", async () => {
    conDeuda(deuda());
    const res = await pagar({ cuotas: 3 });
    expect(res.body.monto_abono).toBe(300000);
    expect(abono()).toEqual(["5", 3, 300000, null]);
    expect(actualiza()).toEqual([3, "pendiente", "5"]);
  });

  it("sin el campo cuotas se asume 1 cuota", async () => {
    conDeuda(deuda());
    const res = await pagar({});
    expect(res.status).toBe(200);
    expect(abono()[1]).toBe(1);
  });

  it("acepta cuotas como texto numérico y guarda la descripción recortada", async () => {
    conDeuda(deuda());
    await pagar({ cuotas: "2", descripcion: "  Pago de noviembre  " });
    expect(abono()).toEqual(["5", 2, 200000, "Pago de noviembre"]);
  });

  it("continúa desde las cuotas ya pagadas (cálculo acumulado)", async () => {
    conDeuda(deuda({ cuotas_pagadas: 4 }));
    const res = await pagar({ cuotas: 2 });
    expect(res.body.cuotas_pagadas).toBe(6);
    expect(res.body.monto_abono).toBe(200000);
  });

  it("RF-07.9 · al completar las cuotas el estado pasa a 'pagada'", async () => {
    conDeuda(deuda({ cuotas_pagadas: 11 }));
    const res = await pagar({ cuotas: 1 });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe("Deuda pagada completamente");
    expect(res.body.estado).toBe("pagada");
    expect(res.body.cuotas_pagadas).toBe(12);
    expect(actualiza()).toEqual([12, "pagada", "5"]);
  });

  it("pagar todas las cuotas de una vez deja la deuda 'pagada' por el monto total", async () => {
    conDeuda(deuda());
    const res = await pagar({ cuotas: 12 });
    expect(res.body.estado).toBe("pagada");
    expect(res.body.monto_abono).toBe(1200000);
  });

  it("deuda sin cuotas_total (pago único) equivale a 1 cuota por el monto completo", async () => {
    conDeuda(deuda({ cuotas_total: null, monto: "300000" }));
    const res = await pagar({});
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("pagada");
    expect(res.body.monto_abono).toBe(300000);
  });

  it("la suma de todos los pagos de una deuda es exactamente su monto (redondeo a centavos)", async () => {
    // 100 en 3 cuotas: 33.33 + 33.34 + 33.33 = 100.00 (el ajuste de centavos cae en la 2ª)
    const montos = [];
    for (let pagadas = 0; pagadas < 3; pagadas++) {
      client.query.mockReset();
      conDeuda(deuda({ monto: "100", cuotas_total: 3, cuotas_pagadas: pagadas }));
      const res = await pagar({ cuotas: 1 });
      montos.push(res.body.monto_abono);
    }
    expect(montos).toEqual([33.33, 33.34, 33.33]);
    expect(Math.round(montos.reduce((a, b) => a + b, 0) * 100) / 100).toBe(100);
  });

  it("RF-07.6 · deuda ya pagada → 409 y no registra el pago", async () => {
    conDeuda(deuda({ estado: "pagada", cuotas_pagadas: 12 }));
    const res = await pagar({ cuotas: 1 });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ ok: false, mensaje: "Esta deuda ya está pagada" });
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("INSERT"))).toBe(false);
  });

  it("RF-07.4 · pagar más cuotas de las que quedan → 400 indicando las pendientes", async () => {
    conDeuda(deuda({ cuotas_pagadas: 10 }));
    const res = await pagar({ cuotas: 3 });

    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("Quedan 2 cuota(s) por pagar.");
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("INSERT"))).toBe(false);
  });

  it("deuda inexistente o de otro usuario → 404 y ROLLBACK", async () => {
    conDeuda(null);
    const res = await pagar({ cuotas: 1 });
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("Deuda no encontrada");
    expect(sqls()).toContain("ROLLBACK");
  });

  const cuotasInvalidas = [
    ["RF-07.5 cuotas = 0 (menos de una cuota)", 0],
    ["RF-07.5 cuotas negativas", -1],
    ["cuotas decimales", 1.5],
    ["cuotas no numéricas", "abc"],
    ["cuotas booleanas", true],
  ];
  it.each(cuotasInvalidas)("%s → 400 sin abrir conexión", async (_n, valor) => {
    const res = await pagar({ cuotas: valor });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("El número de cuotas debe ser un entero mayor o igual a 1");
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("descripción > 255 → 400 sin abrir conexión", async () => {
    const res = await pagar({ cuotas: 1, descripcion: "d".repeat(256) });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("La descripción no puede superar 255 caracteres");
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-1", "1.5"])("id de ruta inválido (%s) → 400", async (id) => {
    const res = await request(app).patch(`/api/movimientos/deudas/${id}/abonar`).set(auth()).send({ cuotas: 1 });
    expect(res.status).toBe(400);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("tras el pago evalúa umbral de deudas y vencimientos", async () => {
    conDeuda(deuda());
    await pagar({ cuotas: 1 });
    expect(verificarUmbralDeudas).toHaveBeenCalledWith(USER_ID);
    expect(verificarDeudasProximasAVencer).toHaveBeenCalledWith(USER_ID);
  });

  it("error al insertar el pago → 500, ROLLBACK y conexión liberada", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/FOR UPDATE/.test(sql)) return { rows: [deuda()] };
      if (/INSERT INTO abonos_deuda/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });
    const res = await pagar({ cuotas: 1 });
    expect(res.status).toBe(500);
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls()).not.toContain("COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("si fallan las notificaciones posteriores, el pago sigue confirmado (200)", async () => {
    conDeuda(deuda());
    verificarUmbralDeudas.mockRejectedValue(new Error("fallo"));
    const res = await pagar({ cuotas: 1 });
    expect(res.status).toBe(200);
    expect(sqls()).toContain("COMMIT");
  });
});

// ═════════════════════════════════════════════════════════════
//  Historial de pagos  ·  GET /api/movimientos/deudas/abonos
// ═════════════════════════════════════════════════════════════
describe("RF-07 · Historial de pagos (GET /api/movimientos/deudas/abonos)", () => {
  it("devuelve los pagos del usuario, del más reciente al más antiguo", async () => {
    const filas = [{ id_abono_deuda: 2, id_deudas: 5, cuotas: 1, monto: "100000" }];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get("/api/movimientos/deudas/abonos").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, datos: filas });
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
    expect(sql).toMatch(/ORDER BY ad\.fecha_registro DESC, ad\.id_abono_deuda DESC/);
  });

  it("error de la BD → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get("/api/movimientos/deudas/abonos").set(auth());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  RF-07.11 · Notificación de vencimientos (servicio real)
// ═════════════════════════════════════════════════════════════
describe("RF-07.11 · NotificacionesService.verificarDeudasProximasAVencer", () => {
  const servicio = jest.requireActual("../../../Backend/src/service/NotificacionesService");

  const simularBD = ({ deudas = [], existe = false } = {}) =>
    pool.query.mockImplementation(async (sql) => {
      if (/FROM deudas d/.test(sql)) return { rows: deudas };
      if (/FROM preferencias_notificacion/.test(sql)) return { rows: [] };
      if (/SELECT id_notificacion FROM notificaciones/.test(sql)) return { rows: existe ? [{ id_notificacion: 1 }] : [] };
      if (/INSERT INTO notificaciones/.test(sql)) return { rows: [{ id_notificacion: 88 }] };
      return { rows: [] };
    });
  const inserciones = () => pool.query.mock.calls.filter(([s]) => /INSERT INTO notificaciones/.test(s));

  it("consulta solo deudas 'pendiente' del usuario que vencen en los próximos 5 días", async () => {
    simularBD();
    await servicio.verificarDeudasProximasAVencer(USER_ID);
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
    expect(sql).toMatch(/d\.estado = 'pendiente'/);
    expect(sql).toMatch(/BETWEEN CURRENT_DATE AND CURRENT_DATE \+ INTERVAL '5 days'/);
  });

  it("crea un recordatorio por cada deuda próxima a vencer", async () => {
    simularBD({
      deudas: [
        { id_deudas: 5, monto: 250000, fecha_fin: "2026-11-25" },
        { id_deudas: 6, monto: 90000, fecha_fin: "2026-11-26" },
      ],
    });
    await servicio.verificarDeudasProximasAVencer(USER_ID);

    const ins = inserciones();
    expect(ins).toHaveLength(2);
    expect(ins[0][1].slice(0, 4)).toEqual([USER_ID, "recordatorio", "deuda_vencimiento", 5]);
    expect(ins[0][1][4]).toMatch(/^¡Atención! Tu deuda de \$250000 vence el /);
    expect(ins[1][1].slice(0, 4)).toEqual([USER_ID, "recordatorio", "deuda_vencimiento", 6]);
  });

  it("si ya existe el recordatorio de esa deuda → no lo duplica", async () => {
    simularBD({ deudas: [{ id_deudas: 5, monto: 250000, fecha_fin: "2026-11-25" }], existe: true });
    await servicio.verificarDeudasProximasAVencer(USER_ID);
    expect(inserciones()).toHaveLength(0);
  });

  it("sin deudas próximas → no crea notificaciones", async () => {
    simularBD({ deudas: [] });
    await servicio.verificarDeudasProximasAVencer(USER_ID);
    expect(inserciones()).toHaveLength(0);
  });

  it("un error de BD no se propaga", async () => {
    pool.query.mockRejectedValue(new Error("db caída"));
    await expect(servicio.verificarDeudasProximasAVencer(USER_ID)).resolves.toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════
//  RF-07.11 · Tarea automática diaria (06:00)
// ═════════════════════════════════════════════════════════════
describe("RF-07.11 · DeudasJob.iniciarJobDeudas (cron diario 06:00)", () => {
  const programar = () => {
    cron.schedule.mockClear();
    iniciarJobDeudas();
    const [expresion, tarea] = cron.schedule.mock.calls[0];
    return { expresion, tarea };
  };

  it("programa la tarea con la expresión '0 6 * * *' (todos los días a las 06:00)", () => {
    const { expresion, tarea } = programar();
    expect(expresion).toBe("0 6 * * *");
    expect(typeof tarea).toBe("function");
  });

  it("al ejecutarse revisa los vencimientos de cada usuario activo", async () => {
    pool.query.mockResolvedValue({ rows: [{ id_usuario: 1 }, { id_usuario: 2 }, { id_usuario: 3 }] });
    const { tarea } = programar();

    await tarea();

    expect(pool.query.mock.calls[0][0]).toMatch(/FROM usuarios WHERE activo = TRUE/);
    expect(verificarDeudasProximasAVencer.mock.calls.map(([id]) => id)).toEqual([1, 2, 3]);
  });

  it("sin usuarios activos no genera notificaciones", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const { tarea } = programar();
    await tarea();
    expect(verificarDeudasProximasAVencer).not.toHaveBeenCalled();
  });

  it("si falla la consulta de usuarios, la tarea no lanza excepción", async () => {
    pool.query.mockRejectedValue(new Error("db caída"));
    const { tarea } = programar();
    await expect(tarea()).resolves.toBeUndefined();
    expect(verificarDeudasProximasAVencer).not.toHaveBeenCalled();
  });
});
