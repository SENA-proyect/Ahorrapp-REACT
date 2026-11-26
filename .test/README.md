# Pruebas Jest web de AhorrApp asignadas a David Barrera

Cada subcarpeta contiene una guía del requerimiento, sus casos Jest y los comandos para ejecutarlos. La documentación de cada RF describe preparación, comportamiento probado y límites de la suite.

## Resultados de la última ejecución

Ejecución registrada el 23 de noviembre de 2026. Las cinco suites pasaron con 28 pruebas en total.

| Requisito | Interfaz web | API | Total |
| --- | ---: | ---: | ---: |
| [RF-10 · Dependientes económicos](RF-10/RF-10.md) | 3 | 12 | **15** |
| [RF-15 · Categorías financieras](RF-15/RF-15.md) | 4 | 5 | **9** |
| [RF-16 · Cerrar sesión](RF-16/RF-16.md) | 4 | — | **4** |
| **Total** | **11** | **17** | **28** |

Los conteos corresponden a pruebas de Jest, incluyendo los casos creados mediante `test.each`.

RF-18, RF-19, RF-20 y RF-21 quedan fuera del alcance web. La API de sincronización de RF-19 da soporte al cliente móvil.

## Ejecutar Jest desde la raíz

```powershell
npm ci --prefix Frontend
npm ci --prefix Backend
npm test --prefix Frontend
npm test --prefix Backend
```

Testing Library interactúa con los componentes React en jsdom. Supertest ejercita las rutas reales de Express con PostgreSQL simulado. Estas pruebas no sustituyen una validación contra PostgreSQL real ni una revisión manual en navegador. La matriz de cumplimiento de la rama de Juan aporta contexto funcional, pero no demuestra por sí sola que exista cobertura Jest para un requisito.
