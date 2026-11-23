# Verificación concreta — David / VERDE

Fecha: 15 de octubre de 2026. Requerimientos: RF-10, RF-15, RF-16, RF-18, RF-19, RF-20, RF-21 y RF-33.

## Alcance y criterio

Se comparó [el PDF de requerimientos](C:/Users/User/Downloads/auditoriaRF-ArchivoGeneral.pdf) con los archivos actuales de `C:\Ahorrapp-REACT` y `C:\ahorrapp-movile`, ambos en la rama `David-M`, incluyendo los cambios locales. “David / VERDE” identifica el grupo de trabajo solicitado; no se cambió a una rama llamada David ni se asignaron estados por el color.

Se ejecutó una nueva batería específica de HTTP/JWT y PostgreSQL temporal para dependientes, categorías e IA; también se repitieron las 104 pruebas Flutter para obtener resultados separados por RF. Se incorporan las pruebas específicas RF-15, RF-16 web y RF-19 backend que ya se ejecutaron hoy en esta misma revisión del proyecto, sin cambios posteriores del código de aplicación. No se modificó código funcional ni el PDF.

No hay dispositivos Android conectados: `adb devices -l` devolvió una lista vacía. No se ejecutó la prueba de integración Android ni se verificaron cámara, voz, widgets nativos o modo avión físico. La prueba Android existente usa una interrupción controlada del transporte y no debe presentarse como prueba de modo avión físico o cierre completo del proceso.

Los resultados de pruebas demuestran los casos ejercitados. No constituyen un porcentaje de cumplimiento de los RF.

## Resultado por requerimiento

| RF | Dictamen | Evidencia resumida |
|---|---|---|
| RF-10 | Parcial: hay errores reproducibles | 20 de 30 comprobaciones específicas aprobaron; 10 fallaron, incluidas 7 de manejo de errores de peso. |
| RF-15 | Parcial: falla una restricción de uso | 50 pruebas existentes aprobaron. En la ampliación HTTP/PostgreSQL, 41 de 46 aprobaron; fallan las cinco ediciones con categoría deshabilitada. |
| RF-16 | Cumple los casos automáticos del alcance documentado | 11 pruebas web y 13 móviles aprobadas; aceptación de navegador y dispositivo real pendiente. |
| RF-18 | Implementado y aprobado en pruebas automáticas; aceptación física pendiente | 12 pruebas de interpretación y 1 de formulario aprobadas. Sin validación de cámara ni QR reales de Nequi/Daviplata. |
| RF-19 | Implementado; PDF desactualizado y aceptación física pendiente | 16 pruebas de consulta local, 19 de cola/sincronización y 17 del backend aprobadas. |
| RF-20 | Parcial respecto a la descripción literal del PDF | 10 pruebas de lógica aprobadas. El mediano muestra cinco datos; el pequeño solo balance. Falta aceptación en el lanzador Android. |
| RF-21 | Implementado y aprobado en pruebas automáticas; aceptación nativa pendiente | 8 pruebas de accesos/formularios y 25 de voz/interpretación aprobadas. |
| RF-33 | Retirado de la interfaz web; no cumple como función vigente del PDF | Ya no existe el chat en web. El backend permanece y admite solicitudes sin sesión; se reprodujo con proveedor externo simulado. |

## RF-10 — Gestionar dependientes económicos

**Qué funciona:** se crea un dependiente con nombre, relación, ocupación, fecha y peso; se conservan los cinco campos; el titular puede consultar, editar y eliminar; otra cuenta no lo lista, modifica ni elimina por las rutas normales. La eliminación administrativa requiere rol, y un administrador puede eliminar un dependiente ajeno. Se comprobó el gasto asociado y su aparición en el reporte por dependiente, y que eliminar el dependiente conserva el gasto con referencia nula.

**Problemas comprobados:**

