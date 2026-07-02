# APIS INTERNAS

# Usuarios

## Resumen de Endpoints

| Método | Ruta | URL |
|:------:|------|-----|
| `POST` | `/register` | `https://localhost:3000/api/auth/register` |
| `POST` | `/login` | `https://localhost:3000/api/auth/login` |
| `GET` | `/PanelUsuarios` | `https://localhost:3000/api/auth/PanelUsuarios` |
| `GET` | `/usuarios/PanelAdmin` | `https://localhost:3000/api/auth/usuarios/PanelAdmin` |
| `GET` | `/dependientes/PanelAdmin` | `https://localhost:3000/api/auth/dependientes/PanelAdmin` |
| `GET` | `/PanelDependientes` | `https://localhost:3000/api/auth/PanelDependientes` |
| `PUT` | `/PanelUsuarios/:id` | `https://localhost:3000/api/auth/PanelUsuarios/:id` |
| `DELETE` | `/PanelUsuarios/:id` | `https://localhost:3000/api/auth/PanelUsuarios/:id` |

---

## Detalle de Endpoints

### Registro de Usuarios

**Método:** `POST`

**Ruta:** `/register`

**Autenticación:** Ninguna (Público)

#### Cuerpo de la Petición

```json
{
  "Nombre": "juan",
  "Apellido": "medina",
  "Email": "juanma@gmail.com",
  "Password_hash": "123"
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Usuario registrado exitosamente",
  "id": 2
}
```

---

### Inicio de Sesión (Login)

**Método:** `POST`

**Ruta:** `/login`

**Autenticación:** Ninguna (Público)

#### Cuerpo de la Petición

```json
{
  "Email": "juanma1608@gmail.com",
  "Password_hash": "123"
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZXMiOltdLCJpYXQiOjE3ODIzMjg1NjAsImV4cCI6MTc4MjM1NzM2MH0.0m151zDtUSbY88BPn25cH-NdRzy8y_NyV7yF_SVjjfY",
  "usuario": {
    "id": 2,
    "nombre": "manuel",
    "apellido": "guerrero",
    "email": "juanma1608@gmail.com",
    "roles": []
  }
}
```

---

### Obtener Panel de Usuarios

**Método:** `GET`

**Ruta:** `/PanelUsuarios`

**Autenticación:** Requerida (`verifyToken`)

#### Respuesta Exitosa (200 OK)

```json
{
  "ok": true,
  "cantidad": 2,
  "usuarios": [
    {
      "ID_usuario": 1,
      "Nombre": "juan",
      "Apellido": "medina",
      "Email": "juanma@gmail.com",
      "Activo": 1
    },
    {
      "ID_usuario": 2,
      "Nombre": "manuel",
      "Apellido": "guerrero",
      "Email": "juanma1608@gmail.com",
      "Activo": 1
    }
  ]
}
```

---

### Actualizar Usuario

**Método:** `PUT`

**Ruta:** `/PanelUsuarios/:id`

**Autenticación:** Requerida (`verifyToken`)

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del usuario a modificar. |

#### Cuerpo de la Petición

```json
{
  "Nombre": "juan carlos",
  "Apellido": "medina ramos",
  "Email": "juanma_nuevo@gmail.com",
  "Activo": 1
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Usuario actualizado exitosamente"
}
```

---

### Eliminar Usuario

**Método:** `DELETE`

**Ruta:** `/PanelUsuarios/:id`

**Autenticación:** Requerida (`verifyToken` - Solo Superusuario)

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del usuario a eliminar. |

#### Respuesta Exitosa (200 OK)

```json
{
  "ok": true,
  "mensaje": "Usuario eliminado exitosamente"
}
```

---

### Obtener Usuarios en Panel Admin

**Método:** `GET`

**Ruta:** `/usuarios/PanelAdmin`

**Autenticación:** Requerida (`verifyToken` - Administradores / Superusuario)

#### Respuesta Exitosa (200 OK)

```json
{
  "totalUsuarios": 2
}
```

---

### Obtener Dependientes en Panel Admin

