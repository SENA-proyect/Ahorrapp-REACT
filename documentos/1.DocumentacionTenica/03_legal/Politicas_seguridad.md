# POLÍTICA GENERAL DE SEGURIDAD DE LA INFORMACIÓN — AhorrApp

| | |
|---|---|
| **Proceso / Subproceso** | Tecnología / Seguridad de la información |
| **Código / Versión** | AHR-SI-PO-001 / 1.0 |
| **Fecha de aprobación** | ______________ (próxima revisión: máximo 12 meses después) |
| **Norma de referencia** | ISO/IEC 27001:2022 (guía: ISO/IEC 27002:2022; riesgos: ISO/IEC 27005) |
| **Clasificación** | Las secciones 1 a 13 pueden publicarse. Los anexos B y C son de uso interno |
| **Contacto** | proyectofinanzassena@gmail.com |

*AhorrApp alinea su gestión de seguridad con la ISO/IEC 27001:2022. Este documento no implica que esté certificada en esa norma.*

## 1. Objetivo y alcance

**Objetivo:** establecer el marco de gobierno de la seguridad de la información de AhorrApp para proteger su confidencialidad, integridad y disponibilidad, y cumplir los requisitos legales y contractuales aplicables, en especial la Ley 1581 de 2012.

**Alcance:** aplica a los integrantes del equipo (Juan Medina, Santiago Hurtado, David Barrera y Manuel Guevara), a futuros colaboradores y a los proveedores que traten información de AhorrApp. Cubre la aplicación web y móvil, el backend, la base de datos, los repositorios y las cuentas administrativas, alojados en Render (backend, Oregón, EE. UU.) y Amazon Web Services (frontend y base de datos, región del este de EE. UU.), más Google (inicio de sesión) y la pasarela de pagos. Abarca datos de cuenta, datos financieros, comprobantes OCR/QR, datos de pago, código fuente y credenciales. El equipo trabaja de forma remota.

## 2. Roles y responsabilidades

Las responsabilidades se asignan por rol; una persona puede tener varios. Cada rol debe tener titular y, en lo posible, suplente.

| Rol | Responsabilidades | Titular / Suplente |
|---|---|---|
| **Alta dirección (Comité de Seguridad):** los cuatro integrantes | Aprobar la política, asignar recursos, aceptar el riesgo residual y revisar el SGSI al menos una vez al año | Los cuatro |
| **Responsable de Seguridad de la Información (RSI)** | Mantener la política y el registro de riesgos, medir indicadores, coordinar incidentes, capacitar y llevar el acta de revisión | ________ / ________ |
| **Responsable de Infraestructura y Desarrollo (RID)** | Operar Render y AWS; gestionar despliegues, respaldos, vulnerabilidades, secretos y cuentas técnicas | ________ / ________ |
| **Responsable de Protección de Datos Personales (RPD)** | Atender consultas y reclamos, custodiar autorizaciones, mantener la política de datos y atender el RNBD si aplica | ________ / ________ |
| **Integrantes y usuarios** | Cumplir esta política (equipo) y el contrato de servicios (usuarios); proteger credenciales y reportar incidentes | Todos |

**Segregación de funciones:** cuando sea posible, el cambio en producción lo aprueba una persona distinta de quien lo desarrolló.

## 3. Definiciones

**Activo de información:** todo lo que tiene valor y requiere protección (datos, código, credenciales, servicios, dispositivos). **Confidencialidad, integridad y disponibilidad:** acceso solo a autorizados, información exacta y servicio accesible cuando se necesita. **SGSI:** Sistema de Gestión de Seguridad de la Información. **Riesgo:** probabilidad de un evento por su impacto. **Incidente de seguridad:** evento que compromete la confidencialidad, integridad o disponibilidad de la información. **Riesgo residual:** el que queda tras aplicar controles. **Datos personales, titular, responsable y tratamiento:** tienen el sentido de la Ley 1581 de 2012.

## 4. Marco normativo

