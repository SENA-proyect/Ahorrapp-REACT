# Auditoria RF-09 INICIAR SESION

## En esta auditoria llevaremos a cabo 5 casos de prueba, los mas importantes para este:
1. Login Exitoso
### Login exitoso
Codigo 200
{
    "ok": true,
    "mensaje": "Inicio de sesión exitoso",
    "token": "ey...",
    "usuario": {
        "id": 2,
        "nombre": "Santiago",
        "apellido": "Hurtado",
        "email": "santiagohurhur@gmail.com",
        "roles": [
            "user"
        ]
    }
}

3. Contraseña o correo incorrecto
### Contrasena o correo incorrecto
Codigo 401
{
    "ok": false,
    "mensaje": "Correo o contraseña incorrectos"
}
4. Correo con formato invalido
5. Campos vacios