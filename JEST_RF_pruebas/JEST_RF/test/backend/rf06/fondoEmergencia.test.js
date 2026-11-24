/**
 * RF-06 · Gestionar fondo de emergencia (backend)
 * Archivo bajo prueba: Backend/src/controllers/fondoemergenciaController.js
 *   → getFondoEmergencia, crearFondoEmergencia, actualizarMetaFondoEmergencia,
 *     registrarAporte, registrarRetiro, getMovimientosFondoEmergencia
 * Rutas: Backend/src/routes/fondoemergenciaRoutes.js (montadas en /api/fondo-emergencia)
 * Estrategia: app Express de prueba; BD y NotificacionesService mockeados; JWT firmado de verdad.
 */

jest.mock("../../../Backend/src/db/connection", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("../../../Backend/src/service/NotificacionesService", () => ({
  verificarUmbralEmergencia: jest.fn().mockResolvedValue(undefined),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const pool = require("../../../Backend/src/db/connection");
const { verificarUmbralEmergencia } = require("../../../Backend/src/service/NotificacionesService");
const fondoRoutes = require("../../../Backend/src/routes/fondoemergenciaRoutes");

const app = express();
app.use(express.json());
app.use("/api/fondo-emergencia", fondoRoutes);

const USER_ID = 7;
const auth = () => ({ Authorization: `Bearer ${jwt.sign({ id: USER_ID }, process.env.JWT_SECRET)}` });
const BASE = "/api/fondo-emergencia";

const client = { query: jest.fn(), release: jest.fn() };
const sqls = () => client.query.mock.calls.map(([s]) => String(s).replace(/\s+/g, " ").trim());
const llamada = (patron) => client.query.mock.calls.find(([s]) => patron.test(String(s)));

const movimientoGuardado = (tipo, monto) => ({
  id_movimiento_fondo: 1, id_fondo: 11, tipo, monto, fecha_registro: "2026-11-10", descripcion: null,
});

// Cliente transaccional: existe fondo 11 con el saldo indicado
const simularFondo = ({ saldo = "100000", existe = true, tipo = "aporte", monto = 1 } = {}) =>
  client.query.mockImplementation(async (sql) => {
    const s = String(sql);
    if (/SELECT id_fondo FROM fondos_emergencia/.test(s)) return { rows: existe ? [{ id_fondo: 11 }] : [] };
    if (/SELECT[\s\S]*AS saldo_actual/.test(s)) return { rows: [{ saldo_actual: saldo }] };
    if (/INSERT INTO movimientos_fondo_emergencia/.test(s)) return { rows: [movimientoGuardado(tipo, monto)] };
    return { rows: [] };
  });

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  pool.connect.mockResolvedValue(client);
  verificarUmbralEmergencia.mockResolvedValue(undefined);
});

// ═════════════════════════════════════════════════════════════
describe("RF-06 · Autenticación requerida", () => {
  const rutas = [
    ["GET", BASE, "get"],
    ["POST", BASE, "post"],
    ["PUT", `${BASE}/meta`, "put"],
    ["POST", `${BASE}/aporte`, "post"],
    ["POST", `${BASE}/retiro`, "post"],
    ["GET", `${BASE}/movimientos`, "get"],
  ];
  it.each(rutas)("%s %s sin token → 401", async (_m, url, metodo) => {
    const res = await request(app)[metodo](url);
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
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
//  Consultar fondo  ·  GET /api/fondo-emergencia
// ═════════════════════════════════════════════════════════════
describe("RF-06 · Consultar fondo (GET /api/fondo-emergencia)", () => {
  it("devuelve la meta y el saldo calculado a partir de los movimientos (RF-06.5)", async () => {
    const fondo = { id_fondo: 11, id_usuario: USER_ID, meta: "5000000", saldo_actual: "1250000" };
    pool.query.mockResolvedValue({ rows: [fondo] });

    const res = await request(app).get(BASE).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, datos: fondo });
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
    expect(sql).toMatch(/WHERE fe\.id_usuario = \$1/);
    // El saldo se deriva de los movimientos: aportes suman, retiros restan
    expect(sql).toMatch(/WHEN mfe\.tipo = 'aporte' THEN mfe\.monto/);
    expect(sql).toMatch(/WHEN mfe\.tipo = 'retiro' THEN -mfe\.monto/);
  });

  it("RF-06.6 · usa tablas propias, separadas de ahorros e imprevistos", async () => {
    pool.query.mockResolvedValue({ rows: [{ id_fondo: 11 }] });
    await request(app).get(BASE).set(auth());
    const sql = pool.query.mock.calls[0][0];
    expect(sql).toMatch(/fondos_emergencia/);
    expect(sql).toMatch(/movimientos_fondo_emergencia/);
    expect(sql).not.toMatch(/\bahorros\b|\bimprevistos\b/);
  });

  it("usuario sin fondo → 404 con mensaje claro", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(BASE).set(auth());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "El usuario no tiene un fondo de emergencia configurado" });
  });

  it("error de la BD → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("db caída"));
    const res = await request(app).get(BASE).set(auth());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
  });
});

