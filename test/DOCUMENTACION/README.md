# AhorrApp · Pruebas automatizadas de requisitos funcionales

Índice de la documentación de pruebas (Jest en backend, Vitest en frontend web). Cada RF tiene su propio documento.

## Resultados

| RF | Nombre | Backend (Jest) | Frontend (Vitest) | Total |
|---|---|:---:|:---:|:---:|
| [RF-02](RF02.md) | Gestionar ingresos | 59 | 26 | **85** |
| [RF-03](RF03.md) | Gestionar gastos | 61 | 32 | **93** |
| [RF-04](RF04.md) | Gestionar ahorros | 89 | 37 | **126** |
| [RF-05](RF05.md) | Gestionar imprevistos | 67 | 28 | **95** |
| [RF-06](RF06.md) | Gestionar fondo de emergencia | 70 | 35 | **105** |
| [RF-07](RF07.md) | Gestionar deudas | 106 | 46 | **152** |
| [RF-11](RF11.md) | Generar reportes financieros | 227 | 19 | **246** |
| [RF-24](RF24.md) | Exportación nativa de reportes financieros (PDF) | 29 | 37 | **66** |
| [RF-26](RF26.md) | Gestionar presupuestos y períodos presupuestales | 132 | 38 | **170** |
| | **Total** | **840** | **298** | **1138** |

Además, `test/frontend/comun/validaciones.test.js` (64 pruebas) cubre las validaciones compartidas del formulario y no se suma por RF. Con ellas, la suite de frontend completa tiene 364 pruebas (incluye las 2 de `api.google.test.js` ya existentes).

Fecha de ejecución: 2026-11-23. Todas las pruebas pasan, **salvo que el backend no carga sin corregir el hallazgo H-01**.

## Cómo ejecutar

```
# Backend (desde Backend/)
npx jest              # todas las suites
npx jest rf03         # un RF

# Frontend (desde Frontend/)
npx vitest run                      # todas las suites
npx vitest run test/frontend/rf03   # un RF
```

Estructura (las pruebas viven fuera de `Backend/` y `Frontend/`, en `test/`):

```
test/
├── backend/        rf02 … rf26   (Jest + Supertest)
├── frontend/       rf02 … rf26, comun/, helpers/   (Vitest + Testing Library)
└── DOCUMENTACION/  RF02.md … RF26.md, README.md
```

## Cambio de configuración incluido

`Frontend/vite.config.js` es el único archivo del proyecto que se modificó. Antes, Vitest solo encontraba pruebas dentro de `Frontend/`. Ahora, **solo cuando corre Vitest**, la raíz sube a la carpeta del proyecto y un pequeño plugin resuelve los imports de las pruebas (`react`, `vitest`, `@testing-library/*`) contra `Frontend/node_modules`. `npm run dev` y `npm run build` no cambian. El `proxy` y el `https` del servidor se conservan.

## Hallazgos

| ID | Severidad | Hallazgo | Dónde |
|---|---|---|---|
| H-01 | **Alta (bloqueante)** | `movimientosController.js` exporta `getMovimientos` pero la función no existe. Al cargar el módulo ocurre `ReferenceError: getMovimientos is not defined`, por lo que el servidor no arranca y las suites de RF-02 a RF-07 no pueden cargar el controlador. La suite RF-02 pasaba 59/59 el 2026-11-08; la regresión es posterior. | `Backend/src/controllers/movimientosController.js` (export final, línea ~1177) y `Backend/src/routes/movimientosRoutes.js` (`GET /api/movimientos`, línea ~30). El frontend la usa en `getMovimientos` de `api.js`. |
| H-02 | Media | Abrir un período el último día del mes con día de corte 1 (p. ej. 30-nov con corte 1) da `fecha_fin = fecha_inicio`; viola RF-26.5 y el `CHECK (fecha_fin > fecha_inicio)`, por lo que `abrirPeriodo` responde 500. | `PresupuestosController.js` → `calcularFechaFin`. Prueba `it.failing` en `test/backend/rf26`. |
| H-03 | Baja | Cuando el backend rechaza con HTTP 4xx, algunas llamadas de `api.js` lanzan excepción y la pantalla muestra «Error al conectar con el servidor» en lugar del motivo (abonos de ahorro y deuda, crear fondo, crear perfil, abrir período). | `Frontend/src/services/api.js` y páginas correspondientes. Pruebas «OBSERVACIÓN». |
| H-04 | Baja | PDF web: queda una página en blanco si no se elige presupuesto; las secciones 2–5 sin datos no tienen leyenda «no disponible» (RF-24.5); «ingresos por fuente» se consulta pero no se imprime. | `Frontend/src/utils/generarreportepdf.js`. Pruebas «OBSERVACIÓN» en `test/frontend/rf24`. |
| H-05 | Baja | RF-07 declara el número de cuotas como obligatorio y mayor que cero, pero backend y web aceptan dejarlo vacío (pago único, se guarda `null`). | `movimientosController.js` y `Modalnuevomovimiento.jsx`. |
| H-06 | Informativa | Reglas que existen solo en una capa: monto mínimo 50 en gastos (solo web, RF-03.2 lo declara así), causa obligatoria en imprevistos (solo web), fecha no futura (solo web, no figura en los RF). | Ver documentos RF-03, RF-05 y RF-02. |

**Sobre H-01.** Para ejecutar y verificar las suites usé una copia del proyecto con `const getMovimientos = async (req, res) => res.status(200).json([]);` definida antes del `module.exports` (solo en mi copia de trabajo). **Ese cambio no está en el `.zip` entregado**, porque el comportamiento correcto de esa función (qué devuelve el listado general de movimientos) es una decisión tuya: restaura la función original o elimina el export y la ruta si ya no se usa. Una vez corregido, ejecuta `npx jest` en `Backend/`.

## Alcance y límites

- Se cubren **backend** y **frontend web**. La aplicación móvil no forma parte del proyecto entregado; los requisitos marcados «móvil» (RF-11.8, RF-24.4 hoja de compartir nativa, RF-24.7) no se pudieron probar y están señalados en cada documento.
- La base de datos, Firebase, `node-cron` y jsPDF están simulados; no hay pruebas contra PostgreSQL/Supabase ni de extremo a extremo.
- Las pruebas marcadas «OBSERVACIÓN» fijan el comportamiento actual de algo que difiere del requisito o del comportamiento esperable; si se corrige el código, esas pruebas deberán actualizarse.
