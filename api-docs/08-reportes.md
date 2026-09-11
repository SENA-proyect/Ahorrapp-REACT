# API — Reportes (`ReportesController`)

**Base path:** `/api/reportes`
**Archivo de rutas:** `src/routes/ReportesRoutes.js`
**Archivo de controlador:** `src/controllers/ReportesController.js`

🔒 Todos los endpoints requieren `Authorization: Bearer <token>`.

Todos estos endpoints son de **solo lectura** (`GET`), no reciben body. La mayoría requiere un rango de fechas por **query string**: `?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD` (nombres en snake_case, no camelCase). Si faltan o son inválidas, responden 400 con:
```json
{ "ok": false, "mensaje": "Debe proporcionar fecha_inicio y fecha_fin válidas" }
```

---

## 1. 🔒 Resumen financiero del período

`GET /api/reportes/resumen?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "resumen": {
    "ingresos": 1000000,
    "gastos": 100000,
    "imprevistos": 80000,
    "ahorros": 50000,
    "pagos_deudas": 100000,
    "fondo_emergencia": { "aportes": 100000, "retiros": 50000, "neto": 50000 },
    "balance": 620000
  },
  "deudas": { "monto_pagado": 100000, "cuotas_pagadas": 1 }
}
```

---

## 2. 🔒 Gastos por categoría

`GET /api/reportes/gastos/categorias?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "datos": [
    { "id_categoria": 1, "categoria": "Alimentación", "total": 100000 },
    { "id_categoria": 0, "categoria": "Sin categoría", "total": 20000 }
  ]
}
```

---

## 3. 🔒 Gastos por dependiente

`GET /api/reportes/gastos/dependientes?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "datos": [
    { "id_dependiente": 4, "dependiente": "Pedro", "total": 60000 },
    { "id_dependiente": 0, "dependiente": "Gasto propio", "total": 40000 }
  ]
}
```

---

## 4. 🔒 Ingresos por categoría

`GET /api/reportes/ingresos/categorias?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "datos": [
    { "id_categoria": 2, "categoria": "Salario", "total": 1000000 }
  ]
}
```

---

## 5. 🔒 Ingresos por fuente

`GET /api/reportes/ingresos/fuentes?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "datos": [
    { "fuente": "Trabajo", "total": 1000000 }
  ]
}
```

---

## 6. 🔒 Historial de abonos a ahorros

`GET /api/reportes/ahorros?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "total_ahorrado": 50000,
  "datos": [
    {
      "id_abono": 3,
      "id_ahorros": 3,
      "monto": 50000,
      "fecha_registro": "2026-01-05T00:00:00.000Z",
      "meta_monto": 500000,
      "monto_acumulado": 300000,
      "descripcion": "Fondo para vacaciones",
      "meta": "Viaje a Cartagena"
    }
  ]
}
```

---

## 7. 🔒 Historial de pagos de deuda

`GET /api/reportes/deudas?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "resumen": { "total_pagado": 100000, "cuotas_pagadas": 1 },
  "datos": [
    {
      "id_abono_deuda": 5,
      "id_deudas": 2,
      "cuotas": 1,
      "monto": 100000,
      "fecha_registro": "2026-01-05T00:00:00.000Z",
      "descripcion": "Pago de enero",
      "fuente": "Tarjeta de crédito",
      "monto_total_deuda": 1200000,
      "cuotas_total": 12,
      "cuotas_pagadas": 1,
      "estado": "pendiente"
    }
  ]
}
```

---

## 8. 🔒 Imprevistos por categoría

`GET /api/reportes/imprevistos/categorias?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "datos": [
    { "id_categoria": 6, "categoria": "Emergencias del hogar", "total": 80000 }
  ]
}
```

---

## 9. 🔒 Reporte del fondo de emergencia (por período)