| Norma | Relación con la seguridad |
|---|---|
| Constitución, art. 15 | Intimidad y habeas data |
| Ley 1581 de 2012 y Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) | Protección de datos. Principio de seguridad (art. 4) y deber del responsable de conservar la información con condiciones de seguridad (art. 17) |
| Circular Única de la SIC | RNBD, transferencias internacionales e incidentes de seguridad |
| Ley 1273 de 2009 | Delitos informáticos |
| Ley 1480 de 2011 (modificada por la Ley 2439 de 2024) y Ley 527 de 1999 | Consumidor, comercio y firma electrónica |
| Ley 23 de 1982 | Derechos de autor del software |
| ISO/IEC 27001:2022 | Norma de referencia del SGSI |

AhorrApp actualizará esta tabla cuando cambie el marco legal, incluidas las reformas a la Ley 1581 que lleguen a aprobarse.

## 5. Declaración de la política y compromiso de la dirección

La información de los usuarios de AhorrApp es financiera y personal, y protegerla es condición para prestar el servicio. AhorrApp se compromete a: (1) proteger la confidencialidad, integridad y disponibilidad de la información; (2) cumplir los requisitos legales y contractuales aplicables; (3) gestionar la seguridad con un enfoque basado en riesgos; (4) aplicar medidas técnicas, humanas y administrativas proporcionadas; (5) responder con rapidez a los incidentes e informar a los afectados en los plazos fijados; (6) capacitar al equipo; y (7) mejorar de forma continua el SGSI.

La alta dirección asigna los recursos necesarios, revisa el SGSI al menos una vez al año y trata la seguridad de la información como un riesgo prioritario del proyecto.

**Principios:** enfoque basado en riesgos, mínimo privilegio, defensa en profundidad, segregación de funciones, seguridad desde el diseño, minimización de datos, responsabilidad individual y colectiva, y mejora continua.

## 6. Alcance del SGSI

**Procesos incluidos:** diseño, desarrollo, operación, soporte y atención de usuarios; gestión de cuentas y membresías; atención de consultas y reclamos; gestión del equipo.

| Contexto | Factores a considerar |
|---|---|
| **Interno** | Crecimiento de usuarios y datos; cambios en el equipo; nuevos servicios de terceros; nuevas funciones (OCR, voz); conocimiento concentrado en pocas personas; recursos limitados |
| **Externo** | Cambios en la Ley 1581 y en la SIC; reglas del consumidor; políticas de las tiendas de aplicaciones; fallas o cambios de proveedores de nube, inicio de sesión y pagos; aumento de amenazas informáticas |

**Partes interesadas:** usuarios (datos protegidos y derechos), equipo (reglas claras), SIC (cumplimiento), proveedores y tiendas de aplicaciones (uso conforme a sus términos) y evaluadores del proyecto (evidencia de buenas prácticas).

**Exclusiones:** A.8.30 (el desarrollo lo hace el propio equipo), A.8.23 (sin red corporativa propia), A.8.17 (relojes gestionados por los proveedores de nube) y A.7.1 a A.7.6, A.7.11 y A.7.12 (sin instalaciones propias; la protección física la ejercen Render y AWS). Se revisan si cambian las circunstancias.

## 7. Objetivos de seguridad e indicadores

| # | Objetivo | Indicador y meta | Frecuencia | Resp. |
|---|---|---|---|---|
| 1 | Atender incidencias | 95 % de las críticas respondidas en 1 hora (horario de atención) | Mensual | RSI |
| 2 | Informar incidentes | 100 % de incidentes con datos personales informados a los titulares en menos de 72 horas | Por incidente | RPD |
| 3 | Atender derechos de titulares | 100 % de consultas en 10 días hábiles y reclamos en 15 | Trimestral | RPD |
| 4 | Corregir vulnerabilidades | Críticas en 7 días y altas en 30 días | Mensual | RID |
| 5 | Garantizar la recuperación | Al menos 1 prueba de restauración exitosa cada 6 meses | Semestral | RID |
| 6 | Controlar accesos | Revisión de accesos privilegiados cada 3 meses | Trimestral | RSI |
| 7 | Capacitar al equipo | 100 % del equipo capacitado al año | Anual | RSI |
| 8 | Mantener el SGSI | 1 revisión anual de política, riesgos y objetivos | Anual | RSI |

