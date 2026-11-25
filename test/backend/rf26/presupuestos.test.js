/**
 * RF-26 · Gestionar presupuestos y períodos presupuestales (backend)
 * Archivo bajo prueba: Backend/src/controllers/PresupuestosController.js
 *   → listarPerfiles, obtenerPerfil, crearPerfil, editarPerfil, eliminarPerfil, activarPerfil,
 *     abrirPeriodo, cerrarPeriodo, listarPeriodos, obtenerPeriodoActivo,
 *     ajustarIngresoPeriodo, actualizarIngresoReal / actualizarIngresoRealHandler
 * Rutas: Backend/src/routes/PresupuestosRoutes.js (montadas en /api/presupuestos)
 * Estrategia: app Express de prueba; BD y NotificacionesService mockeados; JWT firmado de verdad.
 * Las pruebas de fechas congelan SOLO el reloj (Date) para que el resultado sea determinista.
 */

jest.mock("../../../Backend/src/db/connection", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("../../../Backend/src/service/NotificacionesService", () => ({
  verificarImprevistosNoUsados: jest.fn().mockResolvedValue(undefined),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const pool = require("../../../Backend/src/db/connection");
const { verificarImprevistosNoUsados } = require("../../../Backend/src/service/NotificacionesService");
const presupuestosRoutes = require("../../../Backend/src/routes/PresupuestosRoutes");

const app = express();
app.use(express.json());
app.use("/api/presupuestos", presupuestosRoutes);

const USER_ID = 7;
const BASE = "/api/presupuestos";
const auth = () => ({ Authorization: `Bearer ${jwt.sign({ id: USER_ID }, process.env.JWT_SECRET)}` });
const client = { query: jest.fn(), release: jest.fn() };
const csqls = () => client.query.mock.calls.map(([s]) => String(s).replace(/\s+/g, " ").trim());

// Reloj: congela solo Date (el resto de temporizadores sigue real para que supertest funcione)
const SIN_FALSEAR = [
  "hrtime", "nextTick", "performance", "queueMicrotask", "requestAnimationFrame", "cancelAnimationFrame",
  "requestIdleCallback", "cancelIdleCallback", "setImmediate", "clearImmediate",
  "setInterval", "clearInterval", "setTimeout", "clearTimeout",
];
const hoyEs = (anio, mes, dia) => jest.useFakeTimers({ now: new Date(anio, mes - 1, dia), doNotFake: SIN_FALSEAR });

const perfilBD = (extra = {}) => ({
  ID_presupuesto: 3, ID_usuario: USER_ID, Nombre: "Mi presupuesto", Descripcion: null, Activo: false, Dia_corte: 15,
  Porcentaje_gastos: 40, Porcentaje_deudas: 20, Porcentaje_imprevistos: 15, Porcentaje_ahorros: 10, Porcentaje_emergencia: 15,
  ...extra,
});

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  pool.connect.mockResolvedValue(client);
  verificarImprevistosNoUsados.mockResolvedValue(undefined);
});
afterEach(() => jest.useRealTimers());

// ═════════════════════════════════════════════════════════════
describe("RF-26 · Autenticación requerida", () => {
  const rutas = [
    ["GET", BASE, "get"],
    ["GET", `${BASE}/3`, "get"],
    ["POST", BASE, "post"],
    ["PUT", `${BASE}/3`, "put"],
    ["DELETE", `${BASE}/3`, "delete"],
    ["PUT", `${BASE}/3/activar`, "put"],
    ["GET", `${BASE}/periodos`, "get"],
    ["GET", `${BASE}/periodos/activo`, "get"],
    ["POST", `${BASE}/periodos/abrir`, "post"],
    ["PUT", `${BASE}/periodos/cerrar`, "put"],
    ["PATCH", `${BASE}/periodos/ajustar-ingreso`, "patch"],
    ["PATCH", `${BASE}/periodos/actualizar-ingreso`, "patch"],
  ];
  it.each(rutas)("%s %s sin token → 401", async (_m, url, metodo) => {
    const res = await request(app)[metodo](url);
    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it.each(rutas)("%s %s con token inválido → 401", async (_m, url, metodo) => {
    const res = await request(app)[metodo](url).set("Authorization", "Bearer token.falso.xyz");
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });
});

// ═════════════════════════════════════════════════════════════
//  Crear perfil  ·  POST /api/presupuestos
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Crear perfil (POST /api/presupuestos)", () => {
  const perfil = (extra = {}) => ({
    Nombre: "Quincenal",
    Descripcion: "Plan de noviembre",
    Dia_corte: 15,
    Porcentaje_gastos: 50,
    Porcentaje_deudas: 10,
    Porcentaje_imprevistos: 10,
    Porcentaje_ahorros: 20,
    Porcentaje_emergencia: 10,
    ...extra,
  });
  beforeEach(() => pool.query.mockResolvedValue({ rows: [{ id_presupuesto: 9 }] }));

  it("crea el perfil con datos válidos → 201, inactivo y asociado al usuario", async () => {
    const res = await request(app).post(BASE).set(auth()).send(perfil());

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, mensaje: "Perfil creado", ID_presupuesto: 9 });
    const [sql, params] = pool.query.mock.calls[0];
    // [usuario, nombre, descripcion, dia_corte, %gastos, %deudas, %imprevistos, %ahorros, %emergencia]
    expect(params).toEqual([USER_ID, "Quincenal", "Plan de noviembre", 15, 50, 10, 10, 20, 10]);
    expect(sql).toMatch(/VALUES \(\$1, \$2, \$3, FALSE, \$4/); // RF-26.3: nace inactivo
  });

  it("sin datos en el cuerpo usa los valores por defecto (40/20/15/10/15, corte 1)", async () => {
    const res = await request(app).post(BASE).set(auth()).send({});
    expect(res.status).toBe(201);
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID, "Mi presupuesto", null, 1, 40, 20, 15, 10, 15]);
  });

  it("recorta el nombre y la descripción vacía se guarda como null", async () => {
    await request(app).post(BASE).set(auth()).send(perfil({ Nombre: "  Mensual  ", Descripcion: "   " }));
    const params = pool.query.mock.calls[0][1];
    expect(params[1]).toBe("Mensual");
    expect(params[2]).toBeNull();
  });

  it("acepta porcentajes como texto numérico", async () => {
    const res = await request(app).post(BASE).set(auth())
      .send(perfil({ Porcentaje_gastos: "50", Porcentaje_deudas: "10", Dia_corte: "20" }));
    expect(res.status).toBe(201);
    expect(pool.query.mock.calls[0][1][3]).toBe(20);
  });

  describe("RF-26.4 · día de corte", () => {
    it.each([1, 15, 31])("día %i es válido", async (dia) => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Dia_corte: dia }));
      expect(res.status).toBe(201);
    });
    it.each([0, 32, -1, 1.5, "abc", 100])("día %p → 400 sin consultar la BD", async (dia) => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Dia_corte: dia }));
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe("El día de corte debe estar entre 1 y 31");
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe("RF-26.1 · los cinco porcentajes suman exactamente 100 %", () => {
    it("suma 100 con decimales (33.33 + 33.33 + 33.34 + 0 + 0) es válida", async () => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({
        Porcentaje_gastos: 33.33, Porcentaje_deudas: 33.33, Porcentaje_imprevistos: 33.34,
        Porcentaje_ahorros: 0, Porcentaje_emergencia: 0,
      }));
      expect(res.status).toBe(201);
    });
    it("100 en un solo módulo y 0 en los demás es válido", async () => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({
        Porcentaje_gastos: 100, Porcentaje_deudas: 0, Porcentaje_imprevistos: 0, Porcentaje_ahorros: 0, Porcentaje_emergencia: 0,
      }));
      expect(res.status).toBe(201);
    });
    it("suma 99 → 400 con la suma actual en el mensaje", async () => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Porcentaje_gastos: 49 }));
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe("Los porcentajes deben sumar 100. Suma actual: 99.00");
      expect(pool.query).not.toHaveBeenCalled();
    });
    it("suma 101 → 400", async () => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Porcentaje_gastos: 51 }));
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe("Los porcentajes deben sumar 100. Suma actual: 101.00");
    });
    it("suma 99,99 → 400 (no se redondea)", async () => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Porcentaje_gastos: 49.99 }));
      expect(res.status).toBe(400);
    });
  });

  describe("RF-26.2 · cada porcentaje entre 0 y 100", () => {
    it.each([
      ["negativo", { Porcentaje_gastos: -10, Porcentaje_deudas: 70 }],
      ["mayor a 100", { Porcentaje_gastos: 101, Porcentaje_deudas: -1 }],
      ["no numérico", { Porcentaje_ahorros: "abc" }],
      ["vacío", { Porcentaje_ahorros: "" }],
    ])("porcentaje %s → 400", async (_n, extra) => {
      const res = await request(app).post(BASE).set(auth()).send(perfil(extra));
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe("Cada porcentaje debe estar entre 0 y 100");
      expect(pool.query).not.toHaveBeenCalled();
    });
    it("más de 2 decimales → 400", async () => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Porcentaje_gastos: 50.001, Porcentaje_deudas: 9.999 }));
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe("Los porcentajes admiten como máximo 2 decimales");
    });
  });

  describe("nombre y descripción", () => {
    it.each([["solo espacios", "   "], ["vacío", ""]])("nombre %s → 400", async (_n, nombre) => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Nombre: nombre }));
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe("El nombre del perfil es obligatorio");
    });
    it("nombre > 80 caracteres → 400", async () => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Nombre: "n".repeat(81) }));
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe("El nombre no puede superar 80 caracteres");
    });
    it("descripción > 255 caracteres → 400", async () => {
      const res = await request(app).post(BASE).set(auth()).send(perfil({ Descripcion: "d".repeat(256) }));
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe("La descripción no puede superar 255 caracteres");
    });
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).post(BASE).set(auth()).send(perfil());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error al crear perfil" });
  });
});

