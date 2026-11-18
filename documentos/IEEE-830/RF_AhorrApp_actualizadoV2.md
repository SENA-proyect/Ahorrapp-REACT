# RF – AhorrApp (documentación alineada con el código)

**Base de la revisión:** `codigoAhorrApp.zip` (Backend Node/Express + PostgreSQL, Frontend web React, Frontend móvil Flutter, `supabase.sql`) contra `RF_AhorrApp.md`.

## Cómo leer este documento

Cada RF mantiene los campos de tu plantilla y agrega dos campos de trazabilidad:

- **Cumplimiento:** `Cumple` (el código hace lo documentado) · `Cumple con ajustes` (se corrigió el texto para reflejar el código) · `Nuevo` (existe en el código y no estaba documentado) · `Pendiente` (documentado pero sin código).
- **Evidencia en el código:** archivos donde se puede demostrar el RF.

**Criterio aplicado:** todo lo que dice un RF se puede demostrar con el código. Las restricciones o funciones documentadas que el código **no** cumple se retiraron del RF y quedaron listadas en el **Anexo A** (para decidir si se implementan o se descartan). Los hallazgos técnicos que no son RF están en el **Anexo B**.

**Numeración y referencias cruzadas:** la documentación original tenía referencias inconsistentes (por ejemplo, "Iniciar sesión" aparecía como RF-09 en la versión web y como RF-13 en la móvil; "Reportes" como RF-11, RF-13 y RF-16). Se normalizó todo a la numeración de los títulos:

| ID | Nombre | ID | Nombre |
|---|---|---|---|
| RF-01 | Registrar usuarios | RF-17 | Verificación biométrica para acciones sensibles |
| RF-02 | Gestionar ingresos | RF-18 | Registrar gastos mediante OCR y QR |
| RF-03 | Gestionar gastos | RF-19 | Modo sin conexión (**Pendiente**) |
| RF-04 | Gestionar ahorros | RF-20 | Widget de resumen financiero |
| RF-05 | Gestionar imprevistos | RF-21 | Registro rápido de gastos e ingresos |
| RF-06 | Gestionar fondo de emergencia | RF-22 | Consistencia de datos web-móvil |
| RF-07 | Gestionar deudas | RF-23 | Verificación con PIN para acciones sensibles |
| RF-08 | Gestionar usuarios | RF-24 | Exportación nativa de reportes (PDF) |
| RF-09 | Iniciar sesión | RF-25 | Calendario de actividad financiera |
| RF-10 | Gestionar dependientes económicos | RF-26 | Gestionar presupuestos y períodos (**Nuevo**) |
| RF-11 | Generar reportes financieros | RF-27 | Panel de control financiero – solo web (**Nuevo**) |
| RF-12 | Alertas y sugerencias de presupuesto | RF-28 | Mis movimientos e historial de actividad (**Nuevo, parcial**) |
| RF-13 | Notificaciones, recordatorios y alertas | RF-29 | Noticias e indicadores de mercado (**Nuevo**) |
| RF-14 | Recuperar contraseña | RF-30 | Gestionar mi cuenta (**Nuevo**) |
| RF-15 | Gestionar categorías financieras | RF-31 | Panel de administración (**Nuevo, parcial**) |
| RF-16 | Cerrar sesión | RF-32 | Inicio de sesión con Google – móvil (**Nuevo, parcial**) |
| | | RF-33 | Asistente financiero con IA (**Nuevo, en revisión**) |


**Versionado:** los RF que cambiaron suben una versión mayor respecto a la original (por ejemplo 4.0 → 5.0). Los que no cambiaron conservan su versión. 

---

# RF – VERSIÓN WEB (y backend compartido)

## 1. RF-01: Registrar usuarios

**Identificador del requerimiento:** RF-01

**Nombre del requerimiento:** Registrar usuarios

**Descripción:** El sistema deberá permitir el registro de nuevos usuarios con nombre, apellido, correo electrónico y contraseña, creando una cuenta única con el rol `user` por defecto, asociada a la información financiera del usuario.

**Precondiciones:** El correo no debe estar registrado previamente.

**Postcondiciones:** El usuario queda registrado con rol `user` y puede iniciar sesión.

**Restricciones:**

- El correo no puede estar duplicado (validado en el backend).
- La contraseña se almacena cifrada (bcrypt).
- En la web la contraseña debe tener entre 8 y 64 caracteres e incluir minúscula, mayúscula, número y símbolo; en la móvil, mínimo 8 caracteres, con indicador de fortaleza.
- El nombre y el apellido se validan en el cliente web (solo letras, 2–50 caracteres).

**Dependencias y relaciones:**

- Se relaciona con RF-09 (Iniciar sesión).
- Se relaciona con RF-08 (Gestionar usuarios).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 5.0

**Justificación:** Permite la creación de cuentas individuales necesarias para la gestión personalizada de la información.

**RFN relacionados:** RNF 01, RNF 02, RNF 03, RNF 07, RNF 09, RNF 11

**Cumplimiento:** Cumple con ajustes

**Evidencia en el código:** `Backend/src/controllers/authController.js` (`register`), `Frontend(web)/src/pages/Login.jsx`, `Frontend(movile)/lib/screens/auth/register_screen.dart`, `SQL/supabase.sql` (`usuarios`, `usuarios_roles`).

---

## 2. RF-02: Gestionar ingresos

**Identificador del requerimiento:** RF-02

**Nombre del requerimiento:** Gestionar ingresos

**Descripción:** El sistema deberá permitir a los usuarios registrar, consultar, editar, eliminar y clasificar ingresos (salarios, comisiones, bonificaciones y otras fuentes) indicando monto, fuente, descripción, fecha y categoría, manteniendo un listado organizado disponible para análisis financiero.

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- La cuenta debe estar activa.

**Postcondiciones:**

- Los ingresos registrados o modificados quedan almacenados en la base de datos.
- Los reportes, el panel de control y el período presupuestal reflejan la información más reciente.

**Restricciones:**

- El monto debe ser mayor que cero (restricción `CHECK (monto > 0)` en base de datos; el backend además rechaza montos vacíos).
- Cada usuario solo accede a sus propios ingresos.
- La fecha de registro es opcional; si no se envía, se usa la fecha actual.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-11 (Reportes), RF-15 (Categorías), RF-26 (Presupuestos y períodos).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 4.0

**Justificación:** Permite administrar de forma integral las fuentes de ingreso del usuario y proporciona información confiable para reportes y estadísticas.

**RFN relacionados:** RNF 01, RNF 02, RNF-05, RNF-06, RNF 07

