const request = require('supertest');
const app = require('../index');
const jwt = require('jsonwebtoken');
const pool = require('../src/db/connection');

jest.mock('../src/db/connection', () => ({ query: jest.fn() }));
jest.mock("../src/config/firebase", () => ({}));

process.env.JWT_SECRET = 'secreto_de_prueba';

const token = jwt.sign({ id: 1, email: 'test@test.com', roles: ['user'] }, process.env.JWT_SECRET || 'secreto_test');

describe('RF-13: Notificaciones', () => {
  test('Debería obtener el contador de no leídas', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 3 }] });

    const res = await request(app)
      .get('/api/notificaciones/no-leidas/count')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(3);
  });

  test('Debería marcar todas como leídas', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 5 });

    const res = await request(app)
      .patch('/api/notificaciones/leer-todas')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});