- Nombre `"   "` o relación `"   "` se guardan con respuesta 201. El backend no limpia ni comprueba texto significativo en esos campos obligatorios.
- Editar un gasto propio asignando el identificador de un dependiente de otra cuenta responde 200. Crear un gasto con ese dependiente sí es rechazado: la restricción no es uniforme.
- Pesos `0`, `-1`, `6`, `1.5`, `"abc"` y `null` producen 500 en lugar de un rechazo de validación controlado. Omitir el campo también produce 500. **No se persistieron pesos fuera de 1 a 5:** la restricción de la base funciona, pero la API deja que la entrada inválida llegue hasta ella.
- En móvil solo se comprueba que el peso, si se escribe, sea un entero; no se exige el rango 1–5. La relación vacía se envía como `null` y el peso se permite vacío. El campo sugiere “Ej: 50”, incompatible con el RF.

**Para cerrarlo:** validar nombre y relación con texto significativo, alinear el peso entre web/móvil/API, devolver errores de validación y verificar propiedad del dependiente al crear y editar asociaciones financieras.

Evidencia: [dependientes backend](C:/Ahorrapp-REACT/Backend/src/controllers/dependientesController.js:35), [edición de gastos](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:571), [formulario móvil](C:/ahorrapp-movile/lib/screens/dependientes/agregar_dependientes_screen.dart:148), [ejemplo incorrecto](C:/ahorrapp-movile/lib/screens/dependientes/agregar_dependientes_screen.dart:385).

## RF-15 — Gestionar categorías financieras

**Qué funciona:** crear, editar, deshabilitar, habilitar y eliminar categorías propias; rechazar duplicados normalizados; impedir editar, habilitar, deshabilitar o eliminar categorías globales, del sistema y ajenas; impedir eliminar una categoría activa. Se consultaron los cinco módulos. Crear movimientos con categorías deshabilitadas es rechazado.

Se comprobó con PostgreSQL que deshabilitar conserva los cinco registros financieros, y que eliminar después la categoría conserva ingresos, gastos, ahorros, imprevistos y deudas con `id_categoria = NULL`. La interfaz web y móvil también considera las banderas de sistema y global al mostrar acciones.

**Fallo comprobado:** al editar un ingreso, gasto, ahorro, imprevisto o deuda, la API acepta una categoría deshabilitada y responde 200. La batería ampliada de hoy también reproduce categorías ajenas aceptadas en esas cinco ediciones. Aprobar las 50 pruebas específicas anteriores no cubría esta restricción de edición.

**Para cerrarlo:** aplicar la validación de existencia, propiedad/visibilidad y actividad en los cinco métodos de edición, y volver a probar las cinco rutas.

Evidencia: [gestión de categorías](C:/Ahorrapp-REACT/Backend/src/controllers/categoriasController.js), [edición de ingresos](C:/Ahorrapp-REACT/Backend/src/controllers/movimientosController.js:385), [resultados específicos nuevos](C:/Ahorrapp-REACT/.artifacts/verificacion-david-verde-2026-10-15-resultados.json).

## RF-16 — Cerrar sesión

**Comprobado automáticamente:** web limpia token y perfiles en ambos almacenamientos, revalida al regresar, recargar, enfocar y cambiar de pestaña, y protege rutas sin sesión. Móvil limpia token, usuario, PIN y configuración biométrica; no recupera una sesión anterior y mantiene la limpieza local aunque Google falle o tarde. También se probaron lecturas en curso, cierres simultáneos y protección de navegación.

Resultado: **11/11 web y 13/13 móvil**.

El PDF especifica cierre en cliente y vencimiento temporal del JWT: no exige revocación del token en el servidor. Esa característica no se cuenta como incumplimiento de RF-16.

**Pendiente para aceptación real:** salir, volver atrás, recargar y reabrir en navegador; repetir salida y reapertura en Android con almacenamiento y Google reales.

Evidencia: [sesión web](C:/Ahorrapp-REACT/Frontend/src/services/session.js), [pruebas web](C:/Ahorrapp-REACT/Frontend/tests/rf16.test.js), [limpieza móvil](C:/ahorrapp-movile/lib/services/auth_service.dart:426), [pruebas móviles](C:/ahorrapp-movile/test/rf16_test.dart).

## RF-18 — OCR y QR

**Comprobado:** hay cámara/galería y escáner QR; la interpretación abre el formulario editable y no guarda sin confirmación. OCR solo propone un monto ligado a TOTAL; no usa subtotal, precios o referencias como sustitutos. Se verifican separadores monetarios, fechas imposibles, referencias, detección de categoría y rechazo de textos o enlaces no interpretables. El formulario permite corregir monto, descripción y fecha antes de enviar.

