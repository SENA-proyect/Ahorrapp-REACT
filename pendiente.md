# RESTRUCTURACION

### DASHBOARD
La vista presenta errores con algunos endpoints tales como:
· GET /api/dashboard/flujo-semanal
· GET /api/dashboard/presupuesto-vs-ejecutado
· GET /api/dashboard/resumen
Originalmente pensaba que era un error de conexion debido a un error 300 pero ya revise ese punto, seguire en la busqueda de alguna brecha de me de alguna idea de donde se pudo originar el error

<details>
<summary><b>Ver detalles de Presupuestos y Errores</b></summary>

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
* Al tener un periodo activo y querer activar otro sin cerrar el periodo ocurre un error 409
</details>

<details>

<summary><b>Ver detalles de categorias y errores</b></summary>

### CATEGORIAS

* Me permite registrar varias categorias con el mismo nombre
* No me da la opcion de eliminar una categoria personalizada incluso ya estando deshabilitada

</details>

<details>

<summary><b>Ver detalles de dependientes y errores</b></summary>

### DEPENDIENTES
* Definir bien como va funcionar la parte del "peso economico"

</details>

<details>

<summary><b>Ver detalles del modulo de deudas y errores</b></summary>

### MODULO DEUDAS

* Me permite editar una deuda ya pagada, modificando el numero de cuotas pagadas, si modifico esto la deuda sigue apareciendo como pagada a pesar de que por dar un ejemplo tengo 4/5 deudas pagadas

* Elimine la opcion de que el usuario pueda seleccionar el estado de la deuda (pagada/pendiente) con el fin de evitar errores de logica, el backend se encarga de llenar este campo automaticamente en base a las cuotas pagadas

</details>

<details>

<summary><b>Ver detalles del modulo de imprevistos y errores</b></summary>

### MODULO IMPREVISTOS

* Todo bien durante la primera revicion

</details>

<details>

<summary><b>Ver detalles del modulo de ahorros y errores</b></summary>

### MODULO AHORROS

* Cuando pague el valor exacto de una deuda esta sigue apareciendo en el mismo apartado y no en uno de "meta alcanzada" o algo por el estilo, lo ideal seria implementar una vista similar a como se maneja en deudas

* cuando ya termine de pagar la deuda me sigue apareciendo el boton de abonar, puedo abrir el modal de abonar y registrar un nuevo abono pero al querer guardar el abono me surge un error (ya documentado en el apartado de errores, segundo error registrado)


`ERRORES`
* Fui a editar un ahorro y tuve el siguiente error:
```json
{"ok":false,"mensaje":"Acceso denegado, token no proporcionado"}
```
La consola me dice lo siguiente
```body
Failed to load resource: the server responded with a status of 500 ()
```
* Fui a registrar $500.000 en un abono que el cupo maximo era de $432.000 y me arrojo el siguiente error
```json
{"ok":false,"mensaje":"Acceso denegado, token no proporcionado"}
```
la consola dice lo siguiente
```body
Failed to load resource: the server responded with a status of 400 ()
```
</details>

<details>

<summary><b>Ver detalles del modulo de gastos y errores</b></summary>

### MODULO GASTOS

* El formulario de editar no trae los datos completos, el apartado de dependientes simplemente lo olvida y no lo trae consigo

* El formulario de registrar y editar me permiten registrar un gasto por 4 pesos (el valor minimo en colombia es la moneda de 50)

* A pesar de que el formulario de editar no lleva el valor del dependiente (en caso de que este registrado) si no muevo nada y simplemente acepto los cambios se conserva el valor del dependiente a pesar de que visualmente en el formulario este apartado aparecia como gasto propio

</details>

## SIGUE PENDIENTE
* El primer punto de dependientes
* Todo el apartado de Ahorros