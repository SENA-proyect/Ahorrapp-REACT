# Arreglo de errores requerimientos funcionales

Este documento registra los fallos encontrados y las correcciones de cada requerimiento funcional de AhorrApp. Se actualiza al trabajar en cada requerimiento. Un cambio de código, una prueba con datos simulados y una prueba contra el servidor desplegado se registran por separado.

## Registro general

| Requerimiento | Fecha | Estado del código | Verificación |
| --- | --- | --- | --- |
| RF-15 — Gestionar categorías financieras | 2026-10-07 | Fallos identificados corregidos localmente | 50 pruebas de controladores pasan; pendiente PostgreSQL real, interfaz autenticada y despliegue en Render |

Rama de trabajo: `David`. Base de la corrección: commit `d624ed3`. Las correcciones y este registro se publican en la rama remota `David`. Publicar en Git no confirma que Render haya desplegado la versión; esa comprobación queda pendiente.

## RF-15 — Gestionar categorías financieras

### 1. Comportamiento esperado

El usuario puede crear, editar, deshabilitar, habilitar y eliminar sus categorías financieras. El servidor debe garantizar las restricciones aunque la solicitud llegue directamente a la API y no use la interfaz de React.

- Una categoría personal nueva se crea activa, con `sistema=false`, `es_global=false` y el propietario obtenido de la sesión autenticada.
- El usuario solo modifica sus categorías personales. Las categorías globales y las marcadas como del sistema quedan protegidas.
- Un nombre no puede repetirse entre las categorías visibles para el usuario: sus categorías propias y las globales, incluidas las deshabilitadas.
- Para comparar nombres se ignoran mayúsculas y espacios al principio o al final. No se eliminan acentos ni se cambian espacios interiores.
- Distintos usuarios pueden tener categorías personales con el mismo nombre, porque no comparten esa categoría.
- Una categoría deshabilitada no puede asociarse a un movimiento nuevo.
- Solo se permite eliminar categorías personales deshabilitadas. La eliminación no debe borrar sus movimientos históricos.

### 2. Diagnóstico inicial y evidencia

Se ejecutaron 26 casos contra los controladores reales cargados con una base de datos simulada: **15 pasaron y 11 fallaron**.

Los cinco cambios básicos de categorías funcionaban en esta prueba. También funcionaban la protección de categorías globales o ajenas, el rechazo de nombres vacíos y el rechazo de la eliminación de categorías activas. Los fallos correspondían a dos casos de duplicados, cuatro operaciones sobre categorías del sistema no globales y cinco tipos de movimientos con categorías deshabilitadas.

La interfaz ya comprobaba duplicados, reconocía categorías del sistema y filtraba categorías activas al registrar movimientos. Eso no sustituía las comprobaciones faltantes del servidor.

### 3. Fallo RF15-01: creación de categorías duplicadas

**Antes:** `crearCategoria` insertaba el nombre después de comprobar únicamente que no estuviera vacío. Una petición directa podía crear `Personal` y después ` personal ` para el mismo usuario. La API respondía `201` en lugar de rechazar el duplicado.

**Causa:** la validación de duplicados existía en React, pero no en el controlador. El índice de nombres globales del esquema SQL no protege nombres personales ni normaliza mayúsculas y espacios.

**Corrección:** antes de insertar se consulta `categorias` usando `LOWER(BTRIM(nombre))`. La búsqueda incluye categorías globales y categorías del usuario autenticado, sin excluir las deshabilitadas. Si existe una coincidencia, se devuelve `409` con un mensaje de categoría duplicada y se revierte la transacción.

**Archivo:** `Backend/src/controllers/categoriasController.js`, función `crearCategoria`.

**Resultado probado:** se rechaza la creación duplicada, también cuando cambia la capitalización o la categoría existente está deshabilitada. Se permite que otro usuario tenga una categoría personal con ese nombre.

### 4. Fallo RF15-02: edición hacia un nombre ya utilizado

**Antes:** `actualizarCategoria` comprobaba la propiedad y luego actualizaba el nombre sin buscar coincidencias. Una petición directa podía renombrar una categoría personal con el nombre de una categoría global o de otra categoría propia.

**Corrección:** se aplica la misma comparación normalizada que en creación. Se excluye de la búsqueda el identificador de la categoría que se está editando, para permitir conservar su nombre o cambiar solamente su descripción. Ante un duplicado se devuelve `409` sin actualizarla.

**Archivo:** `Backend/src/controllers/categoriasController.js`, función `actualizarCategoria`.

**Resultado probado:** se bloquea la edición hacia un nombre global existente y se permite conservar el nombre actual, incluso con espacios exteriores.

