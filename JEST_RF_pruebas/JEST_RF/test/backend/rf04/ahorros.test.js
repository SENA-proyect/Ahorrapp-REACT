/**
 * RF-04 · Gestionar ahorros (backend)
 * Archivos bajo prueba:
 *   Backend/src/controllers/movimientosController.js
 *     → crearMovimiento (subtipo "Ahorro"), getAhorros, updateAhorros, deleteAhorros,
 *       abonarAhorro, getAbonosAhorro
 *   Backend/src/service/NotificacionesService.js → verificarMetaAhorroAlcanzada (RF-04.7)
 * Rutas: Backend/src/routes/movimientosRoutes.js (montadas en /api/movimientos)
 * Estrategia: app Express de prueba; BD y servicios mockeados; JWT firmado de verdad.
 */

jest.mock("../../../Backend/src/db/connection", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("../../../Backend/src/config/firebase", () => ({
  messaging: () => ({ sendEachForMulticast: jest.fn().mockResolvedValue({ responses: [] }) }),
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
  verificarUmbralGastos: jest.fn(),
  verificarUmbralImprevistos: jest.fn(),
  verificarUmbralDeudas: jest.fn(),
  verificarUmbralAhorros: jest.fn().mockResolvedValue(undefined),
  verificarMetaAhorroAlcanzada: jest.fn().mockResolvedValue(undefined),
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
const {
  verificarMetaAhorroAlcanzada,
  verificarUmbralAhorros,
} = require("../../../Backend/src/service/NotificacionesService");
const movimientosRoutes = require("../../../Backend/src/routes/movimientosRoutes");

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
  if (/INSERT INTO entrada/.test(sql)) return { rows: [{ id_entrada: 20 }] };
  if (/INSERT INTO ahorros/.test(sql)) return { rows: [{ id_ahorros: 40 }] };
  return { rows: [] };
};

const bodyValido = (datos = {}) => ({
  tipo_flujo: "Entrada",
  subtipo_modulo: "Ahorro",
  datos: {
    monto: 2000000, // monto objetivo de la meta
    meta: "Vacaciones",
    descripcion: "Viaje a la costa",
    fecha_registro: "2026-11-01",
    fecha_meta: "2027-06-30",
    id_categoria: 5,
    ...datos,
  },
});

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  pool.connect.mockResolvedValue(client);
  client.query.mockImplementation(async (sql) => flujoCrear(String(sql)));
});

// ═════════════════════════════════════════════════════════════
describe("RF-04 · Autenticación requerida", () => {
  const rutas = [
    ["POST", "/api/movimientos", "post"],
    ["GET", "/api/movimientos/ahorros", "get"],
    ["PUT", "/api/movimientos/ahorros/1", "put"],
    ["DELETE", "/api/movimientos/ahorros/1", "delete"],
    ["PATCH", "/api/movimientos/ahorros/1/abonar", "patch"],
    ["GET", "/api/movimientos/ahorros/abonos", "get"],
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
//  Crear meta  ·  POST /api/movimientos (Entrada / Ahorro)
// ═════════════════════════════════════════════════════════════
describe("RF-04 · Crear meta de ahorro (POST /api/movimientos)", () => {
  it("crea la meta con datos completos → 201 y transacción confirmada", async () => {
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      ok: true,
      mensaje: "Movimiento registrado exitosamente",
      ID_movimiento: 10,
      ID_detalle: 40,
    });
    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");
    expect(llamada(/INSERT INTO movimientos/)[1]).toEqual([USER_ID, "Entrada", "Ahorro"]);
    // [id_entrada, id_categoria, monto objetivo, descripcion, meta, fecha_registro, fecha_meta]
    expect(llamada(/INSERT INTO ahorros/)[1]).toEqual([
      20, 5, 2000000, "Viaje a la costa", "Vacaciones", "2026-11-01", "2027-06-30",
    ]);
    expect(verificarUmbralAhorros).toHaveBeenCalledWith(USER_ID);
  });

  it("la fecha meta es opcional (se guarda null) y sin fecha_registro la BD usa CURRENT_DATE", async () => {
    const body = bodyValido();
    delete body.datos.fecha_meta;
    delete body.datos.fecha_registro;

    const res = await request(app).post("/api/movimientos").set(auth()).send(body);

    expect(res.status).toBe(201);
    const [sql, params] = llamada(/INSERT INTO ahorros/);
    expect(params[5]).toBeNull();
    expect(params[6]).toBeNull();
    expect(sql).toMatch(/COALESCE\(\$6, CURRENT_DATE\)/);
  });

  it("el monto acumulado no se envía: la BD lo inicia por defecto", async () => {
    await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(llamada(/INSERT INTO ahorros/)[0]).not.toMatch(/monto_acumulado/);
  });

  it("RF-04.5 · fecha meta igual a la fecha de registro es válida", async () => {
    const res = await request(app)
      .post("/api/movimientos").set(auth())
      .send(bodyValido({ fecha_registro: "2026-11-01", fecha_meta: "2026-11-01" }));
    expect(res.status).toBe(201);
  });

  describe("validaciones → 400 sin abrir conexión a la BD", () => {
    const casos = [
      ["RF-04.1 monto objetivo ausente", () => { const b = bodyValido(); delete b.datos.monto; return b; }, "El campo monto es requerido"],
      ["RF-04.1 monto objetivo vacío", () => bodyValido({ monto: "" }), "El campo monto es requerido"],
      ["RF-04.1 monto objetivo 0", () => bodyValido({ monto: 0 }), "El monto debe ser mayor que cero"],
      ["RF-04.1 monto objetivo negativo", () => bodyValido({ monto: -100 }), "El monto debe ser mayor que cero"],
      ["monto no numérico", () => bodyValido({ monto: "abc" }), "El monto debe ser un número válido"],
      ["monto sobre el máximo", () => bodyValido({ monto: 1000000000001 }), "no puede superar"],
      ["nombre de meta ausente", () => bodyValido({ meta: undefined }), "El nombre de la meta es requerido"],
      ["nombre de meta solo espacios", () => bodyValido({ meta: "   " }), "El nombre de la meta es requerido"],
      ["nombre de meta > 100", () => bodyValido({ meta: "m".repeat(101) }), "El nombre de la meta no puede superar 100 caracteres"],
      ["descripción > 255", () => bodyValido({ descripcion: "a".repeat(256) }), "La descripción no puede superar 255 caracteres"],
      ["fecha de registro inválida", () => bodyValido({ fecha_registro: "2026-02-30" }), "La fecha de registro no es válida"],
      ["fecha meta inválida", () => bodyValido({ fecha_meta: "30/06/2027" }), "La fecha meta no es válida (use AAAA-MM-DD)"],
      [
        "RF-04.5 fecha meta anterior a la fecha de registro",
        () => bodyValido({ fecha_registro: "2026-11-10", fecha_meta: "2026-11-09" }),
        "La fecha meta no puede ser anterior a la fecha de registro",
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
      if (/INSERT INTO ahorros/.test(sql)) throw pgError("23503");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(400);
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("violación del CHECK de la BD (23514) → 400", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO ahorros/.test(sql)) throw pgError("23514");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(400);
  });

  it("error inesperado → 500 genérico con ROLLBACK", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO ahorros/.test(sql)) throw new Error("boom");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
    expect(sqls()).toContain("ROLLBACK");
  });

  it("si falla la evaluación del umbral de ahorros, la creación sigue siendo 201", async () => {
    verificarUmbralAhorros.mockRejectedValueOnce(new Error("fallo alerta"));
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(201);
  });
});

// ═════════════════════════════════════════════════════════════
//  Consultar metas  ·  GET /api/movimientos/ahorros
// ═════════════════════════════════════════════════════════════
describe("RF-04 · Consultar metas (GET /api/movimientos/ahorros)", () => {
  it("devuelve las metas del usuario con su monto acumulado", async () => {
    const filas = [{ id: 1, monto: "2000000", monto_acumulado: "500000", meta: "Vacaciones", fecha_meta: "2027-06-30" }];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get("/api/movimientos/ahorros").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(filas);
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
    expect(sql).toMatch(/a\.monto_acumulado AS monto_acumulado/);
    expect(sql).toMatch(/WHERE m\.id_usuario = \$1/);
  });

  it("usuario sin metas → 200 y arreglo vacío", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get("/api/movimientos/ahorros").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("error de la BD → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("db caída"));
    const res = await request(app).get("/api/movimientos/ahorros").set(auth());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  Modificar meta  ·  PUT /api/movimientos/ahorros/:id
// ═════════════════════════════════════════════════════════════
describe("RF-04 · Modificar meta (PUT /api/movimientos/ahorros/:id)", () => {
  const actual = { id_ahorros: 3, monto_acumulado: "500000", meta: "Vacaciones" };
  const cuerpo = (extra = {}) => ({
    monto: 2500000,
    meta: "Vacaciones 2027",
    descripcion: "Viaje",
    fecha_registro: "2026-11-01",
    fecha_meta: "2027-07-30",
    id_categoria: 5,
    ...extra,
  });

  beforeEach(() => {
    // 1ª consulta: SELECT de la meta propia; 2ª: UPDATE
    pool.query.mockImplementation(async (sql) => (/^\s*SELECT/.test(sql) ? { rows: [actual] } : { rows: [], rowCount: 1 }));
  });

  it("meta propia con datos válidos → 200; conserva el acumulado de la BD", async () => {
    const res = await request(app).put("/api/movimientos/ahorros/3").set(auth()).send(cuerpo());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Ahorro actualizado exitosamente" });

    expect(pool.query.mock.calls[0][1]).toEqual(["3", USER_ID]); // búsqueda restringida al dueño
    const [, params] = pool.query.mock.calls[1];
    // [monto, monto_acumulado, descripcion, meta, fecha_registro, fecha_meta, id_categoria, id]
    expect(params).toEqual([2500000, 500000, "Viaje", "Vacaciones 2027", "2026-11-01", "2027-07-30", 5, "3"]);
    expect(verificarUmbralAhorros).toHaveBeenCalledWith(USER_ID);
    expect(verificarMetaAhorroAlcanzada).not.toHaveBeenCalled();
  });

  it("RF-04.1 · el nuevo monto objetivo no puede ser menor al acumulado → 400", async () => {
    const res = await request(app).put("/api/movimientos/ahorros/3").set(auth()).send(cuerpo({ monto: 400000 }));

    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("La meta no puede ser menor a lo ya acumulado");
    expect(pool.query).toHaveBeenCalledTimes(1); // no llegó al UPDATE
  });

  it("si el ajuste completa la meta, genera la notificación de meta alcanzada (RF-04.7)", async () => {
    const res = await request(app).put("/api/movimientos/ahorros/3").set(auth()).send(cuerpo({ monto: 500000 }));

    expect(res.status).toBe(200);
    expect(verificarMetaAhorroAlcanzada).toHaveBeenCalledWith(
      USER_ID,
      { id_ahorros: 3, meta_monto: 500000, meta_nombre: "Vacaciones 2027" },
      500000
    );
  });

  it("acepta monto_acumulado explícito (>= 0) y lo guarda", async () => {
    await request(app).put("/api/movimientos/ahorros/3").set(auth()).send(cuerpo({ monto_acumulado: 800000 }));
    expect(pool.query.mock.calls[1][1][1]).toBe(800000);
  });

  it("monto_acumulado negativo → 400", async () => {
    const res = await request(app).put("/api/movimientos/ahorros/3").set(auth()).send(cuerpo({ monto_acumulado: -1 }));
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("El monto acumulado no puede ser negativo");
  });

  it("meta inexistente o de otro usuario → 404", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).put("/api/movimientos/ahorros/3").set(auth()).send(cuerpo());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "Ahorro no encontrado" });
  });

  it.each(["abc", "0", "-1", "1.5"])("id de ruta inválido (%s) → 400 sin consultar la BD", async (id) => {
    const res = await request(app).put(`/api/movimientos/ahorros/${id}`).set(auth()).send(cuerpo());
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  const invalidos = [
    ["monto objetivo ausente", { monto: undefined }],
    ["monto objetivo 0", { monto: 0 }],
    ["monto objetivo negativo", { monto: -5 }],
    ["RF-04.5 fecha meta anterior a fecha de registro", { fecha_registro: "2026-11-10", fecha_meta: "2026-11-01" }],
    ["fecha meta inválida", { fecha_meta: "2027-02-31" }],
    ["nombre de meta > 100", { meta: "m".repeat(101) }],
  ];
  it.each(invalidos)("%s → 400 sin consultar la BD", async (_n, extra) => {
    const res = await request(app).put("/api/movimientos/ahorros/3").set(auth()).send(cuerpo(extra));
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("error inesperado → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).put("/api/movimientos/ahorros/3").set(auth()).send(cuerpo());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  Eliminar meta  ·  DELETE /api/movimientos/ahorros/:id
// ═════════════════════════════════════════════════════════════
describe("RF-04 · Eliminar meta (DELETE /api/movimientos/ahorros/:id)", () => {
  it("meta propia → 200; borra ahorros → entrada → movimientos y recalcula umbral", async () => {
    client.query.mockImplementation(async (sql) =>
      /SELECT p\.id_entrada/.test(sql) ? { rows: [{ id_entrada: 20, id_movimiento: 10 }] } : { rows: [] }
    );

    const res = await request(app).delete("/api/movimientos/ahorros/3").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Ahorro eliminado exitosamente" });
    const lista = sqls();
    expect(lista[lista.length - 1]).toBe("COMMIT");
    const orden = ["DELETE FROM ahorros", "DELETE FROM entrada", "DELETE FROM movimientos"].map((p) =>
      lista.findIndex((s) => s.startsWith(p))
    );
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    expect(orden.every((i) => i > 0)).toBe(true);
    expect(verificarUmbralAhorros).toHaveBeenCalledWith(USER_ID);
  });

  it("meta inexistente o de otro usuario → 404 y ROLLBACK", async () => {
    client.query.mockImplementation(async () => ({ rows: [] }));
    const res = await request(app).delete("/api/movimientos/ahorros/3").set(auth());
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("Ahorro no encontrado");
    expect(sqls()).toContain("ROLLBACK");
  });

  it.each(["abc", "0", "-1"])("id de ruta inválido (%s) → 400", async (id) => {
    const res = await request(app).delete(`/api/movimientos/ahorros/${id}`).set(auth());
    expect(res.status).toBe(400);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("error durante el borrado → 500, ROLLBACK y conexión liberada", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/SELECT p\.id_entrada/.test(sql)) return { rows: [{ id_entrada: 20, id_movimiento: 10 }] };
      if (/^\s*DELETE FROM ahorros/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });
    const res = await request(app).delete("/api/movimientos/ahorros/3").set(auth());
    expect(res.status).toBe(500);
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});

// ═════════════════════════════════════════════════════════════
//  Abonar  ·  PATCH /api/movimientos/ahorros/:id/abonar
// ═════════════════════════════════════════════════════════════
describe("RF-04 · Registrar abono (PATCH /api/movimientos/ahorros/:id/abonar)", () => {
  // Meta de 1.000.000 con 400.000 acumulados → restante 600.000
  const ahorro = { id_ahorros: 3, meta_monto: "1000000", monto_acumulado: "400000", meta_nombre: "Vacaciones" };
  const conAhorro = (fila = ahorro) =>
    client.query.mockImplementation(async (sql) => (/FOR UPDATE/.test(sql) ? { rows: fila ? [fila] : [] } : { rows: [] }));

  it("RF-04.6 · abono válido → 200, registra el abono y recalcula el acumulado", async () => {
    conAhorro();
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto: 100000 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      mensaje: "Abono registrado correctamente",
      acumulado: 500000,
      meta: 1000000,
      progreso: 50,
      meta_alcanzada: false,
    });
    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");
    expect(llamada(/INSERT INTO abonos_ahorro/)[1]).toEqual(["3", 100000]);
    expect(llamada(/UPDATE ahorros SET monto_acumulado/)[1]).toEqual([500000, "3"]);
    // La meta se busca solo entre las del usuario
    expect(llamada(/FOR UPDATE/)[1]).toEqual(["3", USER_ID]);
    expect(verificarMetaAhorroAlcanzada).toHaveBeenCalledWith(USER_ID, ahorro, 500000);
    expect(verificarUmbralAhorros).toHaveBeenCalledWith(USER_ID);
  });

  it("acepta el monto como texto y lo redondea a centavos", async () => {
    conAhorro();
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto: "100.505" });
    expect(res.status).toBe(200);
    expect(llamada(/INSERT INTO abonos_ahorro/)[1][1]).toBe(100.51);
  });

  it("RF-04.7 · el abono que completa la meta marca meta_alcanzada y notifica", async () => {
    conAhorro();
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto: 600000 });

    expect(res.status).toBe(200);
    expect(res.body.acumulado).toBe(1000000);
    expect(res.body.progreso).toBe(100);
    expect(res.body.meta_alcanzada).toBe(true);
    expect(verificarMetaAhorroAlcanzada).toHaveBeenCalledWith(USER_ID, ahorro, 1000000);
  });

  it("RF-04.3 · abono mayor al monto restante → 400 con el máximo permitido y ROLLBACK", async () => {
    conAhorro();
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto: 600000.01 });

    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("El aporte máximo permitido es 600000.00");
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("INSERT INTO abonos_ahorro"))).toBe(false);
  });

  it("RF-04.4 · meta ya alcanzada → 400 y no registra el abono", async () => {
    conAhorro({ ...ahorro, monto_acumulado: "1000000" });
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto: 10 });

    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("La meta de ahorro ya fue alcanzada");
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("INSERT INTO abonos_ahorro"))).toBe(false);
    expect(verificarMetaAhorroAlcanzada).not.toHaveBeenCalled();
  });

  it("meta inexistente o de otro usuario → 404 y ROLLBACK", async () => {
    conAhorro(null);
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto: 100 });
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("Ahorro no encontrado");
    expect(sqls()).toContain("ROLLBACK");
  });

  const montosInvalidos = [
    ["RF-04.2 monto ausente", undefined, "El monto del abono debe ser un número válido"],
    ["RF-04.2 monto vacío", "", "El monto del abono debe ser un número válido"],
    ["RF-04.2 monto 0", 0, "El monto del abono debe ser mayor que cero"],
    ["RF-04.2 monto negativo", -5, "El monto del abono debe ser mayor que cero"],
    ["monto no numérico", "abc", "El monto del abono debe ser un número válido"],
    ["monto booleano", true, "El monto del abono debe ser un número válido"],
    ["monto sobre el máximo", 1000000000001, "no puede superar"],
  ];
  it.each(montosInvalidos)("%s → 400 sin abrir conexión", async (_n, monto, mensaje) => {
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toEqual(expect.stringContaining(mensaje));
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("sin cuerpo en la petición → 400", async () => {
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth());
    expect(res.status).toBe(400);
  });

  it.each(["abc", "0", "-1", "1.5"])("id de ruta inválido (%s) → 400", async (id) => {
    const res = await request(app).patch(`/api/movimientos/ahorros/${id}/abonar`).set(auth()).send({ monto: 100 });
    expect(res.status).toBe(400);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("error inesperado → 500, ROLLBACK y conexión liberada", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/FOR UPDATE/.test(sql)) return { rows: [ahorro] };
      if (/INSERT INTO abonos_ahorro/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto: 100 });
    expect(res.status).toBe(500);
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("si falla la notificación posterior, el abono sigue confirmado (200)", async () => {
    conAhorro();
    verificarMetaAhorroAlcanzada.mockRejectedValueOnce(new Error("fallo push"));
    const res = await request(app).patch("/api/movimientos/ahorros/3/abonar").set(auth()).send({ monto: 600000 });
    expect(res.status).toBe(200);
    expect(sqls()).toContain("COMMIT");
  });
});

