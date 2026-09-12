# RESTRUCTURACION
### DASHBOARD
La vista presenta errores con algunos endpoints tales como:
· GET /api/dashboard/flujo-semanal
· GET /api/dashboard/presupuesto-vs-ejecutado
· GET /api/dashboard/resumen
Originalmente pensaba que era un error de conexion debido a un error 300 pero ya revise ese punto, seguire en la busqueda de alguna brecha de me de alguna idea de donde se pudo originar el error

### PRESUPUESTOS
· Doble click inecesario al momento de abrir y activar un periodo, lo mejor es implementar la logica de que al "activar" el periodo se habra inmediatamente la modal del ingreso estimado.

`ERRORES`
· Intente registrar el dia de corte con dia "32", me salio el siguiente mensaje:

Failed to load resource: the server responded with a status of 409 ()

al hacerle click para tener mas informacion me notifico lo siguiente:
{"ok":false,"mensaje":"Acceso denegado, token no proporcionado"}

·El dia de corte permite poner dia superiores a 31, no existen meses que duren 32 dias