### 5. Fallo RF15-03: protección incompleta de categorías del sistema

**Antes:** editar, deshabilitar, habilitar y eliminar exigían `es_global=false`, pero no comprobaban `sistema=false`. Una categoría con `sistema=true`, `es_global=false` y el usuario como propietario podía modificarse. Los cuatro casos devolvían `200`.

**Corrección:** las comprobaciones de permisos exigen simultáneamente el propietario autenticado, `es_global=false` y `sistema=false`. Si no se cumplen, se devuelve `403`.

Las sentencias que habilitan, deshabilitan y eliminan vuelven a incluir las condiciones de propiedad y protección. Esto evita depender únicamente de una consulta previa cuando los datos cambian entre la comprobación y la escritura. Se comprueba `rowCount` para no informar éxito si la operación no afectó ninguna categoría.

**Archivo:** `Backend/src/controllers/categoriasController.js`, funciones `actualizarCategoria`, `deshabilitarCategoria`, `habilitarCategoria` y `eliminarCategoria`.

**Resultado probado:** las cuatro operaciones rechazan categorías del sistema no globales. Se mantienen las restricciones sobre categorías globales y ajenas y las operaciones permitidas sobre categorías personales.

### 6. Fallo RF15-04: categorías deshabilitadas en nuevos movimientos

**Antes:** `crearMovimiento` insertaba el movimiento y su categoría sin comprobar si estaba activa. La API aceptaba categorías deshabilitadas en ingreso, ahorro, gasto, imprevisto y deuda. Tampoco comprobaba su visibilidad para el usuario antes de insertar.

**Corrección:** dentro de la transacción, antes de insertar cualquier registro, se consulta la categoría indicada. Debe existir, ser global o pertenecer al usuario y tener `activa=true`. Si no está disponible se devuelve `400` y se revierte la transacción. Los identificadores inválidos también se rechazan con `400` antes de abrir la conexión.

La validación común está antes de separar los cinco tipos de movimiento. Por ello se aplica a todos ellos. La ausencia de categoría sigue permitida: `null`, campo omitido o cadena vacía no obligan a seleccionar una categoría.

La consulta utiliza `FOR SHARE`. En PostgreSQL, este bloqueo conserva la categoría durante la transacción e impide que otra operación la deshabilite o elimine mientras se guarda el movimiento. La coordinación real de bloqueos está pendiente de una prueba de integración.

**Archivo:** `Backend/src/controllers/movimientosController.js`, función `crearMovimiento`.

**Resultado probado:** los cinco tipos rechazan categorías deshabilitadas antes de emitir cualquier `INSERT`. Se rechazan categorías ajenas, inexistentes e identificadores inválidos. Se aceptan categorías propias activas, categorías globales activas y movimientos sin categoría.

### 7. Refuerzo RF15-05: solicitudes simultáneas con el mismo nombre

Una consulta de duplicados seguida de una inserción sin coordinación permite que dos solicitudes consulten a la vez, no encuentren el nombre y ambas lo inserten.

**Corrección:** creación y edición usan una conexión dedicada, `BEGIN` y `LOCK TABLE categorias IN SHARE ROW EXCLUSIVE MODE` antes de comprobar nombres. Después de validar y escribir se ejecuta `COMMIT`. Ante un rechazo se ejecuta `ROLLBACK`; la conexión se libera en `finally`.

El bloqueo serializa los cambios de nombres y entra en conflicto con las escrituras concurrentes en la tabla mientras dura la transacción. Es un bloqueo de tabla: durante ese intervalo puede hacer esperar a otras operaciones de categorías. Las transacciones solo incluyen comprobaciones y escrituras de este módulo, sin llamadas externas.

**Límite:** no se cambió el esquema ni se ejecutó una migración. La regla de duplicados se garantiza en las rutas corregidas del servidor; no se convierte en una restricción SQL para escrituras manuales o futuros controladores que no implementen estas comprobaciones. Los duplicados existentes no se eliminan ni se renombran automáticamente.

### 8. Refuerzo RF15-06: validación de los datos en la API

**Antes:** la interfaz tenía límites de longitud, pero las solicitudes directas podían omitirlos. Un nombre numérico o una descripción de tipo incorrecto podían provocar errores al usar `trim()`.

**Corrección:** `validarCategoria` se usa al crear y editar. El nombre debe ser texto y contener entre 2 y 50 caracteres después de recortar espacios exteriores. La descripción es opcional, debe ser texto cuando se proporciona y admite hasta 200 caracteres después del recorte. Los errores devuelven `400`, antes de conectar con la base de datos.