## 8. Gestión de riesgos

AhorrApp gestiona los riesgos conforme a la ISO/IEC 27005: identifica activos, amenazas y vulnerabilidades (Anexo C), valora cada riesgo con **probabilidad (1 a 5) × impacto (1 a 5)** y lo trata (reducir, evitar, transferir o aceptar).

| Nivel | Puntaje | Criterio de aceptación |
|---|---|---|
| Bajo | 1–4 | Aceptable; se monitorea |
| Medio | 5–9 | Aceptable con seguimiento y controles básicos |
| Alto | 10–15 | Requiere plan de tratamiento con responsable y fecha |
| Crítico | 16–25 | Tratamiento inmediato y aprobación de la alta dirección para operar |

La alta dirección acepta el riesgo residual y queda registrado. El registro se revisa al menos una vez al año, ante cambios importantes (alcance, activos, proveedores, normativa) y tras un incidente grave.

## 9. Políticas específicas

Esta política se desarrolla en las políticas del Anexo A: **A1** acceso e identidades, **A2** criptografía, **A3** copias de seguridad, **A4** incidentes, **A5** continuidad, **A6** proveedores y nube, **A7** desarrollo seguro y vulnerabilidades, **A8** clasificación, retención y supresión, **A9** dispositivos y trabajo remoto, **A10** registros y monitoreo. El Anexo B las relaciona con los controles de la ISO/IEC 27001:2022.

## 10. Cumplimiento y consecuencias

Cumplir esta política es obligatorio. El incumplimiento se evalúa según su gravedad y puede dar lugar a llamado de atención, retiro de accesos, separación del proyecto o acciones legales. Los integrantes y colaboradores firman un compromiso de confidencialidad y cumplimiento. A los usuarios se les aplica el contrato de servicios (Cláusulas 13 y 17) y a los proveedores, la revisión o terminación de la relación. Las excepciones requieren aprobación escrita de la alta dirección, con justificación, riesgo y fecha de vencimiento.

## 11. Comunicación y capacitación

La política se guarda en el repositorio documental del equipo y su versión pública se publica en la plataforma. Cada integrante nuevo la lee y confirma su recibo por escrito; el RSI conserva los registros. Se capacita al equipo en seguridad y datos personales al menos una vez al año y al ingresar nuevos integrantes, con una breve evaluación y evidencia. Cada nueva versión se comunica por correo. A los usuarios se les informa mediante el aviso de privacidad, la política de datos y el contrato.

## 12. Revisión y mejora continua

La alta dirección revisa la política y el SGSI **al menos una vez al año**, considerando indicadores, incidentes, riesgos, cambios legales, cambios de proveedores y resultados de pruebas, y de forma extraordinaria ante un incidente grave, una reforma legal relevante, un cambio de proveedor o de arquitectura, o nuevas funciones que traten nuevos datos. La revisión se documenta en un acta, aunque no haya cambios. Al menos una vez al año una persona ajena al desarrollo (docente, asesor o auditor externo) revisa la aplicación de la política, en lo posible. Se lleva un registro de no conformidades y acciones correctivas.

## 13. Aprobación y control de versiones

| Versión | Descripción | Elaboró | Revisó | Aprobó |
|---|---|---|---|---|
| 1.0 | Creación de la política, alineada con la ISO/IEC 27001:2022 | ________ | ________ | Alta dirección |

| Nombre | Rol | Firma | Fecha |
|---|---|---|---|
| Juan Medina | Alta dirección | ____________ | ________ |
| Santiago Hurtado | Alta dirección | ____________ | ________ |
| Manuel Guevara | Alta dirección | ____________ | ________ |
| David Barrera | Alta dirección | ____________ | ________ |

---

# Anexo A. Políticas específicas

*RSI = Responsable de Seguridad de la Información; RID = Responsable de Infraestructura y Desarrollo; RPD = Responsable de Protección de Datos Personales.*

