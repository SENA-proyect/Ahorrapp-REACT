# API — Fondo de Emergencia (`fondoemergenciaController`)

**Base path:** `/api/fondo-emergencia`
**Archivo de rutas:** `src/routes/fondoemergenciaRoutes.js`
**Archivo de controlador:** `src/controllers/fondoemergenciaController.js`

🔒 Todos los endpoints requieren `Authorization: Bearer <token>`.

Cada usuario puede tener **un solo** fondo de emergencia (restricción `UNIQUE(id_usuario)` en la tabla `fondos_emergencia`). El saldo se calcula dinámicamente como la suma de aportes menos retiros (tabla `movimientos_fondo_emergencia`), no se guarda como columna.

---

## 1. 🔒 Obtener el fondo de emergencia del usuario

`GET /api/fondo-emergencia`

### Respuesta 200
```json
{
  "ok": true,
  "datos": {
    "id_fondo": 1,
    "id_usuario": 4,
    "meta": 3000000,
    "fecha_creacion": "2026-01-01T00:00:00.000Z",
    "fecha_actualizacion": "2026-01-05T00:00:00.000Z",
    "saldo_actual": "200000"
  }
}
```
> `saldo_actual` viene como string porque es el resultado de un `SUM()` en Postgres devuelto sin cast explícito.

### Respuesta 404
```json
{ "ok": false, "mensaje": "El usuario no tiene un fondo de emergencia configurado" }
```

---

## 2. 🔒 Crear el fondo de emergencia

`POST /api/fondo-emergencia`

### Body
```json
{ "meta": 3000000 }
```
> `meta` es opcional (por defecto `0`), debe ser >= 0.

### Respuesta 201
```json
{
  "ok": true,
  "mensaje": "Fondo de emergencia creado correctamente",
  "datos": {
    "id_fondo": 1,
    "id_usuario": 4,
    "meta": 3000000,
    "fecha_creacion": "2026-01-01T00:00:00.000Z",
    "fecha_actualizacion": "2026-01-01T00:00:00.000Z"
  }
}
```

### Respuesta 400
```json
{ "ok": false, "mensaje": "La meta no puede ser negativa" }
```

### Respuesta 409 — ya existe uno
```json
{ "ok": false, "mensaje": "El usuario ya tiene un fondo de emergencia" }
```

---

## 3. 🔒 Actualizar la meta del fondo

`PUT /api/fondo-emergencia/meta`

### Body
```json
{ "meta": 3500000 }
```

### Respuesta 200
```json
{
  "ok": true,
  "mensaje": "Meta actualizada correctamente",
  "datos": {
    "id_fondo": 1,
    "id_usuario": 4,
    "meta": 3500000,
    "fecha_creacion": "2026-01-01T00:00:00.000Z",
    "fecha_actualizacion": "2026-01-05T00:00:00.000Z"
  }
}
```

### Respuesta 400
```json
{ "ok": false, "mensaje": "La meta debe ser un número mayor o igual a 0" }
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "El usuario no tiene un fondo de emergencia configurado" }
```

---

## 4. 🔒 Registrar un aporte

`POST /api/fondo-emergencia/aporte`

### Body
```json
{
  "monto": 100000,
  "descripcion": "Ahorro extra de enero"
}
```
> `monto` obligatorio, > 0. `descripcion` opcional.

### Respuesta 201
```json
{
  "ok": true,
  "mensaje": "Aporte registrado correctamente",
  "datos": {
    "id_movimiento_fondo": 12,
    "id_fondo": 1,
    "tipo": "aporte",
    "monto": 100000,
    "fecha_registro": "2026-01-05T00:00:00.000Z",
    "descripcion": "Ahorro extra de enero"
  }
}
```

### Respuesta 400
```json
{ "ok": false, "mensaje": "El monto del aporte debe ser mayor a 0" }
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "El usuario no tiene un fondo de emergencia configurado" }
```

---

## 5. 🔒 Registrar un retiro

`POST /api/fondo-emergencia/retiro`

### Body
```json
{
  "monto": 50000,
  "descripcion": "Gasto médico imprevisto"
}
```
> `monto` obligatorio, > 0, y no puede superar el saldo actual disponible.

### Respuesta 201
```json
{
  "ok": true,
  "mensaje": "Retiro registrado correctamente",
  "datos": {
    "id_movimiento_fondo": 13,
    "id_fondo": 1,
    "tipo": "retiro",
    "monto": 50000,
    "fecha_registro": "2026-01-06T00:00:00.000Z",
    "descripcion": "Gasto médico imprevisto"
  }
}
```

### Respuesta 400
```json
{ "ok": false, "mensaje": "El monto del retiro debe ser mayor a 0" }
```
```json
{ "ok": false, "mensaje": "El retiro no puede ser mayor al saldo disponible" }
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "El usuario no tiene un fondo de emergencia configurado" }
```

---

## 6. 🔒 Historial de movimientos del fondo

`GET /api/fondo-emergencia/movimientos`

### Respuesta 200
```json
{
  "ok": true,
  "datos": [
    {
      "id_movimiento_fondo": 13,
      "id_fondo": 1,
      "tipo": "retiro",
      "monto": 50000,
      "fecha_registro": "2026-01-06T00:00:00.000Z",
      "descripcion": "Gasto médico imprevisto"
    },
    {
      "id_movimiento_fondo": 12,
      "id_fondo": 1,
      "tipo": "aporte",
      "monto": 100000,
      "fecha_registro": "2026-01-05T00:00:00.000Z",
      "descripcion": "Ahorro extra de enero"
    }
  ]
}
```

---

## Errores genéricos

```json
{ "ok": false, "mensaje": "Error interno del servidor" }
```
con status **500** ante cualquier excepción no controlada.