`GET /api/reportes/fondo-emergencia?fecha_inicio=2026-01-01&fecha_fin=2026-01-31`

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-31" },
  "resumen": {
    "aportes": 100000,
    "retiros": 50000,
    "movimiento_neto": 50000,
    "meta": 3000000
  }
}
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "El usuario no tiene fondo de emergencia" }
```

---

## 10. 🔒 Reporte de presupuesto de un período específico

`GET /api/reportes/presupuesto/:id_periodo`

### Params
- `id_periodo` (URL, entero) — id de un período en `periodos_presupuesto` que pertenezca al usuario.

### Respuesta 200
```json
{
  "ok": true,
  "periodo": {
    "id_periodo": 7,
    "id_presupuesto": 1,
    "fecha_inicio": "2026-01-05T00:00:00.000Z",
    "fecha_fin": "2026-02-04T00:00:00.000Z",
    "estado": "abierto"
  },
  "presupuesto": {
    "nombre": "Mi presupuesto",
    "descripcion": null,
    "porcentajes": { "gastos": 40, "deudas": 20, "imprevistos": 15, "ahorros": 10, "emergencia": 15 }
  },
  "ingresos": { "estimado": 1000000, "real": 1000000 },
  "saldo": { "anterior": 0, "disponible": 750000 },
  "categorias": {
    "gastos":      { "planeado": 400000, "ejecutado": 100000, "diferencia": 300000, "porcentaje_usado": 25 },
    "deudas":      { "planeado": 200000, "ejecutado": 100000, "diferencia": 100000, "porcentaje_usado": 50 },
    "imprevistos": { "planeado": 150000, "ejecutado": 80000,  "diferencia": 70000,  "porcentaje_usado": 53.33 },
    "ahorros":     { "planeado": 100000, "ejecutado": 50000,  "diferencia": 50000,  "porcentaje_usado": 50 },
    "emergencia":  { "planeado": 150000, "ejecutado": 50000,  "diferencia": 100000, "porcentaje_usado": 33.33 }
  },
  "resumen": {
    "total_planeado": 1000000,
    "total_ejecutado": 380000,
    "diferencia": 620000,
    "porcentaje_ejecucion": 38
  }
}
```

### Respuesta 400
```json
{ "ok": false, "mensaje": "El id_periodo debe ser válido" }
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "El periodo de presupuesto no existe" }
```

---

## 11. 🔒 Evolución temporal (día a día, con balance acumulado)

`GET /api/reportes/evolucion?fecha_inicio=2026-01-01&fecha_fin=2026-01-10`

Devuelve una fila **por cada día** del rango (incluidos los días sin movimientos, con ceros), más el balance acumulado corrido.

### Respuesta 200
```json
{
  "ok": true,
  "periodo": { "fecha_inicio": "2026-01-01", "fecha_fin": "2026-01-10" },
  "datos": [
    {
      "fecha": "2026-01-01T00:00:00.000Z",
      "ingresos": 0, "gastos": 0, "imprevistos": 0, "ahorros": 0, "pagos_deudas": 0,
      "aportes_emergencia": 0, "retiros_emergencia": 0,
      "balance": 0, "balance_acumulado": 0
    },
    {
      "fecha": "2026-01-05T00:00:00.000Z",
      "ingresos": 1000000, "gastos": 0, "imprevistos": 0, "ahorros": 0, "pagos_deudas": 0,
      "aportes_emergencia": 0, "retiros_emergencia": 0,
      "balance": 1000000, "balance_acumulado": 1000000
    }
  ]
}
```

---

## 12. 🔒 Estado actual de todas las metas de ahorro

`GET /api/reportes/ahorros/estado`

> No recibe query params de fecha — es un snapshot del estado actual, no de un período.

### Respuesta 200
```json
{
  "ok": true,
  "resumen": {
    "cantidad_metas": 1,
    "meta_total": 500000,
    "acumulado_total": 300000,
    "porcentaje_cumplimiento": 60
  },
  "datos": [
    {
      "id_ahorro": 3,
      "meta": 500000,
      "monto_acumulado": 300000,
      "porcentaje_cumplimiento": 60,
      "total_abonado": 300000,
      "fecha_registro": "2026-01-01T00:00:00.000Z",
      "fecha_meta": "2026-06-01T00:00:00.000Z",
      "descripcion": "Fondo para vacaciones"
    }
  ]
}
```

---

## 13. 🔒 Estado actual de todas las deudas

`GET /api/reportes/deudas/estado`

> No recibe query params de fecha.

### Respuesta 200
```json
{
  "ok": true,
  "resumen": {
    "cantidad_deudas": 1,
    "monto_total": 1200000,
    "monto_pagado": 100000,
    "monto_pendiente": 1100000,
    "cuotas_total": 12,
    "cuotas_pagadas": 1,
    "cuotas_pendientes": 11,
    "porcentaje_pagado": 8.33
  },
  "datos": [
    {
      "id_deuda": 2,
      "fuente": "Tarjeta de crédito",
      "descripcion": "Compra de portátil",
      "fecha_inicio": "2026-01-05T00:00:00.000Z",
      "monto_total": 1200000,
      "monto_pagado": 100000,
      "monto_pendiente": 1100000,
      "cuotas_total": 12,
      "cuotas_pagadas": 1,
      "cuotas_pendientes": 11,
      "porcentaje_pagado": 8.33,
      "estado": "pendiente"
    }
  ]
}
```

---

## 14. 🔒 Estado actual del fondo de emergencia

`GET /api/reportes/fondo-emergencia/estado`

> No recibe query params de fecha.

### Respuesta 200
```json
{
  "ok": true,
  "data": {
    "id_fondo": 1,
    "meta": 3000000,
    "aportes": 100000,
    "retiros": 50000,
    "saldo_actual": 50000,
    "porcentaje_meta": 1.67,
    "fecha_creacion": "2026-01-01T00:00:00.000Z"
  }
}
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "El usuario no tiene fondo de emergencia" }
```

---

## Errores genéricos

```json
{ "ok": false, "mensaje": "Error interno del servidor" }
```
con status **500** ante cualquier excepción no controlada.
