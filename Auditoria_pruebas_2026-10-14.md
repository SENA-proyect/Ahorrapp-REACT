# Auditoría de pruebas de AhorrApp — 14 de octubre de 2026

Se ejecutaron **2.443 comprobaciones funcionales y de entradas**, de las cuales **2.363 pasaron y 80 fallaron**. Además, 88 archivos pasaron la revisión de sintaxis y la compilación de producción del frontend terminó correctamente. Hay fallos funcionales y de autorización que requieren corrección antes de considerar el proyecto verificado.

Los 80 resultados fallidos incluyen varios casos de una misma causa: **no equivalen a 80 errores independientes**. La matriz de 2.048 identificadores inválidos explica buena parte del volumen; aprobarla no demuestra la cobertura completa del proyecto.

## Alcance y estado examinado

- Proyecto: `C:\Ahorrapp-REACT`, frontend React/Vite y backend Express/PostgreSQL.
- Rama local: `David-M`. HEAD: `af03b492ca60c5dd2ed17b3bd52b95647c9458b7`.
- Se probaron los archivos actuales, incluyendo cambios locales que ya existían. El hash por sí solo no identifica todo el contenido probado.
- Se conservaron los cambios del usuario. Solo se agregaron scripts, evidencias e informe de auditoría; no se corrigió el código de la aplicación ni se actualizaron dependencias.
- Las solicitudes HTTP y escrituras usaron PostgreSQL temporal en `127.0.0.1`. No se consultaron cuentas ni se escribieron datos en producción.
- La suite ampliada extrajo las tablas, restricciones CHECK, tipos, índices y disparadores del SQL del proyecto. Una coma faltante se corrigió únicamente en la copia cargada en la base temporal, después de demostrar que el original falla.
- Los controladores, rutas, JWT, transacciones y SQL probados fueron reales. El envío de correos y los efectos auxiliares de movimientos se sustituyeron para probar fallos y evitar comunicaciones externas. La API de presupuestos y sus notificaciones usó servicios reales contra la base temporal.
- Las pruebas de interfaz ejecutaron React en JSDOM con respuestas simuladas: no verifican apariencia, cámara, navegador real, servicios externos ni el servidor desplegado. No se probó el proyecto Flutter de `C:\ahorrapp-movile`.

## Resultados por grupo

| Grupo | Comprobaciones | Pasaron | Fallaron | Qué verifica |
|---|---:|---:|---:|---|
| RF-15 existente | 50 | 50 | 0 | Controladores con base y efectos simulados |
| RF-16 existente | 11 | 11 | 0 | Cierre de sesión, memoria y protección de rutas en JSDOM |
| RF-19 existente | 17 | 17 | 0 | HTTP, JWT y PostgreSQL temporal; reintentos, aislamiento y reversión |
| Backend ampliado | 2.253 | 2.180 | 73 | SQL, API, autorización, valores inválidos y concurrencia |
| Frontend ampliado | 112 | 105 | 7 | 27 rutas en cuatro modos y manejo de errores de movimientos |
| **Total funcional** | **2.443** | **2.363** | **80** | Incluye casos de la misma causa |
| Sintaxis, separado del total funcional | 88 | 88 | 0 | Análisis sin ejecución de código |

Compilación: aprobada; el archivo principal generado pesa aproximadamente **1.335,54 kB** antes de compresión y **382,79 kB** con gzip. Se emitieron advertencias de tamaño y de importación estática/dinámica de `api.js`; no son fallos de compilación.

Revisión estática: **57 errores y 1 advertencia**. Incluye variables sin uso, bloques vacíos y reglas de efectos y exportaciones de React. Estos diagnósticos no prueban por sí solos que una pantalla falle. Los 88 archivos sin errores de sintaxis tampoco prueban su comportamiento.

Instalación actual: `npm ls --depth=0 --json` no reportó problemas en frontend ni backend. No se hizo una reinstalación desde cero.

