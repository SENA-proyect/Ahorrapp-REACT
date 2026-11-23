# Correspondencia de AhorrApp con los requerimientos

Fecha de revisión: 15 de octubre de 2026.

**Dictamen: el proyecto corresponde en gran parte al alcance funcional del PDF, pero no se puede considerar que cumpla íntegramente sus requerimientos. Hay funciones implementadas, restricciones que fallan, funciones declaradas parciales y estados del documento que ya no reflejan el código actual.**

## Alcance y criterio

- Documento contrastado: [auditoría de requerimientos](C:/Users/User/Downloads/auditoriaRF-ArchivoGeneral.pdf), 53 páginas, RF-01 a RF-33 y anexos.
- Código web y backend: `C:\Ahorrapp-REACT`, rama `David-M`, incluyendo los cambios locales existentes.
- Código móvil: `C:\ahorrapp-movile`, rama `David-M`, incluyendo los cambios locales existentes.
- Se revisó código y se ejecutaron las pruebas existentes y las baterías de auditoría disponibles. No se modificó el código de la aplicación para corregir hallazgos.
- La presencia de una pantalla o un controlador demuestra implementación, pero no demuestra por sí sola que todo el RF esté aceptado.
- El PDF ya ajusta varios RF a lo que existía en un archivo anterior del proyecto. Las funciones retiradas al Anexo A no se consideran automáticamente obligaciones vigentes. Su eventual inclusión requiere decidir el alcance del documento.
- RF-27 exige el dashboard web. La ausencia de un dashboard móvil no constituye por sí misma incumplimiento de ese alcance, aunque el resumen final del PDF lo señale como trabajo futuro.
- El PDF declara expresamente que el cierre de sesión es local y que el token vence por tiempo. No se considera la ausencia de revocación del token una diferencia con RF-16.

## Matriz de los 33 requerimientos

Los estados siguientes describen la evidencia disponible y sus límites; no son una certificación de aceptación completa.

