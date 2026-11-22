const request = require('supertest');
const app = require('../index');
const jwt = require('jsonwebtoken');
const pool = require('../src/db/connection');

jest.mock('../src/db/connection', () => ({ query: jest.fn() }));
jest.mock("../src/config/firebase", () => ({}));

process.env.JWT_SECRET = 'secreto_de_prueba';

// Token con rol de admin
const tokenAdmin = jwt.sign({ id: 99, Email: 'admin@test.com', roles: ['admin'] }, process.env.JWT_SECRET || 'secreto_test');

describe('RF-31: Panel de Administración', () => {
  test('Debería obtener la lista de usuarios en el panel', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, nombre: 'User' }]
    });

    const res = await request(app)
      .get('/api/auth/usuarios/PanelAdmin') // Ruta exacta de authRoutes
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
  });
});