## Hallazgos de prioridad alta

### 1. Un usuario normal puede leer información administrativa

**Reproducción:** enviar GET con JWT de rol `user` a `/api/auth/PanelUsuarios`, `/api/auth/PanelDependientes`, `/api/auth/usuarios/PanelAdmin` y `/api/auth/dependientes/PanelAdmin`.

**Resultado:** los cuatro endpoints responden **200**, cuando el acceso administrativo debe bloquearse. Las consultas de usuarios y dependientes incluyen registros de otras cuentas; los otros dos endpoints exponen conteos generales.

**Causa:** las rutas aplican `verifyToken` sin `requireRole`; sus controladores consultan datos generales. La protección de la página React no protege solicitudes directas a la API.

**Ubicación:** [authRoutes.js](C:/Ahorrapp-REACT/Backend/src/routes/authRoutes.js:32), [authController.js](C:/Ahorrapp-REACT/Backend/src/controllers/authController.js:342).

**Corrección propuesta:** exigir el rol administrativo correspondiente en cada endpoint y conservar una prueba HTTP con usuario normal y otra con administrador.

### 2. El token para recuperar contraseña también autoriza acceso a gastos

**Reproducción:** usar un JWT firmado con `{id: 7, purpose: 'reset_password'}` como autorización de GET `/api/movimientos/gastos`.

**Resultado:** **200**, aunque ese token solo debe permitir completar la recuperación. Se utilizó la misma estructura de token que emite `verifyResetCode`, con el secreto de la instancia temporal.

**Causa:** `verifyToken` valida firma y vencimiento, pero no el propósito ni la estructura de un token de sesión.

**Ubicación:** [authMiddleware.js](C:/Ahorrapp-REACT/Backend/src/middlewares/authMiddleware.js:18), [authController.js](C:/Ahorrapp-REACT/Backend/src/controllers/authController.js:258).

**Corrección propuesta:** distinguir tokens de sesión y recuperación; rechazar el segundo en todas las rutas protegidas.

### 3. Desactivar una cuenta no invalida su acceso con un JWT anterior

**Reproducción:** cambiar `usuarios.activo` a false en la base temporal y consultar `/api/movimientos/ingresos` con el JWT previamente emitido de esa cuenta.

**Resultado:** **200**. El login filtra cuentas activas, pero las solicitudes posteriores no revisan ese estado.

**Ubicación:** [authMiddleware.js](C:/Ahorrapp-REACT/Backend/src/middlewares/authMiddleware.js:18), [authController.js](C:/Ahorrapp-REACT/Backend/src/controllers/authController.js:597).

**Corrección propuesta:** comprobar que la cuenta sigue habilitada, o usar un mecanismo de invalidación de sesiones que también cubra desactivación y cambios relevantes de credenciales.

### 4. El token de recuperación se puede reutilizar

**Reproducción:** POST `/api/auth/reset-password` dos veces con el mismo `resetToken`, usando dos contraseñas diferentes de longitud válida.

**Resultado:** **200 en ambas solicitudes**. El mismo token sigue permitiendo cambiar la contraseña dentro de su vigencia.

**Ubicación:** [authController.js](C:/Ahorrapp-REACT/Backend/src/controllers/authController.js:276).

**Corrección propuesta:** registrar y consumir una autorización de recuperación de un solo uso de forma atómica. Invalidar el código de correo no consume el JWT que ya se emitió.

### 5. Editar movimientos permite usar categorías ajenas o inactivas

**Reproducción:** crear un movimiento propio y hacer PUT a su endpoint de ingresos, gastos, ahorros, imprevistos o deudas con `id_categoria` de otra cuenta o con una categoría inactiva.

**Resultado:** las **10 combinaciones devuelven 200**. La restricción que existe al crear un movimiento no se aplica al editarlo.