**Método:** `GET`

**Ruta:** `/dependientes/PanelAdmin`

**Autenticación:** Requerida (`verifyToken` - Administradores / Superusuario)

#### Respuesta Exitosa (200 OK)

```json
{
  "totalDependientes": 0
}
```

---

### Obtener Todos los Dependientes

**Método:** `GET`

**Ruta:** `/PanelDependientes`

**Autenticación:** Requerida (`verifyToken`)

#### Respuesta Exitosa (200 OK)

```json
{
  "ok": true,
  "dependientes": []
}
```

# Categorías

## Resumen de Endpoints

| Método | Ruta | URL |
|:------:|------|-----|
| `GET` | `/` | `https://localhost:3000/api/categorias` |
| `GET` | `/gastos` | `https://localhost:3000/api/categorias/gastos` |
| `GET` | `/ingresos` | `https://localhost:3000/api/categorias/ingresos` |
| `GET` | `/ahorros` | `https://localhost:3000/api/categorias/ahorros` |
| `GET` | `/imprevistos` | `https://localhost:3000/api/categorias/imprevistos` |
| `GET` | `/deudas` | `https://localhost:3000/api/categorias/deudas` |
| `POST` | `/` | `https://localhost:3000/api/categorias` |
| `PUT` | `/:id` | `https://localhost:3000/api/categorias/:id` |
| `PATCH` | `/:id/deshabilitar` | `https://localhost:3000/api/categorias/:id/deshabilitar` |
| `PATCH` | `/:id/habilitar` | `https://localhost:3000/api/categorias/:id/habilitar` |

---

## Detalle de Endpoints

### Obtener Categorías

**Método:** `GET`

**Ruta:** `/`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "categorias": [
    {
      "id": 1,
      "id_usuario": null,
      "nombre": "Alimentacion",
      "descripcion": "Gastos de comida",
      "activa": true,
      "sistema": true,
      "es_global": true
    }
  ]
}
```

---

### Obtener Gastos por Categoría

**Método:** `GET`

**Ruta:** `/gastos`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "categorias": [
    {
      "id": 1,
      "nombre": "Alimentacion",
      "cantidad_gastos": 2,
      "total_gastos": 150000,
      "gastos": [
        {
          "id": 10,
          "monto": 75000,
          "descripcion": "Mercado",
          "fecha": "2026-06-24"
        }
      ]
    }
  ]
}
```

---

### Obtener Ingresos por Categoría

**Método:** `GET`

**Ruta:** `/ingresos`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "categorias": [
    {
      "id": 2,
      "nombre": "Salario",
      "cantidad_ingresos": 1,
      "total_ingresos": 3000000,
      "ingresos": [
        {
          "id": 8,
          "monto": 3000000,
          "descripcion": "Nomina",
          "fecha": "2026-06-01"
        }
      ]
    }
  ]
}
```

---

### Obtener Ahorros por Categoría

**Método:** `GET`

**Ruta:** `/ahorros`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "categorias": [
    {
      "id": 3,
      "nombre": "Viajes",
      "cantidad_ahorros": 1,
      "total_ahorros": 500000,
      "ahorros": [
        {
          "id": 5,
          "monto": 500000,
          "descripcion": "Viaje familiar",
          "fecha": "2026-06-10"
        }
      ]
    }
  ]
}
```

---

### Obtener Imprevistos por Categoría

**Método:** `GET`

**Ruta:** `/imprevistos`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "categorias": [
    {
      "id": 4,
      "nombre": "Salud",
      "cantidad_imprevistos": 1,
      "total_imprevistos": 80000,
      "imprevistos": [
        {
          "id": 3,
          "monto": 80000,
          "descripcion": "Medicamentos",
          "fecha": "2026-06-12"
        }
      ]
    }
  ]
}
```

---

### Obtener Deudas por Categoría

**Método:** `GET`

**Ruta:** `/deudas`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "categorias": [
    {
      "id": 5,
      "nombre": "Tarjetas",
      "cantidad_deudas": 1,
      "total_deudas": 200000,
      "deudas": [
        {
          "id": 7,
          "monto": 200000,
          "descripcion": "Tarjeta credito",
          "fecha": "2026-06-05"
        }
      ]
    }
  ]
}
```

