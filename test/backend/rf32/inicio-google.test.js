jest.mock("../../../Backend/src/db/connection", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: (...args) => mockVerifyIdToken(...args),
  })),
}));

const mockVerifyIdToken = jest.fn();
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const pool = require("../../../Backend/src/db/connection");
const authRoutes = require("../../../Backend/src/routes/authRoutes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const client = { query: jest.fn(), release: jest.fn() };
const googlePayload = {
  sub: "google-account-abc",
  email: "ana@example.com",
  email_verified: true,
  name: "Ana Gomez",
  given_name: "Ana",
  family_name: "Gomez",
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GOOGLE_CLIENT_ID = "test-web-client-id";
  jest.spyOn(console, "error").mockImplementation(() => {});
  pool.connect.mockResolvedValue(client);
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => googlePayload,
  });
});

afterEach(() => {
  delete process.env.GOOGLE_CLIENT_ID;
  jest.restoreAllMocks();
});

describe("RF-32 · Inicio de sesión con Google", () => {
  it("rechaza credenciales de Google ausentes", async () => {
    const response = await request(app)
      .post("/api/auth/google")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toBe("No se recibió el token de Google");
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("rechaza un ID token de Google inválido", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("invalid token"));

    const response = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "invalid-token" });

    expect(response.status).toBe(401);
    expect(response.body.mensaje).toBe("El token de Google no es válido o expiró");
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "invalid-token",
      audience: "test-web-client-id",
    });
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("crea la cuenta nueva con rol user y devuelve un JWT de sesión", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // Usuario por correo
      .mockResolvedValueOnce({
        rows: [{
          id_usuario: 29,
          nombre: "Ana",
          apellido: "Gomez",
          email: "ana@example.com",
          activo: true,
        }],
      }) // INSERT usuario
      .mockResolvedValueOnce({ rows: [] }) // Asignar rol por defecto
      .mockResolvedValueOnce({ rows: [{ Cargo: "user" }] }) // Consultar roles
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const response = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "valid-google-id-token" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      mensaje: "Inicio de sesión con Google exitoso",
      usuario: {
        id: 29,
        email: "ana@example.com",
        roles: ["user"],
      },
    });
    expect(jwt.verify(response.body.token, process.env.JWT_SECRET)).toMatchObject({
      id: 29,
      roles: ["user"],
    });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO usuarios_roles/i),
      [29, 1]
    );
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("no permite iniciar sesión si Google no verificó el correo", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ ...googlePayload, email_verified: false }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "unverified-google-id-token" });

    expect(response.status).toBe(401);
    expect(response.body.mensaje).toBe("Google no devolvió una cuenta verificada");
    expect(pool.connect).not.toHaveBeenCalled();
  });
});
