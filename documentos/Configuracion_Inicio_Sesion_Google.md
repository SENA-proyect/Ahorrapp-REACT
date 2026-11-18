# Configuración del inicio de sesión con Google

El inicio de sesión usa Google Identity Services para obtener un ID token. El
frontend lo envía a `POST /api/auth/google`; el backend verifica la firma,
audiencia y correo verificado antes de iniciar la sesión o crear una cuenta.

## 1. Crear un cliente OAuth web

En Google Cloud Console, configura la pantalla de consentimiento y crea un
cliente OAuth de tipo **Aplicación web**. En **Orígenes autorizados de
JavaScript**, agrega:

- `https://localhost:5173` para el desarrollo local de este proyecto.
- `http://localhost:5173` si se ejecuta localmente sin los certificados HTTPS.
- El origen HTTPS exacto donde se publique el frontend.

No agregues rutas ni el dominio del backend como origen del frontend.

## 2. Configurar el mismo Client ID en ambos lados

En `Frontend/.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

En `Backend/.env`:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

El valor debe ser el mismo en ambos archivos. Para producción, configura
`VITE_GOOGLE_CLIENT_ID` en el entorno de compilación del frontend y
`GOOGLE_CLIENT_ID` en las variables de entorno del backend. Reinicia o vuelve a
publicar cada servicio después de cambiar sus variables.

No se necesita un Client Secret para este flujo. No publiques credenciales
privadas ni incluyas archivos `.env` en Git.

## 3. Flujo de usuario

1. El usuario elige **Continuar con Google** en la pantalla de inicio de sesión.
2. Google devuelve un ID token al frontend.
3. El frontend envía el token a `/api/auth/google`.
4. El backend valida el token y devuelve el JWT y los datos de sesión de AhorrApp.

Si falta la variable del frontend, la pantalla informa que Google no está
configurado. Si falta la variable del backend, el endpoint devuelve un error de
configuración en lugar de crear una sesión.
