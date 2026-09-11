# API — Autenticación y Usuarios (`authController`)

**Base path:** `/api/auth`
**Archivo de rutas:** `src/routes/authRoutes.js`
**Archivo de controlador:** `src/controllers/authController.js`

Autenticación: los endpoints marcados con 🔒 requieren header `Authorization: Bearer <token>`.
Los marcados con 🔒👑 además requieren el rol `superuser` (middleware `requireRole(["superuser"])`).

---

## 1. Registrar usuario

`POST /api/auth/register`

### Body
```json
{
  "Nombre": "Ana",
  "Apellido": "Gómez",
  "Email": "ana@correo.com",
  "Password_hash": "MiClave123!"
}
```
> Nota: el campo se llama `Password_hash` en el body, pero es la contraseña en texto plano — el backend la hashea con bcrypt antes de guardarla. `Email` y `Password_hash` son obligatorios.

### Respuesta 201 — éxito
```json
{
  "ok": true,
  "mensaje": "Usuario registrado exitosamente",
  "id": 1
}
```

### Respuesta 400 — datos incompletos
```json
{ "ok": false, "mensaje": "Datos incompletos" }
```

### Respuesta 400 — correo ya registrado
```json
{ "ok": false, "mensaje": "El correo ya está registrado" }
```

---

## 2. Iniciar sesión

`POST /api/auth/login`

### Body
```json
{
  "Email": "ana@correo.com",
  "Password_hash": "MiClave123!"
}
```

### Respuesta 200 — éxito
```json
{
  "ok": true,
  "mensaje": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Ana",
    "apellido": "Gómez",
    "email": "ana@correo.com",
    "roles": ["user"]
  }
}
```
> El `token` expira en 8 horas (`expiresIn: "8h"`). Debe enviarse en las siguientes peticiones como `Authorization: Bearer <token>`.

### Respuesta 401 — credenciales inválidas
```json
{ "ok": false, "mensaje": "Correo o contraseña incorrectos" }
```

---

## 3. Solicitar recuperación de contraseña

`POST /api/auth/forgot-password`

### Body
```json
{ "Email": "ana@correo.com" }
```

### Respuesta 200 (siempre, exista o no el correo — evita enumeración de emails)
```json
{
  "ok": true,
  "mensaje": "Si el correo está registrado, recibirás un código de verificación"
}
```
> Si el correo existe, se genera un código de 6 dígitos, se envía por email (`MailService`) y expira en 15 minutos.

### Respuesta 400 — falta el correo
```json
{ "ok": false, "mensaje": "El correo es requerido" }
```

---

## 4. Verificar código de recuperación

`POST /api/auth/verify-reset-code`

### Body
```json
{
  "Email": "ana@correo.com",
  "code": "483920"
}
```

### Respuesta 200 — código válido
```json
{
  "ok": true,
  "mensaje": "Código verificado correctamente",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
> `resetToken` expira en 10 minutos y debe usarse en el siguiente endpoint.

### Respuesta 400 — código inválido / expirado
```json
{ "ok": false, "mensaje": "Código inválido o expirado" }
```
```json
{ "ok": false, "mensaje": "El código ha expirado" }
```
```json
{ "ok": false, "mensaje": "Código inválido" }
```

---

## 5. Restablecer contraseña

`POST /api/auth/reset-password`

### Body
```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nuevaPassword": "NuevaClave456!"
}
```
> `nuevaPassword` debe tener mínimo 8 caracteres.

### Respuesta 200 — éxito
```json
{ "ok": true, "mensaje": "Contraseña actualizada exitosamente" }
```

### Respuesta 401 — token expirado o inválido
```json
{ "ok": false, "mensaje": "El proceso de recuperación expiró, solicita un nuevo código" }
```
```json
{ "ok": false, "mensaje": "Token inválido" }
```

### Respuesta 400 — validación
```json
{ "ok": false, "mensaje": "La contraseña debe tener al menos 8 caracteres" }
```

---

## 6. 🔒 Listar usuarios (panel de administración)

`GET /api/auth/PanelUsuarios`

### Respuesta 200
```json
{
  "ok": true,
  "cantidad": 2,
  "usuarios": [
    {
      "ID_usuario": 1,
      "Nombre": "Ana",
      "Apellido": "Gómez",
      "Email": "ana@correo.com",
      "Activo": true,
      "ID_rol": 1,
      "Cargo": "user"
    }
  ]
}
```
> Solo devuelve usuarios con `activo = TRUE`.

---

## 7. 🔒 Actualizar datos de un usuario

`PUT /api/auth/PanelUsuarios/:id`

### Params
- `id` (URL, entero) — id del usuario a editar.

### Body
```json
{
  "Nombre": "Ana María",
  "Apellido": "Gómez Ruiz",
  "Email": "anamaria@correo.com"
}
```

### Respuesta 200
```json
{ "ok": true, "mensaje": "Usuario actualizado exitosamente" }
```

### Respuesta 400 — id inválido
```json
{ "ok": false, "mensaje": "ID inválido" }
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "Usuario no encontrado" }
```

---

## 8. 🔒 Eliminar (desactivar) usuario

`DELETE /api/auth/PanelUsuarios/:id`

> No borra el registro: hace `UPDATE usuarios SET activo = FALSE`.

### Respuesta 200
```json
{ "ok": true, "mensaje": "Usuario eliminado exitosamente" }
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "Usuario no encontrado" }
```

---

## 9. 🔒👑 Actualizar rol de un usuario (solo `superuser`)

`PUT /api/auth/PanelUsuarios/:id/rol`

### Body
```json
{ "ID_rol": 2 }
```

### Respuesta 200
```json
{ "ok": true, "mensaje": "Rol actualizado exitosamente" }
```

### Respuesta 400 — falta el rol
```json
{ "ok": false, "mensaje": "Debes indicar el rol" }
```

### Respuesta 404
```json
{ "ok": false, "mensaje": "Usuario no encontrado" }
```
```json
{ "ok": false, "mensaje": "El rol indicado no existe" }
```

### Respuesta 403 — sin permisos (no es superuser)
```json
{ "ok": false, "mensaje": "No tienes permisos para realizar esta acción" }
```

---

## 10. 🔒 Conteo de usuarios (panel admin)

`GET /api/auth/usuarios/PanelAdmin`

### Respuesta 200
```json
{ "totalUsuarios": 15 }
```

---

## 11. 🔒 Conteo de dependientes (panel admin)

`GET /api/auth/dependientes/PanelAdmin`

### Respuesta 200
```json
{ "totalDependientes": 8 }
```

---

## 12. 🔒 Listar todos los dependientes (panel admin, de todos los usuarios)

`GET /api/auth/PanelDependientes`

### Respuesta 200
```json
{
  "ok": true,
  "dependientes": [
    {
      "id_dependientes": 1,
      "Nombre": "Pedro",
      "Relacion": "Hijo",
      "Ocupacion": "Estudiante",
      "Fecha_nacimiento": "2015-03-10T00:00:00.000Z",
      "ID_usuario": 1,
      "usuario_nombre": "Ana"
    }
  ]
}
```

---

## Errores genéricos (todos los endpoints)

Ante cualquier excepción no controlada, todos los endpoints de este controlador devuelven:

```json
{ "ok": false, "mensaje": "<mensaje descriptivo del error>" }
```
con status **500**.
