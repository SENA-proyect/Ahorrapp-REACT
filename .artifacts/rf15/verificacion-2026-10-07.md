# Verificación RF-15 — 7 de octubre de 2026

Rama: David. Commit: d624ed31cb9c49dc27b93f138c5b027b36d84bb9.
Resultado: RF-15 no cumple completamente en el código local actual.

## Pruebas ejecutadas
Se ejecutó verificar-controladores.cjs contra los controladores reales, con PostgreSQL y servicios secundarios simulados. Resultado: 15 casos pasan y 11 fallan. Los resultados están en resultados-controladores.json. Esta prueba no demuestra persistencia, restricciones adicionales de la BD desplegada ni equivalencia del despliegue de Render con este commit.

| Comprobación | Resultado en controladores |
| --- | --- |
| Crear, editar, deshabilitar y habilitar categoría propia | Pasa |
| Eliminar categoría deshabilitada | Pasa |
| Rechazar eliminación de categoría activa | Pasa |
| Proteger categorías globales y categorías ajenas | Pasa |
| Rechazar nombre vacío | Pasa |
| Evitar duplicados al crear y editar | Falla: responde 201/200 |
| Proteger sistema=true, es_global=false | Falla en editar, deshabilitar, habilitar y eliminar |
| Bloquear categoría inactiva en nuevos ingresos, ahorros, gastos, imprevistos y deudas | Falla en los cinco tipos |

## Interfaz y esquema: revisión estática
ModulosCategorias.jsx valida duplicados con trim y minúsculas, identifica categorías globales o del sistema y tiene acciones para las cinco operaciones. Modalnuevomovimiento.jsx filtra categorías activas. Estas comprobaciones del cliente no impiden solicitudes directas a la API.
SQL/supabase.sql solo define un índice único parcial de nombres globales. No aporta una restricción de duplicados para categorías propias normalizando mayúsculas y espacios. Las relaciones de movimientos con categorías usan ON DELETE SET NULL.

## Verificación real pendiente
GET https://david-ekcn.onrender.com/api/categorias devolvió HTTP 401 sin autenticación. No se hicieron modificaciones de datos reales.
El navegador integrado no pudo abrir https://localhost:5173/ por ERR_CERT_AUTHORITY_INVALID. Se requiere que el usuario resuelva el aviso del certificado y disponga de una sesión autenticada para probar la interfaz y la API real.
El backend local no dispone de .env ni node_modules para hacer pruebas con PostgreSQL real.

No se modificó código funcional durante esta auditoría.