---

### Crear Categoría

**Método:** `POST`

**Ruta:** `/`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Cuerpo de la Petición

```json
{
  "nombre": "Ropa",
  "descripcion": "Gastos en vestimenta"
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Categoria creada exitosamente",
  "id": 10
}
```

---

### Actualizar Categoría

**Método:** `PUT`

**Ruta:** `/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador de la categoría personal a modificar. |

#### Cuerpo de la Petición

```json
{
  "nombre": "Ropa y calzado",
  "descripcion": "Gastos en vestimenta y zapatos"
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Categoria actualizada exitosamente"
}
```

---

### Deshabilitar Categoría

**Método:** `PATCH`

**Ruta:** `/:id/deshabilitar`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador de la categoría personal. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Categoria deshabilitada"
}
```

---

### Habilitar Categoría

**Método:** `PATCH`

**Ruta:** `/:id/habilitar`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador de la categoría personal. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Categoria habilitada"
}
```

# Dashboard

## Resumen de Endpoints

| Método | Ruta | URL |
|:------:|------|-----|
| `GET` | `/resumen` | `https://localhost:3000/api/dashboard/resumen` |
| `GET` | `/presupuesto-vs-ejecutado` | `https://localhost:3000/api/dashboard/presupuesto-vs-ejecutado` |
| `GET` | `/flujo-semanal` | `https://localhost:3000/api/dashboard/flujo-semanal` |

---

## Detalle de Endpoints

### Obtener Resumen del Dashboard

**Método:** `GET`

**Ruta:** `/resumen`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "sin_periodo": false,
  "totalIngresos": 3000000,
  "totalGastos": 850000,
  "totalAhorros": 500000,
  "balance": 2150000,
  "periodo": {
    "fecha_inicio": "2026-06-01",
    "fecha_fin": "2026-06-30",
    "perfil_nombre": "Presupuesto base",
    "ingreso_estimado": 3000000,
    "ingreso_real": 3000000,
    "saldo_anterior": 0
  }
}
```

---

### Obtener Presupuesto vs Ejecutado

**Método:** `GET`

**Ruta:** `/presupuesto-vs-ejecutado`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "sin_periodo": false,
  "data": [
    {
      "categoria": "Gastos",
      "presupuestado": 1200000,
      "ejecutado": 850000,
      "disponible": 350000,
      "porcentaje": 70.8
    }
  ]
}
```

---

### Obtener Flujo Semanal

**Método:** `GET`

**Ruta:** `/flujo-semanal`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "sin_periodo": false,
  "data": [
    {
      "semana": "Sem 1",
      "ingresos": 1500000,
      "gastos": 400000,
      "balance": 1100000
    }
  ]
}
```

# Movimientos

## Resumen de Endpoints

| Método | Ruta | URL |
|:------:|------|-----|
| `POST` | `/` | `https://localhost:3000/api/movimientos` |
| `GET` | `/` | `https://localhost:3000/api/movimientos` |
| `GET` | `/ingresos` | `https://localhost:3000/api/movimientos/ingresos` |
| `GET` | `/ahorros` | `https://localhost:3000/api/movimientos/ahorros` |
| `GET` | `/gastos` | `https://localhost:3000/api/movimientos/gastos` |
| `GET` | `/imprevistos` | `https://localhost:3000/api/movimientos/imprevistos` |
| `GET` | `/deudas` | `https://localhost:3000/api/movimientos/deudas` |
| `PATCH` | `/deudas/:id/abonar` | `https://localhost:3000/api/movimientos/deudas/:id/abonar` |
| `PATCH` | `/ahorros/:id/abonar` | `https://localhost:3000/api/movimientos/ahorros/:id/abonar` |
| `PUT` | `/ingresos/:id` | `https://localhost:3000/api/movimientos/ingresos/:id` |
| `PUT` | `/ahorros/:id` | `https://localhost:3000/api/movimientos/ahorros/:id` |
| `PUT` | `/gastos/:id` | `https://localhost:3000/api/movimientos/gastos/:id` |
| `PUT` | `/imprevistos/:id` | `https://localhost:3000/api/movimientos/imprevistos/:id` |
| `PUT` | `/deudas/:id` | `https://localhost:3000/api/movimientos/deudas/:id` |
| `DELETE` | `/ingresos/:id` | `https://localhost:3000/api/movimientos/ingresos/:id` |
| `DELETE` | `/ahorros/:id` | `https://localhost:3000/api/movimientos/ahorros/:id` |
| `DELETE` | `/gastos/:id` | `https://localhost:3000/api/movimientos/gastos/:id` |
| `DELETE` | `/imprevistos/:id` | `https://localhost:3000/api/movimientos/imprevistos/:id` |
| `DELETE` | `/deudas/:id` | `https://localhost:3000/api/movimientos/deudas/:id` |

