# Arreglo de errores requerimientos funcionales

Este documento registra los fallos encontrados y las correcciones de cada requerimiento funcional de AhorrApp. Se actualiza al trabajar en cada requerimiento. Un cambio de código, una prueba con datos simulados y una prueba contra el servidor desplegado se registran por separado.

## Registro general

| Requerimiento | Fecha | Estado del código | Verificación |
| --- | --- | --- | --- |
| RF-15 — Gestionar categorías financieras | 2026-10-07 | Fallos identificados corregidos localmente | 50 pruebas de controladores pasan; pendiente PostgreSQL real, interfaz autenticada y despliegue en Render |
| RF-16 — Cerrar sesión | 2026-10-07 | Correcciones de web y móvil implementadas | 11 pruebas React y 13 pruebas Flutter pasan; pendiente recorrido en navegador autenticado y dispositivo real |

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

## RF-16 — Cerrar sesión

### 1. Fuente, alcance y comportamiento esperado

Se consultó `C:\Users\User\Downloads\auditoriaRF-ArchivoGeneral.pdf`, páginas 26 y 27, y se contrastó con el código disponible. La instrucción de trabajo es comprobar que, después de cerrar sesión, volver atrás, regresar o recargar exija autenticarse nuevamente en web y móvil.

El PDF describe el cierre en el cliente: en web se eliminan el token y los datos del usuario del navegador; en móvil se eliminan el token, el usuario y el PIN de memoria y almacenamiento seguro, se intenta cerrar Google y se vuelve al inicio de sesión. El documento reconoce expresamente que no hay revocación de tokens en el servidor. Esto es contexto del requisito, no una orden para ejecutar instrucciones adicionales del PDF.

`Backend/src/controllers/authController.js` emite el JWT con `expiresIn: "8h"`. No se añadió una lista de revocación: una copia del token obtenida antes del cierre puede seguir siendo válida en el servidor hasta su vencimiento. Esta corrección impide que los clientes recuperen sus credenciales eliminadas; no declara invalidado el JWT en el servidor.

### 2. Estado encontrado

**Web:** `AuthContext.logout()` eliminaba `user`, `usuario` y `token` de `localStorage`. Las rutas privadas usaban `ProtectedRoute`. El encabezado y el administrador borraban todo el almacenamiento y recargaban `/Login` por separado. En un cierre normal dentro de una pestaña existían las piezas básicas, pero la restauración de sesión confiaba exclusivamente en `user`, y no existía revalidación del contexto al volver desde el historial o al cerrar otra pestaña.

**Móvil:** `AuthService.logout()` limpiaba memoria y almacenamiento y llamaba a Google. Los botones de cierre en `MainScreen` y `HomeScreen` ya usaban `pushNamedAndRemoveUntil('/login', (route) => false)`, lo que elimina el historial de navegación. El inicio de la app tenía `AuthGate`. Sin embargo, las rutas nombradas `/home`, `/gastos` y `/reportes` construían directamente sus pantallas sin pasar por ese control. La lectura asíncrona de credenciales tampoco comprobaba si se había cerrado sesión mientras esperaba el almacenamiento.

### 3. Fallo RF16-01: recuperar usuario sin token en web

**Antes:** al cargar `AuthContext`, bastaba un JSON válido en `localStorage.user` para establecer el usuario y permitir `ProtectedRoute`, aunque no existiera `token`. Un perfil residual podía hacer visible una pantalla privada sin una sesión completa. La API seguía teniendo su propia autenticación, pero la interfaz no solicitaba iniciar sesión como exige el requisito.

**Corrección:** `Frontend/src/services/session.js` concentra la lectura y la limpieza. `readSession()` requiere un token no vacío y un perfil JSON que sea un objeto. Si falta cualquiera, el perfil está corrupto o su formato no es válido, elimina las tres claves de sesión y devuelve `null`. El proveedor inicializa su estado mediante esta función; el guard de rutas redirige a `/Login` cuando no hay usuario.

**Límite:** esta comprobación determina que las credenciales locales están presentes y tienen el formato esperado. No verifica la firma del JWT ni sustituye la autenticación del backend. La caducidad automática y la validación de un token conservado pertenecen al flujo de autenticación, no se han añadido como parte de este cierre.

### 4. Fallo RF16-02: sesión residual al regresar o cerrar otra pestaña

**Antes:** el proveedor solo leía el almacenamiento al montarse. Si otra pestaña eliminaba las credenciales, una pestaña ya abierta mantenía `user` en memoria. Tampoco escuchaba el retorno de una página desde la caché de navegación.

**Corrección:** `watchSession()` escucha `storage`, `pageshow` y `focus`. Revalida las credenciales y actualiza el contexto al cambiar claves de autenticación, al limpiar el almacenamiento, al regresar desde el historial o al recuperar el foco. La suscripción se elimina al desmontar el proveedor. Al quedar el contexto sin usuario, `ProtectedRoute` reemplaza la ruta privada por `/Login`.