**Ubicación:** [movimientosController.js](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:385); revisar también `updateAhorros`, `updateGastos`, `updateImprevistos` y `updateDeudas`.

**Corrección propuesta:** validar propiedad o visibilidad global, existencia y actividad de la categoría en todos los métodos de edición, dentro de la operación de escritura.

### 6. Se aceptan dependientes de otras cuentas

**Reproducción:** crear un imprevisto con `id_dependientes` de otra cuenta, o editar un gasto/imprevisto propio asignándole ese dependiente.

**Resultado:** **201 al crear el imprevisto y 200 en ambas ediciones**. Crear un gasto sí rechaza el dependiente ajeno; la cobertura es desigual.

**Ubicación:** [movimientosController.js](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:113), [updateGastos](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:571), [updateImprevistos](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:658).

**Corrección propuesta:** aplicar la misma validación de dueño al crear y editar todos los módulos que admiten dependientes.

### 7. El retiro del fondo de emergencia falla por SQL inválido

**Reproducción:** crear fondo, aportar 500 y solicitar un retiro de 100; solicitar también un retiro superior al saldo.

**Resultado:** ambos retiros devuelven **500**. PostgreSQL informa `FOR UPDATE is not allowed with GROUP BY clause`.

**Ubicación:** [fondoemergenciaController.js](C:/Ahorrapp-REACT/Backend/src/controllers/fondoemergenciaController.js:306).

**Corrección propuesta:** bloquear primero la fila del fondo y consultar después el saldo agregado dentro de la misma transacción. Agregar pruebas de saldo insuficiente y retiros simultáneos.

### 8. Solicitudes simultáneas crean varios períodos abiertos

**Reproducción:** activar un perfil, cerrar su período y enviar 20 solicitudes simultáneas a POST `/api/presupuestos/periodos/abrir` para la misma cuenta.

**Resultado observado:** **17 respuestas 201 y 17 períodos abiertos**. El número puede variar entre ejecuciones; la condición incorrecta es permitir más de uno.

**Causa:** consultar si existe un período abierto e insertar después no protege contra otra solicitud que hace lo mismo al mismo tiempo. El esquema examinado no impone unicidad de período abierto por usuario.

**Ubicación:** [PresupuestosController.js](C:/Ahorrapp-REACT/Backend/src/controllers/PresupuestosController.js:356), [supabase.sql](C:/Ahorrapp-REACT/SQL/supabase.sql:908).

**Corrección propuesta:** serializar la apertura por cuenta y respaldarla con una restricción única apropiada en PostgreSQL. Mantener una prueba de concurrencia.

### 9. Un abono guardado puede responder como si hubiera fallado

**Reproducción:** hacer PATCH de abono de ahorro con monto 25 y provocar un fallo del efecto de notificación después del COMMIT.

**Resultado:** respuesta **500**, pero el monto acumulado queda en **25**. La escritura real se confirmó antes del error. Un usuario que reintente puede duplicar el aporte.

**Ubicación:** [movimientosController.js](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:1106).

**Corrección propuesta:** separar el resultado de la transacción de los efectos posteriores; añadir deduplicación al abono si se permiten reintentos de operación.

### 10. Cuotas inválidas se convierten en pagos reales

**Reproducción:** abonar una deuda con `cuotas` igual a `0`, `'abc'`, `1.8` o `'1abc'`.

**Resultado:** **200 en los cuatro casos**. El código aplica `parseInt(...) || 1`, convirtiendo valores inválidos en una cuota o truncándolos.

**Ubicación:** [movimientosController.js](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:863).

**Corrección propuesta:** admitir únicamente enteros positivos completos y devolver un error de validación antes de modificar la deuda.

## Otros errores reproducibles

