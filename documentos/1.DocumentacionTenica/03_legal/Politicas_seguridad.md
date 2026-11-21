# Política General de Seguridad de la Información — AhorrApp

20 de noviembre de 2026

Esta política define cómo AhorrApp protege la confidencialidad, integridad y disponibilidad de la información financiera de sus usuarios, conforme a ISO/IEC 27001:2022 y a la ley colombiana.

## 1. Control del documento

| Campo | Detalle |
| --- | --- |
| Código | AHORRAPP-POL-SI-001 |
| Versión | 1.0 (borrador para aprobación) |
| Proceso | Seguridad de la información |
| Clasificación | Público |
| Norma de referencia | ISO/IEC 27001:2022, cláusula 5.2 |
| Elaboró | Equipo de desarrollo AhorrApp (Juan Medina, Santiago Hurtado, David Barrera, Manuel Guevara) |
| Aprobó | [Nombre y cargo — por definir] |
| Fecha de aprobación | [Por definir] |
| Próxima revisión | 12 meses después de la aprobación |
| Contacto | proyectofinanzassena@gmail.com |

## 2. Propósito y alcance

**Propósito.** Establecer el marco de gobierno del Sistema de Gestión de Seguridad de la Información (SGSI) de AhorrApp, para proteger la información financiera personal que los usuarios confían a la plataforma, cumplir la ley colombiana y mejorar de forma continua.

**Alcance.** El SGSI cubre el diseño, desarrollo, operación, soporte y mantenimiento de AhorrApp como servicio multiplataforma de gestión financiera personal:

- Aplicación web (React, Vite, Tailwind CSS) y aplicación móvil (Flutter, Android e iOS).
- Backend (Node.js, Express) alojado en Render, y base de datos PostgreSQL y frontend web alojados en Amazon Web Services (AWS).
- Integraciones: inicio de sesión con Google, OCR/QR, registro por voz, exportación a PDF, APIs de noticias e indicadores y pasarela de pagos de un tercero.
- Los roles de usuario (User, Admin y Superuser), el equipo de desarrollo y los proveedores que tratan datos por cuenta de AhorrApp.

**Fuera del alcance.** AhorrApp no maneja dinero real, no realiza transacciones bancarias ni administra fondos de terceros. La seguridad de los dispositivos personales de los usuarios es responsabilidad de cada usuario, conforme a la Cláusula 10.4 del Contrato de Servicios.

Este alcance debe mantenerse idéntico en la Declaración de Aplicabilidad (SoA) y en cualquier certificación futura.

**Aplicación.** La política obliga a los integrantes del equipo y a toda persona o proveedor con acceso a los sistemas o datos de AhorrApp.

## 3. Definiciones

| Término | Significado |
| --- | --- |
| Confidencialidad | La información solo es accesible a quien está autorizado. |
| Integridad | La información es exacta y no se altera sin autorización. |
| Disponibilidad | La información y el servicio están accesibles cuando se necesitan. |
| Activo de información | Todo lo que tiene valor para AhorrApp: datos de usuarios, código fuente, credenciales, bases de datos, documentación e infraestructura. |
| SGSI | Sistema de Gestión de Seguridad de la Información. |
| SoA | Declaración de Aplicabilidad: lista los controles del Anexo A de ISO 27001:2022 y justifica si se aplican o no. |
| Incidente de seguridad | Evento que compromete la confidencialidad, integridad o disponibilidad de los datos del usuario (Contrato, Cláusula 1). |
| Datos personales | Información vinculada o asociable a una persona natural determinada o determinable (Ley 1581 de 2012). |
| Responsable / Encargado | Responsable: quien decide sobre el tratamiento de los datos (AhorrApp). Encargado: tercero que los trata por cuenta del Responsable (Render, AWS, Google, pasarela de pagos). |
| Riesgo residual | Riesgo que permanece después de aplicar los controles. |

## 4. Principios y objetivos de seguridad

**Principios rectores:**