// ═════════════════════════════════════════════════════════════
//  Consultar perfiles  ·  GET /api/presupuestos  y  /:id
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Consultar perfiles", () => {
  it("GET / lista solo los perfiles del usuario, el activo primero", async () => {
    const filas = [perfilBD({ Activo: true }), perfilBD({ ID_presupuesto: 4 })];
    pool.query.mockResolvedValue({ rows: filas });

    const res = await request(app).get(BASE).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, data: filas });
    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
    expect(sql).toMatch(/ORDER\s+BY activo DESC, fecha_actualizacion DESC/);
  });

  it("GET / error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(BASE).set(auth());
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al listar perfiles");
  });

  it("GET /:id devuelve el perfil propio", async () => {
    pool.query.mockResolvedValue({ rows: [perfilBD()] });
    const res = await request(app).get(`${BASE}/3`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, data: perfilBD() });
    expect(pool.query.mock.calls[0][1]).toEqual(["3", USER_ID]);
  });

  it("GET /:id de otro usuario o inexistente → 404", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/3`).set(auth());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "Perfil no encontrado" });
  });

  it.each(["abc", "0", "-1", "1.5"])("GET /:id con id inválido (%s) → 400 sin consultar la BD", async (id) => {
    const res = await request(app).get(`${BASE}/${id}`).set(auth());
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════
//  Editar perfil  ·  PUT /api/presupuestos/:id
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Editar perfil (PUT /api/presupuestos/:id)", () => {
  // 1ª: SELECT perfil; 2ª: períodos abiertos del perfil; 3ª: UPDATE
  const simular = ({ perfil = perfilBD(), abiertos = [] } = {}) =>
    pool.query.mockImplementation(async (sql) => {
      if (/FROM\s+presupuestos\s+WHERE id_presupuesto/.test(sql)) return { rows: perfil ? [perfil] : [] };
      if (/FROM periodos_presupuesto\s+WHERE id_presupuesto/.test(sql)) return { rows: abiertos };
      return { rows: [], rowCount: 1 };
    });
  const update = () => pool.query.mock.calls.find(([s]) => /^\s*UPDATE presupuestos/.test(s));

  it("edita el perfil → 200; los campos no enviados conservan su valor", async () => {
    simular();
    const res = await request(app).put(`${BASE}/3`).set(auth()).send({ Nombre: "Nuevo nombre", Dia_corte: 20 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Perfil actualizado" });
    // [nombre, descripcion, dia_corte, %gastos, %deudas, %imprevistos, %ahorros, %emergencia, id]
    expect(update()[1]).toEqual(["Nuevo nombre", null, 20, 40, 20, 15, 10, 15, "3"]);
  });

  it("puede redistribuir los cinco porcentajes si suman 100", async () => {
    simular();
    const res = await request(app).put(`${BASE}/3`).set(auth()).send({
      Porcentaje_gastos: 30, Porcentaje_deudas: 30, Porcentaje_imprevistos: 10, Porcentaje_ahorros: 20, Porcentaje_emergencia: 10,
    });
    expect(res.status).toBe(200);
    expect(update()[1].slice(3, 8)).toEqual([30, 30, 10, 20, 10]);
  });

  it("RF-26.1 · cambiar solo un porcentaje rompe la suma del perfil resultante → 400", async () => {
    simular();
    const res = await request(app).put(`${BASE}/3`).set(auth()).send({ Porcentaje_gastos: 50 });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("Los porcentajes deben sumar 100. Suma actual: 110.00");
    expect(update()).toBeUndefined();
  });

  it.each([
    ["RF-26.4 día de corte 0", { Dia_corte: 0 }, "El día de corte debe estar entre 1 y 31"],
    ["RF-26.4 día de corte 32", { Dia_corte: 32 }, "El día de corte debe estar entre 1 y 31"],
    ["RF-26.2 porcentaje fuera de rango", { Porcentaje_gastos: 140, Porcentaje_deudas: -80 }, "Cada porcentaje debe estar entre 0 y 100"],
    ["nombre vacío", { Nombre: "  " }, "El nombre del perfil es obligatorio"],
  ])("%s → 400 y no actualiza", async (_n, cuerpo, mensaje) => {
    simular();
    const res = await request(app).put(`${BASE}/3`).set(auth()).send(cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe(mensaje);
    expect(update()).toBeUndefined();
  });

  it("perfil inexistente o de otro usuario → 404", async () => {
    simular({ perfil: null });
    const res = await request(app).put(`${BASE}/3`).set(auth()).send({ Nombre: "x" });
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("Perfil no encontrado");
  });

  it("con un período abierto asociado → 409 y no actualiza", async () => {
    simular({ abiertos: [{ id_periodo: 1 }] });
    const res = await request(app).put(`${BASE}/3`).set(auth()).send({ Nombre: "x" });
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toBe("No puedes editar un perfil con un período activo. Cierra el período primero.");
    expect(update()).toBeUndefined();
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).put(`${BASE}/3`).set(auth()).send({ Nombre: "x" });
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al actualizar perfil");
  });

  it.each(["abc", "0", "-1"])("id de ruta inválido (%s) → 400", async (id) => {
    const res = await request(app).put(`${BASE}/${id}`).set(auth()).send({});
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════
//  Eliminar perfil  ·  DELETE /api/presupuestos/:id
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Eliminar perfil (DELETE /api/presupuestos/:id)", () => {
  const simular = ({ perfil = { Activo: false }, periodos = 0 } = {}) =>
    pool.query.mockImplementation(async (sql) => {
      if (/SELECT activo AS "Activo"/.test(sql)) return { rows: perfil ? [perfil] : [] };
      if (/COUNT\(\*\)/.test(sql)) return { rows: [{ total: periodos }] };
      return { rows: [], rowCount: 1 };
    });
  const borrado = () => pool.query.mock.calls.find(([s]) => /DELETE FROM presupuestos/.test(s));

  it("perfil inactivo y sin períodos → 200 y lo elimina", async () => {
    simular();
    const res = await request(app).delete(`${BASE}/3`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Perfil eliminado" });
    expect(borrado()[1]).toEqual(["3"]);
    expect(pool.query.mock.calls[0][1]).toEqual(["3", USER_ID]); // verificación de propiedad
  });

  it("perfil inexistente o de otro usuario → 404", async () => {
    simular({ perfil: null });
    const res = await request(app).delete(`${BASE}/3`).set(auth());
    expect(res.status).toBe(404);
    expect(borrado()).toBeUndefined();
  });

  it("perfil activo → 409 y no lo elimina", async () => {
    simular({ perfil: { Activo: true } });
    const res = await request(app).delete(`${BASE}/3`).set(auth());
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toBe("No puedes eliminar el perfil activo");
    expect(borrado()).toBeUndefined();
  });

  it("perfil con períodos registrados → 409 y no lo elimina", async () => {
    simular({ periodos: 2 });
    const res = await request(app).delete(`${BASE}/3`).set(auth());
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toBe("El perfil tiene períodos registrados y no puede eliminarse");
    expect(borrado()).toBeUndefined();
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).delete(`${BASE}/3`).set(auth());
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al eliminar perfil");
  });
});

// ═════════════════════════════════════════════════════════════
//  Activar perfil  ·  PUT /api/presupuestos/:id/activar
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Activar perfil (PUT /api/presupuestos/:id/activar)", () => {
  const simular = ({ perfil = [{ id_presupuesto: 3 }], abierto = [] } = {}) =>
    pool.query.mockImplementation(async (sql) => {
      if (/FROM presupuestos WHERE id_presupuesto/.test(sql)) return { rows: perfil };
      if (/FROM periodos_presupuesto pp/.test(sql)) return { rows: abierto };
      return { rows: [] };
    });

  it("RF-26.3 · desactiva todos los perfiles del usuario y activa solo el elegido (transacción)", async () => {
    simular();
    client.query.mockResolvedValue({ rows: [] });

    const res = await request(app).put(`${BASE}/3/activar`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Perfil activado correctamente" });
    expect(csqls()).toEqual([
      "BEGIN",
      "UPDATE presupuestos SET activo = FALSE WHERE id_usuario = $1",
      "UPDATE presupuestos SET activo = TRUE WHERE id_presupuesto = $1",
      "COMMIT",
    ]);
    expect(client.query.mock.calls[1][1]).toEqual([USER_ID]);
    expect(client.query.mock.calls[2][1]).toEqual(["3"]);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("perfil inexistente o de otro usuario → 404 sin abrir transacción", async () => {
    simular({ perfil: [] });
    const res = await request(app).put(`${BASE}/3/activar`).set(auth());
    expect(res.status).toBe(404);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("con un período abierto → 409 y no cambia el perfil activo", async () => {
    simular({ abierto: [{ id_periodo: 1 }] });
    const res = await request(app).put(`${BASE}/3/activar`).set(auth());
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toBe("Tienes un período activo. Ciérralo antes de cambiar de perfil.");
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("falla dentro de la transacción → 500, ROLLBACK y conexión liberada", async () => {
    simular();
    client.query.mockImplementation(async (sql) => {
      if (/SET activo = TRUE/.test(sql)) throw new Error("boom");
      return { rows: [] };
    });
    const res = await request(app).put(`${BASE}/3/activar`).set(auth());
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al activar perfil");
    expect(csqls()).toContain("ROLLBACK");
    expect(csqls()).not.toContain("COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});

// ═════════════════════════════════════════════════════════════
//  Abrir período  ·  POST /api/presupuestos/periodos/abrir
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Abrir período (POST /api/presupuestos/periodos/abrir)", () => {
  const simular = ({ perfiles = [perfilBD({ Activo: true })], abiertos = [], ultimos = [], insertar } = {}) =>
    pool.query.mockImplementation(async (sql) => {
      if (/activo = TRUE/.test(sql)) return { rows: perfiles };
      if (/estado = 'abierto'/.test(sql)) return { rows: abiertos };
      if (/estado = 'cerrado'/.test(sql)) return { rows: ultimos };
      if (/INSERT INTO periodos_presupuesto/.test(sql)) {
        if (insertar) throw insertar;
        return { rows: [{ id_periodo: 50 }] };
      }
      return { rows: [] };
    });
  const insercion = () => pool.query.mock.calls.find(([s]) => /INSERT INTO periodos_presupuesto/.test(s));
  const abrir = (...args) =>
    request(app).post(`${BASE}/periodos/abrir`).set(auth()).send({ ingreso_estimado: args.length ? args[0] : 3000000 });

  it("RF-26.7 · calcula los montos por módulo según los porcentajes del perfil", async () => {
    hoyEs(2026, 11, 10);
    simular();
    const res = await abrir(3000000);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.mensaje).toBe("Período abierto correctamente");
    expect(res.body.data).toMatchObject({
      ID_periodo: 50,
      Fecha_inicio: "2026-11-10",
      Fecha_fin: "2026-12-14",
      Saldo_anterior: 0,
      Ingreso_estimado: 3000000,
      Monto_gastos: 1200000,      // 40 %
      Monto_deudas: 600000,       // 20 %
      Monto_imprevistos: 450000,  // 15 %
      Monto_ahorros: 300000,      // 10 %
      Monto_emergencia: 450000,   // 15 %
    });
    // Se inserta abierto, con ingreso real en 0, y asociado al perfil activo y al usuario
    const [sql, params] = insercion();
    expect(sql).toMatch(/'abierto', \$5, 0\.00/);
    expect(params).toEqual([3, USER_ID, "2026-11-10", "2026-12-14", 3000000, 0, 1200000, 600000, 450000, 300000, 450000]);
  });

  it("suma el saldo sobrante del último período cerrado a la base de cálculo", async () => {
    hoyEs(2026, 11, 10);
    simular({ ultimos: [{ saldo_sobrante: "500000" }] });
    const res = await abrir(2500000); // base = 2.500.000 + 500.000 = 3.000.000

    expect(res.body.data.Saldo_anterior).toBe(500000);
    expect(res.body.data.Ingreso_estimado).toBe(2500000);
    expect(res.body.data.Monto_gastos).toBe(1200000);
  });

  it("un saldo sobrante negativo se toma como 0", async () => {
    hoyEs(2026, 11, 10);
    simular({ ultimos: [{ saldo_sobrante: "-80000" }] });
    const res = await abrir(1000000);
    expect(res.body.data.Saldo_anterior).toBe(0);
  });

  it("RF-26.5 · la fecha de fin es el día anterior al corte del mes siguiente", async () => {
    hoyEs(2026, 11, 10);
    simular({ perfiles: [perfilBD({ Activo: true, Dia_corte: 15 })] });
    const res = await abrir();
    expect(res.body.data.Fecha_inicio).toBe("2026-11-10");
    expect(res.body.data.Fecha_fin).toBe("2026-12-14");
    expect(res.body.data.Fecha_fin > res.body.data.Fecha_inicio).toBe(true);
  });

  it("el corte cruza de año (20-dic con corte 5 → 4-ene del año siguiente)", async () => {
    hoyEs(2026, 12, 20);
    simular({ perfiles: [perfilBD({ Activo: true, Dia_corte: 5 })] });
    const res = await abrir();
    expect(res.body.data.Fecha_fin).toBe("2027-01-04");
  });

  it("corte 31 en un mes de menos días se recorta al último día disponible (nunca desborda)", async () => {
    hoyEs(2026, 1, 31);
    simular({ perfiles: [perfilBD({ Activo: true, Dia_corte: 31 })] });
    const res = await abrir();
    expect(res.body.data.Fecha_fin).toBe("2026-02-27"); // febrero tiene 28 días
  });

  it("corte 1: el período termina el último día del mes", async () => {
    hoyEs(2026, 11, 10);
    simular({ perfiles: [perfilBD({ Activo: true, Dia_corte: 1 })] });
    const res = await abrir();
    expect(res.body.data.Fecha_fin).toBe("2026-11-30");
  });

  // DEFECTO DETECTADO (RF-26.5): si el período se abre el último día del mes con corte = 1,
  // fecha_fin resulta IGUAL a fecha_inicio. La rama de recálculo de calcularFechaFin vuelve a
  // dar el mismo día y la BD rechaza el INSERT (CHECK fecha_fin > fecha_inicio) → 500.
  // `it.failing` pasa mientras el defecto exista; cuando se corrija pasará a rojo para avisar.
  it.failing("DEFECTO · RF-26.5 abrir el 30-nov con corte 1 debe dar fecha_fin posterior al inicio", async () => {
    hoyEs(2026, 11, 30);
    simular({ perfiles: [perfilBD({ Activo: true, Dia_corte: 1 })] });
    const res = await abrir();
    expect(res.status).toBe(201);
    expect(res.body.data.Fecha_fin > res.body.data.Fecha_inicio).toBe(true);
  });

  it("RF-26.6 · sin perfil activo → 400 y no inserta", async () => {
    simular({ perfiles: [] });
    const res = await abrir();
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe("No tienes un perfil de presupuesto activo. Activa uno primero.");
    expect(insercion()).toBeUndefined();
  });

  it("ya existe un período abierto → 409 y no inserta", async () => {
    simular({ abiertos: [{ id_periodo: 1 }] });
    const res = await abrir();
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toBe("Ya tienes un período abierto. Ciérralo antes de abrir uno nuevo.");
    expect(insercion()).toBeUndefined();
  });

  it("dos aperturas simultáneas (índice único, 23505) → 409", async () => {
    simular({ insertar: Object.assign(new Error("dup"), { code: "23505" }) });
    const res = await abrir();
    expect(res.status).toBe(409);
  });

  it("ingreso estimado 0 es válido (montos en 0)", async () => {
    simular();
    const res = await abrir(0);
    expect(res.status).toBe(201);
    expect(res.body.data.Monto_gastos).toBe(0);
  });

  it.each([
    ["ausente", undefined, "El ingreso estimado debe ser un número válido"],
    ["vacío", "", "El ingreso estimado debe ser un número válido"],
    ["negativo", -1, "El ingreso estimado no puede ser negativo"],
    ["no numérico", "abc", "El ingreso estimado debe ser un número válido"],
    ["sobre el máximo", 1000000000001, "no puede superar"],
  ])("ingreso estimado %s → 400 sin consultar la BD", async (_n, valor, mensaje) => {
    const res = await abrir(valor);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toEqual(expect.stringContaining(mensaje));
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("error inesperado → 500 genérico", async () => {
    simular({ insertar: new Error("boom") });
    const res = await abrir();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, mensaje: "Error interno del servidor" });
  });
});

// ═════════════════════════════════════════════════════════════
//  Cerrar período  ·  PUT /api/presupuestos/periodos/cerrar
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Cerrar período (PUT /api/presupuestos/periodos/cerrar)", () => {
  const periodo = {
    ID_periodo: 50, ID_presupuesto: 3, Fecha_inicio: "2026-11-01", Fecha_fin: "2026-11-30",
    Ingreso_estimado: 3000000, Monto_imprevistos: 450000,
  };
  const simular = ({ abiertos = [periodo], ingresos = 2800000 } = {}) =>
    pool.query.mockImplementation(async (sql) => {
      if (/FROM periodos_presupuesto\s+WHERE id_usuario/.test(sql)) return { rows: abiertos };
      if (/SUM\(i\.monto\)/.test(sql)) return { rows: [{ total: ingresos }] };
      return { rows: [], rowCount: 1 };
    });
  const cierre = () => pool.query.mock.calls.find(([s]) => /SET estado = 'cerrado'/.test(s));

  it("cierra el período: fija el ingreso real con los ingresos del rango y lo marca 'cerrado'", async () => {
    simular();
    const res = await request(app).put(`${BASE}/periodos/cerrar`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      mensaje: "Período cerrado correctamente",
      data: { ID_periodo: 50, Ingreso_real: 2800000, Fecha_inicio: "2026-11-01", Fecha_fin: "2026-11-30" },
    });
    expect(cierre()[1]).toEqual([2800000, 50]);
    const suma = pool.query.mock.calls.find(([s]) => /SUM\(i\.monto\)/.test(s));
    expect(suma[1]).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
  });

  it("RF-05.4 · al cerrar genera la sugerencia de imprevistos no usados (RF-12/13)", async () => {
    simular();
    await request(app).put(`${BASE}/periodos/cerrar`).set(auth());
    expect(verificarImprevistosNoUsados).toHaveBeenCalledWith(USER_ID, periodo);
  });

  it("si falla la notificación de cierre, el período igual se cierra (200)", async () => {
    simular();
    verificarImprevistosNoUsados.mockRejectedValue(new Error("fallo"));
    const res = await request(app).put(`${BASE}/periodos/cerrar`).set(auth());
    expect(res.status).toBe(200);
    expect(cierre()).toBeDefined();
  });

  it("sin período abierto → 404 y no actualiza", async () => {
    simular({ abiertos: [] });
    const res = await request(app).put(`${BASE}/periodos/cerrar`).set(auth());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, mensaje: "No tienes un período abierto." });
    expect(cierre()).toBeUndefined();
    expect(verificarImprevistosNoUsados).not.toHaveBeenCalled();
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).put(`${BASE}/periodos/cerrar`).set(auth());
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al cerrar período");
  });
});

// ═════════════════════════════════════════════════════════════
//  Histórico paginado  ·  GET /api/presupuestos/periodos
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Histórico de períodos (GET /api/presupuestos/periodos)", () => {
  const simular = (total = 25) =>
    pool.query.mockImplementation(async (sql) =>
      /COUNT\(\*\)/.test(sql) ? { rows: [{ total }] } : { rows: [{ ID_periodo: 1 }, { ID_periodo: 2 }] }
    );
  const paginacion = () => pool.query.mock.calls[0][1];

  it("RF-26.8 · por defecto pagina 1 con 10 registros (offset 0)", async () => {
    simular();
    const res = await request(app).get(`${BASE}/periodos`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, data: [{ ID_periodo: 1 }, { ID_periodo: 2 }], total: 25, pagina: 1, limite: 10 });
    expect(paginacion()).toEqual([USER_ID, 10, 0]);
    expect(pool.query.mock.calls[0][0]).toMatch(/ORDER\s+BY pp\.fecha_inicio DESC/);
  });

  it("calcula el offset según pagina y limite", async () => {
    simular();
    const res = await request(app).get(`${BASE}/periodos?pagina=3&limite=5`).set(auth());
    expect(paginacion()).toEqual([USER_ID, 5, 10]);
    expect(res.body.pagina).toBe(3);
    expect(res.body.limite).toBe(5);
  });

  it("el límite máximo es 50", async () => {
    simular();
    const res = await request(app).get(`${BASE}/periodos?limite=500`).set(auth());
    expect(res.body.limite).toBe(50);
    expect(paginacion()[1]).toBe(50);
  });

  it.each([
    ["limite negativo", "limite=-5", 1],
    ["limite = 0", "limite=0", 10],
    ["limite no numérico", "limite=abc", 10],
  ])("%s → se normaliza (sin error 500)", async (_n, qs, esperado) => {
    simular();
    const res = await request(app).get(`${BASE}/periodos?${qs}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.limite).toBe(esperado);
  });

  it.each([["pagina = 0", "pagina=0"], ["pagina negativa", "pagina=-3"], ["pagina no numérica", "pagina=abc"]])(
    "%s → se normaliza a la página 1",
    async (_n, qs) => {
      simular();
      const res = await request(app).get(`${BASE}/periodos?${qs}`).set(auth());
      expect(res.body.pagina).toBe(1);
      expect(paginacion()[2]).toBe(0);
    }
  );

  it("solo cuenta y lista los períodos del usuario", async () => {
    simular();
    await request(app).get(`${BASE}/periodos`).set(auth());
    expect(pool.query.mock.calls[1][1]).toEqual([USER_ID]);
  });

  it("usuario sin períodos → lista vacía y total 0", async () => {
    pool.query.mockImplementation(async (sql) => (/COUNT\(\*\)/.test(sql) ? { rows: [{ total: 0 }] } : { rows: [] }));
    const res = await request(app).get(`${BASE}/periodos`).set(auth());
    expect(res.body).toMatchObject({ ok: true, data: [], total: 0 });
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/periodos`).set(auth());
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al listar períodos");
  });
});

// ═════════════════════════════════════════════════════════════
//  Período activo  ·  GET /api/presupuestos/periodos/activo
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Período activo (GET /api/presupuestos/periodos/activo)", () => {
  const abierto = {
    ID_periodo: 50, Fecha_inicio: "2026-11-01", Fecha_fin: "2026-11-30", Estado: "abierto",
    Monto_gastos: 1200000, Monto_deudas: 600000, Monto_imprevistos: 450000, Monto_ahorros: 300000, Monto_emergencia: 450000,
  };

  it("sin período abierto → 200 con data null", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get(`${BASE}/periodos/activo`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, data: null });
  });

  it("devuelve el período con la ejecución por módulo (presupuestado, ejecutado, disponible)", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [abierto] })
      .mockResolvedValueOnce({ rows: [{ total: 900000 }] })  // gastos
      .mockResolvedValueOnce({ rows: [{ total: 200000 }] })  // pagos de deudas
      .mockResolvedValueOnce({ rows: [{ total: 50000 }] })   // imprevistos
      .mockResolvedValueOnce({ rows: [{ total: 100000 }] }); // abonos a ahorros

    const res = await request(app).get(`${BASE}/periodos/activo`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ ID_periodo: 50, Estado: "abierto" });
    expect(res.body.data.ejecucion).toEqual({
      gastos: { presupuestado: 1200000, ejecutado: 900000, disponible: 300000 },
      deudas: { presupuestado: 600000, ejecutado: 200000, disponible: 400000 },
      imprevistos: { presupuestado: 450000, ejecutado: 50000, disponible: 400000 },
      ahorros: { presupuestado: 300000, ejecutado: 100000, disponible: 200000 },
    });
    // Las 4 sumas se limitan al rango del período y al usuario
    for (const i of [1, 2, 3, 4]) {
      expect(pool.query.mock.calls[i][1]).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
    }
  });

  it("si se ejecutó más de lo presupuestado, 'disponible' queda negativo", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [abierto] })
      .mockResolvedValueOnce({ rows: [{ total: 1500000 }] })
      .mockResolvedValue({ rows: [{ total: 0 }] });
    const res = await request(app).get(`${BASE}/periodos/activo`).set(auth());
    expect(res.body.data.ejecucion.gastos.disponible).toBe(-300000);
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get(`${BASE}/periodos/activo`).set(auth());
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al obtener el período activo");
  });
});

// ═════════════════════════════════════════════════════════════
//  Ajustar ingreso estimado  ·  PATCH /api/presupuestos/periodos/ajustar-ingreso
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Ajustar ingreso estimado (PATCH /api/presupuestos/periodos/ajustar-ingreso)", () => {
  const abierto = {
    ID_periodo: 50, Saldo_anterior: "200000",
    Porcentaje_gastos: 40, Porcentaje_deudas: 20, Porcentaje_imprevistos: 15, Porcentaje_ahorros: 10, Porcentaje_emergencia: 15,
  };
  const simular = (rows = [abierto]) =>
    pool.query.mockImplementation(async (sql) => (/^\s*SELECT/.test(sql) ? { rows } : { rows: [], rowCount: 1 }));
  const ajustar = (v) => request(app).patch(`${BASE}/periodos/ajustar-ingreso`).set(auth()).send({ ingreso_estimado: v });

  it("recalcula los montos de cada módulo con el nuevo ingreso + saldo anterior", async () => {
    simular();
    const res = await ajustar(1800000); // base = 1.800.000 + 200.000 = 2.000.000

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      mensaje: "Ingreso ajustado y montos recalculados",
      data: {
        Ingreso_estimado: 1800000, Saldo_anterior: 200000,
        Monto_gastos: 800000, Monto_deudas: 400000, Monto_imprevistos: 300000, Monto_ahorros: 200000, Monto_emergencia: 300000,
      },
    });
    const upd = pool.query.mock.calls.find(([s]) => /^\s*UPDATE periodos_presupuesto/.test(s));
    expect(upd[1]).toEqual([1800000, 800000, 400000, 300000, 200000, 300000, 50]);
  });

  it("solo afecta al período abierto del usuario", async () => {
    simular();
    await ajustar(1000);
    expect(pool.query.mock.calls[0][1]).toEqual([USER_ID]);
    expect(pool.query.mock.calls[0][0]).toMatch(/pp\.estado = 'abierto'/);
  });

  it("sin período activo → 404 y no actualiza", async () => {
    simular([]);
    const res = await ajustar(1000);
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toBe("No hay período activo");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["ausente", undefined],
    ["vacío", ""],
    ["negativo", -5],
    ["no numérico", "abc"],
  ])("ingreso %s → 400 sin consultar la BD", async (_n, valor) => {
    const res = await ajustar(valor);
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await ajustar(1000);
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al ajustar ingreso");
  });
});

// ═════════════════════════════════════════════════════════════
//  Actualizar ingreso real  ·  PATCH /api/presupuestos/periodos/actualizar-ingreso
// ═════════════════════════════════════════════════════════════
describe("RF-26 · Actualizar ingreso real (PATCH /api/presupuestos/periodos/actualizar-ingreso)", () => {
  const llamar = () => request(app).patch(`${BASE}/periodos/actualizar-ingreso`).set(auth());

  it("recalcula el ingreso real sumando los ingresos dentro del rango del período abierto", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id_periodo: 50, fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30" }] })
      .mockResolvedValueOnce({ rows: [{ total: 3250000 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await llamar();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, mensaje: "Ingreso real actualizado correctamente" });
    expect(pool.query.mock.calls[1][1]).toEqual([USER_ID, "2026-11-01", "2026-11-30"]);
    expect(pool.query.mock.calls[2][0]).toMatch(/UPDATE periodos_presupuesto SET ingreso_real = \$1/);
    expect(pool.query.mock.calls[2][1]).toEqual([3250000, 50]);
  });

  it("sin período abierto → 200 y no escribe nada", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await llamar();
    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("error de la BD → 500", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await llamar();
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe("Error al actualizar ingreso real");
  });
});