**Resultado probado:** se rechazan nombres numéricos, demasiado cortos o demasiado largos y descripciones numéricas o demasiado largas en ambas operaciones.

### 9. Eliminación y conservación del historial

Se conserva la regla existente: primero debe deshabilitarse la categoría. Además, la sentencia `DELETE` exige `activa=false` para impedir eliminarla si otra operación acaba de habilitarla. Si no se elimina ninguna fila tras la comprobación inicial se devuelve `409` para que el usuario recargue el estado.

El esquema `SQL/supabase.sql` contiene relaciones de movimientos con categorías mediante `ON DELETE SET NULL`. Esto conserva los movimientos al eliminar una categoría y deja su asociación vacía. No se modificaron esas relaciones. Su comportamiento en la base de datos desplegada **no se ha verificado**.

### 10. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `Backend/src/controllers/categoriasController.js` | Duplicados, transacciones, protección del sistema, escrituras condicionadas y validación de datos |
| `Backend/src/controllers/movimientosController.js` | Validación de categoría disponible antes de crear movimientos y bloqueo de la fila |
| `Backend/tests/rf15.cjs` | Suite reproducible de regresión con controladores reales y base de datos simulada |
| `Backend/package.json` | Comando `test:rf15` |
| `api-docs/02-categorias.md` | Documentación de las restricciones y respuestas nuevas |
| `arreglo de errores requerimientos funcionales.md` | Registro detallado por requerimiento |

### 11. Pruebas y resultado después de corregir

Desde `Backend`, ejecutar:

```powershell
npm run test:rf15
```

La suite usa únicamente módulos integrados de Node y no necesita conectarse a Render, instalar las dependencias del backend ni disponer de credenciales. Carga el código real de los dos controladores y sustituye PostgreSQL y servicios secundarios por simulaciones. Devuelve un código de salida distinto de cero si hay fallos.

**Resultado:** 50 casos pasan, 0 fallan. Incluyen las cinco operaciones, eliminación de activas, permisos, duplicados, datos inválidos, categorías deshabilitadas en los cinco tipos de movimiento y casos válidos que deben seguir funcionando.

Se comprobó también la sintaxis de los archivos JavaScript modificados y la ausencia de errores de espacios en el diff.

Estas pruebas demuestran el comportamiento de los controladores ante las respuestas simuladas. **No demuestran ejecución de SQL, concurrencia, claves foráneas, persistencia real, comportamiento visual ni actualización del servidor desplegado.**

### 12. Verificación de integración pendiente

Para cerrar RF-15 en el entorno real:

1. Publicar estos cambios y comprobar que el backend de pruebas de David los ejecuta.
2. Usar una sesión autenticada en la web conectada a ese backend.
3. Crear dos categorías personales temporales; editar una, deshabilitarla, habilitarla y deshabilitarla nuevamente.
4. Repetir los nombres al crear y editar mediante solicitudes directas y confirmar `409`, incluyendo diferencias de capitalización, espacios y categorías deshabilitadas.
5. Verificar `403` en las cuatro operaciones sobre una categoría del sistema y una categoría ajena, usando datos de prueba controlados.
6. Intentar nuevos ingresos, ahorros, gastos, imprevistos y deudas con una categoría deshabilitada; confirmar `400` y que no se guardaron movimientos.
7. Crear un movimiento válido con categoría activa y comprobar que se guarda. Probar también un movimiento sin categoría.
8. Enviar solicitudes simultáneas de creación o renombrado al mismo nombre y comprobar que solo una se acepta.
9. Eliminar una categoría personal deshabilitada de prueba y comprobar la conservación de su historial.
10. Limpiar los registros de prueba y registrar los resultados, la fecha y el despliegue probado aquí.

Actualmente falta una sesión autenticada y configuración local de PostgreSQL. El navegador integrado bloqueó el certificado de `https://localhost:5173/`; el usuario debe resolver ese aviso. El endpoint de categorías de David respondió `401` sin autenticación. No se modificaron registros reales durante estas pruebas.

### 13. Estado final de RF-15

**Corregido en el código local y comprobado con 50 pruebas de controladores. Pendiente validar PostgreSQL real y el recorrido completo en la web después del despliegue.** No se declara aprobado en producción ni en Render hasta registrar esa verificación.

## Próximos requerimientos

Se agregarán secciones independientes cuando se revise cada requerimiento, con su comportamiento esperado, reproducción de fallos, causas, cambios, archivos, pruebas y estado real. No se han auditado ni corregido otros requerimientos en esta intervención.