**A1. Control de acceso, identidades y contraseñas (RID).** Acceso solo según necesidad y con mínimo privilegio. Cuentas personales, sin compartirlas. Autenticación multifactor en Render, AWS, repositorio, correo del proyecto y gestor de contraseñas. Contraseñas largas y únicas en un gestor. En la plataforma, roles User, Admin y Superuser (este último limitado y revisado cada 3 meses), contraseñas solo con hash bcrypt, sesiones con JWT con vencimiento y PIN o biometría para acciones sensibles. Al salir un integrante se retiran sus accesos y se rotan los secretos que conocía el mismo día. El acceso a datos reales de usuarios es excepcional, solo para soporte o incidentes, y no se modifican datos financieros salvo por función técnica u orden de autoridad. El RSI revisa los accesos cada 3 meses.

**A2. Criptografía (RID).** Toda comunicación usa HTTPS/TLS. Contraseñas con bcrypt, sin algoritmos obsoletos. Cifrado en reposo de la base de datos y los respaldos cuando el proveedor lo permita. Claves, secretos de JWT y credenciales en el gestor de secretos o en variables de entorno del proveedor, **nunca en el repositorio**. Rotación al menos anual y de inmediato ante sospecha de exposición. Solo algoritmos y librerías estándar y vigentes. La biometría se procesa en el dispositivo; AhorrApp no guarda huellas ni imágenes del rostro.

**A3. Copias de seguridad y recuperación (RID).** Copias periódicas de la base de datos con la frecuencia máxima que permita la infraestructura contratada, protegidas como los datos originales y, cuando sea posible, con una copia en un servicio distinto del principal. Pruebas de restauración al menos cada 6 meses, con registro de fecha, resultado y tiempo. Las copias antiguas se eliminan o sobrescriben de forma periódica. Se verifica y documenta qué cubre el plan de infraestructura contratado.

**A4. Gestión de incidentes (RSI).** Todo evento sospechoso se reporta de inmediato al RSI; los usuarios pueden hacerlo a proyectofinanzassena@gmail.com. El RSI lo clasifica (crítico, alto, medio, bajo, como en el SLA), contiene, erradica, recupera y verifica. Se conserva la evidencia sin alterarla. Si hay datos personales afectados, el RPD informa a los titulares en un máximo de **72 horas** y, cuando la ley lo exija, a la SIC según sus instrucciones vigentes. Cada incidente se registra (fecha, causa, impacto, acciones) y los críticos o altos se revisan para actualizar riesgos y controles. Se mantiene un listado de contactos de proveedores y autoridades.

**A5. Continuidad del servicio (RID).** Se identifican los componentes críticos (backend, base de datos, autenticación, pagos) y se documenta un procedimiento breve para restaurar la base de datos, redesplegar y comunicar a los usuarios. Se vigila el uso y los límites del plan de infraestructura. Se informa a los usuarios durante una interrupción y se hace un informe interno al restablecer. El conocimiento crítico se documenta para no depender de una sola persona.

**A6. Proveedores y servicios en la nube (RID, con apoyo del RPD).** Se mantiene un inventario de proveedores (Render, AWS, Google, pasarela de pagos y proveedores de OCR, voz y datos de mercado). Antes de usar uno nuevo se revisan sus condiciones de seguridad y privacidad y el país de alojamiento. Se documenta el modelo de responsabilidad compartida: el proveedor protege la infraestructura y AhorrApp sus configuraciones, accesos y datos. Si trata datos personales, se verifica que cumpla la Ley 1581 y que el usuario haya autorizado la transmisión internacional. La base de datos no debe ser pública cuando sea posible, con reglas de firewall mínimas y acceso administrativo solo con autenticación multifactor. Se revisan los proveedores al menos una vez al año y se planifica su salida para recuperar o eliminar los datos.

**A7. Desarrollo seguro y vulnerabilidades (RID).** Cada nueva función se analiza desde la seguridad y la privacidad. Codificación segura: validar entradas, consultas parametrizadas, control de acceso por rol en el servidor y sin datos sensibles en errores. Revisión de código por otro integrante cuando sea posible. Se mantiene la lista de dependencias y se actualizan las que tengan fallas conocidas. Antes de publicar se prueba autenticación, roles, sincronización y OCR/QR, y se guarda la evidencia. Entornos de desarrollo, pruebas y producción separados, **sin datos reales en pruebas**. Todo cambio en producción se registra (qué, quién, cuándo) y tiene plan de reversión. Vulnerabilidades críticas en 7 días y altas en 30. Repositorio privado, sin secretos y con análisis de secretos cuando esté disponible.

