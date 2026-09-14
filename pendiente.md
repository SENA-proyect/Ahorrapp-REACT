# RESTRUCTURACION

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

<details>

<summary><b>Ver detalles del modulo de ingresos y errores</b></summary>

### MODULO INGRESOS

* Todo bien, ningun error durante la primera revicion
</details>

<details>

<summary><b>Ver detalles de noticias y errores</b></summary>

### NOTICIAS

* La paleta de colores con la navbar de economia, finanzas, dolar empleo y todos no cumple con la paleta de colores del proyecto

</details>

<details>

<summary><b>Ver detalles de reportes y errores</b></summary>

### REPORTES

* Me arroja un error 400 al momento de querer obtener un reporte, esto es debido a que no tengo creado la logia del frontend respecto al fondo de emergencia

* El apartado del ID del presupuesto no es tan claro, lo mejor es modificar ese campo a una lista desgplegable con los presupuestos que tiene el usuario

* No toma los datos del estado actual del fondo de emergencia

* Al descargar el PDF este no toma los datos y se muestra vacio con los valores en 0%

</details>

<details>

<summary><b>Ver detalles del panel de administrador y errores</b></summary>

## PANEL DE ADMINISTRADOR (GENERAL)

* En el archivo `PanelAdmin` no se toman los datos de la informacion de usuarios ni dependientes registrados en el sistema, la actividad reciente tambien se refleja como un campo vacio

### PANELUSUARIO

* En el formulario para editar la informacion de un usuario me permite cambiarle el nombre y apellido por numeros ademas de no tener renstricciones en el campo del correo, permitiendome poner correos inexistentes como "nose@gnail.com"

### PANELDEPENDIENTES
 
* Las cards traen buena informacion pero en el campo de fecha registra de la siguiente manera `2026-09-12T00:00:00.000Z`, siendo un formato inecesario, basta con el mes, dia y año

* Aunque dice a quien le pertenece el dependiente (por nombre del usuario) seria util tambien agregar el ID con el cual esta registrado el usuario que registro al respectivo dependiente

### PANELHISTORIAL

* Es un archivo vacio, simplemente sale el mensaje de que no se pudo cargar el historial

### PANELMOVIMIENTOS

* Da informacion util pero no especifica a quien le pertenece esa informacion ademas de que son "movimientos" generales respecto a los modulos financieros, esta informacio seria mucho mas util en un apartado de "configuracion" en el cual solo traiga la informacion del usuario logueado con fines de llevar un registro de sus acciones (que el usuario pueda visualizar si lo desea), actualmente ya existe un archivo "configuracion.jsx" En el cual se puede dar esta informacion

* Relacionado al punto anterior, la vista de movimientos con respecto al panel de usuario seria mas util si registrara el movimiento de los admin y superuser en el sentido de saber si eliminaron algun usuario, algun dependiente del usuario o modificaron el rol de algun usuario 


</details>

<details>

<summary><b>Ver detalles de Configuracion y errores</b></summary>

### CONFIGURACION

* Es un archivo bien construido pero existen camps deshabilitados los serian utiles agregarles tales como:
  * 1- Campo para visualizar los movimientos respecto a los modulos financieros realizados por el usuario
  * 2- Campo para editar los datos del usuario como modificar su informacion personal (Nombre, apellido u cualquier otro campo registrado en la DB), Tambien podra modificar la contraseña y deshabilitar su cuenta (que le informe al usuario que despues de un lapso de 30 dias su cuenta sera eliminada con todos los datos en ella)
  * 3- Un boton que solo puedan acceder los usuarios con rol id 2 y 3 (admin y superuser respectivamente), los usuarios con rol 1 no podran visualizar este boton

</details>

<details>

<summary><b>Ver detalles de dashboard y errores</b></summary>

### DASHBOARD

* No esta trayendo los datos del campo de emergencia

</details>

## SIGUE PENDIENTE
* El primer punto de dependientes
* Todo lo de reportes
* Todo de noticias
* Todo con respecto al panel de administrador


<details>

<summary><b>Ver detalles dey errores</b></summary>

</details>