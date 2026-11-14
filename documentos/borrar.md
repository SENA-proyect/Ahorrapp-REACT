## 1.4 Definiciones, acrónimos y abreviaturas

Esta sección define los términos, acrónimos y abreviaturas necesarios para interpretar este documento. El resumen de los requisitos se encuentra en los Apéndices A y B, y las tablas de la base de datos en el Apéndice E.

### Definiciones

| Término | Definición |
|---|---|
| Abono | Monto aportado a una meta de ahorro (RF-04) o pagado a una deuda (RF-07). |
| Acceso directo (*shortcut*) | Opción del ícono de la aplicación móvil que abre directamente un formulario de registro (RF-21). |
| Acción sensible | Operación que exige una verificación adicional con PIN o biometría: cambiar la contraseña y editar datos personales (RF-17 y RF-23). |
| Administrador (`admin`) | Rol que consulta y gestiona cuentas, dependientes e historial de actividad, sin poder modificar roles (RF-08 y RF-31). |
| Alerta de presupuesto | Notificación que se genera cuando el consumo de gastos o de imprevistos alcanza el 85 % de su asignación (RF-12). |
| Almacenamiento seguro | Espacio protegido del dispositivo móvil (Keystore de Android) donde se guardan el token de sesión, los datos del usuario y el PIN (3.1.2). |
| Backend | Servidor común a las aplicaciones web y móvil que valida, procesa y almacena la información (3.1.4). |
| Baja lógica | Eliminación de una cuenta que la deja inactiva, sin borrarla de inmediato (RF-08 y RF-30). |
| Biometría | Verificación de identidad mediante la huella o el reconocimiento facial del dispositivo (RF-17). |
| Categoría | Clasificación de los registros financieros. Es global si la define el sistema y personal si la crea el usuario (RF-15). |
| Cliente | Aplicación web o móvil que consume el backend. |
| Dependiente económico | Persona que depende económicamente del usuario y que puede asociarse a sus gastos (RF-10). |
| Día de corte | Día del mes, entre 1 y 31, definido en el perfil de presupuesto (RF-26). |
| Fondo de emergencia | Reserva única por usuario, con meta, aportes y retiros, independiente de los ahorros y de los imprevistos (RF-06). |
| Hoja de compartir | Menú nativo del sistema operativo móvil para enviar o guardar un archivo (RF-24). |
| Historial de actividad | Registro de las acciones administrativas y sensibles del sistema, con usuario, acción, detalle y fecha (RF-28). |
| Imprevisto | Gasto no planificado, que se contabiliza contra la porción de imprevistos del presupuesto (RF-05). |
| Línea base | Medición inicial de usuarios y de carga del sistema, contra la que se comparan las metas de crecimiento (RNF-03). |
| Meta de ahorro | Objetivo de ahorro con monto objetivo y fecha meta opcional, al que se asocian abonos (RF-04). |
| Modo sin conexión | Funcionamiento de la aplicación móvil sin internet, con almacenamiento local y sincronización posterior (RF-19). |
| Notificación | Mensaje generado por el sistema. Sus tipos son sistema, recordatorio, sugerencia y alerta de presupuesto (RF-13). |
| Percentil 95 | Valor por debajo del cual se encuentra el 95 % de las mediciones. Se usa en las métricas de tiempo de respuesta (RNF-01). |
| Perfil de presupuesto | Conjunto de porcentajes asignados a gastos, deudas, imprevistos, ahorros y fondo de emergencia, que suman 100 %, y el día de corte (RF-26). |
| Período presupuestal | Intervalo con fecha de inicio y fecha de fin, con ingreso estimado e ingreso real, sobre el que se calculan los montos por módulo (RF-26). |
| Rol | Conjunto de permisos de un usuario. Los roles son `user`, `admin` y `superuser` (RF-08). |
| Servicios externos | Servicios de terceros que usa el sistema: NewsAPI, Finnhub, la fuente de la TRM y el servicio de correo (3.1.3). |
| Superusuario (`superuser`) | Rol con los permisos del administrador que, además, asigna y modifica roles (RF-08). |
| Tarea automática | Proceso programado que se ejecuta sin intervención del usuario: la revisión diaria de deudas a las 06:00 y la eliminación diaria de cuentas desactivadas hace 30 días (3.1.4). |
| Token de sesión | Credencial (JWT) emitida al iniciar sesión, con vigencia de 8 horas (RF-09). |
| Umbral | Porcentaje de consumo de una asignación que dispara una alerta (85 %) (RF-12). |
| Usuario | Persona registrada que usa el sistema con el rol `user` (RF-01). |
| Valor de respaldo | Valor que se muestra cuando no se puede obtener la TRM (RF-29). |
| *Widget* | Componente de la pantalla de inicio de Android que muestra el resumen financiero del mes (RF-20). |

