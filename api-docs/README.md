# Documentación de la API — AhorrApp Backend

Documentación generada a partir del código real del backend (`src/controllers` + `src/routes`), verificada contra el schema de la base de datos corregido.

**Convenciones generales:**
- 🔒 = requiere header `Authorization: Bearer <token>` (JWT obtenido en `/api/auth/login`).
- 🔒👑 = requiere además rol `superuser`.
- 🔓 = endpoint público, sin autenticación.
- La gran mayoría de los endpoints responde `{ "ok": boolean, ... }`. Las excepciones puntuales (`dependientesController`, `exportController`, y las rutas de bolsa/noticias) están señaladas explícitamente dentro de cada documento porque usan otro formato (`{ error }` / `{ message }` / array plano).

## Índice

| # | Documento | Base path | Controller |
|---|---|---|---|
| 1 | [01-auth.md](01-auth.md) | `/api/auth` | `authController.js` |
| 2 | [02-categorias.md](02-categorias.md) | `/api/categorias` | `categoriasController.js` |
| 3 | [03-dependientes.md](03-dependientes.md) | `/api/dependientes` | `dependientesController.js` |
| 4 | [04-movimientos.md](04-movimientos.md) | `/api/movimientos` | `movimientosController.js` |
| 5 | [05-dashboard.md](05-dashboard.md) | `/api/dashboard` | `dashboardController.js` |
| 6 | [06-presupuestos.md](06-presupuestos.md) | `/api/presupuestos` | `PresupuestosController.js` |
| 7 | [07-fondo-emergencia.md](07-fondo-emergencia.md) | `/api/fondo-emergencia` | `fondoemergenciaController.js` |
| 8 | [08-reportes.md](08-reportes.md) | `/api/reportes` | `ReportesController.js` |
| 9 | [09-notificaciones.md](09-notificaciones.md) | `/api` (notificaciones y preferencias) | `Notificacionescontroller.js` |
| 10 | [10-export.md](10-export.md) | `/api/exportRoutes` | `exportController.js` |
| 11 | [11-ai.md](11-ai.md) | `/api/ai` | `aiController.js` |
| 12 | [12-bolsa-noticias-extra.md](12-bolsa-noticias-extra.md) *(bonus, sin controller propio)* | `/api` y `/api/noticias` | *(lógica inline en las rutas)* |

## Notas transversales encontradas al documentar

- **`dependientesController.js`** responde `{ error }` / `{ message }` en vez de `{ ok, mensaje }`, y `GET /api/dependientes` devuelve un array plano en vez de `{ ok, data }`.
- **`exportController.js`** responde `{ error }` en vez de `{ ok, mensaje }`, usa nombres de campo en `camelCase` (`fechaInicio`/`fechaFin`) mientras que `ReportesController.js` usa `snake_case` (`fecha_inicio`/`fecha_fin`) para lo mismo — hay que tener cuidado al integrarlos desde el mismo cliente.
- **`/api/ai/chat`** no exige token (sin `verifyToken`), a diferencia de todo el resto de la API.
- **`PATCH /api/presupuestos/periodos/actualizar-ingreso`** está mal cableado (el handler espera `(ID_usuario, connection)`, no `(req, res)`) — documentado con advertencia, no se debe invocar como endpoint HTTP hasta que se corrija.
- La ruta pública de exportación quedó como `/api/exportRoutes` en vez de `/api/exportar` (nombre heredado, hay un comentario del equipo original reconociéndolo en el propio archivo).
