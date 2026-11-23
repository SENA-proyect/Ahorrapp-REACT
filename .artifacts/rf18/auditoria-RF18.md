# Auditoría RF-18 — 7 de octubre de 2026

Estado: cumplimiento parcial; no aprobado.

Fuente: auditoriaRF-ArchivoGeneral.pdf, páginas 28–30. El requerimiento pide captura por cámara, extracción de monto, fecha y comercio, categoría por coincidencia y formulario editable antes de guardar. Los QR no interpretables deben producir aviso e ingreso manual.

## Alcance y evidencia

Código móvil revisado: C:/ahorrapp-movile/lib. No se encontró implementación OCR/QR en Frontend/src ni Backend/src del proyecto web. Se ejecutaron los dos parsers Dart copiados sin cambios, usando un DTO mínimo de GastoModel para evitar dependencias Flutter; esto prueba su lógica de texto, no el reconocimiento de imágenes. Resultados: 5/15 casos aprobados, 10 fallidos. Ver resultados-parsers.json y harness/check.dart.

## Hallazgos reproducidos

- QR ignora las fechas del texto y siempre asigna DateTime.now(). Fecha 05/10/2026 e ISO 2026-10-05 dieron 2026-10-07.
- OCR selecciona Subtotal 40.000 antes de TOTAL 45.000 porque busca palabras como total mediante contains.
- Ambos rechazan TOTAL 500: sus patrones exigen números de cuatro dígitos o separadores de miles.
- OCR acepta Referencia 123456789 como monto, aunque no hay valor de compra.
- QR con Referencia 987654321 y TOTAL $45.000 devuelve 987654321: el símbolo impide reconocer la palabra clave y se toma el número mayor.
- QR convierte TOTAL 45.000,00 en 4500000 al eliminar todos los separadores.
- QR acepta https://example.com/comprobante/123456789 como gasto de 123456789; no valida el formato de comprobante ni rechaza previamente URLs.
- OCR transforma 31/02/2026 en 03/03/2026: DateTime normaliza días inexistentes y el try/catch no lo impide.

## Corrección antes de guardar: inspección estática

modulo_gastos.dart devuelve el resultado a AgregarGastoScreen; no guarda directamente desde el escáner. Los resultados nulos muestran un aviso de entrada manual. agregar_gasto_screen.dart precarga los controladores de monto y descripción y la variable de fecha; _crearGasto construye un nuevo modelo con los valores actuales. gastos_service.dart envía ese modelo a POST /movimientos y gasto_model.dart serializa la fecha como fecha_registro. movimientosController.js utiliza los datos suministrados en la inserción del gasto.

Limitación funcional: _buildCalendarSheet solo presenta los días de _fecha.month y _fecha.year, sin navegación entre meses/años. Se puede corregir el día, pero no una fecha reconocida con mes o año equivocado; el QR que usa hoy tampoco permite elegir el mes real de un recibo anterior.

La categoría detectada se compara por nombre con la lista del servidor; sin coincidencia permanece sin seleccionar. Ambos parsers usan General como valor predeterminado, lo que puede preseleccionar una categoría General aunque no se haya detectado una categoría en el recibo.

## Límites de verificación

adb devices no mostró dispositivos conectados. No se probó cámara, permisos, reconocimiento ML Kit sobre fotos reales, lectura de QR reales de Nequi/Daviplata, interacción del formulario, petición autenticada ni persistencia en base de datos. No se modificó el código de la aplicación. El resultado del documento «Cumple» no queda respaldado por esta revisión del código actual.

## Correcciones necesarias

Extraer y validar fechas también en QR; validar fechas calendáricas OCR; priorizar total final frente a subtotal; interpretar símbolos y separadores monetarios sin confundir identificadores; admitir montos pequeños; rechazar contenidos QR no reconocibles; permitir cambiar mes y año antes de guardar. Después repetir estos casos y probar captura, edición, cancelación y guardado con un dispositivo y comprobantes representativos.
