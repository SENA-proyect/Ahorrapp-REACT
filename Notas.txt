en PresupuestosController.js, en abonarDeuda y abonarAhorro:
Cambiar todos los pool.query por db.query en la parte baja del archivo.

Cambiar los req.usuario.id por req.user.ID_usuario

El verdadero peligro con los porcentajes: Si el usuario edita solo el nombre, los porcentajes que no envíe pasarán como null y mantendrán sus valores en la base de datos gracias al COALESCE. Sin embargo, tu validación previa de la suma evalúa los campos faltantes como 0 (Number(Porcentaje_gastos ?? 0)).Consecuencia: Si el usuario intenta editar únicamente su nombre, la validación de la suma sumará 0 + 0 + 0 + 0 + 0 = 0. Como 0 no es 100, la API rebotará la petición con un error 400: Los porcentajes deben sumar 100, impidiendo actualizaciones parciales.