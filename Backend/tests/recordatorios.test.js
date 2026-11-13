jest.mock('../src/config/firebase', () => ({
  messaging: () => ({
    sendEachForMulticast: jest.fn().mockResolvedValue({ responses: [] }),
  }),
}));

jest.mock('../src/db/connection', () => ({
  query: jest.fn(),
}));

const pool = require('../src/db/connection');
const NotificacionesService = require('../src/service/NotificacionesService');

describe('Prueba de Recordatorios de Deudas (Requerimiento IEEE)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Debería crear un recordatorio si una deuda vence en 5 días o menos', async () => {
    // 1. Buscar deudas próximas a vencer
    pool.query.mockResolvedValueOnce({
      rows: [{ id_deudas: 1, monto: 50000, fecha_fin: '2026-11-17' }]
    });

    // 2. existeNotificacionEntidad (vacío = no existe)
    pool.query.mockResolvedValueOnce({ rows: [] });

    // 3. preferenciaActiva (vacío = por defecto true)
    pool.query.mockResolvedValueOnce({ rows: [] });

    // 4. INSERT en la tabla notificaciones (retorna el ID)
    pool.query.mockResolvedValueOnce({ rows: [{ id_notificacion: 1 }] });

    // 5. SELECT de push_tokens (vacío para que no intente enviar Push real)
    pool.query.mockResolvedValueOnce({ rows: [] });

    // Ejecutamos la función
    await NotificacionesService.verificarDeudasProximasAVencer(2);

    // Verificamos la consulta de inserción
    const insertCall = pool.query.mock.calls.find(
      (call) => call[0].includes('INSERT INTO notificaciones')
    );

    expect(insertCall).toBeDefined();
    // Verificamos que el mensaje y el usuario sean los correctos
    expect(insertCall[1]).toContain(2); // ID_usuario
    expect(insertCall[1][4]).toContain("vence el"); // Mensaje
  });

  test('NO debería duplicar el recordatorio si ya fue enviado hoy', async () => {
    // 1. Buscar deudas próximas a vencer
    pool.query.mockResolvedValueOnce({
      rows: [{ id_deudas: 1, monto: 50000, fecha_fin: '2026-11-17' }]
    });

    // 2. existeNotificacionEntidad (devuelve un ID = YA existe)
    pool.query.mockResolvedValueOnce({ rows: [{ id_notificacion: 99 }] });

    await NotificacionesService.verificarDeudasProximasAVencer(2);

    // Verificamos que NO se llamó al INSERT de notificaciones
    const insertCall = pool.query.mock.calls.find(
      (call) => call[0].includes('INSERT INTO notificaciones')
    );

    expect(insertCall).toBeUndefined();
  });
});