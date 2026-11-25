/**
 * RF-03 · Gestionar gastos (backend)
 * Archivo bajo prueba: Backend/src/controllers/movimientosController.js
 *   → crearMovimiento (subtipo "Gasto"), getGastos, updateGastos, deleteGastos
 * Rutas: Backend/src/routes/movimientosRoutes.js (montadas en /api/movimientos)
 * Estrategia: app Express de prueba con solo movimientosRoutes; BD y servicios
 * mockeados. El JWT se firma de verdad para que verifyToken corra sin mock.
 */

jest.mock("../../../Backend/src/db/connection", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));
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
  verificarUmbralGastos: jest.fn().mockResolvedValue(undefined),
  verificarUmbralImprevistos: jest.fn(),
  verificarUmbralDeudas: jest.fn(),
  verificarUmbralAhorros: jest.fn(),
  verificarMetaAhorroAlcanzada: jest.fn(),
  verificarDeudasProximasAVencer: jest.fn(),
}));
jest.mock("../../../Backend/src/controllers/sincronizacionController", () => ({
  capacidades: jest.fn(),
  consultarOperacion: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const pool = require("../../../Backend/src/db/connection");
const { verificarUmbralGastos } = require("../../../Backend/src/service/NotificacionesService");
const movimientosRoutes = require("../../../Backend/src/routes/movimientosRoutes");

// ── App de prueba ─────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use("/api/movimientos", movimientosRoutes);

const USER_ID = 7;
const auth = () => ({ Authorization: `Bearer ${jwt.sign({ id: USER_ID }, process.env.JWT_SECRET)}` });

// ── Cliente transaccional simulado ────────────────────────────
const client = { query: jest.fn(), release: jest.fn() };
const sqls = () => client.query.mock.calls.map(([s]) => String(s).replace(/\s+/g, " ").trim());
const llamada = (patron) => client.query.mock.calls.find(([s]) => patron.test(String(s)));
const pgError = (code) => Object.assign(new Error(`pg ${code}`), { code });

const flujoCrear = (sql) => {
  if (/INSERT INTO movimientos/.test(sql)) return { rows: [{ id_movimiento: 10 }] };
  if (/INSERT INTO salida/.test(sql)) return { rows: [{ id_salida: 21 }] };
  if (/INSERT INTO gastos/.test(sql)) return { rows: [{ id_gastos: 31 }] };
  return { rows: [] };
};

const bodyValido = (datos = {}) => ({
  tipo_flujo: "Salida",
  subtipo_modulo: "Gasto",
  datos: {
    monto: 85000,
    descripcion: "Mercado semanal",
    fecha_registro: "2026-11-05",
    id_categoria: 3,
    id_dependientes: 4,
    ...datos,
  },
});

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  pool.connect.mockResolvedValue(client);
  client.query.mockImplementation(async (sql) => flujoCrear(String(sql)));
  verificarUmbralGastos.mockResolvedValue(undefined);
});

// ═════════════════════════════════════════════════════════════
//  Precondición: sesión iniciada (JWT)
// ═════════════════════════════════════════════════════════════
describe("RF-03 · Autenticación requerida", () => {
  const rutas = [
    ["POST", "/api/movimientos", "post"],
    ["GET", "/api/movimientos/gastos", "get"],
    ["PUT", "/api/movimientos/gastos/1", "put"],
    ["DELETE", "/api/movimientos/gastos/1", "delete"],
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
    expect(pool.connect).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════
//  Registrar gasto  ·  POST /api/movimientos
// ═════════════════════════════════════════════════════════════
describe("RF-03 · Registrar gasto (POST /api/movimientos)", () => {
  it("crea el gasto con datos completos → 201 y transacción confirmada", async () => {
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      ok: true,
      mensaje: "Movimiento registrado exitosamente",
      ID_movimiento: 10,
      ID_detalle: 31,
    });

    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");

    // RF-03.5: el movimiento queda asociado al usuario del token
    expect(llamada(/INSERT INTO movimientos/)[1]).toEqual([USER_ID, "Salida", "Gasto"]);
    // Datos persistidos: [id_salida, id_categoria, monto, descripcion, fecha, id_dependientes]
    expect(llamada(/INSERT INTO gastos/)[1]).toEqual([21, 3, 85000, "Mercado semanal", "2026-11-05", 4]);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("tras el COMMIT evalúa el umbral del presupuesto (alerta RF-12)", async () => {
    await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(verificarUmbralGastos).toHaveBeenCalledWith(USER_ID);
  });

  it("sin fecha_registro envía null y la BD usa CURRENT_DATE", async () => {
    const body = bodyValido();
    delete body.datos.fecha_registro;

    const res = await request(app).post("/api/movimientos").set(auth()).send(body);

    expect(res.status).toBe(201);
    const [sql, params] = llamada(/INSERT INTO gastos/);
    expect(params[4]).toBeNull();
    expect(sql).toMatch(/COALESCE\(\$5, CURRENT_DATE\)/);
  });

  it("RF-03.3 · categoría, dependiente y descripción son opcionales (null)", async () => {
    const res = await request(app)
      .post("/api/movimientos")
      .set(auth())
      .send({ tipo_flujo: "Salida", subtipo_modulo: "Gasto", datos: { monto: 100 } });

    expect(res.status).toBe(201);
    expect(llamada(/INSERT INTO gastos/)[1]).toEqual([21, null, 100, null, null, null]);
  });

  it("RF-03.4 · asocia el gasto a un dependiente económico", async () => {
    await request(app).post("/api/movimientos").set(auth()).send(bodyValido({ id_dependientes: 9 }));
    expect(llamada(/INSERT INTO gastos/)[1][5]).toBe(9);
  });

  it("acepta el monto como texto numérico y recorta espacios en la descripción", async () => {
    const res = await request(app)
      .post("/api/movimientos")
      .set(auth())
      .send(bodyValido({ monto: "100.50", descripcion: "  Taxi  " }));

    expect(res.status).toBe(201);
    const params = llamada(/INSERT INTO gastos/)[1];
    expect(params[2]).toBe(100.5);
    expect(params[3]).toBe("Taxi");
  });

  it("RF-03.2 · el mínimo de 50 NO se exige en el backend (solo en el formulario web)", async () => {
    // Documenta el comportamiento real: un monto de 10 es aceptado por la API.
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido({ monto: 10 }));
    expect(res.status).toBe(201);
    expect(llamada(/INSERT INTO gastos/)[1][2]).toBe(10);
  });

  describe("RF-03.1 · validaciones → 400 sin abrir conexión a la BD", () => {
    const casos = [
      ["monto ausente", () => { const b = bodyValido(); delete b.datos.monto; return b; }, "El campo monto es requerido"],
      ["monto vacío", () => bodyValido({ monto: "" }), "El campo monto es requerido"],
      ["monto null", () => bodyValido({ monto: null }), "El campo monto es requerido"],
      ["monto 0", () => bodyValido({ monto: 0 }), "El monto debe ser mayor que cero"],
      ["monto negativo", () => bodyValido({ monto: -50 }), "El monto debe ser mayor que cero"],
      ["monto no numérico", () => bodyValido({ monto: "abc" }), "El monto debe ser un número válido"],
      ["monto booleano", () => bodyValido({ monto: true }), "El monto debe ser un número válido"],
      ["monto sobre el máximo", () => bodyValido({ monto: 1000000000001 }), "no puede superar"],
      ["descripción > 255", () => bodyValido({ descripcion: "a".repeat(256) }), "La descripción no puede superar 255 caracteres"],
      ["fecha inexistente", () => bodyValido({ fecha_registro: "2026-02-31" }), "La fecha de registro no es válida (use AAAA-MM-DD)"],
      ["fecha con formato incorrecto", () => bodyValido({ fecha_registro: "05/11/2026" }), "La fecha de registro no es válida (use AAAA-MM-DD)"],
      ["datos ausente", () => ({ tipo_flujo: "Salida", subtipo_modulo: "Gasto" }), "El campo datos es requerido"],
      ["tipo_flujo inválido", () => ({ ...bodyValido(), tipo_flujo: "Otro" }), "tipo_flujo inválido"],
      ["subtipo no válido para Salida", () => ({ ...bodyValido(), subtipo_modulo: "Ingreso" }), "Subtipo inválido para Salida"],
    ];

    it.each(casos)("%s", async (_nombre, armar, mensaje) => {
      const res = await request(app).post("/api/movimientos").set(auth()).send(armar());

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.mensaje).toEqual(expect.stringContaining(mensaje));
      expect(pool.connect).not.toHaveBeenCalled();
    });
  });

  it("RF-03.3 · categoría inexistente (FK 23503) → 400 con ROLLBACK", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO gastos/.test(sql)) throw pgError("23503");
      return flujoCrear(String(sql));
    });

    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());

    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("La categoría o el dependiente indicado no existe");
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls()).not.toContain("COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("violación del CHECK monto > 0 de la BD (23514) → 400", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO gastos/.test(sql)) throw pgError("23514");
      return flujoCrear(String(sql));
    });

    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());

    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("Los datos enviados no cumplen las restricciones de la base de datos");
  });

  it("error inesperado de BD → 500 genérico con ROLLBACK", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO gastos/.test(sql)) throw new Error("boom");
      return flujoCrear(String(sql));
    });

    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("si falla la evaluación del umbral tras el COMMIT, la creación sigue siendo 201", async () => {
    verificarUmbralGastos.mockRejectedValue(new Error("fallo alerta"));

    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());

    expect(res.status).toBe(201);
    expect(sqls()).toContain("COMMIT");
  });
});