---

## Detalle de Endpoints

### Crear Movimiento

**Método:** `POST`

**Ruta:** `/`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Cuerpo de la Petición

```json
{
  "tipo_flujo": "Entrada",
  "subtipo_modulo": "Ingreso",
  "datos": {
    "monto": 3000000,
    "descripcion": "Salario mensual",
    "fuente": "Empresa",
    "fecha_registro": "2026-06-01",
    "id_categoria": 2
  }
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Movimiento registrado exitosamente",
  "ID_movimiento": 15,
  "ID_detalle": 8
}
```

---

### Obtener Todos los Movimientos

**Método:** `GET`

**Ruta:** `/`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
[
  {
    "tipo": "ingreso",
    "monto": 3000000,
    "descripcion": "Salario mensual",
    "fecha": "2026-06-01"
  },
  {
    "tipo": "gasto",
    "monto": 75000,
    "descripcion": "Mercado",
    "fecha": "2026-06-02"
  }
]
```

---

### Obtener Ingresos

**Método:** `GET`

**Ruta:** `/ingresos`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
[
  {
    "id": 8,
    "monto": 3000000,
    "descripcion": "Salario mensual",
    "fuente": "Empresa",
    "fecha": "2026-06-01",
    "ID_categoria": 2,
    "categoria": "Salario"
  }
]
```

---

### Obtener Ahorros

**Método:** `GET`

**Ruta:** `/ahorros`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
[
  {
    "id": 5,
    "monto": 1000000,
    "monto_acumulado": 500000,
    "descripcion": "Viaje familiar",
    "meta": "Vacaciones",
    "fecha": "2026-06-10",
    "fecha_meta": "2026-12-31",
    "ID_categoria": 3,
    "categoria": "Viajes"
  }
]
```

---

### Obtener Gastos

**Método:** `GET`

**Ruta:** `/gastos`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
[
  {
    "id": 10,
    "monto": 75000,
    "descripcion": "Mercado",
    "fecha": "2026-06-02",
    "ID_categoria": 1,
    "ID_dependientes": 2,
    "categoria": "Alimentacion",
    "dependiente": "Hijo"
  }
]
```

---

### Obtener Imprevistos

**Método:** `GET`

**Ruta:** `/imprevistos`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
[
  {
    "id": 3,
    "monto": 80000,
    "causa": "Medicamentos",
    "fecha": "2026-06-12",
    "ID_categoria": 4,
    "ID_dependientes": null,
    "categoria": "Salud",
    "dependiente": null
  }
]
```

---

### Obtener Deudas

**Método:** `GET`

**Ruta:** `/deudas`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
[
  {
    "id": 7,
    "monto": 200000,
    "fuente": "Banco",
    "descripcion": "Tarjeta credito",
    "cuotas_total": 4,
    "cuotas_pagadas": 1,
    "fecha_inicio": "2026-06-05",
    "fecha_fin": "2026-10-05",
    "estado": "pendiente",
    "ID_categoria": 5,
    "categoria": "Tarjetas"
  }
]
```

---

### Abonar Deuda