**Cumplimiento:** Cumple con ajustes (no existe distinción "fijo/variable"; ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/movimientosController.js` (`crearMovimiento`, `getIngresos`, `updateIngresos`, `deleteIngresos`), `Backend/src/routes/movimientosRoutes.js`, `Frontend(web)/src/pages/ModulosIngresos.jsx`, `Frontend(web)/src/components/Modalnuevomovimiento.jsx`, `Frontend(movile)/lib/screens/ingresos/`, `Frontend(movile)/lib/services/ingresos_service.dart`.

---

## 3. RF-03: Gestionar gastos

**Identificador del requerimiento:** RF-03

**Nombre del requerimiento:** Gestionar gastos

**Descripción:** El sistema deberá permitir a los usuarios registrar, consultar, editar, eliminar y clasificar gastos por categoría, fecha y monto, y opcionalmente asociarlos a un dependiente económico, manteniendo un listado organizado para el control y análisis de la información financiera personal.

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- La cuenta debe estar activa.

**Postcondiciones:**

- Los gastos registrados o modificados quedan almacenados en la base de datos.
- Los reportes, el panel de control, las alertas de presupuesto y el calendario reflejan la información más reciente.

**Restricciones:**

- El monto debe ser mayor que cero (`CHECK (monto > 0)` en base de datos). El formulario web exige además un monto mínimo de 50.
- La categoría seleccionada debe existir (clave foránea a `categorias`).
- Cada usuario solo accede a sus propios gastos.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-11 (Reportes), RF-12 (Alertas de presupuesto), RF-15 (Categorías), RF-10 (Dependientes), RF-18 (OCR/QR), RF-21 (Registro rápido).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 5.0

**Justificación:** Permite administrar los gastos del usuario, facilitando el control de egresos, el análisis de hábitos financieros y la generación de reportes confiables.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (la categoría no es obligatoria en backend; ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/movimientosController.js` (`getGastos`, `updateGastos`, `deleteGastos`), `Frontend(web)/src/pages/ModulosGastos.jsx`, `Frontend(movile)/lib/screens/gastos/`, `Frontend(movile)/lib/services/gastos_service.dart`.

---

## 4. RF-04: Gestionar ahorros

**Identificador del requerimiento:** RF-04

**Nombre del requerimiento:** Gestionar ahorros

**Descripción:** El sistema deberá permitir al usuario crear, consultar, modificar y eliminar metas de ahorro (con monto objetivo y fecha meta opcional) y registrar abonos asociados a cada meta, recalculando automáticamente el monto acumulado para dar seguimiento a su progreso.

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- La cuenta debe estar activa.

**Postcondiciones:**

- La meta queda registrada o actualizada.
- Cada abono queda almacenado en el historial de abonos de la meta.
- El monto acumulado se recalcula automáticamente.
- Al completar el monto objetivo se genera una notificación de meta alcanzada (RF-13).

**Restricciones:**

- El monto objetivo debe ser mayor que cero.
- Los abonos deben ser mayores que cero.
- Un abono no puede superar el monto restante de la meta; no se admiten abonos en metas ya alcanzadas.
- La fecha meta no puede ser anterior a la fecha de registro.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-05 (Imprevistos, por la sugerencia de redirigir excedentes a ahorros), RF-06 (Fondo de emergencia), RF-11 (Reportes), RF-13 (Notificaciones).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 5.0

**Justificación:** Permite planificar objetivos financieros mediante metas personalizadas y monitorear el progreso de los aportes.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/movimientosController.js` (`abonarAhorro`, `updateAhorros`, `deleteAhorros`), tablas `ahorros` y `abonos_ahorro` en `SQL/supabase.sql`, `Frontend(web)/src/pages/ModuloAhorros.jsx`, `Frontend(movile)/lib/screens/ahorros/`.

---

## 5. RF-05: Gestionar imprevistos

**Identificador del requerimiento:** RF-05

**Nombre del requerimiento:** Gestionar imprevistos *(antes: "Gestionar fondo de imprevistos")*

**Descripción:** El sistema deberá permitir al usuario registrar, consultar, modificar y eliminar gastos imprevistos (no planificados), clasificados por categoría. Cada imprevisto se contabiliza contra la porción de imprevistos del presupuesto del período activo. El sistema avisará cuando el consumo de esa porción se acerque al límite y, al cerrar un período con la porción casi sin usar, sugerirá redirigir ese dinero a ahorros.

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- La cuenta debe estar activa.

**Postcondiciones:**

- El imprevisto queda almacenado y se refleja en el consumo del período presupuestal.
- Se genera una notificación al alcanzar el umbral de consumo de imprevistos (85 %).
- Al cerrar el período con la porción de imprevistos casi sin usar, se genera una notificación de sugerencia (la transferencia a ahorros la realiza el usuario manualmente).

**Restricciones:**

- El monto debe ser mayor que cero.
- Cada usuario solo accede a sus propios imprevistos.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-26 (Presupuestos y períodos), RF-13 (Notificaciones), RF-04 (Ahorros), RF-11 (Reportes).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 4.0

**Justificación:** Permite registrar los gastos inesperados y controlar su impacto sobre el presupuesto del período.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (el código **no** implementa un fondo con saldo, retiros ni transferencia automática; ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/movimientosController.js` (`getImprevistos`, `updateImprevistos`, `deleteImprevistos`), `Backend/src/service/NotificacionesService.js` (`verificarUmbralImprevistos`, `verificarImprevistosNoUsados`), `Backend/src/controllers/PresupuestosController.js` (`cerrarPeriodo`), `Frontend(web)/src/pages/ModuloImprevistos.jsx`, `Frontend(movile)/lib/screens/imprevistos/`.

---

## 6. RF-06: Gestionar fondo de emergencia

**Identificador del requerimiento:** RF-06

**Nombre del requerimiento:** Gestionar fondo de emergencia

**Descripción:** El sistema deberá permitir al usuario crear un fondo de emergencia único, definir y actualizar su meta, registrar aportes y retiros, y consultar su saldo, progreso e historial de movimientos. El fondo es independiente de los ahorros y de los imprevistos.

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- La cuenta debe estar activa.

**Postcondiciones:**

- El fondo queda registrado o actualizado.
- Los aportes y retiros quedan almacenados en el historial del fondo.
- El saldo se calcula automáticamente a partir de los movimientos.

**Restricciones:**

- Cada usuario puede tener un solo fondo de emergencia.
- La meta debe ser mayor o igual a cero.
- Los aportes y los retiros deben ser mayores que cero.
- Los retiros no pueden exceder el saldo disponible.
- El fondo se almacena en tablas propias, separadas de ahorros e imprevistos.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-04 (Ahorros), RF-11 (Reportes), RF-26 (Presupuestos y períodos).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Permite construir una reserva financiera para afrontar situaciones de emergencia.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (la meta puede ser 0)

**Evidencia en el código:** `Backend/src/controllers/fondoemergenciaController.js`, `Backend/src/routes/fondoemergenciaRoutes.js`, tablas `fondos_emergencia` y `movimientos_fondo_emergencia`, `Frontend(web)/src/pages/Modulofondoemergencia.jsx`, `Frontend(movile)/lib/screens/emergencia/emergencia.dart`.

---

## 7. RF-07: Gestionar deudas

**Identificador del requerimiento:** RF-07

**Nombre del requerimiento:** Gestionar deudas

**Descripción:** El sistema deberá permitir al usuario registrar, consultar, modificar y eliminar deudas con una persona o entidad (fuente), definiendo monto total, número de cuotas, fechas y categoría, y registrar el pago de cuotas. Cada pago calcula su valor proporcional (monto ÷ cuotas totales × cuotas pagadas) y la deuda pasa a estado "pagada" al completar sus cuotas.

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- La cuenta debe estar activa.

**Postcondiciones:**

- La deuda queda registrada o actualizada.
- Los pagos quedan almacenados en el historial de abonos de la deuda.
- Las cuotas pagadas y el estado de la deuda se actualizan automáticamente.
- Las deudas con fecha de vencimiento próxima generan una notificación (RF-13).

**Restricciones:**

- La fuente de la deuda es obligatoria.
- El monto debe ser mayor que cero.
- El número de cuotas debe ser mayor que cero y las cuotas pagadas no pueden exceder el total.
- El pago debe ser de al menos una cuota; no se admiten pagos en deudas ya pagadas.
- La fecha de fin no puede ser anterior a la fecha de inicio.
- En la web, la eliminación requiere confirmación explícita del usuario.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-11 (Reportes), RF-13 (Notificaciones), RF-26 (Presupuestos y períodos).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 5.0

**Justificación:** Permite administrar las obligaciones financieras, hacer seguimiento a los pagos y conocer el avance de cada deuda.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (la deuda no maneja tasa de interés ni saldo en dinero; ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/movimientosController.js` (`abonarDeuda`, `updateDeudas`, `deleteDeudas`), tablas `deudas` y `abonos_deuda`, `Backend/src/service/jobs/VencimientosJob.js`, `Frontend(web)/src/pages/ModuloDeudas.jsx`, `Frontend(movile)/lib/screens/deudas/`.

---

## 8. RF-08: Gestionar usuarios

**Identificador del requerimiento:** RF-08

**Nombre del requerimiento:** Gestionar usuarios

**Descripción:** El sistema deberá permitir a los usuarios con rol `admin` o `superuser` consultar, modificar (nombre, apellido y correo) y eliminar cuentas de usuario. La eliminación es una baja lógica (la cuenta queda inactiva). Solo el rol `superuser` puede asignar y modificar roles.

**Precondiciones:**

- El administrador debe haber iniciado sesión.
- Debe tener rol `admin` o `superuser`.

**Postcondiciones:**

- Los cambios quedan guardados y las acciones de gestión se registran en el historial del sistema.
- Una cuenta dada de baja deja de poder iniciar sesión.

**Restricciones:**

- Los usuarios solo gestionan su propia información financiera.
- Los administradores gestionan cuentas pero no pueden modificar roles.
- Solo `superuser` puede asignar o modificar roles.
- En la web, la eliminación de una cuenta requiere confirmación explícita.

**Dependencias y relaciones:**

- Depende de: RF-01 (Registrar usuarios), RF-09 (Iniciar sesión).
- Se relaciona con: RF-28 (Historial de actividad), RF-31 (Panel de administración).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 6.0

**Justificación:** Permite administrar las cuentas registradas, garantizando el control de acceso y la correcta asignación de privilegios.

**RFN relacionados:** RNF-02, RNF-03, RNF-05, RNF-07

**Cumplimiento:** Cumple con ajustes (no existen acciones separadas de activar/desactivar; ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/authController.js` (`getUsuarios`, `updateUsuario`, `deleteUsuario`, `actualizarRolUsuario`), `Backend/src/routes/authRoutes.js`, `Backend/src/middlewares/authMiddleware.js` (`requireRole`), `Frontend(web)/src/pages/PanelUsuarios.jsx`, `Frontend(movile)/lib/screens/admin/panel_usuarios_screen.dart`.

---

## 9. RF-09: Iniciar sesión

**Identificador del requerimiento:** RF-09

**Nombre del requerimiento:** Iniciar sesión

**Descripción:** El sistema deberá permitir a los usuarios autenticarse con correo y contraseña para acceder a las funcionalidades correspondientes a su rol. Al autenticarse se emite un token de sesión (JWT) con vigencia de 8 horas que incluye los roles del usuario.

**Precondiciones:**

- El usuario debe estar registrado.
- La cuenta debe estar activa.

**Postcondiciones:**

- El usuario accede con los permisos asociados a su rol.
- Se inicia una sesión con token firmado; el cliente lo almacena (localStorage en web; almacenamiento seguro en móvil).

**Restricciones:**

- El correo y la contraseña deben coincidir con un registro válido.
- Las cuentas desactivadas no pueden iniciar sesión.
- El mensaje de error no revela si falló el correo o la contraseña.
- Las rutas protegidas exigen token válido; el token vence a las 8 horas.

**Dependencias y relaciones:**

- Depende de: RF-01 (Registrar usuarios).
- Se relaciona con: RF-08 (Gestionar usuarios), RF-14 (Recuperar contraseña), RF-16 (Cerrar sesión), RF-32 (Google, móvil).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 5.0

**Justificación:** Garantiza el acceso controlado a la información financiera y administrativa del sistema.

**RFN relacionados:** RNF-01, RNF-02, RNF-03, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (no hay bloqueo temporal tras intentos fallidos; ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/authController.js` (`login`), `Backend/src/middlewares/authMiddleware.js` (`verifyToken`), `Frontend(web)/src/pages/Login.jsx`, `Frontend(web)/src/context/AuthContext.jsx`, `Frontend(web)/src/components/ProtectedRoute.jsx`, `Frontend(movile)/lib/screens/auth/login_screen.dart`, `Frontend(movile)/lib/screens/auth/auth_gate.dart`.

---

## 10. RF-10: Gestionar dependientes económicos

**Identificador del requerimiento:** RF-10

**Nombre del requerimiento:** Gestionar dependientes económicos

**Descripción:** El sistema deberá permitir al usuario registrar, consultar, modificar y eliminar las personas que dependen económicamente de él, indicando nombre, relación, ocupación, fecha de nacimiento y un peso económico de 1 a 5. Los dependientes pueden asociarse a gastos y aparecen en los reportes de gasto por dependiente.

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- La cuenta debe estar activa.

**Postcondiciones:**

- La información del dependiente queda almacenada o actualizada.
- Los reportes pueden agrupar gastos por dependiente.

**Restricciones:**

- Solo el titular de la cuenta gestiona sus dependientes (un administrador puede eliminar dependientes de cualquier usuario desde el panel, ver RF-31).
- El nombre y la relación son obligatorios.
- El peso económico debe estar entre 1 y 5.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-03 (Gastos), RF-11 (Reportes), RF-36 (Panel de administración).

**Prioridad:** Media

**Estado:** Finalizado

**Versión:** 4.0

**Justificación:** Permite personalizar el análisis financiero considerando las responsabilidades económicas del usuario.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (no se valida duplicidad; ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/dependientesController.js`, `Backend/src/routes/dependientesRoutes.js`, tabla `dependientes`, `Frontend(web)/src/pages/ModulosDependientes.jsx`, `Frontend(movile)/lib/screens/dependientes/`.

---

## 11. RF-11: Generar reportes financieros

**Identificador del requerimiento:** RF-11

**Nombre del requerimiento:** Generar reportes financieros

**Descripción:** El sistema deberá generar un informe consolidado, filtrable por rango de fechas y por período de presupuesto, que incluye: resumen, gastos por categoría y por dependiente, ingresos por categoría y por fuente, ahorros y su estado, deudas y su estado, imprevistos por categoría, fondo de emergencia y su estado, evolución temporal y ejecución del presupuesto. En la versión web el informe se descarga como PDF con tablas y gráficas; en la móvil la pantalla indica qué información se incluirá y el detalle se entrega en el PDF (ver RF-24).

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- Debe existir información registrada en al menos uno de los módulos financieros.

**Postcondiciones:**

- Se genera el informe con la información disponible; las secciones sin datos se omiten o se indican como "sin datos".

**Restricciones:**

- Los reportes reflejan únicamente la información registrada por el usuario.
- Los reportes de rango exigen fecha de inicio y fecha de fin.
- La generación del informe no modifica los datos originales.
- Si una consulta parcial falla, el resto del informe se genera igualmente.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-10, RF-26, RF-24 (PDF móvil), RF-27 (Panel de control).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 4.0

**Justificación:** Facilita la comprensión de la situación financiera mediante reportes e indicadores que permiten analizar tendencias y resultados.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (las visualizaciones del panel se documentan en RF-27)

**Evidencia en el código:** `Backend/src/controllers/ReportesController.js` (14 endpoints), `Backend/src/routes/ReportesRoutes.js`, `Frontend(web)/src/pages/reportes.jsx`, `Frontend(web)/src/utils/generarreportepdf.js`, `Frontend(movile)/lib/screens/reportes/reportes_screen.dart`, `Frontend(movile)/lib/services/reportes_service.dart`.

---

## 12. RF-12: Alertas y sugerencias de presupuesto

**Identificador del requerimiento:** RF-12

**Nombre del requerimiento:** Alertas y sugerencias de presupuesto *(antes: "Generar recomendaciones de presupuesto")*

**Descripción:** El sistema deberá apoyar la planificación presupuestal con base en el perfil de presupuesto definido por el usuario (porcentajes por módulo que suman 100 %): calculará los montos asignados a cada módulo según el ingreso del período, alertará cuando el consumo de gastos o de imprevistos alcance el 85 % de su asignación y, al cerrar un período, sugerirá redirigir a ahorros los imprevistos no utilizados. El usuario también puede consultar orientación puntual con el asistente de IA (RF-33).

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- Debe tener un perfil de presupuesto activo y un período abierto.

**Postcondiciones:**

- Se calculan los montos por módulo a partir de los porcentajes del perfil.
- Se generan notificaciones de alerta o sugerencia cuando se cumplen las condiciones.

**Restricciones:**

- Las alertas y sugerencias se basan únicamente en la información registrada en el sistema.
- El sistema no reemplaza el asesoramiento financiero profesional.
- El usuario puede ignorar o descartar las notificaciones generadas.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-26 (Presupuestos y períodos), RF-13 (Notificaciones), RF-03, RF-05, RF-04, RF-33.

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 4.0

**Justificación:** Orienta al usuario para que cumpla el presupuesto definido y evite sobregiros.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (el código no calcula una distribución sugerida automática; ver Anexo A)

**Evidencia en el código:** `Backend/src/service/NotificacionesService.js` (`UMBRAL_GASTOS`, `UMBRAL_IMPREVISTOS`, `verificarImprevistosNoUsados`), `Backend/src/controllers/PresupuestosController.js`, `Frontend(web)/src/components/Preferenciasnotificaciones.jsx`.

---

## 13. RF-13: Gestionar notificaciones, recordatorios y alertas

**Identificador del requerimiento:** RF-13

**Nombre del requerimiento:** Gestionar notificaciones, recordatorios y alertas

**Descripción:** El sistema deberá generar y mostrar notificaciones de cuatro tipos (sistema, recordatorio, sugerencia y alerta de presupuesto) a partir de eventos de la actividad financiera: umbral de gastos, umbral de imprevistos, imprevistos no usados al cerrar período, meta de ahorro alcanzada (al registrar el abono que completa la meta) y deudas próximas a vencer (revisión diaria a las 06:00, con 5 días de anticipación). El usuario puede listar sus notificaciones, ver el contador de no leídas, marcarlas como leídas (una o todas), archivarlas, eliminarlas y configurar qué tipos desea recibir.

**Precondiciones:**

- El usuario debe haber iniciado sesión.
- Debe existir información financiera que genere eventos notificables.

**Postcondiciones:**

- La notificación se genera y queda en el historial de notificaciones del usuario.
- Los eventos recurrentes no se duplican (se verifica antes de crear la notificación).

**Restricciones:**

- Las notificaciones se basan exclusivamente en información registrada por el usuario.
- El usuario puede activar o desactivar cada tipo de notificación; si no hay preferencia guardada, el tipo está activo.
- El sistema no envía información financiera a terceros.
- Las alertas se generan solo cuando se cumplen las condiciones definidas.
- La interfaz de notificaciones existe solo en la web; la aplicación móvil aún no tiene pantalla de notificaciones.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-04, RF-05, RF-07, RF-12, RF-26.

**Prioridad:** Media

**Estado:** En desarrollo (solo web)

**Versión:** 2.0

**Justificación:** Facilita el seguimiento de la situación financiera mediante avisos oportunos.

**RFN relacionados:** RNF-01, RNF-02, RNF-03, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Cumple con ajustes (interfaz solo en web; ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/Notificacionescontroller.js`, `Backend/src/routes/NotificacionesRoutes.js`, `Backend/src/service/NotificacionesService.js`, `Backend/src/service/jobs/VencimientosJob.js`, `Frontend(web)/src/context/NotificacionesContext.jsx`, `Frontend(web)/src/components/Historialnotificaciones.jsx`, `Frontend(web)/src/pages/Configuracion.jsx`.

---

## 14. RF-14: Recuperar contraseña

**Identificador del requerimiento:** RF-14

**Nombre del requerimiento:** Recuperar contraseña

**Descripción:** El sistema deberá permitir al usuario recuperar el acceso a su cuenta en tres pasos: (1) solicitar el código con su correo, (2) verificar el código recibido por correo y (3) definir una nueva contraseña con el token temporal obtenido.

**Precondiciones:**

- El usuario debe tener una cuenta activa con un correo válido.

**Postcondiciones:**

- Se envía un código de verificación al correo de la cuenta.
- Tras verificarlo, se emite un token temporal que permite definir la nueva contraseña.
- La contraseña queda actualizada y el código se invalida.

**Restricciones:**

- El código se envía solo al correo asociado a la cuenta y se almacena cifrado.
- El código vence a los 15 minutos y el token de restablecimiento a los 10 minutos.
- El sistema nunca muestra la contraseña actual.
- La nueva contraseña debe tener al menos 8 caracteres.

**Dependencias y relaciones:**

- Depende de: RF-01 (Registrar usuarios).
- Se relaciona con: RF-09 (Iniciar sesión).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Permite mantener la continuidad del acceso de forma segura cuando el usuario olvida sus credenciales.

**RFN relacionados:** RNF-02, RNF-03, RNF-06

**Cumplimiento:** Cumple con ajustes (el mecanismo es un código, no un enlace)

**Evidencia en el código:** `Backend/src/controllers/authController.js` (`forgotPassword`, `verifyResetCode`, `resetPassword`), `Backend/src/service/MailService.js`, `Frontend(web)/src/pages/OlvidarContrasena.jsx`, `VerificacionCorreo.jsx`, `IngresoNuevaContrasena.jsx`, `ConfirmacionCambioContrasena.jsx`, `Frontend(movile)/lib/screens/auth/forgot_password_screen.dart`, `reset_password_screen.dart`.

---

## 15. RF-15: Gestionar categorías financieras

**Identificador del requerimiento:** RF-15

**Nombre del requerimiento:** Gestionar categorías financieras

**Descripción:** El sistema deberá permitir clasificar los registros financieros con categorías predeterminadas (del sistema, globales) o personalizadas, y permitir al usuario crear, editar, deshabilitar, habilitar y eliminar sus categorías personalizadas. Las categorías pueden consultarse por módulo (gastos, ingresos, ahorros, imprevistos y deudas).

**Precondiciones:**

- El usuario debe haber iniciado sesión.

**Postcondiciones:**

- Las categorías creadas o modificadas quedan disponibles para clasificar registros.
- Una categoría deshabilitada deja de ofrecerse pero conserva sus registros asociados.

**Restricciones:**

- El nombre de la categoría es obligatorio.
- Las categorías globales o del sistema no pueden editarse, deshabilitarse ni eliminarse; cada usuario solo modifica las suyas.
- Solo pueden eliminarse categorías previamente deshabilitadas; en la web se pide confirmación.
- Al eliminar una categoría, los registros que la usaban quedan sin categoría.

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-02, RF-03, RF-04, RF-05, RF-07, RF-11.

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 5.0

**Justificación:** Permite organizar la información financiera con categorías adaptadas a las necesidades de cada usuario.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-07

**Cumplimiento:** Cumple con ajustes (ver Anexo A)

**Evidencia en el código:** `Backend/src/controllers/categoriasController.js`, `Backend/src/routes/categoriasRoutes.js`, tabla `categorias`, `Frontend(web)/src/pages/ModulosCategorias.jsx`, `Frontend(movile)/lib/screens/categorias/`.

---

## 16. RF-16: Cerrar sesión

**Identificador del requerimiento:** RF-16

**Nombre del requerimiento:** Cerrar sesión

**Descripción:** El sistema deberá permitir al usuario cerrar su sesión. En la web se elimina del navegador el token y los datos del usuario; en la móvil se eliminan de la memoria y del almacenamiento seguro el token, los datos del usuario, el PIN local y la sesión de Google, y se vuelve a la pantalla de inicio de sesión.

**Precondiciones:**

- El usuario debe haber iniciado sesión.

**Postcondiciones:**

- Las credenciales de sesión se eliminan del dispositivo.
- El usuario es redirigido al inicio o a la pantalla de inicio de sesión.
- El acceso a funciones protegidas requiere un nuevo inicio de sesión.

**Restricciones:**

- El cierre de sesión se realiza en el cliente: el servidor no mantiene lista de tokens revocados, por lo que el token vence por tiempo (8 horas).

**Dependencias y relaciones:**

- Depende de: RF-09 (Iniciar sesión).
- Se relaciona con: RF-28 (Historial de actividad), RF-14 (Recuperar contraseña).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Protege la privacidad del usuario al finalizar el acceso, especialmente en dispositivos compartidos.

**RFN relacionados:** RNF-02, RNF-03, RNF-07

**Cumplimiento:** Cumple con ajustes (ver Anexo A)

**Evidencia en el código:** `Frontend(web)/src/context/AuthContext.jsx` (`logout`), `Frontend(movile)/lib/services/auth_service.dart` (`logout`).

---

# RF – VERSIÓN MÓVIL

## RF-17: Verificación biométrica para acciones sensibles

**Identificador del requerimiento:** RF-17

**Nombre del requerimiento:** Verificación biométrica para acciones sensibles *(antes: "Autenticación biométrica")*

**Descripción:** El sistema permitirá al usuario, desde la pantalla de Inicio, activar o desactivar la biometría del dispositivo (huella o reconocimiento facial). Una vez activada, la biometría se ofrece como alternativa al PIN para confirmar acciones sensibles (cambiar contraseña, editar datos personales) sobre una sesión ya iniciada.

**Precondiciones:** El usuario debe tener una sesión iniciada y un método biométrico configurado en el dispositivo.

**Postcondiciones:** La acción sensible se ejecuta solo si la verificación biométrica (o el PIN) es exitosa.

**Restricciones:** Solo disponible en dispositivos con hardware biométrico compatible. No reemplaza el inicio de sesión con correo y contraseña.

**Dependencias y relaciones:** Depende de RF-01 (Registrar usuarios) y RF-09 (Iniciar sesión). Se relaciona con RF-23 (PIN) y RF-30 (Gestionar mi cuenta).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Agiliza la confirmación de acciones sensibles aprovechando los sensores del dispositivo.

**RFN relacionados:** RNF-02 – Usabilidad, RNF-03 – Seguridad

**Cumplimiento:** Cumple con ajustes (la biometría **no** inicia sesión; ver Anexo A)

**Evidencia en el código:** `Frontend(movile)/lib/screens/auth/biometric_access_screen.dart`, `Frontend(movile)/lib/services/auth_service.dart` (`configureBiometrics`, `authenticateBiometric`, `disableBiometrics`), `Frontend(movile)/lib/screens/home/home_screen.dart`.

---

## RF-18: Registrar gastos mediante escaneo de recibos (OCR) y QR (Nequi/Daviplata)

**Identificador del requerimiento:** RF-18

**Nombre del requerimiento:** Registrar gastos mediante escaneo de recibos (OCR) y QR (Nequi/Daviplata)

**Descripción:** El sistema permitirá capturar con la cámara una fotografía de un recibo o comprobante (OCR con reconocimiento de texto en el dispositivo) o escanear un código QR de comprobantes de pago como Nequi o Daviplata, extrayendo monto, fecha y comercio (descripción). Si el nombre de la categoría detectada coincide con una categoría del usuario, esta se preselecciona.

**Precondiciones:** El usuario debe haber iniciado sesión y otorgado permisos de cámara a la aplicación.

**Postcondiciones:** Se abre el formulario de gasto con los datos extraídos para que el usuario los confirme o edite antes de guardar.

**Restricciones:**

- El usuario puede editar los datos reconocidos antes de confirmar, dado que el reconocimiento no garantiza exactitud total.
- Solo se procesan códigos QR con formato reconocible de comprobantes de pago; si no se pueden interpretar, se avisa al usuario y se solicita el ingreso manual.
- Si la categoría no coincide, queda sin seleccionar.

**Dependencias y relaciones:** Depende de RF-03 (Gestionar gastos) y RF-09 (Iniciar sesión). Se relaciona con RF-15 (Gestionar categorías).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Agiliza el registro de gastos aprovechando la cámara del dispositivo.

**RFN relacionados:** RNF-01 – Diseño adaptable, RNF-05 – Rendimiento

**Cumplimiento:** Cumple

**Evidencia en el código:** `Frontend(movile)/lib/screens/scanners/ocr_scanner_screen.dart`, `qr_scanner_screen.dart`, `Frontend(movile)/lib/services/ocr_parser_service.dart`, `qr_parser_service.dart`, `Frontend(movile)/lib/data/categoria_keywords.dart`.

---

## RF-20: Widget de resumen financiero en pantalla de inicio

**Identificador del requerimiento:** RF-20

**Nombre del requerimiento:** Widget de resumen financiero en pantalla de inicio

**Descripción:** El sistema ofrecerá widgets (pequeño y mediano) para la pantalla de inicio de Android con el balance, los ingresos, los gastos, el porcentaje y la fecha del mes en curso.

**Precondiciones:** El usuario debe haber iniciado sesión y añadido el widget a su pantalla de inicio.

**Postcondiciones:** El widget se actualiza al abrir la aplicación o registrar nuevas transacciones.

**Restricciones:** El widget solo muestra información resumida, sin datos sensibles como contraseñas o detalles de cuentas. Disponible en Android.

**Dependencias y relaciones:** Depende de RF-09 (Iniciar sesión). Se relaciona con RF-02 (Ingresos) y RF-03 (Gastos), cuyos totales resume.

**Prioridad:** Media

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Brinda acceso rápido al estado financiero sin abrir la aplicación completa.

**RFN relacionados:** RNF-01 – Diseño adaptable, RNF-07 – Interfaz gráfica clara

**Cumplimiento:** Cumple con ajustes (solo Android)

**Evidencia en el código:** `Frontend(movile)/lib/services/widget_service.dart` (`AhorrAppSmallWidgetProvider`, `AhorrAppMediumWidgetProvider`), `Frontend(movile)/lib/screens/ingresos/modulo_ingresos.dart` (`_updateWidget`).

---

## RF-21: Registro rápido de gastos e ingresos

**Identificador del requerimiento:** RF-21

**Nombre del requerimiento:** Registro rápido de gastos e ingresos

**Descripción:** El sistema permitirá registrar movimientos en pocos pasos mediante: (1) accesos directos del ícono de la aplicación ("Nuevo gasto" y "Nuevo ingreso") que abren directamente el formulario correspondiente, y (2) dictado por voz dentro de los módulos de gastos e ingresos, que reconoce monto, categoría y descripción con el reconocimiento de voz del dispositivo y precarga el formulario.

**Precondiciones:** La aplicación debe estar instalada y tener una sesión iniciada.

**Postcondiciones:** El formulario queda precargado con los datos reconocidos y el usuario puede confirmarlos o corregirlos antes de guardar.

**Restricciones:** Los accesos directos solo están disponibles en sistemas operativos que soporten *shortcuts* nativos. El reconocimiento de voz no garantiza exactitud total, por lo que los datos siempre se revisan antes de guardar.

**Dependencias y relaciones:** Depende de RF-03 (Gastos), RF-02 (Ingresos) y RF-09 (Iniciar sesión). Se relaciona con RF-15 (Categorías).

**Prioridad:** Media

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Reduce la fricción para registrar transacciones cotidianas desde el móvil.

**RFN relacionados:** RNF-02 – Usabilidad, RNF-05 – Rendimiento

**Cumplimiento:** Cumple con ajustes (la voz se usa dentro de la app, no desde el acceso directo; ver Anexo A)

**Evidencia en el código:** `Frontend(movile)/lib/services/quick_actions_service.dart`, `Frontend(movile)/lib/services/local_parser_service.dart`, `Frontend(movile)/lib/screens/gastos/modulo_gastos.dart`, `Frontend(movile)/lib/screens/ingresos/modulo_ingresos.dart` (uso de `speech_to_text`).

---

## RF-22: Consistencia de datos web-móvil

**Identificador del requerimiento:** RF-22

**Nombre del requerimiento:** Consistencia de datos web-móvil *(antes: "Sincronización multiplataforma web-móvil")*

**Descripción:** Las aplicaciones web y móvil consumen el mismo backend y la misma base de datos, por lo que los datos registrados en una plataforma están disponibles en la otra al consultarlos con la misma cuenta.

**Precondiciones:** El usuario debe tener la misma cuenta activa en ambas plataformas y conexión a internet.

**Postcondiciones:** La información financiera es la misma en la aplicación móvil y en la web al actualizar o consultar la vista.

**Restricciones:** Requiere conexión a internet. No hay actualización en tiempo real: los datos se refrescan al abrir o recargar cada vista. Ante ediciones simultáneas prevalece la última escritura recibida por el servidor.

**Dependencias y relaciones:** Depende de RF-01 (Registrar usuarios) y RF-09 (Iniciar sesión). Se relaciona con RF-28 (Historial de actividad).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Garantiza una experiencia coherente para el usuario que utiliza ambas plataformas.

**RFN relacionados:** RNF-04 – Disponibilidad, RNF-06 – Escalabilidad

**Cumplimiento:** Cumple con ajustes (ver Anexo A)

**Evidencia en el código:** `Frontend(movile)/lib/core/network/api_client.dart` (misma API que `Frontend(web)/src/services/api.js`), `Backend/index.js`.

---

## RF-23: Verificación con PIN para acciones sensibles

**Identificador del requerimiento:** RF-23

**Nombre del requerimiento:** Verificación con PIN para acciones sensibles *(antes: "Bloqueo de aplicación con PIN")*

**Descripción:** El sistema permitirá al usuario configurar desde la pantalla de Inicio un PIN de 4 dígitos, guardado localmente en el almacenamiento seguro del dispositivo, que se solicita como segunda verificación antes de acciones sensibles (cambiar contraseña, editar datos personales). Si el usuario aún no tiene PIN, se le pide crearlo en ese momento.

**Precondiciones:** El usuario debe tener una sesión iniciada.

**Postcondiciones:** La acción sensible solo se ejecuta si el PIN (o la biometría, RF-17) es correcto.

**Restricciones:**

- El PIN tiene exactamente 4 dígitos numéricos.
- El PIN no se envía al servidor; se guarda solo en el almacenamiento seguro del dispositivo (Keystore/Keychain).
- El PIN se elimina al cerrar sesión.

**Dependencias y relaciones:** Depende de RF-01 y RF-09. Se relaciona con RF-17 (Biometría) y RF-30 (Gestionar mi cuenta).

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Añade una barrera adicional antes de modificar datos sensibles de la cuenta.

**RFN relacionados:** RNF-03 – Seguridad, RNF-02 – Usabilidad

**Cumplimiento:** Cumple con ajustes (el PIN no bloquea la app al abrirla; ver Anexo A)

**Evidencia en el código:** `Frontend(movile)/lib/screens/auth/pin_access_screen.dart` (`confirmarConPin`), `Frontend(movile)/lib/services/auth_service.dart` (`savePin`, `verifyPin`, `clearPin`), `Frontend(movile)/lib/screens/home/home_screen.dart`.

---

## RF-24: Exportación nativa de reportes financieros (PDF)

**Identificador del requerimiento:** RF-24

**Nombre del requerimiento:** Exportación nativa de reportes financieros

**Descripción:** El sistema permitirá generar en el dispositivo un reporte en PDF para un rango de fechas y un período de presupuesto seleccionados, con las secciones: portada y resumen, distribución de gastos e ingresos, ahorros, deudas, fondo de emergencia, presupuesto y evolución. Al terminar, se abre la hoja de compartir nativa del sistema operativo.

**Precondiciones:**

- El usuario debe tener una sesión activa y conexión a internet.
- Debe contar con registros financieros almacenados.

**Postcondiciones:** La aplicación compila la información desde el backend, genera el PDF y despliega el menú nativo para su envío o guardado.

**Restricciones:** Las secciones sin datos se indican como no disponibles; el reporte no incluye datos que el backend no devuelva.

**Dependencias y relaciones:** Depende de RF-09, RF-02, RF-03, RF-04, RF-05, RF-07 y RF-06. Se relaciona con RF-11 (Reportes web).

**Prioridad:** Media

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Permite enviar los datos directamente por mensajería o correo sin buscar un archivo en el teléfono.

**RFN relacionados:** RNF-02 – Usabilidad, RNF-05 – Rendimiento

**Cumplimiento:** Cumple con ajustes (ver Anexo A)

**Evidencia en el código:** `Frontend(movile)/lib/screens/reportes/reportes_screen.dart`, `Frontend(movile)/lib/core/utils/pdf/reporte_pdf_builder.dart` y `secciones/`, `Frontend(movile)/lib/services/reportes_service.dart`.

---

## RF-25: Calendario de actividad financiera

**Identificador del requerimiento:** RF-25

**Nombre del requerimiento:** Calendario de actividad financiera

**Descripción:** El sistema mostrará en un calendario los movimientos del usuario, marcando cada día con un color según el tipo de movimiento: ingreso, gasto, imprevisto, ahorro, deuda o fondo de emergencia.

**Precondiciones:** El usuario debe tener una sesión activa y registros en algún módulo financiero.

**Postcondiciones:** El usuario ve sus movimientos resaltados por color en el calendario.

**Restricciones:** La fecha del dispositivo debe ser correcta para que el calendario muestre bien el día actual; los registros se ubican según la fecha guardada en cada movimiento.

**Dependencias y relaciones:** RF-09 (Iniciar sesión), RF-02, RF-03, RF-04, RF-05, RF-06, RF-07.

**Prioridad:** Media

**Estado:** Finalizado

**Versión:** 2.0

**Justificación:** Permite identificar con claridad las fechas de ingresos y egresos.

**RFN relacionados:** RNF-02 – Usabilidad, RNF-07 – Interfaz gráfica clara

**Cumplimiento:** Cumple con ajustes (se agregaron deuda, imprevisto y fondo de emergencia; las dependencias numéricas se corrigieron)

**Evidencia en el código:** `Frontend(movile)/lib/screens/calendario/calendario_screen.dart` (mapa `colorPorTipo`).

---

# RF NUEVOS (funciones presentes en el código y no documentadas)

## RF-26: Gestionar presupuestos y períodos presupuestales

**Identificador del requerimiento:** RF-26

**Nombre del requerimiento:** Gestionar presupuestos y períodos presupuestales

**Descripción:** El sistema permitirá crear, consultar, editar, eliminar y activar perfiles de presupuesto, definiendo el día de corte y el porcentaje asignado a gastos, deudas, imprevistos, ahorros y fondo de emergencia. Con un perfil activo, el usuario podrá abrir y cerrar períodos presupuestales, consultar el período activo y el histórico (paginado), y ajustar o actualizar el ingreso estimado y real del período. Cada período calcula los montos por módulo.

**Plataforma:** Web y móvil

**Precondiciones:** El usuario debe haber iniciado sesión.

**Postcondiciones:** El período activo calcula los montos asignados a cada módulo y sirve de base para alertas, panel de control y reportes.

**Restricciones:**

- Los cinco porcentajes del perfil deben sumar exactamente 100 % (cada uno entre 0 y 100).
- Solo puede haber un perfil de presupuesto activo por usuario.
- El día de corte debe estar entre 1 y 31.
- La fecha de fin de un período debe ser posterior a la de inicio.

**Dependencias y relaciones:** Depende de RF-09. Se relaciona con RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-11, RF-12, RF-13, RF-27.

**Prioridad:** Alta

**Estado:** Finalizado

**Versión:** 1.0

**Justificación:** Es el eje de planificación del sistema: reparte el ingreso entre los módulos financieros y permite comparar lo planeado con lo ejecutado.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-06, RNF-07

**Cumplimiento:** Nuevo

**Evidencia en el código:** `Backend/src/controllers/PresupuestosController.js`, `Backend/src/routes/PresupuestosRoutes.js`, `Backend/src/service/periodoHelper.js`, tablas `presupuestos` y `periodos_presupuesto`, `Frontend(web)/src/pages/ModulosPresupuestos.jsx`, `Frontend(movile)/lib/screens/presupuestos/`, `Frontend(movile)/lib/services/presupuestos_service.dart`.

---

## RF-27: Panel de control financiero

**Identificador del requerimiento:** RF-27

**Nombre del requerimiento:** Panel de control financiero (dashboard)

**Descripción:** El sistema mostrará en la versión web un panel con el resumen financiero, la comparación entre lo presupuestado y lo ejecutado por módulo y el flujo de dinero por semana.

**Plataforma:** Web

**Precondiciones:** El usuario debe haber iniciado sesión.

**Postcondiciones:** El usuario visualiza indicadores actualizados de su situación financiera.

**Restricciones:**

- Solo muestra información registrada por el usuario; no modifica datos.
- La versión móvil no incluye este panel: su resumen financiero se obtiene en el PDF (RF-24). Un dashboard móvil más sencillo está contemplado y aún no está documentado como RF.
- El archivo `Frontend(movile)/lib/screens/dashboard/dashboard_screen.dart` es un boceto descartado: no tiene referencias en la aplicación y se conserva en el repositorio.
- La pantalla de Inicio móvil (`home_screen.dart`) es la vista donde irá el futuro dashboard; hoy solo ofrece la gestión de PIN y biometría (RF-17, RF-23).

**Dependencias y relaciones:** Depende de RF-09. Se relaciona con RF-26, RF-11 y RF-24.

**Prioridad:** Alta

**Estado:** Finalizado (solo web)

**Versión:** 1.1

**Justificación:** Ofrece una vista rápida del estado financiero sin generar un reporte completo.

**RFN relacionados:** RNF-01, RNF-02, RNF-05, RNF-07

**Cumplimiento:** Nuevo (solo web)

**Evidencia en el código:** `Backend/src/controllers/dashboardController.js`, `Backend/src/routes/dashboardRoutes.js`, `Frontend(web)/src/pages/Dashboard.jsx`. En móvil no hay implementación activa (boceto descartado en `Frontend(movile)/lib/screens/dashboard/dashboard_screen.dart`).

---

## RF-28: Mis movimientos e historial de actividad

**Identificador del requerimiento:** RF-28

**Nombre del requerimiento:** Mis movimientos e historial de actividad

**Descripción:** El sistema permitirá: (a) **Mis movimientos:** que el usuario consulte un listado unificado, ordenado por fecha, de sus ingresos, gastos, ahorros, deudas e imprevistos, con tipo, descripción, monto y fecha (en la web dentro de Configuración; en móvil dentro de Mi cuenta, agrupado por día); y (b) **Historial de actividad:** que los usuarios con rol `admin` o `superuser` consulten el historial de acciones del sistema (usuario, acción, detalle y fecha), completo en la web y limitado a las últimas 8 acciones en el panel de administración móvil.

**Plataforma:** Web y móvil

**Precondiciones:** El usuario debe haber iniciado sesión (el historial requiere rol `admin` o `superuser`).

**Postcondiciones:** Se muestra el listado solicitado.

**Restricciones:**

- Cada usuario solo ve sus propios movimientos.
- En el listado, cada ahorro muestra su monto acumulado y cada deuda su fecha de finalización; no incluye movimientos del fondo de emergencia.
- El historial registra únicamente siete acciones: cambio de rol, eliminación de un usuario, desactivación de la cuenta, actualización de datos personales, cambio de contraseña, eliminación de un dependiente propio y eliminación del dependiente de un usuario por parte de un administrador.
- El historial no registra altas, ediciones ni eliminaciones de movimientos financieros.
- Existe el endpoint `GET /historial/propio` (historial de acciones del propio usuario), pero ninguna pantalla web ni móvil lo muestra todavía.

**Dependencias y relaciones:** Depende de RF-09. Se relaciona con RF-08, RF-30, RF-31

**Prioridad:** Media

**Estado:** En desarrollo

**Versión:** 1.1

**Justificación:** Da trazabilidad de la actividad del usuario y de las acciones administrativas.

**RFN relacionados:** RNF-02, RNF-03, RNF-07

**Cumplimiento:** Nuevo (parcial). Verificado: "Mis movimientos" funciona en web y móvil; el historial de administración funciona en web y de forma limitada en móvil; el historial propio solo existe en el backend.

**Evidencia en el código:** `Backend/src/controllers/movimientosController.js` (`getMovimientos`), `Backend/src/controllers/Historialcontroller.js`, `Backend/src/routes/Historialroutes.js`, `Frontend(web)/src/components/Mismovimientos.jsx`, `Frontend(web)/src/pages/PanelHistorial.jsx`, `Frontend(movile)/lib/screens/cuenta/mis_movimientos_screen.dart`, `Frontend(movile)/lib/services/admin_service.dart` (`getHistorial`).

---

## RF-29: Noticias e indicadores de mercado

**Identificador del requerimiento:** RF-29

**Nombre del requerimiento:** Noticias e indicadores de mercado

**Descripción:** El sistema mostrará noticias económicas y financieras en español (categorías: economía, finanzas, dólar, empleo y general), con paginación, y un widget con cotizaciones de bolsa y la TRM USD/COP.

**Plataforma:** Web

**Precondiciones:** El usuario debe haber iniciado sesión (noticias).

**Postcondiciones:** El usuario consulta noticias y cotizaciones actualizadas.

**Restricciones:** Depende de servicios externos (NewsAPI y Finnhub). Si la TRM no se puede obtener, se usa un valor de respaldo. Solo se muestran noticias con título, descripción, enlace e imagen.

**Dependencias y relaciones:** Depende de RF-09.

**Prioridad:** Baja

**Estado:** Finalizado

**Versión:** 1.0

**Justificación:** Aporta contexto económico a las decisiones financieras del usuario.

**RFN relacionados:** RNF-01, RNF-02, RNF-07

**Cumplimiento:** Nuevo

**Evidencia en el código:** `Backend/src/routes/noticiasRoutes.js`, `Backend/src/routes/alphaVantageRoutes.js`, `Frontend(web)/src/pages/Noticias.jsx`, `Frontend(web)/src/components/BolsaWidget.jsx`.

---

## RF-30: Gestionar mi cuenta

**Identificador del requerimiento:** RF-30

**Nombre del requerimiento:** Gestionar mi cuenta

**Descripción:** El usuario podrá editar su nombre, apellido y correo, cambiar su contraseña indicando la actual y desactivar su propia cuenta. Al desactivarla, la cuenta queda inactiva de inmediato y se elimina de forma permanente a los 30 días mediante una tarea automática diaria; la reactivación dentro de ese plazo se solicita a soporte.

**Plataforma:** Web y móvil

**Precondiciones:** El usuario debe haber iniciado sesión. En móvil, editar el perfil y cambiar la contraseña requieren verificación con PIN o biometría (RF-17, RF-23).

**Postcondiciones:** Los datos o la contraseña quedan actualizados; en la desactivación, la cuenta queda inactiva con fecha de eliminación programada y se registra en el historial.

**Restricciones:**

- El nombre y el apellido solo admiten letras; el correo debe tener formato válido.
- La nueva contraseña debe tener al menos 8 caracteres y la contraseña actual debe ser correcta.
- La desactivación requiere confirmación explícita del usuario.
- Al cumplirse el plazo de 30 días, la cuenta y sus datos se eliminan definitivamente.

**Dependencias y relaciones:** Depende de RF-09. Se relaciona con RF-17, RF-23, RF-28.

**Prioridad:** Media

**Estado:** Finalizado

**Versión:** 1.0

**Justificación:** Da al usuario control sobre sus datos y su cuenta.

**RFN relacionados:** RNF-02, RNF-03, RNF-09

**Cumplimiento:** Nuevo

**Evidencia en el código:** `Backend/src/controllers/authController.js` (`actualizarMiPerfil`, `cambiarMiPassword`, `desactivarCuentaPropia`), `Backend/src/service/jobs/EliminacioncuentasJob.js`, `Frontend(web)/src/components/Micuenta.jsx`, `Frontend(movile)/lib/screens/cuenta/` (`mi_cuenta_screen.dart`, `editar_perfil_screen.dart`, `cambiar_password_screen.dart`).

---

## RF-31: Panel de administración

**Identificador del requerimiento:** RF-31

**Nombre del requerimiento:** Panel de administración

**Descripción:** Los usuarios con rol `admin` o `superuser` contarán con un panel para consultar usuarios, dependientes e historial de acciones del sistema, y eliminar dependientes de cualquier usuario. La web incluye además una vista "Movimientos financieros", que muestra los movimientos del propio administrador (no existe una consulta global). La gestión de cuentas y roles se describe en RF-08.

**Plataforma:** Web y móvil (el panel móvil incluye usuarios, dependientes y las últimas 8 acciones del historial; no tiene vista de movimientos)

**Precondiciones:** El usuario debe haber iniciado sesión con rol `admin` o `superuser`.

**Postcondiciones:** El administrador visualiza la información y las acciones quedan registradas en el historial.

**Restricciones:** El acceso al panel está restringido por rol en la interfaz web (`ProtectedRoute`).

**Dependencias y relaciones:** Depende de RF-09. Se relaciona con RF-08, RF-10, RF-28.

**Prioridad:** Media

**Estado:** En desarrollo

**Versión:** 1.1

**Justificación:** Permite supervisar la plataforma.

**RFN relacionados:** RNF-02, RNF-03, RNF-07

**Cumplimiento:** Nuevo (parcial). La vista de movimientos del panel usa `GET /movimientos`, que solo devuelve los movimientos del usuario autenticado.

**Evidencia en el código:** `Frontend(web)/src/pages/PanelAdmin.jsx`, `PanelUsuarios.jsx`, `PanelDependientes.jsx`, `PanelMovimientos.jsx`, `PanelHistorial.jsx`, `Frontend(movile)/lib/screens/admin/` (`panel_admin_screen.dart`, `panel_usuarios_screen.dart`, `panel_dependientes_screen.dart`), `Backend/src/controllers/authController.js` (`getUsuariosPanelAdmin`, `getDependientesPanelAdmin`, `getTodosDependientesAdmin`), `Backend/src/controllers/dependientesController.js` (`deleteDependienteAdmin`).

---

## RF-32: Inicio de sesión con Google (parcial)

**Identificador del requerimiento:** RF-32

**Nombre del requerimiento:** Inicio de sesión con Google

**Descripción:** La aplicación móvil incluye el flujo de inicio de sesión con cuenta de Google, que obtiene las credenciales de Google en el dispositivo y las envía al endpoint `/auth/google` del backend.

**Plataforma:** Móvil

**Precondiciones:** Debe estar configurado el identificador de cliente de Google en la aplicación.

**Postcondiciones:** Al completarse, el usuario queda autenticado con su token de sesión.

**Restricciones:** El backend entregado **no** tiene el endpoint `/auth/google`, por lo que el flujo no se puede completar con ese backend.

**Dependencias y relaciones:** Depende de RF-09. Se relaciona con RF-01.

**Prioridad:** Baja

**Estado:** En desarrollo

**Versión:** 1.0

**Justificación:** Facilita el acceso sin recordar contraseñas.

**RFN relacionados:** RNF-02, RNF-03

**Cumplimiento:** Nuevo (incompleto)

**Evidencia en el código:** `Frontend(movile)/lib/services/auth_service.dart` (`isGoogleAuthConfigured`, llamada a `/auth/google`).

---

# RF DOCUMENTADOS SIN CÓDIGO (PENDIENTES)

## RF-19: Registro y consulta en modo sin conexión

**Identificador del requerimiento:** RF-19

**Nombre del requerimiento:** Registro y consulta en modo sin conexión

**Descripción:** El sistema permitirá registrar ingresos, gastos y ahorros sin conexión a internet, almacenando los datos localmente y sincronizándolos automáticamente al recuperar la conexión.

**Precondiciones:** El usuario debe haber iniciado sesión al menos una vez con conexión activa.

**Postcondiciones:** Los registros hechos sin conexión se sincronizan con el servidor sin duplicar información.

**Restricciones:** Los reportes no reflejarán datos no sincronizados hasta que exista conexión.

**Dependencias y relaciones:** Se relaciona con RF-02, RF-03, RF-04.

**Prioridad:** Alta

**Estado:** Pendiente

**Versión:** 1.0

**Justificación:** Garantiza la continuidad de uso en zonas con conectividad limitada.

**RFN relacionados:** RNF-04 – Disponibilidad, RNF-06 – Escalabilidad

**Cumplimiento:** Pendiente. La aplicación móvil no incluye base de datos local, cola de operaciones pendientes ni detección de conectividad; todos los servicios consumen directamente el backend. Estaba documentado como "Finalizado" y no se puede demostrar con el código.

---

# RF EN REVISIÓN (POSIBLE ELIMINACIÓN)

## RF-33: Asistente financiero con IA

**Identificador del requerimiento:** RF-33

**Nombre del requerimiento:** Asistente financiero con IA

**Descripción:** El sistema ofrecerá un asistente conversacional que responde consultas financieras tomando como contexto un resumen breve de la información financiera del usuario. Las respuestas se generan con un modelo de lenguaje externo (OpenRouter).

**Plataforma:** Web

**Precondiciones:** El usuario debe haber iniciado sesión.

**Postcondiciones:** El usuario recibe una respuesta en el chat.

**Restricciones:** Su permanencia en el sistema está en revisión (probablemente se elimine). Las respuestas están limitadas a 800 tokens. Depende de un servicio externo. El asistente no reemplaza el asesoramiento financiero profesional.

**Dependencias y relaciones:** Depende de RF-09. Se relaciona con RF-12.

**Prioridad:** Baja

**Estado:** Finalizado (en revisión: posible eliminación)

**Versión:** 1.0

**Justificación:** Brinda orientación rápida en lenguaje natural.

**RFN relacionados:** RNF-02, RNF-03, RNF-07

**Cumplimiento:** Nuevo

**Evidencia en el código:** `Backend/src/controllers/aiController.js`, `Backend/src/routes/aiRoutes.js`, `Frontend(web)/src/components/Asistente/Asistente.jsx`.

---

# ANEXO A – Restricciones y funciones documentadas que el código no cumple

Se retiraron de los RF para que cada RF sea demostrable. Cada fila es una decisión pendiente: **implementar** en el código o **descartar** de la documentación.

| RF | Lo que decía la documentación | Lo que hace el código |
|---|---|---|
| RF-01 | La contraseña debe cumplir criterios de seguridad. | Solo los clientes los validan (web: 8–64 con mayúscula, minúscula, número y símbolo; móvil: mínimo 8). El backend solo exige que no esté vacía y tampoco valida el formato del correo. |
| RF-02 | Ingresos fijos o variables. | No existe el campo; se clasifica por categoría y fuente. |
| RF-03 | Todo gasto debe tener categoría válida. | La clave foránea valida que exista, pero la columna es opcional y el backend no la exige. El formulario web exige monto mínimo de 50 (no documentado). |
| RF-04 | Solo pueden modificarse metas activas; toda modificación queda en el historial. | Las metas no tienen estado; solo se guardan los abonos. |
| RF-05 | Fondo con saldo, retiros que no excedan el saldo, historial de transacciones y transferencia automática de excedentes al cierre. | Los imprevistos son registros de gasto contra un porcentaje del presupuesto; al cerrar el período solo se envía una sugerencia. |
| RF-07 | Tasa de interés no negativa; pagos que no excedan el saldo pendiente; confirmación solo para deudas pagadas; historial de toda modificación. | No existe campo de tasa de interés. El control es por cuotas, no por saldo en dinero. La web pide confirmación para cualquier eliminación, pero el backend no la exige. Solo se guarda el historial de abonos. |
| RF-08 | Activar y desactivar cuentas desde el panel. | Solo se edita y se da de baja (baja lógica); no hay reactivación desde el panel. |
| RF-09 | Bloqueo temporal tras tres intentos fallidos. | No hay contador de intentos ni bloqueo, ni en backend ni en los clientes. |
| RF-10 | Un dependiente no puede registrarse más de una vez. | No se valida duplicidad. |
| RF-12 | Propuesta automática de distribución con porcentajes y montos sugeridos según el análisis de la situación del usuario. | El usuario define el perfil; el sistema calcula montos a partir de ese perfil y emite alertas (85 %) y la sugerencia al cierre. |
| RF-13 | Notificaciones disponibles también en móvil. | La interfaz existe solo en la web; en móvil no hay pantalla de notificaciones. (La notificación de meta de ahorro alcanzada sí está implementada y ya forma parte del RF.) |
| RF-15 | Nombres únicos por módulo; no eliminar categorías con registros sin confirmación previa; respetar la estructura de cada módulo. | La tabla no tiene columna de módulo, así que las categorías son compartidas. Solo se verifica unicidad entre categorías globales. La eliminación exige que la categoría esté deshabilitada y deja los registros sin categoría. |
| RF-16 | No cerrar sesión con operaciones críticas pendientes; las sesiones finalizadas no pueden reutilizarse. | El cierre es solo del lado del cliente; el token sigue siendo válido en el servidor hasta su vencimiento (8 h). |
| RF-17 | Iniciar sesión con huella o rostro, sin correo ni contraseña. | La biometría solo confirma acciones sensibles; no inicia sesión. |
| RF-19 | Modo sin conexión completo. | No implementado (ver sección Pendientes). |
| RF-21 | Voz mediante acceso directo o asistente del sistema operativo; confirmación visual del texto reconocido. | Los accesos directos abren los formularios de gasto e ingreso; la voz funciona dentro de la app y precarga el formulario. |
| RF-22 | Sincronización automática en tiempo real; conflictos resueltos por marca de tiempo; depende del modo sin conexión. | Ambos clientes usan el mismo backend; no hay tiempo real ni resolución de conflictos. |
| RF-23 | PIN de 4 a 6 dígitos que se pide al abrir la app o tras inactividad; bloqueo tras 5 intentos fallidos con restablecimiento por correo; PIN cifrado. | PIN de exactamente 4 dígitos, guardado en el almacenamiento seguro del dispositivo, usado para acciones sensibles. No hay solicitud al abrir, inactividad, límite de intentos ni restablecimiento por correo. |
| RF-24 | Exportar historial de movimientos (gastos, ingresos, ahorros, deudas, imprevistos) por período; eliminar el archivo temporal al cerrar el menú de compartir; modo offline. | El PDF es el reporte consolidado (RF-11) y se comparte con `Printing.sharePdf`; el código no elimina el archivo de forma explícita. Sin modo offline. |

---

# ANEXO B – Hallazgos técnicos (no son RF)

Surgieron durante la revisión y conviene corregirlos aparte:

1. **Código de exportación sin RF:** el RF de exportación de datos (antes RF-36) se eliminó porque otro RF lo cubre. `exportController.js`, `exportRoutes.js` y `exportar.jsx` siguen en el código y las rutas están comentadas en `index.js`; conviene retirarlos o dejarlos documentados como código inactivo.
2. **Endpoint de IA sin autenticación:** `POST /api/ai/chat` no usa `verifyToken`; cualquiera puede consumir los créditos del servicio.
3. **Clave de API en el código:** `alphaVantageRoutes.js` incluye una clave de Finnhub como valor por defecto. Debe moverse a variables de entorno y rotarse, porque ya quedó expuesta en el código.
4. **Rutas de administración con verificación de rol incompleta:** `/auth/PanelUsuarios` (GET), `/auth/usuarios/PanelAdmin`, `/auth/dependientes/PanelAdmin` y `/auth/PanelDependientes` usan `verifyToken` pero no `requireRole`. Hay que confirmar que los controladores validen el rol; si no, cualquier usuario autenticado podría listar cuentas.
5. **CORS:** solo permite `https://localhost:5173`; falta el dominio de producción del frontend web.
6. **SQL:** en `supabase.sql`, la definición de `usuarios` no tiene coma entre `fecha_eliminacion_programada` y `fecha_registro`, por lo que el script falla tal cual.
7. **Endpoint `/auth/google` inexistente** (ver RF-32).
8. **Archivos vacíos en móvil:** `models/calendario_model.dart`, `services/calendario_service.dart` y `core/constants/app_constants.dart` (2 bytes).
9. **Reactivación de cuenta:** los mensajes prometen reactivar la cuenta, pero no hay endpoint; el proceso es manual con soporte.
10. **Duplicación de rutas de exportación:** el comentario al final de `exportRoutes.js` habla de un archivo `exportar.js` que ya no existe; unificar el nombre.
11. **Panel de movimientos (admin) no es global:** `PanelMovimientos.jsx` usa `GET /movimientos`, que filtra por el usuario autenticado; muestra solo los movimientos del propio administrador.
12. **`GET /movimientos`:** fue escrito para alimentar a la IA (así lo indica su comentario). Devuelve un arreglo sin identificador, categoría ni orden; el ahorro aparece con su monto acumulado y la deuda con su fecha de fin; no incluye el fondo de emergencia. Si el RF-38 (asistente IA) se elimina, el endpoint debe conservarse porque alimenta "Mis movimientos".
13. **Historial propio sin interfaz:** `GET /historial/propio` y `getHistorialPropio` (web) existen, pero ninguna pantalla los usa.
14. **Historial muy limitado:** `registrarHistorial` se invoca solo en `authController` (5 acciones) y `dependientesController` (2 acciones); no se registran movimientos financieros.
15. **Boceto móvil sin uso:** `Frontend(movile)/lib/screens/dashboard/dashboard_screen.dart` pesa unos 63 KB y ninguna otra pantalla lo referencia; se conserva por decisión del equipo.

---

# RESUMEN – RF PARCIALES O NO DESARROLLADOS

| RF | Estado | Qué está desarrollado | Qué falta |
|---|---|---|---|
| RF-19 Modo sin conexión | **No desarrollado** | Nada. | Almacenamiento local, cola de operaciones pendientes, detección de conectividad y sincronización. |
| RF-13 Notificaciones | **Parcial** (solo web) | Generación de notificaciones, preferencias e interfaz web. | Pantalla de notificaciones en la aplicación móvil. |
| RF-27 Panel de control | **Parcial** (solo web) | Dashboard web. | Dashboard móvil (planeado; `dashboard_screen.dart` es un boceto descartado y la pantalla de Inicio móvil hoy solo gestiona PIN y biometría). |
| RF-28 Mis movimientos e historial | **Parcial** | Mis movimientos (web y móvil), historial del sistema para administradores (completo en web, 8 últimas acciones en móvil). | Pantalla de historial propio (el endpoint ya existe); registro de movimientos financieros en el historial. |
| RF-31 Panel de administración | **Parcial** | Usuarios, dependientes e historial (web y móvil). | Consulta global de movimientos (hoy muestra solo los del administrador) y vista de movimientos en móvil. |
| RF-32 Inicio de sesión con Google | **Parcial** | Flujo en la aplicación móvil. | Endpoint `/auth/google` en el backend. |

**En revisión:** RF-33
 (asistente de IA) funciona, pero probablemente se elimine.

**Funciones del documento original que se retiraron por no estar desarrolladas:** el detalle de cada una está en el Anexo A (afecta a RF-01, 02, 03, 04, 05, 07, 08, 09, 10, 12, 13, 15, 16, 22, 26, 27, 28 y 29).