// ═════════════════════════════════════════════════════════════
//  Consultar gastos  ·  GET /api/movimientos/gastos
// ═════════════════════════════════════════════════════════════
describe("RF-03 · Consultar gastos (GET /api/movimientos/gastos)", () => {
  it("devuelve el listado del usuario ordenado por fecha descendente", async () => {
    const filas = [
      { id: 2, monto: "50000", descripcion: "Bus", fecha: "2026-11-06", categoria: "Transporte", dependiente: null },
      { id: 1, monto: "85000", descripcion: "Mercado", fecha: "2026-11-05", categoria: "Hogar", dependiente: "Ana" },
    ];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get("/api/movimientos/gastos").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(filas);

    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]); // RF-03.5: solo los gastos del usuario del token
    expect(sql).toMatch(/WHERE m\.id_usuario = \$1/);
    expect(sql).toMatch(/ORDER BY g\.fecha_registro DESC/);
    expect(sql).toMatch(/LEFT\s+JOIN dependientes/); // incluye el dependiente asociado
  });

  it("usuario sin gastos → 200 con arreglo vacío", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get("/api/movimientos/gastos").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("error de la BD → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("db caída"));
    const res = await request(app).get("/api/movimientos/gastos").set(auth());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
  });
});

// ═════════════════════════════════════════════════════════════
//  Editar gasto  ·  PUT /api/movimientos/gastos/:id
// ═════════════════════════════════════════════════════════════
describe("RF-03 · Editar gasto (PUT /api/movimientos/gastos/:id)", () => {
  const cuerpo = (extra = {}) => ({
    monto: 90000,
    descripcion: "Mercado (editado)",
    fecha_registro: "2026-11-06",
    id_categoria: 3,
    id_dependientes: 4,
    ...extra,
  });

  beforeEach(() => pool.query.mockResolvedValue({ rowCount: 1, rows: [] }));

  it("gasto propio con datos válidos → 200 y evalúa el umbral", async () => {
    const res = await request(app).put("/api/movimientos/gastos/12").set(auth()).send(cuerpo());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Gasto actualizado exitosamente" });

    const [sql, params] = pool.query.mock.calls[0];
    // [monto, descripcion, fecha, id_categoria, id_dependientes, id_gasto, id_usuario]
    expect(params).toEqual([90000, "Mercado (editado)", "2026-11-06", 3, 4, "12", USER_ID]);
    expect(sql).toMatch(/id_usuario = \$7/); // RF-03.5: restringido al dueño
    expect(verificarUmbralGastos).toHaveBeenCalledWith(USER_ID);
  });

  it("campos opcionales omitidos: descripción, categoría y dependiente quedan null; la fecha se conserva", async () => {
    const res = await request(app).put("/api/movimientos/gastos/12").set(auth()).send({ monto: 60 });

    expect(res.status).toBe(200);
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([60, null, null, null, null, "12", USER_ID]);
    expect(sql).toMatch(/COALESCE\(\$3, fecha_registro\)/);
  });

  it("gasto inexistente o de otro usuario → 404 y no evalúa el umbral", async () => {
    pool.query.mockResolvedValue({ rowCount: 0, rows: [] });

    const res = await request(app).put("/api/movimientos/gastos/12").set(auth()).send(cuerpo());

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "Gasto no encontrado" });
    expect(verificarUmbralGastos).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-1", "1.5", "99999999999"])("id de ruta inválido (%s) → 400 sin consultar la BD", async (id) => {
    const res = await request(app).put(`/api/movimientos/gastos/${id}`).set(auth()).send(cuerpo());
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  const invalidos = [
    ["monto ausente", { monto: undefined }],
    ["monto 0", { monto: 0 }],
    ["monto negativo", { monto: -10 }],
    ["monto no numérico", { monto: "abc" }],
    ["fecha inválida", { fecha_registro: "2026-13-01" }],
    ["descripción > 255", { descripcion: "x".repeat(256) }],
  ];
  it.each(invalidos)("%s → 400 sin consultar la BD", async (_n, extra) => {
    const res = await request(app).put("/api/movimientos/gastos/12").set(auth()).send(cuerpo(extra));
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("categoría inexistente (23503) → 400", async () => {
    pool.query.mockRejectedValue(pgError("23503"));
    const res = await request(app).put("/api/movimientos/gastos/12").set(auth()).send(cuerpo());
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("La categoría o el dependiente indicado no existe");
  });

  it("violación del CHECK de la BD (23514) → 400", async () => {
    pool.query.mockRejectedValue(pgError("23514"));
    const res = await request(app).put("/api/movimientos/gastos/12").set(auth()).send(cuerpo());
    expect(res.status).toBe(400);
  });

  it("error inesperado → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).put("/api/movimientos/gastos/12").set(auth()).send(cuerpo());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
  });

  it("si falla la evaluación del umbral, la edición se mantiene (200)", async () => {
    verificarUmbralGastos.mockRejectedValue(new Error("fallo alerta"));
    const res = await request(app).put("/api/movimientos/gastos/12").set(auth()).send(cuerpo());
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════
//  Eliminar gasto  ·  DELETE /api/movimientos/gastos/:id
// ═════════════════════════════════════════════════════════════
describe("RF-03 · Eliminar gasto (DELETE /api/movimientos/gastos/:id)", () => {
  const filaPropia = { id_salida: 21, id_movimiento: 10 };

  it("gasto propio → 200; borra gastos → salida → movimientos y confirma", async () => {
    client.query.mockImplementation(async (sql) =>
      /SELECT p\.id_salida/.test(sql) ? { rows: [filaPropia] } : { rows: [] }
    );

    const res = await request(app).delete("/api/movimientos/gastos/12").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Gasto eliminado exitosamente" });

    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");
    const orden = ["DELETE FROM gastos", "DELETE FROM salida", "DELETE FROM movimientos"].map((p) =>
      lista.findIndex((s) => s.startsWith(p))
    );
    expect(orden.every((i) => i > 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);

    // RF-03.5: la búsqueda del gasto está filtrada por el usuario del token
    expect(llamada(/SELECT p\.id_salida/)[1]).toEqual(["12", USER_ID]);
  });

  it("gasto inexistente o de otro usuario → 404, ROLLBACK y no borra nada", async () => {
    client.query.mockImplementation(async () => ({ rows: [] }));

    const res = await request(app).delete("/api/movimientos/gastos/12").set(auth());

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "Gasto no encontrado" });
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("DELETE"))).toBe(false);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it.each(["abc", "0", "-1", "1.5"])("id de ruta inválido (%s) → 400 sin abrir conexión", async (id) => {
    const res = await request(app).delete(`/api/movimientos/gastos/${id}`).set(auth());
    expect(res.status).toBe(400);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("error durante el borrado → 500, ROLLBACK y conexión liberada", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/SELECT p\.id_salida/.test(sql)) return { rows: [filaPropia] };
      if (/^\s*DELETE FROM gastos/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });

    const res = await request(app).delete("/api/movimientos/gastos/12").set(auth());

    expect(res.status).toBe(500);
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