**Método:** `PATCH`

**Ruta:** `/deudas/:id/abonar`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador de la deuda. |

#### Cuerpo de la Petición

```json
{
  "cuotas": 1
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Cuota registrada",
  "cuotas_pagadas": 2,
  "cuotas_total": 4,
  "estado": "pendiente"
}
```

---

### Abonar Ahorro

**Método:** `PATCH`

**Ruta:** `/ahorros/:id/abonar`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del ahorro. |

#### Cuerpo de la Petición

```json
{
  "monto": 100000
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Abono registrado",
  "monto_acumulado": 600000,
  "meta_monto": 1000000,
  "progreso": 60.0,
  "meta_alcanzada": false
}
```

---

### Actualizar Ingreso

**Método:** `PUT`

**Ruta:** `/ingresos/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del ingreso. |

#### Cuerpo de la Petición

```json
{
  "monto": 3100000,
  "descripcion": "Salario ajustado",
  "fuente": "Empresa",
  "fecha_registro": "2026-06-01",
  "id_categoria": 2
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Ingreso actualizado exitosamente"
}
```

---

### Actualizar Ahorro

**Método:** `PUT`

**Ruta:** `/ahorros/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del ahorro. |

#### Cuerpo de la Petición

```json
{
  "monto": 1000000,
  "monto_acumulado": 500000,
  "descripcion": "Viaje familiar",
  "meta": "Vacaciones",
  "fecha_registro": "2026-06-10",
  "fecha_meta": "2026-12-31",
  "id_categoria": 3
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Ahorro actualizado exitosamente"
}
```

---

### Actualizar Gasto

**Método:** `PUT`

**Ruta:** `/gastos/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del gasto. |

#### Cuerpo de la Petición

```json
{
  "monto": 80000,
  "descripcion": "Mercado semanal",
  "fecha_registro": "2026-06-02",
  "id_categoria": 1,
  "id_dependientes": 2
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Gasto actualizado exitosamente"
}
```

---

### Actualizar Imprevisto

**Método:** `PUT`

**Ruta:** `/imprevistos/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del imprevisto. |

#### Cuerpo de la Petición

```json
{
  "monto": 90000,
  "causa": "Medicamentos",
  "fecha_registro": "2026-06-12",
  "id_categoria": 4,
  "id_dependientes": null
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Imprevisto actualizado exitosamente"
}
```

---

### Actualizar Deuda

**Método:** `PUT`

**Ruta:** `/deudas/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador de la deuda. |

#### Cuerpo de la Petición

```json
{
  "monto": 200000,
  "fuente": "Banco",
  "descripcion": "Tarjeta credito",
  "cuotas_total": 4,
  "cuotas_pagadas": 2,
  "fecha_inicio": "2026-06-05",
  "fecha_fin": "2026-10-05",
  "estado": "pendiente",
  "id_categoria": 5
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Deuda actualizada exitosamente"
}
```

---

### Eliminar Ingreso

**Método:** `DELETE`

**Ruta:** `/ingresos/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del ingreso. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Ingreso eliminado exitosamente"
}
```

---

### Eliminar Ahorro

**Método:** `DELETE`

**Ruta:** `/ahorros/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del ahorro. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Ahorro eliminado exitosamente"
}
```

---

### Eliminar Gasto

**Método:** `DELETE`

**Ruta:** `/gastos/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del gasto. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Gasto eliminado exitosamente"
}
```

---

### Eliminar Imprevisto

**Método:** `DELETE`

**Ruta:** `/imprevistos/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del imprevisto. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Imprevisto eliminado exitosamente"
}
```

---

### Eliminar Deuda

**Método:** `DELETE`

**Ruta:** `/deudas/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador de la deuda. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Deuda eliminada exitosamente"
}
```

# Presupuestos

## Resumen de Endpoints

| Método | Ruta | URL |
|:------:|------|-----|
| `GET` | `/` | `https://localhost:3000/api/presupuestos` |
| `GET` | `/periodos` | `https://localhost:3000/api/presupuestos/periodos` |
| `GET` | `/periodos/activo` | `https://localhost:3000/api/presupuestos/periodos/activo` |
| `POST` | `/periodos/abrir` | `https://localhost:3000/api/presupuestos/periodos/abrir` |
| `PUT` | `/periodos/cerrar` | `https://localhost:3000/api/presupuestos/periodos/cerrar` |
| `PATCH` | `/periodos/ajustar-ingreso` | `https://localhost:3000/api/presupuestos/periodos/ajustar-ingreso` |
| `GET` | `/:id` | `https://localhost:3000/api/presupuestos/:id` |
| `POST` | `/` | `https://localhost:3000/api/presupuestos` |
| `PUT` | `/:id` | `https://localhost:3000/api/presupuestos/:id` |
| `DELETE` | `/:id` | `https://localhost:3000/api/presupuestos/:id` |
| `PUT` | `/:id/activar` | `https://localhost:3000/api/presupuestos/:id/activar` |

