jest.mock("../../../Backend/src/db/connection", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const pool = require("../../../Backend/src/db/connection");
const authRoutes = require("../../../Backend/src/routes/authRoutes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const token = (roles) => jwt.sign({ id: 82, roles }, process.env.JWT_SECRET);
const auth = (roles) => ({ Authorization: `Bearer ${token(roles)}` });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RF-08 · Gestionar usuarios", () => {
  it("impide que un usuario normal consulte el panel de usuarios", async () => {
    const response = await request(app)
      .get("/api/auth/PanelUsuarios")
      .set(auth(["user"]));

    expect(response.status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("permite a un administrador listar usuarios activos con sus roles", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        ID_usuario: 5,
        Nombre: "Ana",
        Apellido: "Gomez",
        Email: "ana@example.com",
        Activo: true,
        ID_rol: 1,
        Cargo: "user",
      }],
    });

    const response = await request(app)
      .get("/api/auth/PanelUsuarios")
      .set(auth(["admin"]));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      cantidad: 1,
      usuarios: [{ ID_usuario: 5, Cargo: "user", Activo: true }],
    });
    expect(pool.query.mock.calls[0][0]).toMatch(/WHERE u\.activo = TRUE/);
  });

  it("reserva los cambios de rol al superusuario", async () => {
    const response = await request(app)
      .put("/api/auth/PanelUsuarios/5/rol")
      .set(auth(["admin"]))
      .send({ ID_rol: 2 });

    expect(response.status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("permite al superusuario asignar un rol existente", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ ID_usuario: 5 }] })
      .mockResolvedValueOnce({ rows: [{ ID_rol: 2 }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const response = await request(app)
      .put("/api/auth/PanelUsuarios/5/rol")
      .set(auth(["superuser"]))
      .send({ ID_rol: 2 });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(pool.query.mock.calls[2][1]).toEqual([2, "5"]);
  });
});
