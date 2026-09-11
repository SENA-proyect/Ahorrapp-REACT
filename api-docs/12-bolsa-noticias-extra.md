# API — Bolsa y Noticias (rutas externas, sin `controller` propio)

> Este documento es un extra: estas rutas no tienen su lógica en `src/controllers/`, están escritas directamente dentro de los archivos de `src/routes/`. Se documentan aparte porque técnicamente no corresponden a "un controller", pero sí son parte de la API pública.

**Archivos de rutas:** `src/routes/alphaVantageRoutes.js`, `src/routes/noticiasRoutes.js`

Ambos son proxies hacia APIs externas (Finnhub y NewsAPI) para no exponer las API keys al frontend.

---

## Bolsa (Finnhub) — `alphaVantageRoutes.js`

**Base path:** `/api` (montado directo en la raíz de `/api`, sin prefijo propio — nótese que el nombre del archivo dice "alphaVantage" pero en realidad usa la API de **Finnhub**, no de Alpha Vantage; es un nombre heredado/desactualizado).

🔓 **Sin autenticación** — no tiene `verifyToken`.

### 1. Cotización de una acción/símbolo

`GET /api/bolsa/:symbol`

### Params
- `symbol` (URL) — ticker bursátil, ej. `AAPL`, `MSFT`.

### Respuesta 200 — éxito (pasa la respuesta cruda de Finnhub)
```json
{
  "c": 213.25,
  "d": 1.32,
  "dp": 0.62,
  "h": 214.10,
  "l": 211.40,
  "o": 212.00,
  "pc": 211.93,
  "t": 1767628800
}
```
> `c` = precio actual, `d`/`dp` = cambio absoluto/porcentual, `h`/`l`/`o` = máximo/mínimo/apertura del día, `pc` = cierre anterior, `t` = timestamp Unix.

### Respuesta 200 — Finnhub rechazó la solicitud (nota: viene con status 200, no 4xx)
```json
{ "ok": false, "mensaje": "<error devuelto por Finnhub>" }
```

### Respuesta 500
```json
{ "ok": false, "mensaje": "Error al consultar bolsa" }
```

---

### 2. TRM (tasa de cambio USD → COP)

`GET /api/bolsa/trm/usd-cop`

### Respuesta 200 — éxito
```json
{ "ok": true, "trm": 4180.5 }
```

### Respuesta 200 — no se pudo obtener (con valor de respaldo fijo)
```json
{ "ok": false, "mensaje": "<error o 'No se pudo consultar la TRM'>", "trm": 4200 }
```

### Respuesta 500
```json
{ "ok": false, "mensaje": "Error al consultar TRM" }
```

---

## Noticias (NewsAPI) — `noticiasRoutes.js`

**Base path:** `/api/noticias`

🔒 Requiere `Authorization: Bearer <token>`.

### 1. Listar noticias económicas/financieras

`GET /api/noticias?categoria=finanzas&pagina=1`

### Query params (opcionales)
- `categoria` — una de: `economia`, `finanzas`, `dolar`, `empleo`, `todos`. Cualquier otro valor (o ausencia) cae en `todos`.
- `pagina` — entero, default `1`.

### Respuesta 200
```json
{
  "total": 148,
  "pagina": 1,
  "articulos": [
    {
      "titulo": "El dólar cierra la semana a la baja frente al peso colombiano",
      "descripcion": "El tipo de cambio registró una caída del 1.2% durante la sesión...",
      "url": "https://ejemplo.com/noticia",
      "imagen": "https://ejemplo.com/imagen.jpg",
      "fuente": "Portafolio",
      "fecha": "2026-01-06T09:00:00Z",
      "autor": "Redacción Economía"
    }
  ]
}
```
> Se filtran artículos removidos por NewsAPI (`title === "[Removed]"`) y los que no tengan descripción, url o imagen.

### Respuesta 4xx/5xx (según el código que devuelva NewsAPI)
```json
{ "error": "Error al obtener noticias", "detalle": "<mensaje de NewsAPI>" }
```

### Respuesta 500 — error interno
```json
{ "error": "Error interno del servidor" }
```
