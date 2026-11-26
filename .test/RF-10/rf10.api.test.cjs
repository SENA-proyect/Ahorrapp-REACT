// Evita cargar configuración real y sustituye PostgreSQL por funciones simuladas.
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../../Backend/src/db/connection', () => ({ query: jest.fn(), connect: jest.fn() }));

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const pool = require('../../Backend/src/db/connection');
const dependientes = require('../../Backend/src/routes/dependientesRoutes');
const reportes = require('../../Backend/src/routes/ReportesRoutes');

const app = express();
app.use(express.json());
// Monta las rutas reales en una aplicación Express que Supertest puede consultar.
app.use('/api/dependientes', dependientes);
app.use('/api/reportes', reportes);

const claveJwt = 'clave-exclusiva-de-jest';
// El token representa al usuario 7, usado para verificar autenticación y titularidad.
const token = jwt.sign({ id: 7, roles: ['usuario'] }, claveJwt);
const autorizacion = { Authorization: 'Bearer ' + token };
const datos = {
  Nombre: 'Ana', Relacion: 'Hija', Ocupacion: 'Estudiante',
  Fecha_nacimiento: '2010-05-10', Peso_economico: 3,
};

beforeEach(() => {
  // Configura la clave que verifica el token y limpia las consultas simuladas.
  jest.replaceProperty(process, 'env', { ...process.env, JWT_SECRET: claveJwt });
  pool.query.mockReset();
});

describe('RF-10 · Dependientes económicos', () => {
  test('requiere autenticación antes de consultar los dependientes', async () => {
    // Sin token la ruta debe responder 401 y no intentar consultar la base.
    await request(app).get('/api/dependientes').expect(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test.each([
    { Nombre: ' ' }, { Relacion: '' }, { Peso_economico: 0 },
    { Peso_economico: 6 }, { Peso_economico: 2.5 }, { Fecha_nacimiento: '2024-02-30' },
  ])('rechaza los datos inválidos %j sin escribir en la base', async (cambio) => {
    // Cada objeto modifica un campo para probar una entrada inválida distinta.
    await request(app).post('/api/dependientes').set(autorizacion)
      .send({ ...datos, ...cambio }).expect(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('crea el registro para el usuario del token y devuelve su identificador', async () => {
    // La respuesta simulada devuelve el registro que insertaría PostgreSQL.
    pool.query.mockResolvedValueOnce({ rows: [{ ...datos, id_dependientes: 12 }] });
    const respuesta = await request(app).post('/api/dependientes').set(autorizacion)
      .send({ ...datos, ID_usuario: 99 }).expect(201);
    expect(respuesta.body).toMatchObject({ ok: true, id_dependientes: 12 });
    // Aunque el cliente envíe otro ID_usuario, la ruta debe usar el del token (7).
    expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/INSERT INTO dependientes/i),
      [7, 'Ana', 'Hija', 'Estudiante', '2010-05-10', 3]);
  });

  test.each(['put', 'delete'])('limita la operación %s al titular del registro', async (metodo) => {
    // Reutiliza el caso para PUT y DELETE, simulando que el usuario no es titular.
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    await request(app)[metodo]('/api/dependientes/12').set(autorizacion).send(datos).expect(404);
    const [[consulta, parametros]] = pool.query.mock.calls;
    expect(consulta).toMatch(/WHERE id_dependientes = \$\d AND id_usuario = \$\d/i);
    expect(parametros.slice(-2)).toEqual(['12', 7]);
  });

  test('solicita el total de gastos agrupado por dependiente y limitado al titular', async () => {
    // Comprueba el resultado y que la consulta agrupe gastos solo del usuario autenticado.
    const grupo = { id_dependiente: 12, dependiente: 'Ana', total: '200' };
    pool.query.mockResolvedValueOnce({ rows: [grupo] });
    const periodo = { fecha_inicio: '2026-10-01', fecha_fin: '2026-10-31' };
    const respuesta = await request(app).get('/api/reportes/gastos/dependientes')
      .set(autorizacion).query(periodo).expect(200);
    expect(respuesta.body).toEqual({ ok: true, periodo, datos: [grupo] });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/SUM\(g\.monto\).*WHERE m\.id_usuario = \$1.*GROUP BY\s+d\.id_dependientes/is),
      [7, periodo.fecha_inicio, periodo.fecha_fin]
    );
  });

  test('impide que un usuario regular use la eliminación administrativa', async () => {
    // Un usuario común recibe 403 y la ruta administrativa no accede a la base.
    await request(app).delete('/api/dependientes/admin/12').set(autorizacion).expect(403);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