- Seguridad basada en riesgos: los controles se eligen según el riesgo real para los datos del usuario.
- Mínimo privilegio: cada rol (User, Admin, Superuser) accede solo a lo que necesita.
- Defensa en profundidad: contraseñas con hash, tokens, cifrado en tránsito y verificación adicional para acciones sensibles.
- Minimización de datos: la biometría se procesa en el dispositivo del usuario y AhorrApp no guarda huellas ni imágenes del rostro.
- Responsabilidad demostrada: se conserva evidencia de lo que se hace (autorizaciones, versiones aceptadas, pruebas, incidentes).
- Mejora continua del SGSI.

**Objetivos medibles.** Las metas con plazos ya figuran en el Contrato de Servicios; las marcadas como *propuesta* deben confirmarse antes de la aprobación.

| Objetivo | Indicador | Meta | Revisión |
| --- | --- | --- | --- |
| Informar incidentes que afecten datos personales | Horas entre el conocimiento del incidente y el aviso al usuario | 72 h máximo (Contrato 10.3) | Por incidente |
| Restablecer el servicio ante fallas críticas | Tiempo de resolución de incidencias críticas | 24 h máximo (Contrato 8.6) | Trimestral |
| Atender los derechos de los titulares | Días hábiles de respuesta | Consultas 10 días; reclamos 15 días (Contrato 11.4) | Trimestral |
| Garantizar la recuperación de datos | Pruebas de restauración de la base de datos exitosas | Mínimo 1 por semestre (*propuesta*) | Semestral |
| Mantener consciencia en seguridad | Integrantes capacitados en seguridad y protección de datos | 100 % cada año (*propuesta*) | Anual |
| Reducir vulnerabilidades técnicas | Vulnerabilidades críticas en dependencias sin corregir | 0 tras 30 días de detectadas (*propuesta*) | Mensual |
| Mantener el SGSI vigente | Revisión formal de riesgos y de esta política | 1 por año | Anual |

## 5. Compromiso de la dirección

La dirección de AhorrApp, conformada por los cuatro integrantes del equipo, asume la seguridad de la información como un riesgo de primer nivel del negocio y se compromete a:

- Liderar el SGSI y aprobar esta política.
- Asignar el tiempo, las herramientas y el presupuesto necesarios para mantener y mejorar los controles.
- Exigir su cumplimiento a todo el equipo y a los proveedores con acceso a datos.
- Cumplir la Ley 1581 de 2012, sus decretos y las demás normas del capítulo 7.
- Revisar el SGSI al menos una vez al año y tras cualquier cambio relevante.
- Promover la mejora continua con base en incidentes, pruebas y auditorías.

## 6. Roles y responsabilidades

Los roles se asignan por función, no por nombre. Una misma persona puede ocupar varios roles; los nombres se registran en el acta de designación y se actualizan sin cambiar esta política.

| Rol | Responsabilidad | Designado |
| --- | --- | --- |
| Dirección | Aprueba la política, asigna recursos, decide sobre el riesgo residual y revisa el SGSI cada año. | Equipo AhorrApp |
| Responsable de seguridad de la información | Mantiene el SGSI, la SoA y el análisis de riesgos; coordina incidentes y mide los objetivos. | [Por designar] |
| Responsable de protección de datos | Atiende consultas y reclamos de los titulares, mantiene las autorizaciones y la política de tratamiento, y gestiona el RNBD. | [Por designar] |
| Responsable de infraestructura | Opera Render y AWS, gestiona accesos, parches, respaldos y registros. | [Por designar] |
| Responsables de desarrollo (web, móvil, backend) | Aplican prácticas de desarrollo seguro, revisan código y corrigen vulnerabilidades. | [Por designar] |
| Superuser y Admin | Administran cuentas y accesos dentro del panel, con acceso mínimo a datos financieros y solo cuando es necesario (Contrato 11.5). | Según panel administrativo |
| Integrantes del equipo | Cumplen la política, protegen sus credenciales y reportan incidentes de inmediato. | Todos |
| Usuarios | Custodian sus credenciales y PIN, y mantienen seguro su dispositivo (Contrato 5 y 10.4). | — |