| RF | Función | Resultado de la comparación |
|---|---|---|
| RF-01 | Registrar usuarios | Implementado en web, móvil y backend. La API admite un correo inválido y contraseña de un carácter al llamarla directamente. El PDF describe parte de la fortaleza de contraseña como validación del cliente; la debilidad del servidor se registra como hallazgo adicional. |
| RF-02 | Ingresos | Altas, consultas, edición y eliminación presentes. La edición admite categorías ajenas o inactivas; las entradas inválidas pueden producir errores internos. No se considera completamente verificado. |
| RF-03 | Gastos | Gestión presente. Al editar se pueden asignar categorías inactivas o ajenas y dependientes de otra cuenta. La pertenencia del movimiento se comprueba, pero no todas sus referencias. |
| RF-04 | Ahorros | Metas y abonos presentes. Las pruebas de abonos concurrentes respetan el máximo de la meta, pero un fallo de notificación posterior al guardado puede devolver error aunque el aporte ya esté confirmado. La edición comparte el problema de categorías. |
| RF-05 | Imprevistos | Gestión y alertas presentes. Crear un imprevisto permite asociar un dependiente ajeno; editar permite categorías y dependientes ajenos. |
| RF-06 | Fondo de emergencia | Creación, aportes y consultas implementados. El retiro falla con error SQL incluso teniendo saldo. Incumplimiento funcional comprobado. |
| RF-07 | Deudas | Gestión y pagos implementados. Se aceptan valores inválidos de cuotas como `0`, `abc`, `1.8` y `1abc`, convirtiéndolos en pagos. La edición comparte el problema de categorías. |
| RF-08 | Gestionar usuarios | Gestión de cuentas y roles presente. Cuatro consultas administrativas permiten acceso con un usuario normal; contradice la restricción de acceso administrativo. |
| RF-09 | Iniciar sesión | Login y JWT implementados. El middleware también admite tokens de recuperación en rutas de sesión y no comprueba que una cuenta desactivada siga habilitada. El acceso con permisos correctos no está garantizado. |
| RF-10 | Dependientes | Gestión presente. Hay asignaciones financieras que admiten dependientes ajenos. La batería detecta además error interno al omitir el peso económico; el contrato de campo obligatorio o valor predeterminado debe aclararse. |
| RF-11 | Reportes financieros | Rutas, filtros y generación web/móvil presentes; se ejercitaron consultas del backend. No se verificó integralmente el contenido y las cifras de un PDF generado desde datos reales en ambas interfaces. |
| RF-12 | Alertas de presupuesto | Cálculo por perfil y umbrales del 85 % presentes. La orientación mediante el asistente que menciona el PDF necesita actualizarse porque el chat ya no está en la interfaz web. Los errores de períodos afectan la base de estas alertas. |
| RF-13 | Notificaciones | Backend y pantalla web presentes. La aplicación móvil sigue sin pantalla de notificaciones; el propio PDF ya lo declara parcial y solo web. Falta aceptación de recordatorios y preferencias con servicios reales. |
| RF-14 | Recuperar contraseña | Solicitud de código, verificación y cambio presentes. El token de recuperación se puede reutilizar y permite entrar a rutas de datos financieros. El envío real de correo no fue probado en esta revisión. |
| RF-15 | Categorías | Gestión y protección de categorías globales y del sistema presentes; 50 pruebas específicas pasan. La protección no es uniforme al editar movimientos financieros, que aceptan categorías inactivas o ajenas. |
| RF-16 | Cerrar sesión | Implementado. Pasan 11 pruebas web de almacenamiento, pestañas, recarga, regreso y rutas, además de las pruebas móviles incluidas en la suite Flutter. Falta aceptación de esos flujos en navegador y teléfono reales. |
| RF-17 | Biometría | Código de configuración y confirmación de acciones sensibles presente. Se interpreta como segunda verificación sobre una sesión iniciada, tal como indica el PDF. Sin prueba con sensor físico en esta revisión. |
| RF-18 | OCR y QR | Escáneres, interpretación y formulario editable presentes; pruebas móviles aprobadas. El OCR actual solo propone monto cuando encuentra TOTAL. La cámara, recibos reales y formatos reales de comprobantes requieren validación física. |
| RF-19 | Modo sin conexión | El PDF dice pendiente y sin código; ese estado está desactualizado. Ahora existen base local, consultas por cuenta, cola, detección de conectividad, reintentos y deduplicación en backend. Pasan las pruebas móviles y 17 pruebas específicas del servidor. Sigue pendiente aceptación integral con modo avión, reinicio y reconexión en teléfono real. |
| RF-20 | Widget financiero | Implementados resumen y widgets Android; pruebas de cálculos aprobadas. La revisión específica detectó que el mediano muestra los cinco datos del PDF y el pequeño solo balance: el texto debe distinguir tamaños o completarse el pequeño. Falta aceptación en dispositivo real. |
| RF-21 | Registro rápido y voz | Accesos directos, escucha, precarga editable y confirmación presentes; pruebas móviles aprobadas. Falta probar el lanzador y el reconocimiento de voz real del dispositivo. |
| RF-22 | Consistencia web-móvil | Ambos clientes apuntan por defecto a la misma API. La arquitectura corresponde a la consulta compartida descrita; no equivale a prueba de consistencia completa entre dos sesiones reales. |
| RF-23 | PIN | Configuración de cuatro dígitos y confirmación de acciones sensibles presentes. Falta aceptación completa en dispositivo. No se exige bloqueo al abrir la app porque el PDF excluye expresamente ese comportamiento. |
| RF-24 | Exportación nativa de PDF | Construcción del reporte y mecanismo nativo de compartir presentes. Falta inspeccionar el PDF final y el menú de compartir en un teléfono real. |
| RF-25 | Calendario | Pantalla, consulta de movimientos y colores por tipo presentes. Falta contrastar visualmente fechas y totales con registros reales en dispositivo. |
| RF-26 | Presupuestos y períodos | Gestión presente. Las validaciones de porcentajes y día de corte pueden terminar en error interno. En esta ejecución, 20 solicitudes simultáneas abrieron 8 períodos, lo que compromete el uso de un período activo coherente. |
| RF-27 | Panel financiero | Dashboard web presente, conforme al alcance web del cuerpo del RF. Las rutas se ejercitaron con datos de prueba; no hay aceptación completa de cifras y presentación con backend desplegado. |
| RF-28 | Movimientos e historial | Listados e historial administrativo presentes. El historial propio sigue sin interfaz. Las marcas técnicas de sincronización se filtran del historial normal. El listado web convierte fallos HTTP o de red en una lista vacía. El PDF ya lo declara parcial. |
| RF-29 | Noticias e indicadores | Interfaz y rutas de noticias, bolsa y TRM presentes. Servicios externos y actualización efectiva de sus datos no fueron comprobados en esta revisión. |
| RF-30 | Mi cuenta | Perfil, contraseña y desactivación presentes. Desactivar la cuenta no corta el acceso con un JWT emitido antes. No se esperó el plazo de eliminación ni se comprobó el trabajo programado en producción. |
| RF-31 | Administración | Paneles presentes y alcance parcial similar al documento: la vista de movimientos usa los propios del administrador. Las consultas administrativas sin validación de rol son un problema adicional de acceso. |
| RF-32 | Google | Incompleto. El móvil llama a `/auth/google`, pero el backend actual no define esa ruta. Coincide con el estado parcial del PDF y no permite considerar terminado el flujo. |
| RF-33 | Asistente con IA | El documento dice implementado y en revisión. El componente y su integración web ya no están en el código actual. Quedan la ruta y controlador del backend, por lo que corresponde actualizar el alcance y completar la retirada si esa es la decisión del proyecto. |

## Evidencia ejecutada hoy