### Tecnologías, servicios y normas

| Término | Descripción |
|---|---|
| AWS | *Amazon Web Services*. Infraestructura en la que se aloja la instancia Linux que sirve la aplicación web. |
| bcrypt | Algoritmo de cifrado (*hash*) con el que se almacenan las contraseñas. |
| Daviplata y Nequi | Billeteras digitales colombianas cuyos comprobantes de pago pueden leerse mediante un código QR (RF-18). |
| Finnhub | Servicio externo que proporciona las cotizaciones de bolsa (3.1.3). |
| Flutter y Dart | *Framework* y lenguaje con los que se desarrolla la aplicación móvil. |
| Keystore de Android | Almacén seguro de claves y datos del sistema operativo Android. |
| Ley 1581 de 2012 | Ley Estatutaria de protección de datos personales de Colombia (RNF-06). |
| localStorage | Almacenamiento del navegador donde la aplicación web guarda el token de sesión (RF-09.6). |
| *Middleware* | Componente del backend que intercepta las solicitudes para verificar el token y el rol antes de ejecutar la operación. |
| NewsAPI | Servicio externo que proporciona las noticias económicas en español (3.1.3). |
| Node.js | Entorno de ejecución del backend. |
| PostgreSQL | Sistema de base de datos relacional en el que se almacena la información del sistema. |
| React | Biblioteca con la que se desarrolla la aplicación web. |
| Render | Plataforma en la que se despliega el backend. |
| Supabase | Plataforma que aloja la base de datos PostgreSQL. |

### Acrónimos y abreviaturas

| Sigla | Significado |
|---|---|
| API | *Application Programming Interface* (interfaz de programación de aplicaciones) |
| COP | Peso colombiano |
| ERS | Especificación de Requisitos de Software (en inglés, SRS) |
| HTTPS | *Hypertext Transfer Protocol Secure* |
| IEEE | *Institute of Electrical and Electronics Engineers* |
| JSON | *JavaScript Object Notation* |
| JWT | *JSON Web Token* |
| OCR | *Optical Character Recognition* (reconocimiento óptico de caracteres) |
| PDF | *Portable Document Format* |
| PIN | *Personal Identification Number* (número de identificación personal) |
| QR | *Quick Response* (código de respuesta rápida) |
| REST | *Representational State Transfer* |
| RF | Requisito funcional |
| RNF | Requisito no funcional |
| SLA | *Service Level Agreement* (acuerdo de nivel de servicio) |
| SQL | *Structured Query Language* |
| SUS | *System Usability Scale* (escala de usabilidad del sistema) |
| TLS | *Transport Layer Security* |
| TRM | Tasa Representativa del Mercado: tasa de cambio del dólar estadounidense frente al peso colombiano (USD/COP) |
| URL | *Uniform Resource Locator* |
| USD | Dólar estadounidense |

---

## 1.5 Referencias

| Referencia | Título | Ruta | Fecha | Autor |
|---|---|---|---|---|
| [1] | IEEE Std 830-1998. *IEEE Recommended Practice for Software Requirements Specifications* | https://standards.ieee.org/standard/830-1998.html | 20/10/1998 | IEEE Computer Society |
| [2] | Ley Estatutaria 1581 de 2012. *Por la cual se dictan disposiciones generales para la protección de datos personales* | http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html | 17/10/2012 | Congreso de la República de Colombia |
| [3] | Requisitos funcionales de AhorrApp (`RF_AhorrApp_actualizadoV2.md`) | Por definir | Por definir | Equipo de AhorrApp |
| [4] | Script de la base de datos de AhorrApp (`supabase.sql`) | Por definir | Por definir | Equipo de AhorrApp |
| [5] | Documentación de la API de NewsAPI | https://newsapi.org/docs | Por definir | NewsAPI |
| [6] | Documentación de la API de Finnhub | https://finnhub.io/docs/api | Por definir | Finnhub |