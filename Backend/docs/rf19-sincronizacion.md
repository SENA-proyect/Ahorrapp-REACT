# RF-19: sincronización sin cambios en el esquema

La rama `David-M` incorpora deduplicación transaccional para creaciones móviles de ingresos, gastos y ahorros. **No se crean ni se alteran tablas, columnas o índices del servidor.** La propuesta de migración se retiró por la restricción del usuario. El documento móvil está en `C:\ahorrapp-movile\docs\rf19-implementacion.md`.

## Activación

Publicar el backend de esta rama y comprobar con una sesión válida `/api/movimientos/sincronizacion`: `protocolo: 1`, `idempotencia: true`. No ejecutar migraciones. Se utiliza la tabla `historial` ya definida en `SQL/supabase.sql`; si no está disponible, la comprobación devuelve 503 y el teléfono conserva sus pendientes.

No se ha modificado la base remota ni se ha publicado el servicio: Render requiere una sesión administrativa que no está disponible en esta entrega.

## Garantía y contrato

Cada `POST /api/movimientos` con `operation_id` v4 obtiene un bloqueo transaccional PostgreSQL por usuario y hash del UUID. La consulta compara el UUID completo normalizado, así que una colisión solo serializa solicitudes distintas. READ COMMITTED garantiza que el reintento vea la confirmación anterior después de esperar. Este mecanismo funciona entre procesos e instancias diferentes, sin una caché en memoria.

La confirmación se registra en `historial`: acción `RF19:<uuid>`, detalles JSON con huella SHA-256 y respuesta original. Movimiento y confirmación se escriben en la misma transacción. Primera creación: 201; repetición exacta: 200 y respuesta original; contenido diferente: 409. La cuenta procede del token.

Las listas de los tres módulos incluyen `operation_id` después de reconciliar sus IDs de movimiento con el historial técnico. La consulta `/api/movimientos/sincronizacion/operaciones/:operationId` comprueba existencia para la cuenta actual antes de corregir un rechazo.

El historial técnico no aparece en las vistas normales ni en la lista de exportaciones, y el endpoint de eliminar exportaciones no puede borrarlo. Se conserva después de eliminar un movimiento para impedir que un reintento lo recree. La garantía exige conservar estos registros y mantener este protocolo en todas las instancias que procesan operaciones móviles. No purgar las acciones `RF19:` manualmente.

Después de COMMIT se devuelve la conexión al pool antes de ejecutar tareas auxiliares, para evitar agotarlo con varias creaciones concurrentes. Un fallo auxiliar no altera la confirmación financiera.

## Verificación

`npm run test:rf19`: **17 casos aprobados**, HTTP/JWT reales y PostgreSQL temporal real. Incluye tres módulos, respuestas perdidas, 12 reintentos simultáneos, 20 operaciones distintas concurrentes, mayúsculas de UUID, cuentas distintas, conflicto, categorías/dependientes no disponibles, rollback, token vencido, fallo posterior al COMMIT, borrado/reintento, esquema e índices idénticos antes y después, y protección del historial técnico.

`npm run test:rf15`: 50 casos con controladores reales y consultas/servicios simulados. Los efectos auxiliares se sustituyen en el fixture; sus pruebas no se presentan como una validación del presupuesto o las notificaciones reales.

El fixture crea una base PostgreSQL temporal con el esquema existente, datos y cuentas de prueba. No utiliza la base remota. `embedded-postgres` es dependencia de desarrollo. Para Android: iniciar `node tests/rf19-fixture.cjs`, conectar con `adb reverse tcp:18719 tcp:18719` y ejecutar `integration_test/rf19_device_test.dart`. Cada ejecución requiere un fixture vacío nuevo. En modo standalone, escribir `stop` o enviar SIGINT/SIGTERM cierra el fixture y retira su base temporal.
