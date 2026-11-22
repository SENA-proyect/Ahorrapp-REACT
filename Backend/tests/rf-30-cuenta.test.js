const request = require('supertest');
const app = require('../index');
const jwt = require('jsonwebtoken');
const pool = require('../src/db/connection');

jest.mock('../src/db/connection', () => ({ query: jest.fn() }));
jest.mock("../src/config/firebase", () => ({}));

process.env.JWT_SECRET = 'secreto_de_prueba';

const token = jwt.sign({ id: 1, email: 'test@test.com', roles: ['user'] }, process.env.JWT_SECRET);

describe('RF-30: Gestionar mi Cuenta', () => {
  beforeEach(() => {
    pool.query.mockReset();
    pool.query.mockResolvedValue({ rows: [], rowCount: 1 });
  });

  test('Debería actualizar los datos del perfil', async () => {
    const res = await request(app)
      .put('/api/auth/mi-perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ Nombre: 'Nuevo', Apellido: 'Nombre', Email: 'nuevo@test.com' });

    expect(res.statusCode).toBe(200);
  });

  test('Debería desactivar la cuenta', async () => {
    const res = await request(app)
      .put('/api/auth/mi-cuenta/desactivar')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});