// ═════════════════════════════════════════════════════════════
//  Historial de abonos  ·  GET /api/movimientos/ahorros/abonos
// ═════════════════════════════════════════════════════════════
describe("RF-04 · Historial de abonos (GET /api/movimientos/ahorros/abonos)", () => {
  it("devuelve los abonos del usuario, del más reciente al más antiguo", async () => {
    const filas = [{ id_abono: 2, id_ahorros: 3, monto: "100000", fecha_registro: "2026-11-10" }];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get("/api/movimientos/ahorros/abonos").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, datos: filas });
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
    expect(sql).toMatch(/ORDER BY aa\.fecha_registro DESC, aa\.id_abono DESC/);
  });

  it("la ruta /abonos no se confunde con un :id (no devuelve 400 por id inválido)", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get("/api/movimientos/ahorros/abonos").set(auth());
    expect(res.status).toBe(200);
  });

  it("error de la BD → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get("/api/movimientos/ahorros/abonos").set(auth());
    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
//  RF-04.7 · Notificación de meta alcanzada (servicio real)
// ═════════════════════════════════════════════════════════════
describe("RF-04.7 · NotificacionesService.verificarMetaAhorroAlcanzada", () => {
  const servicio = jest.requireActual("../../../Backend/src/service/NotificacionesService");
  const ahorro = { id_ahorros: 3, meta_monto: "1000000", meta_nombre: "Vacaciones" };

  // Enruta las consultas del servicio: preferencia, existencia previa, INSERT y push
  const simularBD = ({ existe = false, preferencia = [] } = {}) =>
    pool.query.mockImplementation(async (sql) => {
      if (/FROM preferencias_notificacion/.test(sql)) return { rows: preferencia };
      if (/SELECT id_notificacion FROM notificaciones/.test(sql)) return { rows: existe ? [{ id_notificacion: 1 }] : [] };
      if (/INSERT INTO notificaciones/.test(sql)) return { rows: [{ id_notificacion: 99 }] };
      return { rows: [] }; // push_tokens
    });
  const insercion = () => pool.query.mock.calls.find(([s]) => /INSERT INTO notificaciones/.test(s));

  it("acumulado >= meta → crea la notificación 'ahorro_meta' para el usuario", async () => {
    simularBD();
    await servicio.verificarMetaAhorroAlcanzada(USER_ID, ahorro, 1000000);

    const [, params] = insercion();
    expect(params).toEqual([USER_ID, "alerta_presupuesto", "ahorro_meta", 3, "¡Felicidades! Alcanzaste Vacaciones."]);
  });

  it("acumulado menor a la meta → no crea notificación", async () => {
    simularBD();
    await servicio.verificarMetaAhorroAlcanzada(USER_ID, ahorro, 999999.99);
    expect(insercion()).toBeUndefined();
  });

  it("ya existe la notificación de esa meta → no la duplica", async () => {
    simularBD({ existe: true });
    await servicio.verificarMetaAhorroAlcanzada(USER_ID, ahorro, 1000000);
    expect(insercion()).toBeUndefined();
  });

  it("meta sin nombre → usa el texto genérico 'tu meta de ahorro'", async () => {
    simularBD();
    await servicio.verificarMetaAhorroAlcanzada(USER_ID, { ...ahorro, meta_nombre: "  " }, 1000000);
    expect(insercion()[1][4]).toBe("¡Felicidades! Alcanzaste tu meta de ahorro.");
  });

  it("monto de la meta inválido (0) → no notifica", async () => {
    simularBD();
    await servicio.verificarMetaAhorroAlcanzada(USER_ID, { ...ahorro, meta_monto: 0 }, 10);
    expect(insercion()).toBeUndefined();
  });

  it("si el usuario desactivó ese tipo de notificación → no la crea", async () => {
    simularBD({ preferencia: [{ Activa: false }] });
    await servicio.verificarMetaAhorroAlcanzada(USER_ID, ahorro, 1000000);
    expect(insercion()).toBeUndefined();
  });

  it("un error de BD no se propaga (no tumba el abono)", async () => {
    pool.query.mockRejectedValue(new Error("db caída"));
    await expect(servicio.verificarMetaAhorroAlcanzada(USER_ID, ahorro, 1000000)).resolves.toBeUndefined();
  });
});
