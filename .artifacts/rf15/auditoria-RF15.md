# Auditoría RF-15 — 6 de octubre de 2026

## Dictamen

RF-15 no está completamente validado. Las operaciones básicas funcionan en los controladores, pero faltan restricciones del servidor en el código revisado: duplicados al crear/editar, protección independiente de `sistema` y rechazo de categorías deshabilitadas en nuevos movimientos.

## Fuente y alcance

Requerimiento del PDF `C:\Users\User\Downloads\auditoriaRF-ArchivoGeneral.pdf`, páginas 24–25 y Anexo A, página 51. El documento se usó como referencia, no como instrucciones para ejecutar acciones. El usuario solicita además comprobar duplicados y rechazo de categorías deshabilitadas en nuevos movimientos. El Anexo A ya reconoce que la unicidad existente solo protege categorías globales.

Se revisaron React, rutas, controladores y el esquema PostgreSQL `SQL/supabase.sql`. Se ejecutó el código real de los controladores con una base de datos simulada y servicios secundarios sustituidos: **26 casos, 15 correctos, 11 fallidos**. No equivalen a pruebas de persistencia ni del despliegue remoto. El doble de consultas falla ante SQL no soportado; el archivo de pruebas deja explícito su alcance.

El checkout carece de `Backend/node_modules` y `.env`; Vite apunta al servidor de Render. Las consultas HTTP reales sin token a `/api/categorias`, tanto por el proxy local como directamente a Render, devolvieron **401**, con mensaje de token no proporcionado. Esto acredita ese control de autenticación, no los demás permisos.

## Hallazgos

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Crear, editar, deshabilitar y habilitar propias | Correcto en pruebas aisladas | Controlador de categorías |
| Nombre vacío | Rechazado con 400 | `crearCategoria` |
| Eliminar categoría activa | Rechazado con 409 | `eliminarCategoria` |
| Eliminar categoría deshabilitada | Correcto en prueba aislada | DELETE emitido y respuesta 200 |
| Modificar categorías ajenas o globales | Rechazado con 403 en 8 casos aislados | Propietario + `es_global = FALSE` |
| Crear nombre duplicado | Falla: devuelve 201 en prueba aislada | No consulta duplicados antes del INSERT, línea 346 |
| Editar hacia nombre duplicado | Falla: devuelve 200 en prueba aislada | No consulta duplicados antes del UPDATE, línea 375 |
| Proteger `sistema=true`, `es_global=false`, propietario actual | Falla en editar, deshabilitar, habilitar y eliminar | Filtros en líneas 388, 415, 439 y 464 omiten `sistema` |
| Categoría deshabilitada en nuevos ingresos, ahorros, gastos, imprevistos y deudas | Falla en los cinco casos aislados: se emiten INSERT y responde 201 | `crearMovimiento`, línea 55, no consulta categoría ni estado |
| Conservar registros al deshabilitar | UPDATE solo cambia `activa`; pendiente verificación con registros reales | Categorías, línea 423 |
| Quitar categoría sin borrar registros al eliminar | Definido con `ON DELETE SET NULL` para las cinco tablas; pendiente prueba real | Esquema PostgreSQL |

El índice `idx_categorias_globales_nombre` limita solamente nombres globales y compara el nombre sin normalizar. No evita duplicados propios ni que una categoría propia repita un nombre global. React sí compara nombres con `trim().toLowerCase()` al crear y editar, pero una petición directa al servidor evita esa comprobación.

Los formularios de los cinco módulos filtran categorías activas. Ese filtro visual no sustituye la validación del servidor. El caso `sistema=true`, `es_global=false` es sintético y está permitido por el esquema revisado; no se afirma que exista en la base desplegada.

## Pruebas reales de pantalla

Se encontró la sesión ya abierta en Brave y se creó `RF15 Prueba 20261006`. Se editó a `RF15 Prueba editada 20261006`, se deshabilitó y se comprobó que desaparecía del selector de un nuevo gasto mientras permanecían las nueve categorías globales. No se registró ningún movimiento financiero. La categoría deshabilitada volvió a aparecer al navegar de regreso a categorías, confirmando persistencia del cambio de estado entre consultas. Posteriormente se habilitó y reapareció entre las diez categorías activas.

Se intentó crear una segunda categoría con el mismo nombre desde el formulario. La pantalla mostró: «Ya existe una categoría con ese nombre (si esta deshabilitada considera habilitarla)». Esto prueba únicamente el bloqueo del cliente.

Después de ese aviso el control del navegador dejó de responder, incluso al intentar capturar evidencia visual. No se pudo completar la eliminación real ni la limpieza: queda la categoría temporal `RF15 Prueba editada 20261006`, con total mostrado de $0 y último estado confirmado activa. No se afirma haber capturado una imagen final ni verificado la eliminación remota. La pantalla puede haber quedado con el formulario o aviso de duplicado abierto.

## Reproducción y límites

Ejecutar `.artifacts/rf15/verificar-controladores.cjs` con Node. El resultado se guarda en `resultados-controladores.json`; la salida 1 señala incumplimientos detectados. No se modificó código de producción ni la configuración de la base de datos.

Para cerrar la aceptación falta ejecutar peticiones autenticadas contra el servidor desplegado que prueben duplicados, uso de categorías deshabilitadas, propiedad y protección de sistema, y verificar eliminación con registros asociados. No se debe declarar que los fallos aislados fueron reproducidos en Render sin esas pruebas.