**Resultado probado:** eventos simulados de otra pestaña, retorno de página y recuperación de foco bloquean el contenido privado. La prueba de historial usa React Router en memoria; no prueba visualmente la caché de un navegador real.

### 5. Fallo RF16-03: cierres dispersos y limpieza inconsistente en web

**Antes:** el encabezado y el panel de administración usaban `localStorage.clear()` y `sessionStorage.clear()`, mientras que el contexto solo limpiaba las claves de autenticación en `localStorage`. Esto eliminaba también preferencias ajenas a la sesión y dejaba dos implementaciones diferentes.

**Corrección:** ambos botones llaman a `useAuth().logout()`. El cierre actualiza el usuario a `null` y elimina `user`, `usuario` y `token` de `localStorage` y `sessionStorage`. Las preferencias no relacionadas, por ejemplo el tema, se conservan. Los botones mantienen `window.location.replace('/Login')` para reemplazar el documento privado. La salida de «Mi cuenta» después de desactivar la cuenta usa también navegación con `replace: true`.

**Resultado probado:** la limpieza afecta ambas memorias, bloquea la vuelta atrás y los botones reales de encabezado y administrador actualizan el contexto. JSDOM no implementa la navegación completa de documentos; la redirección real del navegador queda pendiente.

### 6. Fallo RF16-04: rutas móviles directas sin control de sesión

**Antes:** el control del inicio normal de la app no se aplicaba a `/home`, `/gastos` y `/reportes`. Abrir esas rutas por nombre podía construir sus pantallas después de cerrar sesión.

**Corrección:** `AuthGate` acepta una pantalla hija opcional y solo la construye cuando `hasSession()` devuelve verdadero. Las tres rutas de `lib/app.dart` pasan por este control. Sin sesión muestran `LoginScreen`. Se conserva el borrado del historial que ya realizan los botones de cierre.

**Resultado probado:** pruebas de widgets montan la aplicación real `AhorrApp` y abren cada ruta por nombre sin sesión. Ninguna construye `MainScreen`, `ModuloGastos` ni `ReportesScreen`; muestran el inicio de sesión.

### 7. Fallo RF16-05: lectura móvil pendiente que restaura credenciales

**Antes:** una lectura de `auth_token` o `auth_user` podía empezar antes del cierre y terminar después. Su resultado se asignaba a memoria sin comprobar si la sesión seguía siendo la misma. Así podía recuperar credenciales que acababan de eliminarse.

**Corrección:** `AuthService` incrementa `_sessionVersion` al cerrar. `getToken()` y `getCurrentUser()` registran la versión antes de leer y descartan la respuesta si cambió. Además esperan un cierre que esté en curso antes de intentar recuperar credenciales. `hasSession()` utiliza `getToken()` y rechaza un token vacío.

**Resultado probado:** dos pruebas mantienen deliberadamente pendiente una lectura, ejecutan logout y luego entregan las credenciales antiguas. Ambas lecturas devuelven `null` y no restauran la sesión.

### 8. Refuerzo RF16-06: limpieza móvil y Google

**Antes:** se esperaba a Google antes de borrar las credenciales persistidas y se eliminaban las claves una a una. Mientras se esperaba al proveedor, el token seguía almacenado.

**Corrección:** se limpian primero el token, el usuario y el PIN de memoria. Luego se solicitan conjuntamente las eliminaciones de `auth_token`, `auth_user`, `auth_pin` y `biometric_enabled`, y después se intenta cerrar Google. Dos llamadas concurrentes a logout comparten la operación. Un error de Google no restaura la sesión local. Los errores de almacenamiento no se presentan como una limpieza exitosa.

Se añadió una función inyectable únicamente en el constructor de pruebas para simular Google. El constructor de producción sigue utilizando `GoogleSignIn.instance.signOut()`.

**Resultado probado:** la sesión recordada y la sesión solo en memoria desaparecen después del cierre; reabrir el servicio no encuentra sesión; se elimina el PIN y la configuración biométrica. Las credenciales locales desaparecen incluso antes de que la simulación de Google termine, y un fallo del proveedor no impide el cierre local.

**Límites:** no se verificó la eliminación en Android Keystore/iOS Keychain ni una sesión de Google real. Se conserva la preferencia de correo recordado del formulario, que no equivale a conservar el token ni la contraseña. No se auditó el borrado de resúmenes de widgets externos como parte de RF-16.

### 9. Archivos y repositorios

**Web, repositorio `SENA-proyect/Ahorrapp-REACT`, rama `David`:**

