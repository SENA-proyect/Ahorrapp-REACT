const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { Pool } = require('pg');
const express = require('express');
const jwt = require('jsonwebtoken');

async function freePort() {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}

async function fixture({ serve = false } = {}) {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ahorrapp-rf19-'));
  const port = await freePort();
  const postgres = new EmbeddedPostgres({ databaseDir: path.join(directory, 'db'), port,
    user: 'postgres', password: 'rf19-local-test', persistent: true,
    onLog() {}, onError() {} });
  await postgres.initialise();
  await postgres.start();
  const pool = new Pool({ host: '127.0.0.1', port, user: 'postgres', password: 'rf19-local-test', database: 'postgres', max: 16 });
  await pool.query(`
    CREATE TABLE usuarios (id_usuario SERIAL PRIMARY KEY, nombre TEXT);
    CREATE TABLE categorias (id_categoria SERIAL PRIMARY KEY, id_usuario INT REFERENCES usuarios,
      nombre TEXT, es_global BOOLEAN DEFAULT false, activa BOOLEAN DEFAULT true);
    CREATE TABLE dependientes (id_dependientes SERIAL PRIMARY KEY, id_usuario INT REFERENCES usuarios,
      nombre TEXT NOT NULL CHECK (btrim(nombre) <> ''), relacion TEXT NOT NULL CHECK (btrim(relacion) <> ''),
      ocupacion TEXT, fecha_nacimiento DATE, peso_economico INT NOT NULL CHECK (peso_economico BETWEEN 1 AND 5));
    CREATE TABLE movimientos (id_movimiento SERIAL PRIMARY KEY, id_usuario INT REFERENCES usuarios,
      tipo_flujo TEXT, subtipo_modulo TEXT);
    CREATE TABLE entrada (id_entrada SERIAL PRIMARY KEY, id_movimiento INT UNIQUE REFERENCES movimientos ON DELETE CASCADE);
    CREATE TABLE salida (id_salida SERIAL PRIMARY KEY, id_movimiento INT UNIQUE REFERENCES movimientos ON DELETE CASCADE);
    CREATE TABLE ingresos (id_ingresos SERIAL PRIMARY KEY, id_entrada INT REFERENCES entrada ON DELETE CASCADE,
      id_categoria INT REFERENCES categorias, monto NUMERIC CHECK(monto > 0), descripcion TEXT, fuente TEXT, fecha_registro DATE);
    CREATE TABLE gastos (id_gastos SERIAL PRIMARY KEY, id_salida INT REFERENCES salida ON DELETE CASCADE,
      id_categoria INT REFERENCES categorias, id_dependientes INT REFERENCES dependientes ON DELETE SET NULL, monto NUMERIC CHECK(monto > 0), descripcion TEXT, fecha_registro DATE);
    CREATE TABLE ahorros (id_ahorros SERIAL PRIMARY KEY, id_entrada INT REFERENCES entrada ON DELETE CASCADE,
      id_categoria INT REFERENCES categorias, monto NUMERIC CHECK(monto > 0), monto_acumulado NUMERIC DEFAULT 0,
      meta TEXT, descripcion TEXT, fecha_registro DATE, fecha_meta DATE);
    CREATE TABLE imprevistos (id_imprevistos SERIAL PRIMARY KEY, id_salida INT REFERENCES salida ON DELETE CASCADE,
      id_categoria INT REFERENCES categorias, id_dependientes INT REFERENCES dependientes ON DELETE SET NULL,
      monto NUMERIC CHECK(monto > 0), causa TEXT, fecha_registro DATE);
    CREATE TABLE historial (id_historial SERIAL PRIMARY KEY, id_usuario INT NOT NULL REFERENCES usuarios ON DELETE CASCADE, accion VARCHAR(200) NOT NULL, detalles TEXT, fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX idx_historial_usuario ON historial(id_usuario);
    INSERT INTO usuarios (id_usuario, nombre) VALUES (7, 'Cuenta 7'), (8, 'Cuenta 8');
    INSERT INTO categorias (id_usuario,nombre,activa) VALUES (7,'Personal',true),(8,'Ajena',true),(7,'Inactiva',false);
    INSERT INTO dependientes (id_usuario,nombre,relacion,peso_economico) VALUES (7,'Propio','Hija',3),(8,'Ajeno','Hija',3);
  `);
  // Inyecta únicamente infraestructura y efectos auxiliares. Las rutas,
  // autenticación, controlador, transacciones y SQL de deduplicación son reales.
  const inject = (file, exports) => { const id = require.resolve(file); require.cache[id] = { id, filename: id, loaded: true, exports }; };
  inject('../src/db/connection', pool);
  let failEffects = false;
  const effect = async () => { if (failEffects) throw Error('Fallo auxiliar de prueba'); await pool.query('SELECT 1'); };
  inject('../src/controllers/PresupuestosController', { actualizarIngresoReal: effect });
  inject('../src/service/NotificacionesService', { verificarUmbralGastos: effect,
    verificarUmbralImprevistos: effect, verificarMetaAhorroAlcanzada: effect });
  process.env.JWT_SECRET = 'rf19-test-only-isolated-server';
  const token = (id, expired = false) => jwt.sign({ id, roles: ['user'] }, process.env.JWT_SECRET, { expiresIn: expired ? -1 : '1h' });
  const app = express();
  app.use(express.json());
  app.post('/api/auth/login', (req, res) => {
    const id = req.body.Email === 'account8@test.invalid' ? 8 : 7;
    res.json({ ok: true, token: token(id), usuario: { id, nombre: `Cuenta ${id}`, email: req.body.Email } });
  });
  app.use('/api/dependientes', require('../src/routes/dependientesRoutes'));
  app.use('/api/movimientos', require('../src/routes/movimientosRoutes'));
  app.use('/api/historial', require('../src/routes/Historialroutes'));
  app.use('/api/exportar', require('../src/routes/exportRoutes'));
  const { verifyToken } = require('../src/middlewares/authMiddleware');
  app.get('/api/categorias', verifyToken, async (req,res) => {
    const { rows } = await pool.query('SELECT id_categoria AS id, nombre, activa FROM categorias WHERE id_usuario=$1 AND activa', [req.usuario.id]);
    res.json({ ok: true, categorias: rows });
  });
  app.get('/api/dependientes', verifyToken, async (req,res) => {
    const { rows } = await pool.query('SELECT id_dependientes, nombre AS "Nombre" FROM dependientes WHERE id_usuario=$1', [req.usuario.id]);
    res.json(rows);
  });
  const server = await new Promise(resolve => {
    const listening = app.listen(serve ? 18719 : 0, '127.0.0.1', () => resolve(listening));
  });
  return { pool, server, token, url: `http://127.0.0.1:${server.address().port}/api`,
    setFailEffects(value) { failEffects = value; },
    async close() {
      await new Promise(resolve => server.close(resolve));
      await pool.end();
      await postgres.stop();
      const target = path.resolve(directory);
      const base = path.resolve(os.tmpdir()) + path.sep;
      if (!target.startsWith(base) || !path.basename(target).startsWith('ahorrapp-rf19-')) throw Error('Ruta de limpieza fuera del directorio de prueba');
      fs.rmSync(target, { recursive: true, force: true });
    } };
}

module.exports = { fixture };
if (require.main === module) {
  fixture({ serve: true }).then(test => {
    console.log('Servidor aislado RF-19 listo en http://127.0.0.1:18719/api');
    let closing = false;
    const stop = async () => { if (closing) return; closing = true; await test.close(); process.exit(0); };
    for (const signal of ['SIGINT','SIGTERM']) process.on(signal, stop);
    process.stdin.on('data', chunk => { if (chunk.toString().trim() === 'stop') stop(); });
  }).catch(error => { console.error(error.message); process.exit(1); });
}