Resultado: **12/12 pruebas de interpretación y 1/1 de formulario**. Los ejemplos de QR de las pruebas son textos sintéticos; no demuestran compatibilidad integral con los comprobantes reales de los proveedores citados en el PDF.

**Pendiente:** permisos concedidos y denegados en Android, fotografías reales de recibos y QR reales reconocibles de Nequi/Daviplata, revisión de datos y persistencia con cuenta autenticada. Si el recibo no contiene TOTAL, debe quedar el ingreso manual del monto.

Evidencia: [regla OCR](C:/ahorrapp-movile/lib/services/ocr_parser_service.dart:4), [interpretación](C:/ahorrapp-movile/lib/services/receipt_parser_service.dart), [flujo OCR/QR](C:/ahorrapp-movile/lib/screens/gastos/modulo_gastos.dart:218), [pruebas](C:/ahorrapp-movile/test/rf18_test.dart), [formulario](C:/ahorrapp-movile/test/rf18_form_test.dart).

## RF-19 — Modo sin conexión

**Comprobado:** consulta local persistente por cuenta; diferenciación entre copia vacía y fallo; cola de ingresos, gastos y metas de ahorro; UUID y contenido conservados tras fallo o respuesta perdida; recuperación de operaciones en envío; reintentos; aislamiento entre cuentas; protección ante token vencido, respuestas tardías y errores de escritura; reportes que no suman operaciones locales pendientes.

Resultado: **16/16 consulta local, 19/19 sincronización móvil y 17/17 backend**. En backend las solicitudes, JWT, PostgreSQL y deduplicación son reales sobre una instancia temporal. Las dependencias de red y conectividad de las pruebas móviles están controladas.

El código actual sí incluye implementación y pruebas. La afirmación del PDF de que “no existe código” debe actualizarse; eso no convierte automáticamente su estado pendiente en aceptación final.

**Pendiente:** modo avión físico, crear los tres tipos de registro, cerrar por completo la app y reabrir, recuperar la conexión y comprobar una única escritura por operación tanto en móvil como en web. La integración Android disponible no sustituye por sí sola todos esos pasos.

Evidencia: [base local](C:/ahorrapp-movile/lib/core/storage/offline_database.dart), [sincronización](C:/ahorrapp-movile/lib/services/offline_sync_service.dart), [servicio backend](C:/Ahorrapp-REACT/Backend/src/service/OperacionesMovilesService.js), [pruebas backend](C:/Ahorrapp-REACT/Backend/tests/rf19.cjs), [integración Android](C:/ahorrapp-movile/integration_test/rf19_device_test.dart).

## RF-20 — Widget financiero

**Comprobado:** el resumen calcula el mes y año actuales, ingresos, gastos e imprevistos; excluye los registros pendientes de sincronización; calcula balance, porcentaje y centavos; evita mezclar respuestas; limpia cifras al salir o cambiar de usuario. Ambos tamaños leen la misma instantánea `financial_summary_v1`.

Resultado: **10/10 pruebas de lógica aprobadas**.

**Diferencia concreta con el PDF:** el widget mediano enlaza balance, ingresos, gastos, porcentaje y fecha; el pequeño solo enlaza y muestra el balance, además de botones para gasto e ingreso. El texto del RF atribuye los cinco datos a los widgets pequeño y mediano sin distinguirlos. Por lectura literal, el pequeño está incompleto; si el diseño previsto era un pequeño resumido, debe especificarse así en el RF.

**Pendiente:** resolver esa diferencia de alcance y comprobar ambos widgets en Android al agregar, editar y eliminar movimientos, abrir la app y cerrar sesión. Las pruebas de lógica no renderizan ni verifican el lanzador nativo.

Evidencia: [cálculo y actualización](C:/ahorrapp-movile/lib/services/financial_widget_summary.dart), [servicio](C:/ahorrapp-movile/lib/services/widget_service.dart), [widget pequeño](C:/ahorrapp-movile/android/app/src/main/res/layout/small_widget.xml:52), [proveedor pequeño](C:/ahorrapp-movile/android/app/src/main/kotlin/com/example/ahorrapp_movil/AhorrAppSmallWidgetProvider.kt), [proveedor mediano](C:/ahorrapp-movile/android/app/src/main/kotlin/com/example/ahorrapp_movil/AhorrAppMediumWidgetProvider.kt).

