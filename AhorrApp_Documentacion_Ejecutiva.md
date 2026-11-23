# Documentación ejecutiva de AhorrApp

*Proyecto de gestión financiera personal*

Servicio Nacional de Aprendizaje SENA  
Centro de Electricidad Electrónica y Telecomunicaciones CEET  
Ficha 3278639

Equipo del proyecto  
David Barrera Machuca · Juan Manuel Medina Guerrero  
Manuel Esteban Guevara Barrios · Santiago Hurtado Castellanos

6 de octubre de 2026

## 1 Resumen ejecutivo

AhorrApp es un proyecto de gestión financiera personal que busca facilitar el registro, la organización y el análisis de la información económica de los usuarios en Colombia. La aplicación web reúne funciones relacionadas con ingresos, gastos, ahorros, deudas, presupuestos, imprevistos y fondo de emergencia, además de consultas y reportes visuales.

El proyecto responde a la dificultad de mantener registros financieros organizados y utilizarlos para planificar el uso de los recursos. Su público incluye personas con conocimientos básicos de herramientas digitales, especialmente jóvenes y adultos con ingresos variables que necesitan hacer seguimiento de sus gastos y metas de ahorro.

La propuesta consiste en centralizar la información que registra el usuario y facilitar su consulta. Los beneficios esperados son una mayor visibilidad del presupuesto, un seguimiento más ordenado de las obligaciones y menos esfuerzo para organizar los registros. Su magnitud debe comprobarse mediante pruebas y mediciones; no se presentan porcentajes de ahorro ni retornos económicos como resultados obtenidos.

La decisión propuesta es avanzar con una validación gradual de las funciones principales y un plan de implementación que incluya pruebas, capacitación y acompañamiento. La evaluación económica queda pendiente hasta definir los costos y el modelo de financiación. AhorrApp no realiza transacciones bancarias reales ni sustituye la asesoría financiera profesional.

## 2 Problema que atiende el proyecto

Cuando los ingresos, gastos y obligaciones se registran de forma dispersa o se conservan únicamente en la memoria, resulta difícil reconstruir el comportamiento financiero de un periodo. El usuario puede desconocer cuánto ha gastado por categoría, cuánto tiene comprometido y qué avance ha logrado frente a sus metas.

Esta dificultad adquiere especial relevancia cuando los ingresos varían. Un presupuesto que no se actualiza con los movimientos reales puede dejar de representar los recursos disponibles. La propuesta de AhorrApp aborda el registro y la consulta de esa información para apoyar la planificación personal.

El problema que se pretende resolver es la falta de un método accesible para registrar, organizar y analizar las finanzas personales de manera constante. El aplicativo facilita ese proceso; la mejora depende también de que el usuario ingrese información suficiente y revise sus registros.

## 3 Población objetivo

Los documentos del proyecto definen como población a residentes fiscales en Colombia con conocimientos básicos de aplicaciones digitales. La caracterización de mercado destaca a jóvenes y adultos con ingresos variables o informales que requieren una herramienta sencilla, sin conexión bancaria obligatoria, para organizar sus finanzas.

Para utilizar la versión web se requiere un dispositivo compatible con un navegador moderno y conexión a internet. El grupo inicial del piloto, su tamaño y los mecanismos de selección quedan por definir. Esa selección permitirá evaluar la propuesta con usuarios que representen las necesidades descritas.

## 4 Objetivos del proyecto

### Objetivo general

Desarrollar un aplicativo web de gestión financiera que permita a los usuarios registrar, organizar y analizar su información económica personal.

### Objetivos específicos

- Organizar el registro de ingresos, gastos, ahorros, deudas e imprevistos para facilitar su seguimiento.

- Presentar información mediante tablas, gráficos y reportes que permitan interpretar los movimientos financieros.

- Apoyar la planificación del presupuesto y el seguimiento de metas de ahorro mediante indicadores comprensibles.

- Incorporar recordatorios y alertas que ayuden a mantener actualizado el registro financiero.

