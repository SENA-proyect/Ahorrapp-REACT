# DIAGRAMAS DEL SISTEMA — AhorrApp

| Campo | Información |
|---|---|
| **Proyecto** | AhorrApp |
| **Documento** | Diagramas del Sistema |
| **Versión** | 1.0 |
| **Equipo de desarrollo** | Juan Medina, Santiago Hurtado, David Barrera y Manuel Guevara |
| **Instructor** | Edwin Marin |

**Control de versiones**

| Versión | Fecha | Autor | Cambio |
|---|---|---|---|
| 1.0 | 22/11/2026 | Juan Medina | Creación inicial del documento. |

---

## Contenido

1. [Introducción](#1-introducción)
2. [Descripción general del sistema](#2-descripción-general-del-sistema)
3. [Catálogo de diagramas](#3-catálogo-de-diagramas)
4. [Diagramas](#4-diagramas)
5. [Glosario y referencias](#5-glosario-y-referencias)

---

## 1. Introducción

Este documento reúne en un solo lugar los diagramas de **AhorrApp**, un sistema de gestión financiera personal con versión web y móvil. Sirve como recurso de consulta: cada diagrama tiene un código, una descripción breve y un espacio para su imagen.

## 2. Descripción general del sistema (pendiente a confirmar si se mantiene esta seccion)

AhorrApp permite registrar y consultar ingresos, gastos, ahorros, deudas, presupuestos, imprevistos y fondo de emergencia, para tener más claridad sobre la situación financiera personal. No maneja dinero real, no hace transacciones bancarias ni administra fondos de terceros.

| Aspecto | Detalle |
|---|---|
| **Plataformas** | Web y móvil (Android e iOS) |
| **Acceso** | Membresías Gratuita, Mensual y Anual |
| **Estado** | En desarrollo y auditoría |
| **Frontend web** | React, Vite y Tailwind CSS |
| **App móvil** | Flutter y Dart |
| **Backend** | Node.js y Express |
| **Base de datos** | PostgreSQL |
| **Alojamiento** | Render (backend) y AWS (frontend web y base de datos)|

**Módulos principales**

| Módulo | Qué incluye |
|---|---|
| Ingresos, gastos y categorías | Registro, categorías personalizadas e historial; registro por OCR, QR o voz |
| Presupuestos y alertas | Presupuestos por período, notificaciones y recordatorios |
| Deudas | Registro y seguimiento de deudas y saldos pendientes |
| Ahorros y fondo de emergencia | Metas de ahorro, fondo de emergencia y simulaciones |
| Reportes y consultas | Tablas, gráficos, dashboards y exportación a PDF |
| Cuenta y administración | Registro, autenticación, recuperación de contraseña, roles y sincronización web-móvil |

## 3. Catálogo de diagramas

| Código | Diagrama | Tipo | Estado | Sección |
|---|---|---|---|---|
| DG-01 | BPMN | Procesos | FINALIZADO | 4.1 |
| DG-02 | Entidad-relación | Datos | FINALIZADO | 4.2 |
| DG-03 | Relacional | Datos | FINALIZADO | 4.3 |
| DG-04 | Despliegue | Arquitectura | FINALIZADO | 4.4 |
| DG-05 | Clases | Estructura | FINALIZADO | 4.5 |
| DG-06 | Casos de uso | Comportamiento | FINALIZADO | 4.6 |
| DG-07 | Arquitectura del sistema | Arquitectura | FINALIZADO | 4.7 |

## 4. Diagramas

### 4.1. DG-01 — Diagrama BPMN

**Qué muestra:** el flujo de los procesos principales del sistema.
**Versión:** 3.0
**responsable:** David Barrera

> [Insertar imagen del diagrama]


*Figura 1. Diagrama BPMN de AhorrApp.*

---

### 4.2. DG-02 — Diagrama entidad-relación

**Qué muestra:** las entidades de datos del sistema y cómo se relacionan.
**Versión:** 7.0
**responsable:** David Barrera

> [Insertar imagen del diagrama]

*Figura 2. Diagrama entidad-relación de AhorrApp.*

---

### 4.3. DG-03 — Diagrama relacional

**Qué muestra:** las tablas de la base de datos (23 en total), sus llaves y relaciones.
**Versión:** 8.0
**responsable:** Manuel Guevara

> [Insertar imagen del diagrama]

*Figura 3. Diagrama relacional de AhorrApp.*

---

### 4.4. DG-04 — Diagrama de despliegue

**Qué muestra:** dónde se ejecuta cada parte del sistema (servidores y servicios).
**Versión:** 4.0
**responsable:** Santiago Hurtado

> [Insertar imagen del diagrama]

*Figura 4. Diagrama de despliegue de AhorrApp.*

---

### 4.5. DG-05 — Diagrama de clases

**Qué muestra:** las clases del sistema, sus atributos y relaciones.
**Versión:** 4.0
**responsable:** Manuel Guevara

> [Insertar imagen del diagrama]

*Figura 5. Diagrama de clases de AhorrApp.*

---

### 4.6. DG-06 — Diagrama de casos de uso

**Qué muestra:** las funciones del sistema y los actores que las usan.
**Versión:** 5.0
**responsable:** Manuel Guevara

> [Insertar imagen del diagrama]

*Figura 6. Diagrama de casos de uso de AhorrApp.*

---

### 4.7. DG-07 — Diagrama de arquitectura del sistema

**Qué muestra:** los componentes principales del sistema y cómo se comunican.
**Versión:** 2.0
**responsable:** Santiago Hurtado

> [Insertar imagen del diagrama]

*Figura 7. Arquitectura del sistema AhorrApp.*