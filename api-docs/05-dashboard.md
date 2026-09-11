# API — Dashboard (`dashboardController`)

**Base path:** `/api/dashboard`
**Archivo de rutas:** `src/routes/dashboardRoutes.js`
**Archivo de controlador:** `src/controllers/dashboardController.js`

🔒 Todos los endpoints requieren `Authorization: Bearer <token>`.

Todos los endpoints de este módulo dependen del **período de presupuesto activo** del usuario (`periodos_presupuesto` con `estado = 'abierto'`). Si el usuario no tiene un período abierto, se responde con `sin_periodo: true` y datos de respaldo (o vacíos).

Ninguno de los 3 endpoints recibe body ni query params.

---

## 1. 🔒 Resumen general

`GET /api/dashboard/resumen`

### Respuesta 200 — con período activo
```json
{
  "ok": true,
  "sin_periodo": false,
  "totalIngresos": 1000000,
  "totalGastos": 100000,
  "totalAhorros": 300000,
  "balance": 900000,
  "periodo": {
    "fecha_inicio": "2026-01-01",
    "fecha_fin": "2026-01-31",
    "perfil_nombre": "Mi presupuesto",
    "ingreso_estimado": 1000000,
    "ingreso_real": 1000000,
    "saldo_anterior": 0
  }
}
```

### Respuesta 200 — sin período activo (fallback con totales históricos)
```json
{
  "ok": true,
  "sin_periodo": true,
  "totalIngresos": 1000000,
  "totalGastos": 100000,
  "totalAhorros": 300000,
  "balance": 900000,
  "periodo": null
}
```

---

## 2. 🔒 Presupuesto vs. ejecutado

`GET /api/dashboard/presupuesto-vs-ejecutado`

Compara lo presupuestado (según los porcentajes del perfil activo) contra lo realmente gastado/ahorrado en el período activo, categoría por categoría.

### Respuesta 200 — con período activo
```json
{
  "ok": true,
  "sin_periodo": false,
  "data": [
    {
      "categoria": "Gastos",
      "presupuestado": 400000,
      "ejecutado": 100000,
      "disponible": 300000,
      "porcentaje": 25.0
    },
    {
      "categoria": "Deudas",
      "presupuestado": 200000,
      "ejecutado": 100000,
      "disponible": 100000,
      "porcentaje": 50.0
    },
    {
      "categoria": "Imprevistos",
      "presupuestado": 150000,
      "ejecutado": 0,
      "disponible": 150000,
      "porcentaje": 0
    },
    {
      "categoria": "Ahorros",
      "presupuestado": 100000,
      "ejecutado": 50000,
      "disponible": 50000,
      "porcentaje": 50.0
    },
    {
      "categoria": "Emergencia",
      "presupuestado": 150000,
      "ejecutado": 0,
      "disponible": 150000,
      "porcentaje": 0
    }
  ]
}
```
> `ejecutado` en "Emergencia" siempre se devuelve como `0` (no está implementado en este endpoint; usa `/api/fondo-emergencia` para el detalle real del fondo).

### Respuesta 200 — sin período activo
```json
{ "ok": true, "sin_periodo": true, "data": [] }
```

---

## 3. 🔒 Flujo semanal

`GET /api/dashboard/flujo-semanal`

Divide el período activo en semanas (bloques de 7 días) y calcula ingresos/salidas por semana.

### Respuesta 200 — con período activo
```json
{
  "ok": true,
  "sin_periodo": false,
  "data": [
    { "semana": "Sem 1", "ingresos": 1000000, "gastos": 180000, "balance": 820000 },
    { "semana": "Sem 2", "ingresos": 0, "gastos": 50000, "balance": -50000 },
    { "semana": "Sem 3", "ingresos": 0, "gastos": 0, "balance": 0 },
    { "semana": "Sem 4", "ingresos": 0, "gastos": 0, "balance": 0 },
    { "semana": "Sem 5", "ingresos": 0, "gastos": 0, "balance": 0 }
  ]
}
```
> `gastos` en cada semana es la suma de gastos + imprevistos + cuota proporcional de deudas activas en esa semana (no solo la tabla `gastos`).

### Respuesta 200 — sin período activo
```json
{ "ok": true, "sin_periodo": true, "data": [] }
```

---

## Errores genéricos

```json
{ "ok": false, "mensaje": "Error interno del servidor" }
```
con status **500** ante cualquier excepción no controlada.