- Facilitar el acceso a la información desde la web mediante una interfaz adaptable a distintos tamaños de pantalla.

Estos objetivos expresan la intención del proyecto. El cumplimiento de cada uno debe relacionarse con requisitos y evidencias de aceptación.

## 5 Solución propuesta y alcance

AhorrApp propone un espacio de consulta y registro para que el usuario pueda relacionar sus movimientos con su presupuesto y sus metas. El valor de los módulos se explica por la información que permiten organizar y por las decisiones que ayudan a preparar.

| Función | Utilidad para el usuario |
| --- | --- |
| Ingresos y gastos | Registrar entradas y salidas y consultar su comportamiento. |
| Categorías y presupuestos | Ordenar los movimientos y comparar el gasto con la planificación. |
| Ahorros y metas | Hacer seguimiento de aportes y avance hacia un objetivo. |
| Deudas | Consultar obligaciones y el seguimiento de sus pagos. |
| Imprevistos y fondo de emergencia | Organizar recursos destinados a situaciones no previstas. |
| Reportes y resumen financiero | Consultar información consolidada para analizar periodos. |
| Cuenta y recuperación de acceso | Gestionar el acceso y la continuidad del uso de la aplicación. |

El repositorio contiene pantallas, rutas o servicios relacionados con estas funciones. La presencia de código constituye evidencia de implementación, pero no sustituye las pruebas de funcionamiento con usuarios y datos controlados.

### Límites del servicio

El sistema se orienta a organizar información personal proporcionada por el usuario. El alcance definido excluye las transacciones bancarias reales, el manejo de dinero de terceros, la administración de inversiones complejas y la sustitución de asesoría profesional. Las funciones de proyección y recomendaciones descritas en los objetivos deberán verificarse antes de presentarlas como disponibles.

### Base tecnológica de la versión web

La implementación revisada utiliza React y Vite para la interfaz, Node.js y Express para el backend, y PostgreSQL para el almacenamiento. La conexión de base de datos contiene referencias a Supabase y el cliente apunta a una API alojada en Render. El equipo indica que utiliza planes gratuitos en esos servicios.

La versión móvil se contempla como una línea de desarrollo vinculada al proyecto. Las funciones nativas, como biometría, voz y widgets, requieren revisión de su repositorio y pruebas propias antes de incorporarse como prestaciones confirmadas del producto.

## 6 Beneficios esperados y mejoras operativas

La centralización de los movimientos busca evitar la dispersión de los registros y facilitar la consulta por periodos y categorías. Una vista organizada puede ayudar al usuario a identificar dónde concentra sus gastos y cuánto ha avanzado frente a su planificación.

El seguimiento de deudas, ahorros y recursos de emergencia busca dar continuidad a obligaciones y metas que suelen revisarse por separado. Los reportes permiten examinar la información registrada; su utilidad depende de que los datos estén completos y de que los cálculos representen correctamente los movimientos.

Entre las mejoras operativas esperadas se encuentran una consulta más rápida, menor repetición de tareas de organización y una revisión más constante de la información. La validación de formularios puede ayudar a reducir entradas incorrectas. La disponibilidad del servicio y el respaldo de información deberán definirse y probarse, sin prometer acceso ininterrumpido ni recuperación garantizada.

## 7 Beneficios cuantitativos por medir

Se propone comparar el método actual de cada participante con el uso de AhorrApp para las mismas tareas. No se han establecido valores de referencia, metas numéricas ni resultados medidos. Los siguientes indicadores ofrecen una base para diseñar el piloto.

| Indicador | Forma de medición |
| --- | --- |
| Tiempo de registro | Medir el tiempo necesario para registrar un movimiento con ambos métodos. |
| Calidad del registro | Contar registros incompletos, duplicados o corregidos en un periodo comparable. |
| Constancia de uso | Observar días con actividad y continuidad de los participantes durante el piloto. |
| Seguimiento de metas | Consultar aportes y avance registrados frente a la meta definida por cada usuario. |
| Comprensión del presupuesto | Comprobar si el participante identifica sus principales gastos y recursos disponibles. |
| Facilidad de uso | Registrar tareas completadas, solicitudes de ayuda y valoración de los participantes. |

