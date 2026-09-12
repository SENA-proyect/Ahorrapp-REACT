# RESTRUCTURACION

### DASHBOARD
La vista presenta errores con algunos endpoints tales como:
· GET /api/dashboard/flujo-semanal
· GET /api/dashboard/presupuesto-vs-ejecutado
· GET /api/dashboard/resumen
Originalmente pensaba que era un error de conexion debido a un error 300 pero ya revise ese punto, seguire en la busqueda de alguna brecha de me de alguna idea de donde se pudo originar el error

<details>
<summary><b>📋 Ver detalles de Presupuestos y Errores</b></summary>

### PRESUPUESTOS
* Doble click innecesario al momento de abrir y activar un periodo. Lo mejor es implementar la lógica de que al "activar" el periodo se abra inmediatamente la modal del ingreso estimado.

`ERRORES`
* Intenté registrar el día de corte con día "32", me salió el siguiente mensaje:

  ```bash
  Failed to load resource: the server responded with a status of 409 ()
  ```

  Al hacerle click para tener más información me notificó lo siguiente:
  ```json
  {"ok":false,"mensaje":"Acceso denegado, token no proporcionado"}
  ```

* El día de corte permite poner días superiores a 31. No existen meses que duren 32 días.

</details>
