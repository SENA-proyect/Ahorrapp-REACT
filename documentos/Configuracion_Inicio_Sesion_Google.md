# Configuración del inicio de sesión con Google

El botón de Google en la web aparece únicamente cuando el Frontend recibe
`VITE_GOOGLE_CLIENT_ID`. El Backend también necesita `GOOGLE_CLIENT_ID` para
validar la credencial enviada por el navegador. Ambas variables deben usar el
mismo ID de cliente OAuth de tipo aplicación web.

## Desarrollo local

1. Copia `Frontend/.env.example` como `Frontend/.env.local`.
2. Reemplaza el valor de ejemplo por el ID de cliente OAuth web real.
3. Agrega `GOOGLE_CLIENT_ID` al `Backend/.env` existente. No reemplaces las
   demás variables de base de datos o JWT.
4. Reinicia Vite después de cambiar la variable del Frontend.

Los archivos `.env.local` y `.env` contienen configuración privada y no se
deben subir a GitHub.

## Render

Configura las variables en el servicio correspondiente:

- **Servicio Frontend:** `VITE_GOOGLE_CLIENT_ID`.
- **Servicio Backend:** `GOOGLE_CLIENT_ID`.

Después de cambiar `VITE_GOOGLE_CLIENT_ID`, vuelve a desplegar el Frontend:
Vite incorpora esa variable durante la compilación. Cambiar únicamente la
variable del Backend no hará que aparezca el botón.

## Google Cloud

En el cliente OAuth web, agrega a los orígenes autorizados el origen exacto del
Frontend, incluyendo protocolo y dominio (por ejemplo, el dominio de Render y
`http://localhost:5173` para desarrollo local). Este flujo usa una ventana
emergente, por lo que no requiere una URI de redirección.

## Comprobación

- Si el botón no aparece, comprueba `VITE_GOOGLE_CLIENT_ID` en el entorno del
  Frontend y vuelve a compilar/desplegar.
- Si el botón aparece pero el acceso falla, verifica que `GOOGLE_CLIENT_ID`
  esté configurado en el Backend y que ambos servicios usen el mismo cliente.
- En desarrollo, ejecuta las pruebas del Frontend con `npm test -- --run`.
