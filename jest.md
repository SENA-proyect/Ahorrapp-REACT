# AhorrApp · Ejecución de pruebas

Este proyecto tiene dos suites independientes: Jest para el backend y Vitest para la interfaz web. Ejecuta los comandos desde la carpeta indicada; no hay un comando `npm test` en la raíz del repositorio.

## 1. Requisitos

Instala las dependencias de cada aplicación solo si todavía no existe `node_modules`:

```powershell
cd Backend
npm install
```

```powershell
cd Frontend
npm install
```

Las dependencias de Jest y Supertest ya están declaradas en `Backend/package.json`. Vitest, jsdom y React Testing Library están declarados en `Frontend/package.json`.

## 2. Ejecutar pruebas Backend (Jest)

Desde `Backend/`, ejecuta toda la suite:

```powershell
npm test -- --runInBand
```

Ejecuta solo las pruebas de un requerimiento pasando la ruta relativa a `Backend/`:

```powershell
npm test -- --runInBand ../test/backend/rf01/registro.test.js
npm test -- --runInBand ../test/backend/rf08/gestion-usuarios.test.js
npm test -- --runInBand ../test/backend/rf14/recuperar-contrasena.test.js
npm test -- --runInBand ../test/backend/rf22/consistencia-plataformas.test.js
npm test -- --runInBand ../test/backend/rf29/noticias-indicadores.test.js
npm test -- --runInBand ../test/backend/rf32/inicio-google.test.js
```

También se puede filtrar por nombre de archivo o por nombre/descripción de prueba:

```powershell
npm test -- --runInBand rf14
npm test -- --runInBand -t "código"
```

Las pruebas usan Jest y Supertest. Las dependencias externas y la base de datos se simulan; no requieren una base de datos real.

## 3. Ejecutar pruebas Frontend (Vitest)

Desde `Frontend/`, ejecuta toda la suite:

```powershell
npm test -- --run
```

Ejecuta solo un archivo de prueba:

```powershell
npm test -- --run ../test/frontend/Login.test.jsx
npm test -- --run ../test/frontend/PanelUsuarios.test.jsx
npm test -- --run ../test/frontend/RecuperarContrasena.test.jsx
npm test -- --run ../test/frontend/Mismovimientos.test.jsx
npm test -- --run ../test/frontend/Noticias.test.jsx
npm test -- --run ../test/frontend/api.google.test.js
```

La suite usa Vitest en jsdom con React Testing Library. Las llamadas a servicios y `fetch` se simulan.

## 4. Compilar y revisar estilo

Para comprobar la compilación de producción, desde `Frontend/`:

```powershell
npm run build
```

Para ejecutar ESLint sobre el Frontend completo:

```powershell
npm run lint
```

Para revisar únicamente las pruebas ubicadas en la raíz del repositorio, desde la raíz:

```powershell
.\Frontend\node_modules\.bin\eslint.cmd --config .\Frontend\eslint.config.js --no-ignore .\test\frontend
```

## 5. Ubicación y alcance

| Suite | Ubicación | RF cubiertos |
|---|---|---|
| Jest (backend) | `test/backend/rfXX/` | RF-01, RF-08, RF-14, RF-22, RF-29 y RF-32 |
| Vitest (frontend) | `test/frontend/` | RF-01, RF-08, RF-14, RF-22, RF-29 y RF-32 |

Cada informe de casos, resultados, trazabilidad y limitaciones está en `test/DOCUMENTACION/RFXX.md`.

RF-17 y RF-23 corresponden a funciones móviles y no tienen pruebas de interfaz React en esta rama.