| Grupo | Total | Aprobadas | Fallidas | Alcance |
|---|---:|---:|---:|---|
| Categorías RF-15 | 50 | 50 | 0 | Controladores reales con base y efectos simulados. |
| Cierre de sesión web RF-16 | 11 | 11 | 0 | React y entorno DOM simulado; almacenamiento y protección de rutas. |
| Sincronización backend RF-19 | 17 | 17 | 0 | HTTP, JWT y PostgreSQL temporal reales; infraestructura y efectos auxiliares controlados. |
| Backend ampliado | 2.253 | 2.180 | 73 | Autorización, SQL, consultas, escrituras, entradas y concurrencia sobre PostgreSQL temporal. |
| Frontend ampliado | 112 | 105 | 7 | React en DOM simulado y respuestas de API simuladas. |
| Flutter | 104 | 104 | 0 | Pruebas automáticas de lógica y widgets de RF-16, RF-18, RF-19, RF-20 y RF-21; no dispositivos físicos. |
| **Total** | **2.547** | **2.467** | **80** | Incluye variantes que prueban la misma causa. |

La compilación de producción web terminó correctamente, con advertencias de tamaño y de importaciones. Compilar no demuestra cumplimiento funcional.

**Las 80 comprobaciones fallidas no equivalen a 80 errores independientes. El porcentaje de pruebas aprobadas tampoco es el porcentaje de RF cumplidos:** la batería incluye 2.048 identificadores inválidos y múltiples variantes de una misma función.

La batería ampliada utiliza tablas y restricciones del SQL del proyecto. Como la primera tabla contiene una coma faltante, la suite primero reproduce el error y luego corrige únicamente su copia temporal para probar las demás funciones. No corrige el archivo original.

Se aisló PostgreSQL en el equipo. No se modificaron datos de producción ni se enviaron correos reales. Los resultados no certifican el servidor desplegado, CORS, funcionamiento visual del navegador, biometría, cámara, voz, widgets del lanzador ni compartir archivos en un teléfono.

Archivos de evidencia:

- [Backend: resultados actuales](C:/Ahorrapp-REACT/.artifacts/auditoria-requisitos-2026-10-15-backend.json).
- [Frontend: resultados actuales](C:/Ahorrapp-REACT/.artifacts/auditoria-requisitos-2026-10-15-frontend.json).
- [Flutter: ejecución actual](C:/Ahorrapp-REACT/.artifacts/auditoria-requisitos-2026-10-15-flutter.log).
- Pruebas específicas: [RF-15](C:/Ahorrapp-REACT/Backend/tests/rf15.cjs), [RF-16 web](C:/Ahorrapp-REACT/Frontend/tests/rf16.test.js) y [RF-19 backend](C:/Ahorrapp-REACT/Backend/tests/rf19.cjs).

## Qué corregir primero

1. **Acceso administrativo y sesiones:** exigir roles en las cuatro consultas administrativas, separar tokens de recuperación y sesión y comprobar el estado de la cuenta. Evidencia: [rutas](C:/Ahorrapp-REACT/Backend/src/routes/authRoutes.js:32), [middleware](C:/Ahorrapp-REACT/Backend/src/middlewares/authMiddleware.js:4) y [recuperación](C:/Ahorrapp-REACT/Backend/src/controllers/authController.js:276).
2. **Operaciones financieras:** corregir el retiro del fondo, validar categorías y dependientes en todas las escrituras, rechazar cuotas inválidas y separar el resultado del abono de los fallos de notificaciones posteriores. Evidencia: [retiro](C:/Ahorrapp-REACT/Backend/src/controllers/fondoemergenciaController.js:306), [edición de gastos](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:571), [cuotas](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:859) y [abonos](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:1106).
3. **Presupuestos e instalación:** controlar aperturas simultáneas, validar números y corregir el SQL de instalación. Evidencia: [períodos](C:/Ahorrapp-REACT/Backend/src/controllers/PresupuestosController.js:358) y [SQL](C:/Ahorrapp-REACT/SQL/supabase.sql:13).
4. **Interfaz y alcance pendiente:** resolver el acceso directo a nuevo movimiento, mostrar errores del listado y completar Google o mantenerlo fuera de las funciones finalizadas. Evidencia: [ruta del formulario](C:/Ahorrapp-REACT/Frontend/src/App.jsx:218), [listado](C:/Ahorrapp-REACT/Frontend/src/services/api.js:84) y [Google móvil](C:/ahorrapp-movile/lib/services/auth_service.dart:285).
5. **Documento y aceptación:** actualizar RF-19 con su implementación y pruebas sin declararlo aceptado en dispositivo; actualizar RF-33 y su referencia desde RF-12; mantener visibles los estados parciales; resolver la referencia de RF-10 a un RF-36 fuera de la numeración normalizada. Verificar navegador, backend desplegado y dispositivo para cerrar los RF correspondientes.

## Dictamen final

La base del proyecto sí pertenece al sistema descrito y cubre gran parte de sus módulos. Sin embargo, entregar todos sus RF como finalizados no está respaldado por la evidencia actual. La entrega debe distinguir funciones implementadas, errores por corregir, alcance parcial declarado y pruebas de aceptación pendientes; el PDF también necesita actualizarse para representar la versión actual.