// ═════════════════════════════════════════════════════════════
//  Crear fondo  ·  POST /api/fondo-emergencia
// ═════════════════════════════════════════════════════════════
describe("RF-06 · Crear fondo (POST /api/fondo-emergencia)", () => {
  const fondoCreado = { id_fondo: 11, id_usuario: USER_ID, meta: 5000000 };

  it("crea el fondo con su meta → 201 asociado al usuario del token", async () => {
    pool.query.mockResolvedValue({ rows: [fondoCreado] });

    const res = await request(app).post(BASE).set(auth()).send({ meta: 5000000 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, mensaje: "Fondo de emergencia creado correctamente", datos: fondoCreado });
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID, 5000000]);
  });

  it("acepta la meta como texto numérico", async () => {
    pool.query.mockResolvedValue({ rows: [fondoCreado] });
    await request(app).post(BASE).set(auth()).send({ meta: "250000.50" });
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID, 250000.5]);
  });

  it.each([
    ["sin meta en el cuerpo", {}],
    ["meta null", { meta: null }],
    ["meta vacía", { meta: "" }],
  ])("%s → crea con meta 0", async (_n, cuerpo) => {
    pool.query.mockResolvedValue({ rows: [fondoCreado] });
    const res = await request(app).post(BASE).set(auth()).send(cuerpo);
    expect(res.status).toBe(201);
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID, 0]);
  });

  it("RF-06.2 · meta igual a 0 es válida", async () => {
    pool.query.mockResolvedValue({ rows: [fondoCreado] });
    const res = await request(app).post(BASE).set(auth()).send({ meta: 0 });
    expect(res.status).toBe(201);
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID, 0]);
  });

  const invalidas = [
    ["RF-06.2 meta negativa", { meta: -1 }, "La meta no puede ser negativo"],
    ["meta no numérica", { meta: "abc" }, "La meta debe ser un número válido"],
    ["meta booleana", { meta: true }, "La meta debe ser un número válido"],
    ["meta sobre el máximo", { meta: 1000000000001 }, "no puede superar"],
  ];
  it.each(invalidas)("%s → 400 sin consultar la BD", async (_n, cuerpo, mensaje) => {
    const res = await request(app).post(BASE).set(auth()).send(cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toEqual(expect.stringContaining(mensaje));
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("RF-06.1 · el usuario ya tiene fondo (UNIQUE 23505) → 409", async () => {
    pool.query.mockRejectedValue(Object.assign(new Error("dup"), { code: "23505" }));
    const res = await request(app).post(BASE).set(auth()).send({ meta: 1000 });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ ok: false, mensaje: "El usuario ya tiene un fondo de emergencia" });
  });

  it("error inesperado → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).post(BASE).set(auth()).send({ meta: 1000 });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
  });
});