**A8. Clasificación, retención y supresión (RPD).** Niveles: **Pública** (política de datos, contrato), **Interna** (documentación técnica), **Confidencial** (datos de usuarios, copias de seguridad, comprobantes) y **Restringida** (credenciales, secretos, cuentas administrativas). La información confidencial y restringida no se envía por canales sin cifrar ni por mensajería personal. Retención de datos de usuarios: mientras la cuenta esté activa; tras cerrarla, 30 días para exportar y supresión o anonimización dentro de los 60 días siguientes, salvo exigencia legal (Contrato, Cláusula 11.8). La supresión considera las copias de seguridad. A solicitud se emite certificado de eliminación. Se conservan los registros de aceptación (fecha, hora y versión) y se recolectan solo los datos necesarios.

**A9. Dispositivos, trabajo remoto y escritorio limpio (RSI).** Los equipos de trabajo tienen sistema actualizado, bloqueo automático, cifrado de disco y antivirus o protección equivalente, y solo software de fuentes confiables. Se trabaja desde redes de confianza o con VPN, sin exponer datos de usuarios a terceros. Se bloquea la pantalla al ausentarse y no se dejan visibles credenciales ni datos. No se guardan datos confidenciales en medios extraíbles sin cifrar ni se descargan datos de usuarios a equipos personales, salvo de forma temporal y cifrada. La pérdida o robo de un dispositivo se reporta de inmediato y se revocan sus sesiones. Al salir un integrante o dar de baja un equipo se retiran accesos y se borran los datos de AhorrApp. No se abren enlaces ni archivos sospechosos y se reportan los intentos de phishing.

**A10. Registros y monitoreo (RID).** Se registran inicios de sesión y fallos, cambios de rol, accesos administrativos, errores y despliegues. **No se registran contraseñas, tokens completos, PIN ni datos financieros completos.** Los registros se protegen contra alteración, se conservan unos 90 días (más si un incidente lo exige) y solo acceden el RID y el RSI. Se revisan periódicamente para detectar actividad anómala. Se restringen las exportaciones masivas y se revisan los accesos públicos de la nube. Las pruebas de seguridad en producción se planifican para no afectar el servicio ni exponer datos.

---

# Anexo B. Mapa de controles de la ISO/IEC 27001:2022

*Uso interno. Relaciona los 93 controles del Anexo A de la norma con la política que los cubre: 82 aplican y 11 no. Estado general: **Implementado** (opera según la documentación del proyecto), **Parcial** o **Por implementar** (regla definida, falta ponerla en práctica). Debe verificarse con el equipo técnico en cada revisión.*

| Política o sección | Controles que cubre | Estado |
|---|---|---|
| Secciones 2, 5 y 10 a 12 (gobierno y personas) | 5.1–5.4, 5.6, 5.31, 5.35–5.37, 6.1–6.4, 6.6 | Parcial |
| A1. Acceso e identidades | 5.15–5.18, 6.5, 8.2–8.5, 8.18 | Parcial (roles, bcrypt, JWT y PIN operan) |
| A2. Criptografía | 5.14, 8.24 | Implementado |
| A3. Copias de seguridad | 8.13, 8.14 | Parcial |
| A4. Incidentes | 5.5, 5.24–5.28, 6.8 | Parcial |
| A5. Continuidad | 5.29, 5.30, 8.6 | Por implementar |
| A6. Proveedores y nube | 5.19–5.23, 8.20–8.22 | Parcial |
| A7. Desarrollo seguro | 5.7, 5.8, 8.8, 8.9, 8.19, 8.25–8.29, 8.31–8.33 | Parcial |
| A8. Clasificación y retención | 5.12, 5.13, 5.33, 5.34, 8.10 | Parcial |
| A9. Dispositivos y trabajo remoto | 5.10, 5.11, 6.7, 7.7–7.10, 7.13, 7.14, 8.1, 8.7 | Por implementar |
| A10. Registros y monitoreo | 8.11, 8.12, 8.15, 8.16, 8.34 | Parcial |
| Anexo C (inventario) | 5.9 | Implementado |
| Contrato de servicios, Cláusula 14 | 5.32 | Implementado |

