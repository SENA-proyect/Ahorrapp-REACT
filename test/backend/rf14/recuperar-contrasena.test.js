jest.mock("../../../Backend/src/db/connection", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));
jest.mock("../../../Backend/src/service/MailService", () => ({
  sendResetCodeEmail: jest.fn().mockResolvedValue(undefined),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const pool = require("../../../Backend/src/db/connection");
const { sendResetCodeEmail } = require("../../../Backend/src/service/MailService");
const authRoutes = require("../../../Backend/src/routes/authRoutes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const EMAIL = "ana@example.com";
const USER_ID = 93;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RF-14 · Recuperar contraseña", () => {
  it("devuelve el mismo mensaje si el correo no está registrado", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ Email: EMAIL });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      mensaje: "Si el correo está registrado, recibirás un código de verificación",
    });
    expect(sendResetCodeEmail).not.toHaveBeenCalled();
  });

  it("envía un código de seis dígitos y almacena solo su hash", async () => {
    jest.spyOn(crypto, "randomInt").mockReturnValue(123456);
    pool.query
      .mockResolvedValueOnce({ rows: [{ ID_usuario: USER_ID, Email: EMAIL }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ Email: EMAIL });

    expect(response.status).toBe(200);
    expect(sendResetCodeEmail).toHaveBeenCalledWith(EMAIL, "123456");
    const [, params] = pool.query.mock.calls[1];
    expect(params[0]).not.toBe("123456");
    await expect(bcrypt.compare("123456", params[0])).resolves.toBe(true);
    expect(params[2]).toBe(USER_ID);
    expect(new Date(params[1]).getTime()).toBeGreaterThan(Date.now());
  });

  it("verifica el código una vez y devuelve un token de recuperación", async () => {
    const resetCodeHash = await bcrypt.hash("654321", 4);
    pool.query
      .mockResolvedValueOnce({
        rows: [{
          ID_usuario: USER_ID,
          Reset_code: resetCodeHash,
          Reset_code_expires: new Date(Date.now() + 60_000),
        }],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const response = await request(app)
      .post("/api/auth/verify-reset-code")
      .send({ Email: EMAIL, code: "654321" });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(jwt.verify(response.body.resetToken, process.env.JWT_SECRET)).toMatchObject({
      id: USER_ID,
      purpose: "reset_password",
    });
    expect(pool.query.mock.calls[1][1]).toEqual([USER_ID]);
  });

  it("rechaza códigos vencidos", async () => {
    const resetCodeHash = await bcrypt.hash("654321", 4);
    pool.query
      .mockResolvedValueOnce({
        rows: [{
          ID_usuario: USER_ID,
          Reset_code: resetCodeHash,
          Reset_code_expires: new Date(Date.now() - 60_000),
        }],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const response = await request(app)
      .post("/api/auth/verify-reset-code")
      .send({ Email: EMAIL, code: "654321" });

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toBe("El código ha expirado");
  });

  it("actualiza la contraseña solo con un token de recuperación vigente", async () => {
    const resetToken = jwt.sign(
      { id: USER_ID, purpose: "reset_password" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    pool.query
      .mockResolvedValueOnce({ rows: [{ ID_usuario: USER_ID }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ resetToken, nuevaPassword: "NuevaClave123!" });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    const [updateSql, updateParams] = pool.query.mock.calls[1];
    expect(updateSql).toMatch(/UPDATE usuarios SET password_hash/i);
    expect(updateParams[1]).toBe(USER_ID);
    await expect(bcrypt.compare("NuevaClave123!", updateParams[0])).resolves.toBe(true);
  });
});