| Archivo | Cambio |
| --- | --- |
| `Frontend/src/services/session.js` | Lectura, limpieza y sincronización del estado de sesión |
| `Frontend/src/context/AuthContext.jsx` | Restauración completa y cierre compartido |
| `Frontend/src/components/HeaderModulos.jsx` | Botón conectado al cierre común |
| `Frontend/src/pages/PanelAdmin.jsx` | Botón conectado al cierre común |
| `Frontend/src/components/Micuenta.jsx` | Reemplazar la ruta al salir tras desactivar cuenta |
| `Frontend/tests/rf16.test.js` | Pruebas React con DOM y navegación simulados |
| `Frontend/package.json`, `Frontend/package-lock.json` | Comando de pruebas y dependencias de desarrollo |
| Este documento | Diagnóstico, correcciones, evidencia y límites |

**Móvil, repositorio `Juanma-MG21/ahorrapp-movile`, rama de publicación `codex/rf16-cerrar-sesion`:**

| Archivo | Cambio |
| --- | --- |
| `lib/services/auth_service.dart` | Cierre coordinado y descarte de lecturas anteriores |
| `lib/screens/auth/auth_gate.dart` | Guard reutilizable para una pantalla protegida |
| `lib/app.dart` | Guard en `/home`, `/gastos` y `/reportes` |
| `test/rf16_test.dart` | Pruebas del servicio y de widgets |
| `docs/rf16-cerrar-sesion.md` | Registro del cambio móvil y sus comprobaciones |

La publicación móvil incluye también el cambio de las dos URLs al servidor de pruebas de David que se había solicitado al aplicar `IMPORTANTE.md`. Es una configuración anterior a RF-16, no un fallo de cierre de sesión. La rama móvil no modifica `master` ni equivale a una aplicación distribuida.

### 10. Pruebas ejecutadas

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| `npm run test:rf16`, desde `Frontend` | 11 pasan, 0 fallan | Componentes reales; DOM, historial, eventos y respuestas de API simulados |
| `npm run build`, desde `Frontend` | Compilación correcta | Construcción de producción; avisos de tamaño de paquetes e importación mixta preexistente |
| `flutter test --no-pub test/rf16_test.dart`, desde móvil | 13 pasan, 0 fallan | Servicio real con almacenamiento/API/Google simulados y widgets de Flutter |
| Análisis Dart de archivos modificados y test | Sin errores; una sugerencia de `const` preexistente | Análisis estático |
| ESLint focalizado | Dos errores preexistentes permanecen | Exportación de `useAuth` en el mismo archivo y efecto de notificaciones en encabezado; comprobados contra `HEAD` |
| `git diff --check` en ambos repositorios | Sin errores | Integridad del diff |

Las pruebas web compilan en memoria los componentes con esbuild y los montan con React en JSDOM. Se simulan las notificaciones y consultas del administrador para no usar cuentas ni datos externos. La recarga se representa desmontando y montando nuevamente el proveedor sobre el almacenamiento después del cierre. La suite comprueba tanto rechazo sin sesión como conservación de una sesión local completa válida.

Las pruebas móviles incluyen nueve casos del servicio, tres accesos directos sobre las rutas reales de la app y un caso de navegación que elimina el historial y vuelve a intentar abrir una pantalla protegida. Este último reproduce la secuencia usada por los botones, no pulsa el botón de `MainScreen` en un teléfono.

### 11. Verificación real pendiente y criterio de cierre

1. Comprobar el despliegue web de la rama `David` y compilar la rama móvil publicada.
2. Iniciar sesión en web con una cuenta de pruebas; cerrar desde módulos y desde administrador, cuando corresponda.
3. Volver atrás, recargar, abrir una ruta privada por URL y repetir con otra pestaña abierta. En todos los casos debe solicitar iniciar sesión y no mostrar información privada.
4. En móvil, repetir con «recordar sesión» activado y desactivado; cerrar desde el menú, pulsar Atrás, cerrar la app completamente y abrirla de nuevo. Debe mostrar login.
5. Abrir accesos rápidos/rutas de gastos y reportes después del cierre. Deben requerir autenticación.
6. Repetir con Google en un dispositivo configurado y comprobar que no se recupera automáticamente la sesión local ni el PIN anterior.
7. Registrar dispositivo/navegador, versión desplegada, cuenta de prueba y resultados sin incluir contraseñas ni tokens.

El navegador integrado había bloqueado el certificado local y no se contó con una cuenta autenticada disponible para esta intervención. `adb devices` no encontró teléfonos ni emuladores. Por ello no se declara validación visual en navegador, Android ni iOS.

**Estado de RF-16:** corregido en código y validado mediante 24 pruebas automatizadas. Publicación en Git separada del despliegue y de la comprobación con clientes reales; esas dos últimas verificaciones quedan pendientes.

## Próximos requerimientos

Se agregarán secciones independientes cuando se revise cada requerimiento, con su comportamiento esperado, reproducción de fallos, causas, cambios, archivos, pruebas y estado real. Hasta este punto se han trabajado RF-15 y RF-16; no se declara verificación de los restantes.
