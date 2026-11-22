const request = require('supertest');
const app = require('../index');
const jwt = require('jsonwebtoken');
const pool = require('../src/db/connection');

jest.mock('../src/db/connection', () => ({ query: jest.fn() }));
jest.mock("../src/config/firebase", () => ({}));

process.env.JWT_SECRET = 'secreto_de_prueba';

const token = jwt.sign({ id: 1, email: 'test@test.com', roles: ['user'] }, process.env.JWT_SECRET || 'secreto_test');

describe('RF-28: Mis Movimientos e Historial', () => {
  test('Debería obtener el historial de acciones propio', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ accion: 'Inicio de sesión', fecha: '2026-11-20' }]
    });

    const res = await request(app)
      .get('/api/historial/propio') // Basado en tu getHistorialPropio
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});