---

## Detalle de Endpoints

### Listar Perfiles de Presupuesto

**Método:** `GET`

**Ruta:** `/`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "data": [
    {
      "ID_presupuesto": 1,
      "Nombre": "Presupuesto base",
      "Descripcion": "Perfil mensual",
      "Activo": 1,
      "Dia_corte": 28,
      "Porcentaje_gastos": 40,
      "Porcentaje_deudas": 20,
      "Porcentaje_imprevistos": 15,
      "Porcentaje_ahorros": 10,
      "Porcentaje_emergencia": 15
    }
  ]
}
```

---

### Listar Periodos

**Método:** `GET`

**Ruta:** `/periodos`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Consulta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `pagina` | Integer | Número de página (opcional). |
| `limite` | Integer | Cantidad de registros por página (opcional). |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "data": [
    {
      "ID_periodo": 3,
      "Estado": "cerrado",
      "Perfil_nombre": "Presupuesto base"
    }
  ],
  "total": 1,
  "pagina": 1,
  "limite": 10
}
```

---

### Obtener Periodo Activo

**Método:** `GET`

**Ruta:** `/periodos/activo`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "data": {
    "ID_periodo": 4,
    "Estado": "abierto",
    "Perfil_nombre": "Presupuesto base",
    "ejecucion": {
      "gastos": {
        "presupuestado": 1200000,
        "ejecutado": 850000,
        "disponible": 350000
      }
    }
  }
}
```

---

### Abrir Periodo

**Método:** `POST`

**Ruta:** `/periodos/abrir`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Cuerpo de la Petición

```json
{
  "ingreso_estimado": 3000000
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Periodo abierto correctamente",
  "data": {
    "ID_periodo": 4,
    "Fecha_inicio": "2026-06-01",
    "Fecha_fin": "2026-06-30",
    "Ingreso_estimado": 3000000,
    "Monto_gastos": 1200000
  }
}
```

---

### Cerrar Periodo

**Método:** `PUT`

**Ruta:** `/periodos/cerrar`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Periodo cerrado correctamente",
  "data": {
    "ID_periodo": 4,
    "Ingreso_real": 3000000,
    "Fecha_inicio": "2026-06-01",
    "Fecha_fin": "2026-06-30"
  }
}
```

---

### Ajustar Ingreso del Periodo

**Método:** `PATCH`

**Ruta:** `/periodos/ajustar-ingreso`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Cuerpo de la Petición

```json
{
  "ingreso_estimado": 3200000
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Ingreso ajustado y montos recalculados",
  "data": {
    "Ingreso_estimado": 3200000,
    "Monto_gastos": 1280000,
    "Monto_deudas": 640000
  }
}
```

---

### Obtener Perfil

**Método:** `GET`

**Ruta:** `/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del perfil de presupuesto. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "data": {
    "ID_presupuesto": 1,
    "Nombre": "Presupuesto base",
    "Activo": 1
  }
}
```

---

### Crear Perfil

**Método:** `POST`

**Ruta:** `/`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Cuerpo de la Petición

