jest.mock("../../../Backend/src/db/connection", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const bcrypt = require("bcrypt");
const pool = require("../../../Backend/src/db/connection");
const authRoutes = require("../../../Backend/src/routes/authRoutes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const datosValidos = {
  Nombre: "Ana",
  Apellido: "Gomez",
  Email: "ana@example.com",
  Password_hash: "Seguro123!",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RF-01 · Registro de usuarios", () => {
  it("crea la cuenta, cifra la contraseña y asigna el rol user", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ID_usuario: 42 }] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post("/api/auth/register")
      .send(datosValidos);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ok: true,
      mensaje: "Usuario registrado exitosamente",
      id: 42,
    });

    const [insertUserSql, insertUserParams] = pool.query.mock.calls[1];
    expect(insertUserSql).toMatch(/INSERT INTO usuarios/i);
    expect(insertUserParams).toEqual([
      datosValidos.Nombre,
      datosValidos.Apellido,
      datosValidos.Email,
      expect.any(String),
    ]);
    expect(insertUserParams[3]).not.toBe(datosValidos.Password_hash);
    await expect(
      bcrypt.compare(datosValidos.Password_hash, insertUserParams[3])
    ).resolves.toBe(true);

    expect(pool.query.mock.calls[2][0]).toMatch(/INSERT INTO usuarios_roles/i);
    expect(pool.query.mock.calls[2][1]).toEqual([42, 1]);
  });

  it("rechaza un correo ya registrado sin crear otro usuario", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ID_usuario: 8 }] });

    const response = await request(app)
      .post("/api/auth/register")
      .send(datosValidos);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      ok: false,
      mensaje: "El correo ya está registrado",
    });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["sin correo", { ...datosValidos, Email: "" }],
    ["sin contraseña", { ...datosValidos, Password_hash: "" }],
    ["correo de tipo inválido", { ...datosValidos, Email: 123 }],
    ["contraseña de tipo inválido", { ...datosValidos, Password_hash: {} }],
    ["nombre de tipo inválido", { ...datosValidos, Nombre: 123 }],
  ])("rechaza el registro %s antes de consultar la base de datos", async (_caso, body) => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("responde con error del servidor si falla la base de datos", async () => {
    pool.query.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await request(app)
      .post("/api/auth/register")
      .send(datosValidos);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      mensaje: "Error en registro",
    });
  });
});
