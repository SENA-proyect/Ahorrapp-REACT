const request = require('supertest');
const app = require('../app');
const pool = require('../../Backend/src/db/connection');
const bcrypt = require('bcrypt');

// Mockeamos la conexión a la base de datos para no afectar la real
jest.mock('../../Backend/src/db/connection', () => ({ query: jest.fn() }));

describe('RF-09: Iniciar Sesión', () => {
  test('Debería devolver un token JWT con credenciales válidas', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    // Simulamos que el backend encuentra al usuario en la BD
    pool.query.mockResolvedValueOnce({
      rows: [{ id_usuario: 1, email: 'test@test.com', password_hash: hashedPassword, activo: true, roles: ['user'] }]
    });

    const res = await request(app)
      .post('/api/auth/login') // Basado en tu authRoutes
      .send({ email: 'test@test.com', password: 'Password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Debería fallar con contraseña incorrecta', async () => {
    // Simulamos que el usuario existe pero la contraseña es incorrecta
    pool.query.mockResolvedValueOnce({
      rows: [{ id_usuario: 1, email: 'test@test.com', password_hash: 'hash_falso', activo: true }]
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'WrongPassword' });

    expect(res.statusCode).toBe(401); 
  });
});