## 7. Marco normativo

AhorrApp se compromete a cumplir las siguientes normas colombianas. En Colombia reemplazan al RGPD, la LOPDGDD y el ENS que usan las plantillas españolas.

| Norma | Qué exige a esta política |
| --- | --- |
| Ley 1581 de 2012 y Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) | Autorización previa, política de tratamiento, derechos del titular, medidas de seguridad, registro de bases de datos y reporte de incidentes. |
| Circular Única de la Superintendencia de Industria y Comercio (SIC) | Instrucciones sobre el RNBD, transferencias internacionales y responsabilidad demostrada. |
| Ley 1273 de 2009 | Delitos informáticos; el acceso no autorizado a los sistemas es sancionable. |
| Ley 1480 de 2011 (modificada por la Ley 2439 de 2024) | Derechos del consumidor, retracto y reversión de pagos. |
| Ley 527 de 1999 | Validez de la aceptación y de la firma electrónica. |
| Ley 23 de 1982 | Propiedad intelectual del software. |

Al cambiar la normativa, se actualiza este capítulo en la revisión extraordinaria del capítulo 13. Esta política no es asesoría jurídica; un abogado debe validar el capítulo antes de su aprobación.

## 8. Gestión de riesgos

AhorrApp gestiona la seguridad con un enfoque basado en riesgos (ISO 27001, cláusulas 6.1 y 8.2–8.3). La metodología será ISO/IEC 27005 [a confirmar por la dirección] y se documenta en un procedimiento aparte.

- Cada riesgo se valora por probabilidad e impacto en una escala de 1 a 5.
- La dirección define el nivel de riesgo aceptable y aprueba el riesgo residual.
- El análisis se revisa al menos una vez al año y cuando cambien el alcance, la arquitectura, un proveedor o la normativa.

**Riesgos prioritarios identificados** con base en la arquitectura actual:

| Riesgo | Activo afectado | Tratamiento principal |
| --- | --- | --- |
| Acceso no autorizado a cuentas de usuarios | Datos financieros | Hash bcrypt, JWT, PIN o biometría, roles |
| Pérdida o corrupción de la base de datos | PostgreSQL en AWS | Copias periódicas y pruebas de restauración |
| Caída o incidente en Render, AWS o Google | Backend, frontend, login | Selección de proveedores y plan de continuidad |
| Fuga de secretos (claves JWT, credenciales de infraestructura) | Backend y nube | Gestión de secretos y mínimo privilegio |
| Vulnerabilidades en dependencias y código | Web, móvil, backend | Revisión de código y actualización de dependencias |
| Transferencia internacional de datos sin garantías | Datos personales en EE. UU. | Autorización expresa, cláusulas con Encargados |

## 9. Controles de seguridad y Anexo A

Esta tabla resume los controles que AhorrApp declara en sus documentos comerciales y los vincula con el Anexo A de ISO 27001:2022. El estado refleja lo documentado hoy y debe verificarse contra el sistema real antes de aprobar. La justificación completa de los 93 controles vive en la Declaración de Aplicabilidad (SoA), documento aparte.