| Problema | Resultado y reproducción | Ubicación / propuesta |
|---|---|---|
| La ruta de nuevo movimiento falla al abrirla directamente | `/movimientos/nuevo` produce `Cannot read properties of undefined (reading 'color')` con usuario, administrador y red fallida | [App.jsx](C:/Ahorrapp-REACT/Frontend/src/App.jsx:218) instancia el modal sin `subtipo`; [modal](C:/Ahorrapp-REACT/Frontend/src/components/Modalnuevomovimiento.jsx:110) lo requiere. Completar los parámetros o usar una página que los seleccione |
| El SQL de instalación no se puede ejecutar tal como está | Crear la primera tabla en un esquema vacío falla cerca de `fecha_registro` | [supabase.sql](C:/Ahorrapp-REACT/SQL/supabase.sql:13): falta una coma después de `fecha_eliminacion_programada TIMESTAMP NULL` |
| Fechas y montos inválidos producen 500 | Fechas inexistentes, montos booleanos, arrays y valores enormes llegan a PostgreSQL; se esperó rechazo 400 | [crearMovimiento](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:56): validar formato, tipo, fecha calendario y rango; [abonarAhorro](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:1020) también permite pasar `'NaN'` hasta fallar |
| Registro acepta correo inválido y contraseña de un carácter | POST de registro con email `correo-invalido` y password `x` responde 201 | [authController.js](C:/Ahorrapp-REACT/Backend/src/controllers/authController.js:20): aplicar reglas en servidor, además de las del formulario |
| Login sin contraseña responde 500 | Enviar el correo de una cuenta existente sin `Password_hash` provoca error de bcrypt | [authController.js](C:/Ahorrapp-REACT/Backend/src/controllers/authController.js:73): validar datos antes de consultar/comparar |
| Dependiente sin peso no usa el valor predeterminado | POST válido sin `Peso_economico` responde 500 por NOT NULL | [dependientesController.js](C:/Ahorrapp-REACT/Backend/src/controllers/dependientesController.js:48): se inserta NULL explícito, anulando el default del esquema; definir una política de campo obligatorio o predeterminado |
| La web oculta errores al obtener movimientos | Con HTTP 401, 403, 500 o error de red, `getMovimientos()` devuelve `[]` | [api.js](C:/Ahorrapp-REACT/Frontend/src/services/api.js:78): diferenciar lista vacía de fallo y permitir a la interfaz mostrar error o solicitar inicio de sesión |
| Validación de presupuestos deja errores al SQL | Porcentajes negativos que suman 100, porcentaje `'abc'` y día de corte 1.5 responden 500 | [PresupuestosController.js](C:/Ahorrapp-REACT/Backend/src/controllers/PresupuestosController.js:144): validar cada número finito y sus límites |
| Paginación negativa provoca error | GET `/presupuestos/periodos?limite=-1` responde 500 | [PresupuestosController.js](C:/Ahorrapp-REACT/Backend/src/controllers/PresupuestosController.js:541): rechazar o limitar el valor antes de generar LIMIT/OFFSET |

## Dependencias y mantenimiento

El análisis consultó las alertas actuales del registro npm para las dependencias resueltas del proyecto. Son alertas de versiones; no se intentó explotar estas vulnerabilidades ni se comprobó su exposición en producción.

| Instalación | Críticas | Altas | Moderadas | Bajas | Total reportado |
|---|---:|---:|---:|---:|---:|
| Backend | 1 | 6 | 1 | 0 | 8 |
| Frontend | 0 | 2 | 0 | 2 | 4 |
| Raíz | 0 | 1 | 0 | 0 | 1 |

Backend: `proxy-addr` se reportó crítico; `axios`, `brace-expansion`, `braces`, `chokidar`, `nodemailer` y `nodemon` altos; `qs` moderado. Frontend: `brace-expansion` y `source-map-js` altos; `dompurify` y `esbuild` bajos. Raíz: `source-map-js` alto. Hay paquetes repetidos entre instalaciones y algunas alertas pertenecen a herramientas de desarrollo; no deben sumarse como vulnerabilidades independientes de producción.

