const request = require('supertest');
const app = require('../index');
const jwt = require('jsonwebtoken');
const pool = require('../src/db/connection');

jest.mock('../src/db/connection', () => ({ query: jest.fn() }));
jest.mock("../src/config/firebase", () => ({}));

process.env.JWT_SECRET = 'secreto_de_prueba';

// Token de prueba para saltar el middleware verifyToken
const token = jwt.sign({ id: 1, Email: 'test@test.com', roles: ['user'] }, process.env.JWT_SECRET || 'secreto_test');

describe('RF-12: Alertas y Presupuesto', () => {
  test('Debería consultar el presupuesto y devolver 200', async () => {
    // Simulamos la respuesta de la base de datos para presupuestos
    pool.query.mockResolvedValue({ rows: [{ id_presupuesto: 1, monto_gastos: 1000 }] });

    const res = await request(app)
      .get('/api/presupuestos') // Ajusta si la ruta es diferente en PresupuestosRoutes
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});