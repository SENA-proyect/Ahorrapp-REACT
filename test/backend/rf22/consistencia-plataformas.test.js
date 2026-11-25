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
  verificarUmbralGastos: jest.fn(),
  verificarUmbralImprevistos: jest.fn(),
  verificarUmbralDeudas: jest.fn(),
  verificarUmbralAhorros: jest.fn(),
  verificarMetaAhorroAlcanzada: jest.fn(),
  verificarDeudasProximasAVencer: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const pool = require("../../../Backend/src/db/connection");
const movimientosRoutes = require("../../../Backend/src/routes/movimientosRoutes");
const { actualizarIngresoReal } = require("../../../Backend/src/controllers/PresupuestosController");

const app = express();
app.use(express.json());
app.use("/api/movimientos", movimientosRoutes);

const USER_ID = 117;
const auth = () => ({
  Authorization: `Bearer ${jwt.sign({ id: USER_ID, roles: ["user"] }, process.env.JWT_SECRET)}`,
});
const client = { query: jest.fn(), release: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  pool.connect.mockResolvedValue(client);
  client.query.mockImplementation(async (sql) => {
    if (/INSERT INTO movimientos/i.test(sql)) {
      return { rows: [{ id_movimiento: 501 }] };
    }
    if (/INSERT INTO entrada/i.test(sql)) {
      return { rows: [{ id_entrada: 502 }] };
    }
    if (/INSERT INTO ingresos/i.test(sql)) {
      return { rows: [{ id_ingresos: 503 }] };
    }
    return { rows: [] };
  });
  actualizarIngresoReal.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RF-22 · Consistencia de datos entre plataformas", () => {
  it("escribe y consulta los movimientos bajo el mismo usuario autenticado", async () => {
    const created = await request(app)
      .post("/api/movimientos")
      .set(auth())
      .send({
        tipo_flujo: "Entrada",
        subtipo_modulo: "Ingreso",
        datos: {
          monto: 250,
          descripcion: "Aporte de prueba",
          fuente: "Trabajo",
          fecha_registro: "2026-11-25",
        },
      });

    expect(created.status).toBe(201);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO movimientos/i),
      [USER_ID, "Entrada", "Ingreso"]
    );
    expect(client.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO ingresos/i),
      [502, null, 250, "Aporte de prueba", "Trabajo", "2026-11-25"]
    );

    pool.query
      .mockResolvedValueOnce({
        rows: [{
          tipo: "ingreso",
          monto: 250,
          descripcion: "Aporte de prueba",
          fecha: "2026-11-25",
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const listed = await request(app)
      .get("/api/movimientos")
      .set(auth());

    expect(listed.status).toBe(200);
    expect(listed.body).toContainEqual(
      expect.objectContaining({ tipo: "ingreso", monto: 250 })
    );
    expect(pool.query).toHaveBeenCalledTimes(5);
    expect(pool.query.mock.calls.every(([, params]) => params[0] === USER_ID)).toBe(true);
  });
});