## RF-21 — Registro rápido y voz

**Comprobado:** registra los dos accesos con iconos; espera a que exista sesión; abre el formulario correcto; evita dobles aperturas y protege la ruta al salir. El dictado solicita permiso, usa un idioma español disponible, captura texto, cancela al salir o pasar a segundo plano y precarga un formulario editable. No guarda automáticamente y no inventa identificadores de categoría.

Resultado: **8/8 pruebas de accesos/formularios y 25/25 de voz/interpretación**. El proveedor de reconocimiento y los accesos nativos se simulan en esas pruebas.

**Pendiente:** mantener pulsado el icono real con la app abierta y cerrada, verificar ambos accesos, dictar un ingreso y un gasto, probar permiso denegado y guardar una sola vez tras corregir los datos.

Evidencia: [accesos](C:/ahorrapp-movile/lib/services/quick_actions_service.dart), [diálogo de voz](C:/ahorrapp-movile/lib/widgets/voice_entry_dialog.dart), [pruebas de accesos](C:/ahorrapp-movile/test/rf21_shortcuts_form_test.dart), [pruebas de voz](C:/ahorrapp-movile/test/rf21_voice_test.dart).

## RF-33 — Asistente financiero con IA

**Estado actual comprobado:** el componente web y su estilo están eliminados, y no quedan consumidores del chat en web ni en el código móvil examinado. El servidor conserva `/api/ai/chat`, el controlador y el límite de 800 tokens. Por ello no existe la experiencia de chat que el RF describe como funcionalidad web finalizada.

**Prueba adicional:** una solicitud sin token recibió respuesta 200 y alcanzó el controlador. Se sustituyó únicamente el proveedor externo por una respuesta simulada; no se consumieron créditos ni se enviaron datos a OpenRouter. La restricción de sesión no está aplicada en la ruta del backend.

**Para resolver el RF:** si la retirada se mantiene, documentarlo como retirado/fuera del alcance y eliminar su promesa en RF-12. Si continúa vigente, falta implementar la interfaz. Conservar el backend requiere aplicar autenticación conforme a su uso previsto. Esta verificación no restaura ni elimina código.

Evidencia: [App web](C:/Ahorrapp-REACT/Frontend/src/App.jsx), [ruta de IA](C:/Ahorrapp-REACT/Backend/src/routes/aiRoutes.js:7), [controlador](C:/Ahorrapp-REACT/Backend/src/controllers/aiController.js), [prueba sin proveedor externo](C:/Ahorrapp-REACT/.artifacts/verificacion-david-verde-2026-10-15.cjs).

## Evidencias reproducibles

- [Prueba específica RF-10 / RF-15 / RF-33](C:/Ahorrapp-REACT/.artifacts/verificacion-david-verde-2026-10-15.cjs): 78 comprobaciones, 62 aprobadas y 16 fallidas. Siete de las fallidas son de manejo controlado de entradas de peso inválidas; no indican persistencia de pesos fuera de rango.
- [Resultados HTTP y PostgreSQL](C:/Ahorrapp-REACT/.artifacts/verificacion-david-verde-2026-10-15-resultados.json).
- [Registro completo de Flutter](C:/Ahorrapp-REACT/.artifacts/verificacion-david-verde-2026-10-15-flutter.jsonl): 104 pruebas aprobadas.
- [Resumen Flutter por archivo](C:/Ahorrapp-REACT/.artifacts/verificacion-david-verde-2026-10-15-flutter-resumen.json).
- [Auditoría ampliada de hoy](C:/Ahorrapp-REACT/.artifacts/auditoria-requisitos-2026-10-15-backend.json): evidencia adicional de las cinco ediciones con categorías ajenas y asociaciones con dependientes ajenos.

La nueva batería usa HTTP y PostgreSQL reales en el equipo, con datos de prueba, efectos auxiliares controlados y proveedor de IA simulado. La coma faltante del SQL se corrige únicamente en la copia temporal del esquema. No usa cuentas ni datos de producción y no corrige el código de la aplicación.