// ═════════════════════════════════════════════════════════════
//  Actualizar meta  ·  PUT /api/fondo-emergencia/meta
// ═════════════════════════════════════════════════════════════
describe("RF-06 · Actualizar meta (PUT /api/fondo-emergencia/meta)", () => {
  it("actualiza la meta del fondo del usuario → 200", async () => {
    const fondo = { id_fondo: 11, id_usuario: USER_ID, meta: 8000000 };
    pool.query.mockResolvedValue({ rows: [fondo] });

    const res = await request(app).put(`${BASE}/meta`).set(auth()).send({ meta: 8000000 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Meta actualizada correctamente", datos: fondo });
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([8000000, USER_ID]); // solo el fondo del usuario
    expect(sql).toMatch(/WHERE id_usuario = \$2/);
    expect(sql).toMatch(/fecha_actualizacion = CURRENT_TIMESTAMP/);
  });

  it("RF-06.2 · meta 0 es válida", async () => {
    pool.query.mockResolvedValue({ rows: [{ id_fondo: 11, meta: 0 }] });
    const res = await request(app).put(`${BASE}/meta`).set(auth()).send({ meta: 0 });
    expect(res.status).toBe(200);
  });

  const invalidas = [
    ["RF-06.2 meta negativa", { meta: -100 }],
    ["meta no numérica", { meta: "abc" }],
    ["meta ausente", {}],
    ["meta vacía", { meta: "" }],
    ["meta null", { meta: null }],
    ["meta sobre el máximo", { meta: 1000000000001 }],
  ];
  it.each(invalidas)("%s → 400 sin consultar la BD", async (_n, cuerpo) => {
    const res = await request(app).put(`${BASE}/meta`).set(auth()).send(cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("La meta debe ser un número mayor o igual a 0 y dentro del rango permitido");
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("usuario sin fondo → 404", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).put(`${BASE}/meta`).set(auth()).send({ meta: 1000 });
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("El usuario no tiene un fondo de emergencia configurado");
  });

  it("error inesperado → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).put(`${BASE}/meta`).set(auth()).send({ meta: 1000 });
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  Registrar aporte  ·  POST /api/fondo-emergencia/aporte
// ═════════════════════════════════════════════════════════════
describe("RF-06 · Registrar aporte (POST /api/fondo-emergencia/aporte)", () => {
  it("RF-06.3 · aporte válido → 201, registra el movimiento 'aporte' y confirma", async () => {
    simularFondo({ tipo: "aporte", monto: 200000 });

    const res = await request(app).post(`${BASE}/aporte`).set(auth()).send({ monto: 200000, descripcion: "Prima" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.mensaje).toBe("Aporte registrado correctamente");
    expect(res.body.datos).toMatchObject({ tipo: "aporte", monto: 200000 });

    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");
    expect(llamada(/SELECT id_fondo/)[1]).toEqual([USER_ID]);
    expect(llamada(/SELECT id_fondo/)[0]).toMatch(/FOR UPDATE/);
    expect(llamada(/INSERT INTO movimientos_fondo_emergencia/)[1]).toEqual([11, "aporte", 200000, "Prima"]);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("evalúa el umbral del fondo tras el COMMIT", async () => {
    simularFondo();
    await request(app).post(`${BASE}/aporte`).set(auth()).send({ monto: 100 });
    expect(verificarUmbralEmergencia).toHaveBeenCalledWith(USER_ID);
  });

  it("descripción vacía o solo espacios se guarda como null; con espacios se recorta", async () => {
    simularFondo();
    await request(app).post(`${BASE}/aporte`).set(auth()).send({ monto: 100, descripcion: "   " });
    expect(llamada(/INSERT INTO movimientos_fondo_emergencia/)[1][3]).toBeNull();

    client.query.mockClear();
    simularFondo();
    await request(app).post(`${BASE}/aporte`).set(auth()).send({ monto: 100, descripcion: "  Bono  " });
    expect(llamada(/INSERT INTO movimientos_fondo_emergencia/)[1][3]).toBe("Bono");
  });

  const invalidos = [
    ["RF-06.3 monto ausente", {}, "El monto del aporte debe ser un número válido"],
    ["RF-06.3 monto vacío", { monto: "" }, "El monto del aporte debe ser un número válido"],
    ["RF-06.3 monto 0", { monto: 0 }, "El monto del aporte debe ser mayor que cero"],
    ["RF-06.3 monto negativo", { monto: -10 }, "El monto del aporte debe ser mayor que cero"],
    ["monto no numérico", { monto: "abc" }, "El monto del aporte debe ser un número válido"],
    ["monto sobre el máximo", { monto: 1000000000001 }, "no puede superar"],
    ["descripción > 255", { monto: 100, descripcion: "d".repeat(256) }, "La descripción no puede superar 255 caracteres"],
    ["descripción no es texto", { monto: 100, descripcion: 123 }, "La descripción debe ser texto"],
  ];
  it.each(invalidos)("%s → 400 sin abrir conexión", async (_n, cuerpo, mensaje) => {
    const res = await request(app).post(`${BASE}/aporte`).set(auth()).send(cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toEqual(expect.stringContaining(mensaje));
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("usuario sin fondo → 404 y ROLLBACK", async () => {
    simularFondo({ existe: false });
    const res = await request(app).post(`${BASE}/aporte`).set(auth()).send({ monto: 100 });
    expect(res.status).toBe(404);
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("INSERT"))).toBe(false);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("error al insertar → 500, ROLLBACK y conexión liberada", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/SELECT id_fondo/.test(sql)) return { rows: [{ id_fondo: 11 }] };
      if (/INSERT INTO movimientos_fondo_emergencia/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });
    const res = await request(app).post(`${BASE}/aporte`).set(auth()).send({ monto: 100 });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("si falla la evaluación del umbral, el aporte sigue siendo 201", async () => {
    simularFondo();
    verificarUmbralEmergencia.mockRejectedValue(new Error("fallo alerta"));
    const res = await request(app).post(`${BASE}/aporte`).set(auth()).send({ monto: 100 });
    expect(res.status).toBe(201);
    expect(sqls()).toContain("COMMIT");
  });
});

// ═════════════════════════════════════════════════════════════
//  Registrar retiro  ·  POST /api/fondo-emergencia/retiro
// ═════════════════════════════════════════════════════════════
describe("RF-06 · Registrar retiro (POST /api/fondo-emergencia/retiro)", () => {
  it("retiro menor al saldo → 201, registra el movimiento 'retiro' y confirma", async () => {
    simularFondo({ saldo: "500000", tipo: "retiro", monto: 120000 });

    const res = await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 120000, descripcion: "Urgencia médica" });

    expect(res.status).toBe(201);
    expect(res.body.mensaje).toBe("Retiro registrado correctamente");
    expect(res.body.datos).toMatchObject({ tipo: "retiro", monto: 120000 });
    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");
    expect(llamada(/INSERT INTO movimientos_fondo_emergencia/)[1]).toEqual([11, "retiro", 120000, "Urgencia médica"]);
  });

  it("bloquea la fila del fondo ANTES de calcular el saldo (evita retiros simultáneos)", async () => {
    simularFondo({ saldo: "500000" });
    await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 100 });

    const lista = sqls();
    const iBloqueo = lista.findIndex((s) => /SELECT id_fondo.*FOR UPDATE/.test(s));
    const iSaldo = lista.findIndex((s) => /AS saldo_actual/.test(s));
    expect(iBloqueo).toBeGreaterThan(0);
    expect(iSaldo).toBeGreaterThan(iBloqueo);
  });

  it("RF-06.4 · retiro igual al saldo disponible es válido", async () => {
    simularFondo({ saldo: "100000" });
    const res = await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 100000 });
    expect(res.status).toBe(201);
  });

  it("RF-06.4 · retiro mayor al saldo → 400, ROLLBACK y no registra nada", async () => {
    simularFondo({ saldo: "100000" });
    const res = await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 100000.01 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, mensaje: "El retiro no puede ser mayor al saldo disponible" });
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("INSERT"))).toBe(false);
    expect(verificarUmbralEmergencia).not.toHaveBeenCalled();
  });

  it("fondo sin saldo (0) → cualquier retiro se rechaza", async () => {
    simularFondo({ saldo: "0" });
    const res = await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 1 });
    expect(res.status).toBe(400);
  });

  it("la comparación se hace en centavos (sin errores de coma flotante)", async () => {
    // 0.1 + 0.2 = 0.30000000000000004 en coma flotante: no debe rechazarse contra un saldo de 0.30
    simularFondo({ saldo: "0.30" });
    const res = await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 0.1 + 0.2 });
    expect(res.status).toBe(201);
  });

  const invalidos = [
    ["RF-06.3 monto ausente", {}, "El monto del retiro debe ser un número válido"],
    ["RF-06.3 monto 0", { monto: 0 }, "El monto del retiro debe ser mayor que cero"],
    ["RF-06.3 monto negativo", { monto: -5 }, "El monto del retiro debe ser mayor que cero"],
    ["monto no numérico", { monto: "abc" }, "El monto del retiro debe ser un número válido"],
    ["monto sobre el máximo", { monto: 1000000000001 }, "no puede superar"],
    ["descripción > 255", { monto: 100, descripcion: "d".repeat(256) }, "La descripción no puede superar 255 caracteres"],
  ];
  it.each(invalidos)("%s → 400 sin abrir conexión", async (_n, cuerpo, mensaje) => {
    const res = await request(app).post(`${BASE}/retiro`).set(auth()).send(cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toEqual(expect.stringContaining(mensaje));
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("usuario sin fondo → 404 y ROLLBACK", async () => {
    simularFondo({ existe: false });
    const res = await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 100 });
    expect(res.status).toBe(404);
    expect(sqls()).toContain("ROLLBACK");
  });

  it("evalúa el umbral del fondo tras un retiro confirmado", async () => {
    simularFondo({ saldo: "1000" });
    await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 100 });
    expect(verificarUmbralEmergencia).toHaveBeenCalledWith(USER_ID);
  });

  it("error al calcular el saldo → 500, ROLLBACK y conexión liberada", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/SELECT id_fondo/.test(sql)) return { rows: [{ id_fondo: 11 }] };
      if (/AS saldo_actual/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });
    const res = await request(app).post(`${BASE}/retiro`).set(auth()).send({ monto: 100 });
    expect(res.status).toBe(500);
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});

// ═════════════════════════════════════════════════════════════
//  Historial  ·  GET /api/fondo-emergencia/movimientos
// ═════════════════════════════════════════════════════════════
describe("RF-06 · Historial de movimientos (GET /api/fondo-emergencia/movimientos)", () => {
  it("devuelve aportes y retiros del usuario, del más reciente al más antiguo", async () => {
    const filas = [
      { id_movimiento_fondo: 2, tipo: "retiro", monto: "50000" },
      { id_movimiento_fondo: 1, tipo: "aporte", monto: "200000" },
    ];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get(`${BASE}/movimientos`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, datos: filas });
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
    expect(sql).toMatch(/WHERE fe\.id_usuario = \$1/);
    expect(sql).toMatch(/ORDER BY mfe\.fecha_registro DESC, mfe\.id_movimiento_fondo DESC/);
  });

  it("sin movimientos → 200 y arreglo vacío", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/movimientos`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, datos: [] });
  });

  it("error de la BD → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/movimientos`).set(auth());
    expect(res.status).toBe(500);
  });
});