La evaluación debe documentar número de participantes, duración, condiciones y limitaciones. Una mejora observada en el seguimiento no demuestra por sí sola que la aplicación haya causado un ahorro económico. Cualquier beneficio monetario deberá sustentarse y evitar contar dos veces el mismo efecto.

## 8 Implementación y despliegue

Se propone una implementación por fases para verificar el alcance antes de ampliar el servicio. Esta secuencia es una propuesta de trabajo; las fechas, duraciones y responsables están pendientes de definición por el equipo.

### Confirmación del alcance

Alinear los requisitos con la versión web actual, identificar funciones prioritarias y establecer criterios de aceptación.

### Preparación y pruebas

Configurar un entorno de prueba, utilizar datos controlados y comprobar los flujos principales. Revisar la infraestructura y el procedimiento de recuperación.

### Piloto con usuarios

Seleccionar participantes, explicar el uso del sistema y registrar dificultades, tiempos de tareas y observaciones.

### Ajustes y publicación

Corregir los problemas encontrados, repetir las pruebas afectadas y verificar la configuración de acceso y publicación.

### Acompañamiento

Dar seguimiento a las incidencias y medir la utilidad del servicio durante el periodo acordado.

El cronograma deberá contemplar dependencias entre tareas y reservar tiempo para correcciones. Si se necesita incorporar datos previos, primero se definirá su origen y formato y se verificará su integridad. La puesta en funcionamiento deberá incluir un procedimiento para volver a una versión anterior si aparece una falla importante.

## 9 Pruebas y criterios de aceptación

El plan de pruebas debe cubrir registro e inicio de sesión, recuperación de acceso, creación y consulta de movimientos, edición y eliminación, presupuestos, deudas, metas y coherencia de los reportes. También debe revisar formularios con valores incorrectos, conexión interrumpida, visualización móvil y restricciones de acceso entre usuarios.

Como criterio propuesto para publicar, las funciones prioritarias deberán contar con evidencias de aceptación y los errores que comprometan los datos o el acceso deberán estar resueltos. Cada evidencia debe registrar versión, fecha, escenario, resultado esperado, resultado observado y responsable.

Las notas de errores y la auditoría anterior permiten orientar la revisión. Su contenido corresponde a registros previos y, en parte, a la versión móvil; no acredita la aceptación de la versión web actual. La revisión documental y de código utilizada para esta propuesta no equivale a una prueba del servicio en producción.

## 10 Capacitación soporte y mantenimiento

Se propone una capacitación inicial centrada en registrar un ingreso y un gasto, consultar el presupuesto, revisar una meta y recuperar el acceso. Los materiales pueden incluir una guía breve y ejercicios con datos de ejemplo. El número de sesiones, su duración y la persona responsable están pendientes de definición.

El soporte deberá disponer de un canal para registrar incidencias y distinguir problemas de acceso, inconsistencias de datos y consultas de uso. Horarios, tiempos de respuesta y responsables se acordarán según la capacidad del equipo. No se establece una atención permanente ni un nivel de servicio contratado.

El mantenimiento debe contemplar correcciones, revisión de dependencias y comprobación de las funciones afectadas por cada actualización. El plan de respaldo deberá definir frecuencia, conservación, responsable y una prueba de restauración. Estas actividades se presentan como necesidades operativas pendientes de formalización.

## 11 Riesgos y medidas propuestas

| Riesgo | Medida propuesta |
| --- | --- |
| Registros incompletos o abandono | Simplificar el registro y evaluar dificultades durante el piloto. |
| Interrupciones de conectividad | Informar fallas y verificar el comportamiento para evitar registros perdidos o duplicados. |
| Errores en saldos o reportes | Contrastar cálculos con casos controlados antes de la publicación. |
| Acceso indebido o pérdida de información | Revisar permisos y definir respaldos con pruebas de restauración. |
| Límites de infraestructura gratuita | Revisar consumo y capacidad antes de aumentar el número de usuarios. |
| Capacidad limitada del equipo | Priorizar funciones y asignar responsables y tiempos realistas. |

