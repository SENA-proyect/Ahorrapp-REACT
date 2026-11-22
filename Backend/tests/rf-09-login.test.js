const request = require('supertest');
const app = require('../index');
const pool = require('../../Backend/src/db/connection');
const bcrypt = require('bcrypt');

jest.mock('../../Backend/src/db/connection', () => ({ query: jest.fn() }));
jest.mock("../src/config/firebase", () => ({}));

process.env.JWT_SECRET = 'secreto_de_prueba';

describe('RF-09: Iniciar Sesión', () => {
  test('Debería devolver un token JWT con credenciales válidas', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);

    pool.query
      .mockResolvedValueOnce({
        rows: [{ id_usuario: 1, email: 'test@test.com', password_hash: hashedPassword, activo: true }]
      })
      .mockResolvedValueOnce({
        rows: [{ Cargo: 'user' }]
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ Email: 'test@test.com', Password_hash: 'Password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Debería fallar con contraseña incorrecta', async () => {
    const hashDeOtraClave = await bcrypt.hash('OtraClave999', 10);

    pool.query.mockResolvedValueOnce({
      rows: [{ id_usuario: 1, email: 'test@test.com', password_hash: hashDeOtraClave, activo: true }]
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ Email: 'test@test.com', Password_hash: 'WrongPassword' });

    expect(res.statusCode).toBe(401);
  });
});