| Control (Anexo A) | Cómo se aplica en AhorrApp | Estado |
| --- | --- | --- |
| 5.15 / 8.2 Control de acceso y privilegios | Roles User, Admin y Superuser, con restricciones por rol. | Implementado |
| 5.17 / 8.5 Autenticación segura | Contraseñas con hash bcrypt, tokens JWT, inicio de sesión con Google, PIN o biometría en acciones sensibles. | Implementado |
| 8.24 Uso de criptografía | Cifrado de la información en redes públicas. Falta documentar algoritmos y gestión de claves. | Parcial |
| 8.26 / 8.28 Seguridad de aplicaciones y codificación segura | Validación de datos de entrada. | Parcial |
| 8.13 Copias de seguridad | Copias periódicas de la base de datos, sin plazo de retención ni tiempo de restauración definidos. | Parcial |
| 8.15 Registro y 8.16 Monitoreo | Registro de acciones y alertas de acceso. | Por implementar |
| 8.8 Gestión de vulnerabilidades técnicas | Revisión de dependencias y parches. | Por implementar |
| 5.19–5.23 Proveedores y servicios en la nube | Render, AWS, Google y pasarela de pagos como Encargados (Contrato, Anexo E). | Parcial |
| 5.24–5.28 Gestión de incidentes | Aviso al usuario en 72 h (Contrato 10.3). Falta el procedimiento interno. | Por documentar |
| 5.34 Privacidad y protección de datos personales | Autorización, política de tratamiento, atención de derechos. | Implementado |
| 5.29 / 5.30 Continuidad | Plan de recuperación ante falla de proveedor. | Por implementar |
| 6.3 Concienciación y formación | Capacitación anual del equipo. | Por implementar |

## 10. Protección de datos personales y proveedores

AhorrApp es el Responsable del tratamiento de los datos de sus usuarios y se obliga a:

- Obtener autorización previa, expresa e informada al registrarse, y una autorización separada y opcional para cualquier información comercial.
- Publicar la Política de Tratamiento de Datos Personales (versión 2.0) y el aviso de privacidad, y conservar el registro de la fecha, hora y versión aceptada.
- Atender consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles.
- No tratar datos biométricos: la verificación se hace en el dispositivo y no se condiciona el servicio a datos sensibles.
- Registrar sus bases de datos en el Registro Nacional de Bases de Datos (RNBD) cuando la norma lo exija.
- No vender los datos ni cederlos a terceros para fines propios de estos.

**Proveedores y Encargados.** Render, AWS, Google, la pasarela de pagos y los proveedores de OCR, voz y datos de mercado se listan en el Anexo E del Contrato.

- Antes de contratar o activar un proveedor, el responsable de seguridad revisa sus condiciones de seguridad y la ubicación de los servidores.
- Los Encargados deben garantizar confidencialidad y medidas de seguridad adecuadas.
- Los datos se alojan en Estados Unidos con autorización expresa del usuario. Un abogado debe confirmar que esta transferencia internacional cumple el artículo 26 de la Ley 1581 de 2012 y la Circular Única de la SIC.
- AhorrApp no almacena datos completos de tarjetas o cuentas; los procesa la pasarela de pagos.

## 11. Incidentes, respaldo y continuidad

**Gestión de incidentes.** Todo integrante reporta de inmediato cualquier sospecha de incidente al responsable de seguridad. El procedimiento sigue seis pasos:

1. Detectar y registrar el evento con fecha y hora.
2. Clasificar su gravedad (crítica, alta, media, baja), con los criterios del Anexo C del Contrato.
3. Contener el incidente y proteger las evidencias.
4. Informar al usuario afectado en máximo 72 horas desde que se conoce, indicando qué ocurrió, qué datos se vieron afectados y qué medidas se tomaron.
5. Reportar a la Superintendencia de Industria y Comercio cuando corresponda.
6. Corregir la causa y registrar las lecciones aprendidas.

**Respaldo y recuperación.** Las copias de seguridad de la base de datos son periódicas. La dirección definirá, como metas internas y sin modificar lo prometido en el Contrato (Cláusula 12), los valores de esta tabla:

| Parámetro | Valor |
| --- | --- |
| Frecuencia de copia | [Por definir] |
| Retención | [Por definir] |
| Tiempo máximo de restauración (RTO) | [Por definir] |
| Pérdida máxima aceptable de datos (RPO) | [Por definir] |
| Prueba de restauración | Mínimo 1 por semestre (*propuesta*) |

**Continuidad.** El responsable de infraestructura documenta cómo restablecer el servicio si Render, AWS o Google fallan, y el plan se prueba una vez al año.

## 12. Políticas específicas relacionadas