**Controles que no aplican (11):**

| Control | Justificación |
|---|---|
| 7.1 a 7.6 (perímetros, entrada, oficinas, monitoreo físico, amenazas ambientales, áreas seguras) | Sin instalaciones propias; la protección física la ejercen Render y AWS |
| 7.11 y 7.12 (servicios de apoyo y cableado) | Sin instalaciones propias |
| 8.17 (sincronización de relojes) | Delegado en los proveedores de nube |
| 8.23 (filtrado web) | Sin red corporativa propia |
| 8.30 (desarrollo externalizado) | El desarrollo lo realiza el propio equipo |

**Relación con la Ley 1581 y el contrato:** el principio de seguridad (art. 4) y el deber del art. 17 se atienden con las políticas A1 a A10. El contrato de servicios (Cláusulas 10, 11.5, 11.6, 11.8 y 12) se sustenta en A1, A2, A3, A4, A6 y A8.

---

# Anexo C. Riesgos iniciales e inventario de activos

*Uso interno. P = probabilidad y I = impacto, de 1 a 5.*

## C.1 Registro inicial de riesgos

| ID | Riesgo | P×I | Nivel | Tratamiento | Resp. |
|---|---|---|---|---|---|
| R1 | Acceso no autorizado a cuentas de usuarios por credenciales robadas o débiles | 3×4 | 12 Alto | Hash bcrypt, JWT con vencimiento, PIN/biometría, límite de intentos | RID |
| R2 | Exposición de la base de datos por configuración insegura | 2×5 | 10 Alto | Acceso restringido, cifrado, revisión de la configuración de AWS | RID |
| R3 | Pérdida de datos por falla de infraestructura o error humano | 3×5 | 15 Alto | Copias periódicas y pruebas de restauración semestrales | RID |
| R4 | Indisponibilidad por falla o límite del proveedor de nube | 3×3 | 9 Medio | Monitoreo de capacidad, plan de recuperación, aviso a usuarios | RID |
| R5 | Vulnerabilidades en código o librerías de terceros | 3×4 | 12 Alto | Revisión de dependencias, pruebas de seguridad, corrección en 7 o 30 días | RID |
| R6 | Filtración de secretos en el repositorio | 2×5 | 10 Alto | Secretos fuera del código, análisis de secretos, rotación | RID |
| R7 | Incumplimiento de la Ley 1581 (autorizaciones, plazos) | 2×4 | 8 Medio | Registro de autorizaciones, seguimiento de plazos, capacitación | RPD |
| R8 | Error de despliegue que afecte producción | 3×3 | 9 Medio | Gestión de cambios, plan de reversión, entornos separados | RID |
| R9 | Pérdida o robo de un dispositivo de un integrante | 2×4 | 8 Medio | Cifrado de disco, bloqueo, revocación de sesiones | RSI |
| R10 | Phishing o suplantación dirigida al equipo | 3×4 | 12 Alto | Autenticación multifactor, capacitación, verificación de mensajes | RSI |

## C.2 Inventario de activos de información

| Activo | Propietario | Clasificación |
|---|---|---|
| Base de datos de usuarios (PostgreSQL en AWS) y datos financieros | RID / RPD | Confidencial |
| Comprobantes e imágenes OCR/QR | RPD | Confidencial |
| Datos de membresía y pago (la pasarela guarda los datos completos) | RPD | Confidencial |
| Copias de seguridad | RID | Confidencial |
| Código fuente (web, móvil y backend) | RID | Confidencial |
| Secretos, credenciales y cuentas administrativas (Render, AWS, repositorio, correo) | RID | Restringida |
| Registros (logs) y servicios de terceros (Render, AWS, Google, pasarela, OCR/voz) | RID | Interna |
| Dispositivos del equipo y documentación del proyecto | RSI | Interna |
| Contrato, política de datos y versión pública de esta política | RSI | Pública |