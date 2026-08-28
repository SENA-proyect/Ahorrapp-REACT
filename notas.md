vite.config.js
Las lineas comentadas se encargan de la encriptacion SSL, debido a que el sistema aun no esta adaptado a esta seguridad, se opto por desabilitar las funciones del HTTPS de manera temporal

api.js
A partir de la linea 294 hacia abajo es el codigo implementado desde la rama de santiago para las funciones del panel de administrador

schema.sql
Tabla de rol y usarios_roles, comentadas debido a que no se ha realizado el proceso correcto ni las debidas pruebas, se comento con el fin de evitar problemas al exportar la DB

posible error NaN o formato similar:
revisar dashboardcontroller.js, es posible que el error se encuentre entre los query 10-14 dentro de los respectivos const 

exportcontroller.js:
Actualmente es un archivo fantasma, corresponde a un RF por lo que es necesario restructurarlo, con el fin de usarlo eficientemente

movimientoscontroller.js:
la columna estado es de tipo ENUM en el esquema (estado_deuda_enum, con valores 'pendiente'/'pagada'). Postgres normalmente infiere el tipo del parámetro $8 a partir de la columna destino y hace el cast automático sin problema — así que debería funcionar tal cual está. Pero si al probar el UPDATE sale un error tipo column "estado" is of type estado_deuda_enum but expression is of type text, la solución sería castearlo explícitamente en la query: estado = $8::estado_deuda_enum

mismo punto de updateDeudas: la columna estado es ENUM. Aquí también debería funcionar el cast automático de Postgres al insertar $2 como texto — pero si da el error de tipo, la solución es estado = $2::estado_deuda_enum en el UPDATE

ActualizarIngresoReal:
Es una funcion que existe tanto en PresupuestosController como en movimientoscontroller, corresponde analizar esto durante las etapas de prueba con el fin de prevenir y/o solucionar bugs