Esta política marco no entra en detalle operativo. Convoca estas políticas, que deben elaborarse y aprobarse por separado:

| Política | Qué regula | Controles Anexo A | Prioridad |
| --- | --- | --- | --- |
| Control de acceso y gestión de identidades | Altas y bajas de usuarios internos, roles, privilegios y credenciales | 5.15, 5.16, 5.18, 8.2 | Alta |
| Criptografía y gestión de secretos | Algoritmos, claves JWT, variables de entorno, rotación | 8.24 | Alta |
| Copias de seguridad y continuidad | Frecuencia, retención, restauración, RTO y RPO | 8.13, 8.14, 5.29, 5.30 | Alta |
| Gestión de incidentes | Clasificación, escalado y notificación a usuarios y a la SIC | 5.24–5.28 | Alta |
| Desarrollo seguro y gestión de vulnerabilidades | Revisión de código, pruebas, dependencias, parches | 8.8, 8.25–8.29 | Alta |
| Tratamiento de datos personales | Autorizaciones, derechos del titular, RNBD, retención | 5.34 | Alta |
| Seguridad con proveedores y nube | Evaluación, cláusulas, seguimiento de Render, AWS, Google y pasarela | 5.19–5.23 | Media |
| Clasificación y retención de la información | Categorías de información, plazos de conservación y supresión (30 y 60 días del Contrato) | 5.12, 5.13, 8.10 | Media |
| Uso aceptable y trabajo remoto | Uso de equipos y cuentas personales para trabajar en AhorrApp | 5.10, 6.7, 8.1 | Media |
| Registro y monitoreo | Qué se registra, quién lo ve, cuánto se conserva | 8.15, 8.16 | Media |

## 13. Cumplimiento, comunicación y revisión

**Cumplimiento.** Incumplir esta política puede acarrear la terminación de la colaboración con el integrante o proveedor y la suspensión de sus accesos. El acceso no autorizado a los sistemas es además conducta sancionable conforme a la Ley 1273 de 2009. Las excepciones se aprueban por escrito por la dirección y se registran con fecha de vencimiento.

**Comunicación.** Para que la política sea evidenciable ante un auditor:

- Se publica en la Plataforma y en el repositorio documental del proyecto.
- Cada integrante nuevo la lee y firma un acuse de recibo al incorporarse.
- Se recuerda en la capacitación anual de seguridad y protección de datos.
- Cada nueva versión se informa por correo al equipo, con acuse de lectura.

**Revisión.** La política se revisa formalmente una vez al año y de forma extraordinaria cuando ocurra alguno de estos eventos:

- Cambio del alcance, de la arquitectura o de un proveedor clave.
- Incidente grave de seguridad.
- Cambio relevante de la normativa colombiana.
- Cambio en la composición de la dirección.

Cada revisión se documenta en un acta y, si hay cambios, genera una nueva versión con número y fecha.

## 14. Aprobación e histórico de versiones

La dirección aprueba esta política con su firma. Sin firma y fecha, el documento no es válido ante una auditoría.

| Nombre | Cargo / rol | Firma | Fecha |
| --- | --- | --- | --- |
| Juan Medina | Dirección | ______________ | ______________ |
| Santiago Hurtado | Dirección | ______________ | ______________ |
| Manuel Guevara | Dirección | ______________ | ______________ |
| David Barrera | Dirección | ______________ | ______________ |

**Histórico de versiones**

| Versión | Fecha | Descripción del cambio | Elaboró | Revisó | Aprobó |
| --- | --- | --- | --- | --- | --- |
| 1.0 | 20 de noviembre de 2026 | Versión inicial alineada con ISO/IEC 27001:2022 | Equipo AhorrApp | [Por definir] | [Por definir] |

**Documentos de referencia:** ISO/IEC 27001:2022; Contrato de Servicios AhorrApp (AhorrApp-2026-001 v1.0); Propuesta Comercial y Resumen Ejecutivo (10 de octubre de 2026); Política de Tratamiento de Datos Personales (versión 2.0).