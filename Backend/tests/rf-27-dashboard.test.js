const request = require('supertest');
const app = require('../index');
const jwt = require('jsonwebtoken');
const pool = require('../src/db/connection');

jest.mock('../src/db/connection', () => ({ query: jest.fn() }));
jest.mock("../src/config/firebase", () => ({}));

process.env.JWT_SECRET = 'secreto_de_prueba';

const token = jwt.sign({ id: 1, email: 'test@test.com', roles: ['user'] }, process.env.JWT_SECRET || 'secreto_test');

describe('RF-27: Panel de Control (Dashboard)', () => {
  test('Debería obtener el resumen financiero', async () => {
    // Simulamos las respuestas de la BD para la dashboard
    pool.query.mockResolvedValue({ rows: [{ total: 1000 }] });

    const res = await request(app)
      .get('/api/dashboard/resumen') // Ajusta si en DashboardRoutes es otra
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});