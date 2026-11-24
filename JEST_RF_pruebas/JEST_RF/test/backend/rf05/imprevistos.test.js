/**
 * RF-05 · Gestionar imprevistos (backend)
 * Archivos bajo prueba:
 *   Backend/src/controllers/movimientosController.js
 *     → crearMovimiento (subtipo "Imprevisto"), getImprevistos, updateImprevistos, deleteImprevistos
 *   Backend/src/service/NotificacionesService.js
 *     → verificarUmbralImprevistos (alerta al 85 %), verificarImprevistosNoUsados (sugerencia al cierre)
 * Rutas: Backend/src/routes/movimientosRoutes.js (montadas en /api/movimientos)
 * Estrategia: app Express de prueba; BD mockeada; JWT firmado de verdad. Las pruebas
 * de notificaciones usan el servicio REAL con la BD simulada.
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
  verificarUmbralImprevistos: jest.fn().mockResolvedValue(undefined),
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
const { verificarUmbralImprevistos } = require("../../../Backend/src/service/NotificacionesService");
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
  if (/INSERT INTO salida/.test(sql)) return { rows: [{ id_salida: 21 }] };
  if (/INSERT INTO imprevistos/.test(sql)) return { rows: [{ id_imprevistos: 50 }] };
  return { rows: [] };
};

const bodyValido = (datos = {}) => ({
  tipo_flujo: "Salida",
  subtipo_modulo: "Imprevisto",
  datos: {
    monto: 320000,
    causa: "Reparación de la nevera",
    fecha_registro: "2026-11-08",
    id_categoria: 6,
    id_dependientes: 2,
    ...datos,
  },
});

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  pool.connect.mockResolvedValue(client);
  client.query.mockImplementation(async (sql) => flujoCrear(String(sql)));
  verificarUmbralImprevistos.mockResolvedValue(undefined);
});

// ═════════════════════════════════════════════════════════════
describe("RF-05 · Autenticación requerida", () => {
  const rutas = [
    ["POST", "/api/movimientos", "post"],
    ["GET", "/api/movimientos/imprevistos", "get"],
    ["PUT", "/api/movimientos/imprevistos/1", "put"],
    ["DELETE", "/api/movimientos/imprevistos/1", "delete"],
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
//  Registrar imprevisto  ·  POST /api/movimientos (Salida / Imprevisto)
// ═════════════════════════════════════════════════════════════
describe("RF-05 · Registrar imprevisto (POST /api/movimientos)", () => {
  it("crea el imprevisto con datos completos → 201 y transacción confirmada", async () => {
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      ok: true,
      mensaje: "Movimiento registrado exitosamente",
      ID_movimiento: 10,
      ID_detalle: 50,
    });
    const lista = sqls();
    expect(lista[0]).toBe("BEGIN");
    expect(lista[lista.length - 1]).toBe("COMMIT");
    // RF-05.6: el imprevisto pertenece al usuario del token
    expect(llamada(/INSERT INTO movimientos/)[1]).toEqual([USER_ID, "Salida", "Imprevisto"]);
    // [id_salida, id_categoria, monto, causa, fecha, id_dependientes]
    expect(llamada(/INSERT INTO imprevistos/)[1]).toEqual([21, 6, 320000, "Reparación de la nevera", "2026-11-08", 2]);
  });

  it("RF-05.2/05.3 · tras el COMMIT evalúa el consumo de la porción de imprevistos", async () => {
    await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(verificarUmbralImprevistos).toHaveBeenCalledWith(USER_ID);
  });

  it("sin fecha_registro envía null y la BD usa CURRENT_DATE", async () => {
    const body = bodyValido();
    delete body.datos.fecha_registro;
    const res = await request(app).post("/api/movimientos").set(auth()).send(body);
    expect(res.status).toBe(201);
    const [sql, params] = llamada(/INSERT INTO imprevistos/);
    expect(params[4]).toBeNull();
    expect(sql).toMatch(/COALESCE\(\$5, CURRENT_DATE\)/);
  });

  it("solo el monto es obligatorio en el backend: causa, categoría y dependiente → null", async () => {
    const res = await request(app)
      .post("/api/movimientos").set(auth())
      .send({ tipo_flujo: "Salida", subtipo_modulo: "Imprevisto", datos: { monto: 100 } });

    expect(res.status).toBe(201);
    expect(llamada(/INSERT INTO imprevistos/)[1]).toEqual([21, null, 100, null, null, null]);
  });

  it("recorta espacios de la causa y acepta monto como texto", async () => {
    await request(app).post("/api/movimientos").set(auth()).send(bodyValido({ monto: "99.90", causa: "  Grúa  " }));
    const params = llamada(/INSERT INTO imprevistos/)[1];
    expect(params[2]).toBe(99.9);
    expect(params[3]).toBe("Grúa");
  });

  describe("RF-05.1 · validaciones → 400 sin abrir conexión a la BD", () => {
    const casos = [
      ["monto ausente", () => { const b = bodyValido(); delete b.datos.monto; return b; }, "El campo monto es requerido"],
      ["monto vacío", () => bodyValido({ monto: "" }), "El campo monto es requerido"],
      ["monto null", () => bodyValido({ monto: null }), "El campo monto es requerido"],
      ["monto 0", () => bodyValido({ monto: 0 }), "El monto debe ser mayor que cero"],
      ["monto negativo", () => bodyValido({ monto: -1 }), "El monto debe ser mayor que cero"],
      ["monto no numérico", () => bodyValido({ monto: "abc" }), "El monto debe ser un número válido"],
      ["monto sobre el máximo", () => bodyValido({ monto: 1000000000001 }), "no puede superar"],
      ["causa > 255", () => bodyValido({ causa: "c".repeat(256) }), "La causa no puede superar 255 caracteres"],
      ["fecha inexistente", () => bodyValido({ fecha_registro: "2026-11-31" }), "La fecha de registro no es válida"],
      ["fecha con formato incorrecto", () => bodyValido({ fecha_registro: "08-11-2026" }), "La fecha de registro no es válida"],
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
      if (/INSERT INTO imprevistos/.test(sql)) throw pgError("23503");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("La categoría o el dependiente indicado no existe");
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("violación del CHECK de la BD (23514) → 400", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO imprevistos/.test(sql)) throw pgError("23514");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(400);
  });

  it("error inesperado → 500 genérico con ROLLBACK", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/INSERT INTO imprevistos/.test(sql)) throw new Error("boom");
      return flujoCrear(String(sql));
    });
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
    expect(sqls()).toContain("ROLLBACK");
  });

  it("si falla la evaluación del umbral, la creación sigue siendo 201", async () => {
    verificarUmbralImprevistos.mockRejectedValue(new Error("fallo alerta"));
    const res = await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(res.status).toBe(201);
    expect(sqls()).toContain("COMMIT");
  });

  it("RF-05.5 · registrar un imprevisto no toca las tablas de ahorros", async () => {
    await request(app).post("/api/movimientos").set(auth()).send(bodyValido());
    expect(sqls().some((s) => /ahorros|abonos_ahorro/.test(s))).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════
//  Consultar imprevistos  ·  GET /api/movimientos/imprevistos
// ═════════════════════════════════════════════════════════════
describe("RF-05 · Consultar imprevistos (GET /api/movimientos/imprevistos)", () => {
  it("devuelve el listado del usuario con categoría y dependiente", async () => {
    const filas = [{ id: 1, monto: "320000", causa: "Nevera", fecha: "2026-11-08", categoria: "Hogar", dependiente: null }];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get("/api/movimientos/imprevistos").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(filas);
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]); // RF-05.6
    expect(sql).toMatch(/WHERE m\.id_usuario = \$1/);
    expect(sql).toMatch(/ORDER BY i\.fecha_registro DESC/);
  });

  it("usuario sin imprevistos → 200 y arreglo vacío", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get("/api/movimientos/imprevistos").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("error de la BD → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("db caída"));
    const res = await request(app).get("/api/movimientos/imprevistos").set(auth());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
  });
});

// ═════════════════════════════════════════════════════════════
//  Modificar imprevisto  ·  PUT /api/movimientos/imprevistos/:id
// ═════════════════════════════════════════════════════════════
describe("RF-05 · Modificar imprevisto (PUT /api/movimientos/imprevistos/:id)", () => {
  const cuerpo = (extra = {}) => ({
    monto: 350000,
    causa: "Reparación (ajustada)",
    fecha_registro: "2026-11-09",
    id_categoria: 6,
    id_dependientes: 2,
    ...extra,
  });
  beforeEach(() => pool.query.mockResolvedValue({ rowCount: 1, rows: [] }));

  it("imprevisto propio con datos válidos → 200 y reevalúa el umbral", async () => {
    const res = await request(app).put("/api/movimientos/imprevistos/15").set(auth()).send(cuerpo());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Imprevisto actualizado exitosamente" });
    const [sql, params] = pool.query.mock.calls[0];
    // [monto, causa, fecha, id_categoria, id_dependientes, id_imprevisto, id_usuario]
    expect(params).toEqual([350000, "Reparación (ajustada)", "2026-11-09", 6, 2, "15", USER_ID]);
    expect(sql).toMatch(/m\.id_usuario = \$7/);
    expect(verificarUmbralImprevistos).toHaveBeenCalledWith(USER_ID);
  });

  it("opcionales omitidos → null; la fecha se conserva con COALESCE", async () => {
    await request(app).put("/api/movimientos/imprevistos/15").set(auth()).send({ monto: 10 });
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([10, null, null, null, null, "15", USER_ID]);
    expect(sql).toMatch(/COALESCE\(\$3, i\.fecha_registro\)/);
  });

  it("imprevisto inexistente o de otro usuario → 404 y no reevalúa", async () => {
    pool.query.mockResolvedValue({ rowCount: 0, rows: [] });
    const res = await request(app).put("/api/movimientos/imprevistos/15").set(auth()).send(cuerpo());
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("Imprevisto no encontrado o sin permisos");
    expect(verificarUmbralImprevistos).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-1", "1.5"])("id de ruta inválido (%s) → 400 sin consultar la BD", async (id) => {
    const res = await request(app).put(`/api/movimientos/imprevistos/${id}`).set(auth()).send(cuerpo());
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  const invalidos = [
    ["monto ausente", { monto: undefined }],
    ["monto 0", { monto: 0 }],
    ["monto negativo", { monto: -3 }],
    ["monto no numérico", { monto: "abc" }],
    ["fecha inválida", { fecha_registro: "2026-00-10" }],
    ["causa > 255", { causa: "c".repeat(256) }],
  ];
  it.each(invalidos)("%s → 400 sin consultar la BD", async (_n, extra) => {
    const res = await request(app).put("/api/movimientos/imprevistos/15").set(auth()).send(cuerpo(extra));
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("categoría inexistente (23503) → 400", async () => {
    pool.query.mockRejectedValue(pgError("23503"));
    const res = await request(app).put("/api/movimientos/imprevistos/15").set(auth()).send(cuerpo());
    expect(res.status).toBe(400);
  });

  it("error inesperado → 500 genérico", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).put("/api/movimientos/imprevistos/15").set(auth()).send(cuerpo());
    expect(res.status).toBe(500);
  });

  it("si falla la evaluación del umbral, la edición se mantiene (200)", async () => {
    verificarUmbralImprevistos.mockRejectedValue(new Error("fallo alerta"));
    const res = await request(app).put("/api/movimientos/imprevistos/15").set(auth()).send(cuerpo());
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════
//  Eliminar imprevisto  ·  DELETE /api/movimientos/imprevistos/:id
// ═════════════════════════════════════════════════════════════
describe("RF-05 · Eliminar imprevisto (DELETE /api/movimientos/imprevistos/:id)", () => {
  it("imprevisto propio → 200; borra imprevistos → salida → movimientos", async () => {
    client.query.mockImplementation(async (sql) =>
      /SELECT p\.id_salida/.test(sql) ? { rows: [{ id_salida: 21, id_movimiento: 10 }] } : { rows: [] }
    );

    const res = await request(app).delete("/api/movimientos/imprevistos/15").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Imprevisto eliminado exitosamente" });
    const lista = sqls();
    expect(lista[lista.length - 1]).toBe("COMMIT");
    const orden = ["DELETE FROM imprevistos", "DELETE FROM salida", "DELETE FROM movimientos"].map((p) =>
      lista.findIndex((s) => s.startsWith(p))
    );
    expect(orden.every((i) => i > 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    expect(llamada(/SELECT p\.id_salida/)[1]).toEqual(["15", USER_ID]);
  });

  it("imprevisto inexistente o de otro usuario → 404, ROLLBACK y sin borrados", async () => {
    client.query.mockImplementation(async () => ({ rows: [] }));
    const res = await request(app).delete("/api/movimientos/imprevistos/15").set(auth());
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("Imprevisto no encontrado");
    expect(sqls()).toContain("ROLLBACK");
    expect(sqls().some((s) => s.startsWith("DELETE"))).toBe(false);
  });

  it.each(["abc", "0", "-1"])("id de ruta inválido (%s) → 400", async (id) => {
    const res = await request(app).delete(`/api/movimientos/imprevistos/${id}`).set(auth());
    expect(res.status).toBe(400);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("error durante el borrado → 500, ROLLBACK y conexión liberada", async () => {
    client.query.mockImplementation(async (sql) => {
      if (/SELECT p\.id_salida/.test(sql)) return { rows: [{ id_salida: 21, id_movimiento: 10 }] };
      if (/^\s*DELETE FROM imprevistos/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });
    const res = await request(app).delete("/api/movimientos/imprevistos/15").set(auth());
    expect(res.status).toBe(500);
    expect(sqls()).toContain("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});

// ═════════════════════════════════════════════════════════════
//  Notificaciones de imprevistos (servicio real, BD simulada)
// ═════════════════════════════════════════════════════════════
describe("RF-05.3 / RF-05.4 / RF-05.5 · NotificacionesService (imprevistos)", () => {
  const servicio = jest.requireActual("../../../Backend/src/service/NotificacionesService");

  const periodoActivo = {
    ID_presupuesto: 4,
    Fecha_inicio: "2026-11-01",
    Fecha_fin: "2026-11-30",
    Monto_imprevistos: 1000000, // porción de imprevistos del período
  };

  // Enruta las consultas del servicio. `consumido` = suma de imprevistos del período
  const simularBD = ({ periodo = periodoActivo, consumido = 0, existe = false } = {}) =>
    pool.query.mockImplementation(async (sql) => {
      if (/FROM\s+periodos_presupuesto pp/.test(sql)) return { rows: periodo ? [periodo] : [] };
      if (/SUM\(i\.monto\)/.test(sql)) return { rows: [{ total: consumido }] };
      if (/FROM preferencias_notificacion/.test(sql)) return { rows: [] };
      if (/SELECT id_notificacion FROM notificaciones/.test(sql)) return { rows: existe ? [{ id_notificacion: 1 }] : [] };
      if (/INSERT INTO notificaciones/.test(sql)) return { rows: [{ id_notificacion: 77 }] };
      return { rows: [] };
    });
  const insercion = () => pool.query.mock.calls.find(([s]) => /INSERT INTO notificaciones/.test(s));

  describe("verificarUmbralImprevistos (umbral del 85 %)", () => {
    it("consumo del 85 % → crea la alerta de presupuesto", async () => {
      simularBD({ consumido: 850000 });
      await servicio.verificarUmbralImprevistos(USER_ID);

      const [, params] = insercion();
      expect(params).toEqual([
        USER_ID, "alerta_presupuesto", "periodo_imprevistos", 4,
        "Has usado el 85% de tu porción de imprevistos en este período.",
      ]);
    });

    it("consumo del 100 % o más → también alerta (muestra el porcentaje real)", async () => {
      simularBD({ consumido: 1200000 });
      await servicio.verificarUmbralImprevistos(USER_ID);
      expect(insercion()[1][4]).toBe("Has usado el 120% de tu porción de imprevistos en este período.");
    });

    it("consumo del 84,9 % → no alerta", async () => {
      simularBD({ consumido: 849000 });
      await servicio.verificarUmbralImprevistos(USER_ID);
      expect(insercion()).toBeUndefined();
    });

    it("ya se alertó en este período → no duplica la notificación", async () => {
      simularBD({ consumido: 900000, existe: true });
      await servicio.verificarUmbralImprevistos(USER_ID);
      expect(insercion()).toBeUndefined();
    });

    it("sin período activo → no consulta imprevistos ni notifica", async () => {
      simularBD({ periodo: null });
      await servicio.verificarUmbralImprevistos(USER_ID);
      expect(pool.query.mock.calls.some(([s]) => /SUM\(i\.monto\)/.test(s))).toBe(false);
      expect(insercion()).toBeUndefined();
    });

    it("porción de imprevistos en 0 → no divide por cero ni notifica", async () => {
      simularBD({ periodo: { ...periodoActivo, Monto_imprevistos: 0 }, consumido: 500 });
      await servicio.verificarUmbralImprevistos(USER_ID);
      expect(insercion()).toBeUndefined();
    });

    it("la suma se limita al rango del período y al usuario", async () => {
      simularBD({ consumido: 0 });
      await servicio.verificarUmbralImprevistos(USER_ID);
      const [, params] = pool.query.mock.calls.find(([s]) => /SUM\(i\.monto\)/.test(s));
      expect(params).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
    });

    it("un error de BD no se propaga", async () => {
      pool.query.mockRejectedValue(new Error("db caída"));
      await expect(servicio.verificarUmbralImprevistos(USER_ID)).resolves.toBeUndefined();
    });
  });

  describe("verificarImprevistosNoUsados (al cerrar el período)", () => {
    it("porción casi sin usar (< 10 %) → crea la sugerencia de ahorros", async () => {
      simularBD({ consumido: 50000 }); // 5 %
      await servicio.verificarImprevistosNoUsados(USER_ID, periodoActivo);

      const [, params] = insercion();
      expect(params[1]).toBe("sugerencia");
      expect(params[2]).toBe("periodo_imprevistos_no_usado");
      expect(params[3]).toBe(4);
      expect(params[4]).toMatch(/destinar parte de ese dinero a tus ahorros/);
    });

    it("sin ningún imprevisto (0 %) → también sugiere", async () => {
      simularBD({ consumido: 0 });
      await servicio.verificarImprevistosNoUsados(USER_ID, periodoActivo);
      expect(insercion()).toBeDefined();
    });

    it("consumo del 10 % o más → no sugiere", async () => {
      simularBD({ consumido: 100000 });
      await servicio.verificarImprevistosNoUsados(USER_ID, periodoActivo);
      expect(insercion()).toBeUndefined();
    });

    it("ya se sugirió en ese período → no duplica", async () => {
      simularBD({ consumido: 0, existe: true });
      await servicio.verificarImprevistosNoUsados(USER_ID, periodoActivo);
      expect(insercion()).toBeUndefined();
    });

    it("porción de imprevistos en 0 → no sugiere", async () => {
      simularBD({ consumido: 0 });
      await servicio.verificarImprevistosNoUsados(USER_ID, { ...periodoActivo, Monto_imprevistos: 0 });
      expect(insercion()).toBeUndefined();
    });

    it("RF-05.5 · solo notifica: nunca transfiere dinero a ahorros automáticamente", async () => {
      simularBD({ consumido: 0 });
      await servicio.verificarImprevistosNoUsados(USER_ID, periodoActivo);

      const escrituras = pool.query.mock.calls.map(([s]) => String(s)).filter((s) => /INSERT|UPDATE|DELETE/.test(s));
      // La única escritura permitida es la notificación
      expect(escrituras.length).toBeGreaterThan(0);
      expect(escrituras.every((s) => /INSERT INTO notificaciones/.test(s))).toBe(true);
      expect(escrituras.some((s) => /ahorros|abonos_ahorro/.test(s))).toBe(false);
    });
  });
});