```json
{
  "Nombre": "Presupuesto base",
  "Descripcion": "Perfil mensual",
  "Dia_corte": 28,
  "Porcentaje_gastos": 40,
  "Porcentaje_deudas": 20,
  "Porcentaje_imprevistos": 15,
  "Porcentaje_ahorros": 10,
  "Porcentaje_emergencia": 15
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Perfil creado",
  "ID_presupuesto": 2
}
```

---

### Editar Perfil

**Método:** `PUT`

**Ruta:** `/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del perfil de presupuesto. |

#### Cuerpo de la Petición

```json
{
  "Nombre": "Presupuesto actualizado",
  "Descripcion": "Distribucion mensual",
  "Dia_corte": 28,
  "Porcentaje_gastos": 40,
  "Porcentaje_deudas": 20,
  "Porcentaje_imprevistos": 15,
  "Porcentaje_ahorros": 10,
  "Porcentaje_emergencia": 15
}
```

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Perfil actualizado"
}
```

---

### Eliminar Perfil

**Método:** `DELETE`

**Ruta:** `/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del perfil de presupuesto. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Perfil eliminado"
}
```

---

### Activar Perfil

**Método:** `PUT`

**Ruta:** `/:id/activar`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del perfil de presupuesto. |

#### Respuesta Exitosa

```json
{
  "ok": true,
  "mensaje": "Perfil activado correctamente"
}
```

# Dependientes

## Resumen de Endpoints

| Método | Ruta | URL |
|:------:|------|-----|
| `GET` | `/` | `https://localhost:3000/api/dependientes` |
| `POST` | `/` | `https://localhost:3000/api/dependientes` |
| `PUT` | `/:id` | `https://localhost:3000/api/dependientes/:id` |
| `DELETE` | `/:id` | `https://localhost:3000/api/dependientes/:id` |

---

## Detalle de Endpoints

### Obtener Dependientes

**Método:** `GET`

**Ruta:** `/`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Respuesta Exitosa

```json
[
  {
    "ID_dependientes": 1,
    "Nombre": "Juan",
    "Relacion": "Hijo",
    "Ocupacion": "Estudiante",
    "Fecha_nacimiento": "2010-05-12",
    "Peso_economico": 500000
  }
]
```

---

### Agregar Dependiente

**Método:** `POST`

**Ruta:** `/`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Cuerpo de la Petición

```json
{
  "Nombre": "Ana",
  "Relacion": "Hija",
  "Ocupacion": "Estudiante",
  "Fecha_nacimiento": "2012-08-20",
  "Peso_economico": 300000
}
```

#### Respuesta Exitosa

```json
{
  "message": "Dependiente agregado",
  "id": 2
}
```

---

### Actualizar Dependiente

**Método:** `PUT`

**Ruta:** `/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del dependiente. |

#### Cuerpo de la Petición

```json
{
  "Nombre": "Ana María",
  "Relacion": "Hija",
  "Ocupacion": "Estudiante",
  "Fecha_nacimiento": "2012-08-20",
  "Peso_economico": 350000
}
```

#### Respuesta Exitosa

```json
{
  "message": "Dependiente actualizado"
}
```

---

### Eliminar Dependiente

**Método:** `DELETE`

**Ruta:** `/:id`

**Autenticación:** Requerida mediante Bearer Token (JWT) en todos los endpoints.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | Identificador del dependiente. |

#### Respuesta Exitosa

```json
{
  "message": "Dependiente eliminado"
}
```


# Errores HTTP

| Código | Nombre | Causa |
|---|---|---|
|200|OK|Solicitud procesada correctamente.|
|201|Created|Recurso creado exitosamente.|
|400|Bad Request|Datos inválidos o incompletos.|
|401|Unauthorized|No se envió el token JWT o no es válido.|
|403|Forbidden|El usuario autenticado no tiene permisos o el token expiró.|
|404|Not Found|El recurso solicitado no existe.|
|409|Conflict|Conflicto con el estado actual del recurso.|
|422|Unprocessable Entity|La validación de datos falló.|
|500|Internal Server Error|Error inesperado del servidor.|