Actualizar versiones compatibles y verificar las rutas afectadas después del cambio. Los detalles, dependencias directas/transitivas, enlaces de avisos y versiones propuestas están en los JSON de evidencias. No se ejecutó una corrección automática de dependencias.

La revisión estática requiere limpieza, pero los permisos, retiros, períodos concurrentes y confirmaciones financieras deben tener prioridad sobre variables sin uso y advertencias de desarrollo.

## Comportamientos que sí pasaron

- 50 casos de categorías existentes y 11 de cierre de sesión existente.
- Creación válida de los cinco tipos de movimiento con el esquema temporal derivado del proyecto.
- Otra cuenta no pudo editar ni eliminar un movimiento que no le pertenecía.
- Consultas protegidas examinadas rechazaron la ausencia de token y el token vencido.
- 2.048 identificadores inválidos fueron rechazados y no aumentaron la cantidad de movimientos.
- 100 envíos simultáneos del mismo `operation_id` produjeron una sola creación, respuestas exitosas y un único identificador.
- 24 solicitudes concurrentes de una categoría equivalente produjeron una creación y 23 rechazos por duplicidad.
- 20 abonos simultáneos de 100 sobre una meta de 1.000 dejaron el acumulado en 1.000, con diez abonos confirmados.
- El ciclo secuencial crear perfil → activar → abrir período → rechazar reapertura → cerrar pasó.
- Los reportes examinados respondieron correctamente con datos válidos; los reportes de fondo respondieron 404 cuando no existía un fondo y 200 después de crearlo.
- 105 de 112 casos ampliados del frontend pasaron. Esto demuestra montaje y manejo básico en DOM simulado, sin validar apariencia ni todos los formularios.

## Evidencias y repetición

Archivos dentro de `.artifacts/`, todos con prefijo `auditoria-2026-10-14`:

- `-resultados.json`: los 2.253 casos del backend con esperado, obtenido y errores capturados.
- `-frontend-resultados.json`: los 112 casos de React y manejo de errores.
- `-sintaxis.json`: los 88 archivos analizados.
- `-lint.json`: los diagnósticos estáticos completos.
- `-backend-dependencias.json`, `-frontend-dependencias.json`, `-raiz-dependencias.json`: informes de vulnerabilidades.
- `-backend-instalacion.json`, `-frontend-instalacion.json`: estado de dependencias instaladas.
- `-integracion.log`, `-frontend.log`, `-rf19.log`: salida de las ejecuciones.

Para repetir desde `C:\Ahorrapp-REACT`, ejecutar una sola instancia de cada suite a la vez:

```powershell
node .artifacts/auditoria-2026-10-14.cjs
node .artifacts/auditoria-2026-10-14-frontend.cjs
node .artifacts/auditoria-2026-10-14-sintaxis.cjs
```

Pruebas existentes: `npm run test:rf15` y `npm run test:rf19` desde Backend; `npm run test:rf16`, `npm run build` y `npm run lint` desde Frontend. Los fallos encontrados se registran en JSON; las suites exploratorias no convierten cada expectativa incumplida en un código de salida distinto de cero. Para evaluar el resultado, consultar los campos `failed` y `results`.

## Pendientes para una aceptación completa

Corregir primero los hallazgos de autorización y escritura financiera, y volver a ejecutar sus reproducciones. Después verificar en navegador real los formularios y las sesiones, correo de recuperación, reportes descargados y la integración con un backend de pruebas configurado para ello. La web tiene una URL de API fija hacia Render; ejecutar el frontend local no demuestra que utilice el backend local ni que el código publicado coincida con estos archivos.

No se verificaron carga sostenida, límites de solicitudes públicas, recuperación con correos reales, compatibilidad entre navegadores, accesibilidad visual, dispositivos móviles ni todos los escenarios de interrupción. El resultado no constituye una garantía de ausencia de otros errores.