La matriz DOFA también identifica competencia de otras aplicaciones y desconfianza hacia una marca nueva. La comunicación del alcance, una experiencia comprensible y evidencias de funcionamiento pueden contribuir a la adopción. Los responsables y la prioridad de cada riesgo deberán asignarse en el plan de trabajo.

### Riesgos de mantener el problema sin resolver

La ausencia de un registro organizado puede mantener la dificultad para reconocer patrones de gasto, hacer seguimiento de obligaciones y evaluar metas. Estos riesgos justifican atender el problema, aunque el usuario también puede mejorar su organización mediante otros métodos. No se atribuyen pérdidas monetarias específicas a la falta de AhorrApp.

## 12 Costos y gastos del proyecto

Pendiente por definir.

## 13 Impacto financiero y retorno de inversión

Pendiente por definir.

## 14 Punto de equilibrio y recuperación de la inversión

Pendiente por definir.

## 15 Próximos pasos

- Actualizar los documentos técnicos y de alcance para que correspondan a la versión web actual.

- Confirmar el estado de cada función prioritaria y reunir sus evidencias de prueba.

- Definir el grupo de usuarios del piloto, su duración y los indicadores que se medirán.

- Asignar responsables y acordar el cronograma de implementación, capacitación y soporte.

- Verificar la publicación del frontend, la capacidad de los servicios gratuitos y el procedimiento de respaldo.

- Investigar los costos y el modelo de financiación para completar las secciones económicas.

- Revisar la versión móvil de manera independiente antes de incluir sus funciones como disponibles.

## 16 Conclusiones

AhorrApp plantea una solución para organizar información financiera personal y facilitar su consulta. Los objetivos documentados y los módulos presentes en el repositorio ofrecen una base para construir y evaluar esa propuesta con usuarios de la población definida.

La siguiente etapa debe concentrarse en comprobar las funciones principales y medir su utilidad. Una presentación ejecutiva sustentada requiere relacionar cada beneficio con evidencia, definir el acompañamiento y ajustar la capacidad del servicio al número de usuarios previsto.

La viabilidad económica se evaluará cuando se definan costos y financiación. Hasta entonces, esta propuesta permite examinar el problema, el alcance y las necesidades de implementación sin atribuir resultados financieros que todavía no se han demostrado.

## 17 Fuentes del proyecto

Los siguientes documentos y archivos permiten consultar el origen del alcance, los objetivos y la implementación descrita. Las estadísticas externas incluidas en los documentos originales requieren verificación antes de incorporarse como fundamento numérico de la propuesta.

Informe AHORRAPP

Objetivos, problema, alcance y límites de la aplicación.

Especificación de requisitos de AhorrApp

Requisitos funcionales y no funcionales. Contiene referencias tecnológicas que requieren actualización frente al repositorio.

Caracterización del mercado

Población objetivo, necesidades, sustitutos y contexto del producto.

Matriz DOFA de AhorrApp

Fortalezas, debilidades, oportunidades, amenazas y estrategias propuestas.

Repositorio principal de la versión web

Rama main. Revisión del commit 2866333f1e21d30b53f91300417155cbddf13525. Se consultaron pantallas, configuración tecnológica, rutas y documentación de la API.

Auditoría anterior de requisitos avanzados

Registro previo referido a funciones móviles. Se utiliza para orientar futuras verificaciones, no como validación del estado actual.

Presupuesto de AhorrApp

Documento de referencia para una revisión económica posterior. Las secciones de costos de esta propuesta permanecen pendientes.

La discusión de clase orienta la estructura hacia problema, solución, población, beneficios, implementación, pruebas, capacitación, soporte y sostenibilidad económica. La información aportada por el equipo confirma el uso actual de planes gratuitos en Render y Supabase.
