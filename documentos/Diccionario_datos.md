# Diccionario de datos: postgres

> Esquema public · 23 tablas

## abonos_ahorro

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_abono (Primaria) | int(11) | No | nextval('abonos_ahorro_id_abono_seq'::regclass) | |
| id_ahorros | int(11) | No | | |
| monto | decimal(15,2) | No | | |
| fecha_registro | date | No | CURRENT_DATE | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_abono | | A | No | |
| idx_abonos_ahorro | BTREE | No | No | id_ahorros | | A | No | |

---

## abonos_deuda

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_abono_deuda (Primaria) | int(11) | No | nextval('abonos_deuda_id_abono_deuda_seq'::regclass) | |
| id_deudas | int(11) | No | | |
| cuotas | int(11) | No | 1 | |
| monto | decimal(15,2) | No | | |
| fecha_registro | date | No | CURRENT_DATE | |
| descripcion | varchar(255) | Sí | NULL | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_abono_deuda | | A | No | |
| idx_abonos_deuda_deuda | BTREE | No | No | id_deudas | | A | No | |
| idx_abonos_deuda_fecha | BTREE | No | No | fecha_registro | | A | No | |

---

## ahorros

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_ahorros (Primaria) | int(11) | No | nextval('ahorros_id_ahorros_seq'::regclass) | |
| id_entrada | int(11) | No | | |
| id_categoria | int(11) | Sí | NULL | |
| monto | decimal(15,2) | No | | |
| monto_acumulado | decimal(15,2) | No | 0.00 | |
| descripcion | varchar(255) | Sí | NULL | |
| meta | varchar(100) | Sí | NULL | |
| fecha_registro | date | No | CURRENT_DATE | |
| fecha_meta | date | Sí | NULL | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_ahorros | | A | No | |
| idx_ahorros_categoria | BTREE | No | No | id_categoria | | A | Sí | |
| idx_ahorros_entrada | BTREE | No | No | id_entrada | | A | No | |

---

## categorias

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_categoria (Primaria) | int(11) | No | nextval('categorias_id_categoria_seq'::regclass) | |
| id_usuario | int(11) | Sí | NULL | |
| nombre | varchar(50) | No | | |
| descripcion | varchar(255) | Sí | NULL | |
| activa | boolean | No | true | |
| sistema | boolean | No | false | |
| es_global | boolean | No | false | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_categoria | | A | No | |
| idx_categorias_globales_nombre | BTREE | Sí | No | nombre | | A | No | |

---

## dependientes

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_dependientes (Primaria) | int(11) | No | nextval('dependientes_id_dependientes_seq'::regclass) | |
| id_usuario | int(11) | No | | |
| nombre | varchar(100) | No | | |
| relacion | varchar(100) | Sí | NULL | |
| ocupacion | varchar(150) | Sí | NULL | |
| fecha_nacimiento | date | Sí | NULL | |
| peso_economico | smallint | No | 1 | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_dependientes | | A | No | |
| idx_dependientes_usuario | BTREE | No | No | id_usuario | | A | No | |

---

## deudas

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_deudas (Primaria) | int(11) | No | nextval('deudas_id_deudas_seq'::regclass) | |
| id_salida | int(11) | No | | |
| id_categoria | int(11) | Sí | NULL | |
| monto | decimal(15,2) | No | | |
| fuente | varchar(150) | No | | |
| descripcion | varchar(255) | Sí | NULL | |
| cuotas_total | int(11) | Sí | NULL | |
| cuotas_pagadas | int(11) | No | 0 | |
| fecha_inicio | date | Sí | NULL | |
| fecha_fin | date | Sí | NULL | |
| estado | estado_deuda_enum | No | 'pendiente'::estado_deuda_enum | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_deudas | | A | No | |
| idx_deudas_categoria | BTREE | No | No | id_categoria | | A | Sí | |
| idx_deudas_salida | BTREE | No | No | id_salida | | A | No | |

---

## entrada

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_entrada (Primaria) | int(11) | No | nextval('entrada_id_entrada_seq'::regclass) | |
| id_movimiento | int(11) | No | | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_entrada | 36 | A | No | |
| entrada_id_movimiento_key | BTREE | Sí | No | id_movimiento | 36 | A | No | |

---

## fondos_emergencia

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_fondo (Primaria) | int(11) | No | nextval('fondos_emergencia_id_fondo_seq'::regclass) | |
| id_usuario | int(11) | No | | |
| meta | decimal(15,2) | No | 0.00 | |
| fecha_creacion | date | No | CURRENT_DATE | |
| fecha_actualizacion | timestamp | No | CURRENT_TIMESTAMP | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_fondo | | A | No | |
| fondos_emergencia_id_usuario_key | BTREE | Sí | No | id_usuario | | A | No | |
| idx_fondos_emergencia_usuario | BTREE | No | No | id_usuario | | A | No | |

---

## gastos

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_gastos (Primaria) | int(11) | No | nextval('gastos_id_gastos_seq'::regclass) | |
| id_salida | int(11) | No | | |
| id_categoria | int(11) | Sí | NULL | |
| id_dependientes | int(11) | Sí | NULL | |
| monto | decimal(15,2) | No | | |
| descripcion | varchar(255) | Sí | NULL | |
| fecha_registro | date | No | CURRENT_DATE | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_gastos | 31 | A | No | |
| idx_gastos_categoria | BTREE | No | No | id_categoria | 12 | A | Sí | |
| idx_gastos_dependiente | BTREE | No | No | id_dependientes | 6 | A | Sí | |
| idx_gastos_salida | BTREE | No | No | id_salida | 31 | A | No | |

---

## historial

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_historial (Primaria) | int(11) | No | nextval('historial_id_historial_seq'::regclass) | |
| id_usuario | int(11) | No | | |
| accion | varchar(200) | No | | |
| detalles | text | Sí | NULL | |
| fecha | timestamp | No | CURRENT_TIMESTAMP | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_historial | | A | No | |
| idx_historial_fecha | BTREE | No | No | fecha | | A | No | |
| idx_historial_usuario | BTREE | No | No | id_usuario | | A | No | |

---

## imprevistos

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_imprevistos (Primaria) | int(11) | No | nextval('imprevistos_id_imprevistos_seq'::regclass) | |
| id_salida | int(11) | No | | |
| id_categoria | int(11) | Sí | NULL | |
| id_dependientes | int(11) | Sí | NULL | |
| monto | decimal(15,2) | No | | |
| causa | varchar(255) | Sí | NULL | |
| fecha_registro | date | No | CURRENT_DATE | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_imprevistos | | A | No | |
| idx_imprevistos_categoria | BTREE | No | No | id_categoria | | A | Sí | |
| idx_imprevistos_dependiente | BTREE | No | No | id_dependientes | | A | Sí | |
| idx_imprevistos_salida | BTREE | No | No | id_salida | | A | No | |

---

## ingresos

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_ingresos (Primaria) | int(11) | No | nextval('ingresos_id_ingresos_seq'::regclass) | |
| id_entrada | int(11) | No | | |
| id_categoria | int(11) | Sí | NULL | |
| monto | decimal(15,2) | No | | |
| descripcion | varchar(255) | Sí | NULL | |
| fuente | varchar(150) | Sí | NULL | |
| fecha_registro | date | No | CURRENT_DATE | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_ingresos | | A | No | |
| idx_ingresos_categoria | BTREE | No | No | id_categoria | | A | Sí | |
| idx_ingresos_entrada | BTREE | No | No | id_entrada | | A | No | |

---

## movimientos

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_movimiento (Primaria) | int(11) | No | nextval('movimientos_id_movimiento_seq'::regclass) | |
| id_usuario | int(11) | No | | |
| tipo_flujo | tipo_flujo_enum | No | | |
| subtipo_modulo | subtipo_modulo_enum | No | | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_movimiento | 102 | A | No | |
| idx_movimientos_usuario | BTREE | No | No | id_usuario | 10 | A | No | |

---

## movimientos_fondo_emergencia

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_movimiento_fondo (Primaria) | int(11) | No | nextval('movimientos_fondo_emergencia_id_movimiento_fondo_seq'::regclass) | |
| id_fondo | int(11) | No | | |
| tipo | tipo_movimiento_fondo_enum | No | | |
| monto | decimal(15,2) | No | | |
| fecha_registro | date | No | CURRENT_DATE | |
| descripcion | varchar(255) | Sí | NULL | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_movimiento_fondo | | A | No | |
| idx_movimientos_fondo_fecha | BTREE | No | No | fecha_registro | | A | No | |
| idx_movimientos_fondo_fondo | BTREE | No | No | id_fondo | | A | No | |
| idx_movimientos_fondo_tipo | BTREE | No | No | tipo | | A | No | |

---

## notificaciones

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_notificacion (Primaria) | int(11) | No | nextval('notificaciones_id_notificacion_seq'::regclass) | |
| id_usuario | int(11) | No | | |
| tipo | text | No | | |
| entidad_tipo | varchar(50) | Sí | NULL | |
| entidad_id | int(11) | Sí | NULL | |
| mensaje | text | No | | |
| fecha | timestamp | No | CURRENT_TIMESTAMP | |
| leida | boolean | No | false | |
| archivada | boolean | No | false | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_notificacion | 5 | A | No | |
| idx_notif_entidad | BTREE | No | No | entidad_tipo | 2 | A | Sí | |
| idx_notif_entidad | BTREE | No | No | entidad_id | 5 | A | Sí | |
| idx_notif_entidad | BTREE | No | No | tipo | 2 | A | No | |
| idx_notif_usuario_leida | BTREE | No | No | id_usuario | 4 | A | No | |
| idx_notif_usuario_leida | BTREE | No | No | leida | 1 | A | No | |
| idx_notif_usuario_leida | BTREE | No | No | archivada | 1 | A | No | |
| idx_notif_usuario_leida_archivada | BTREE | No | No | id_usuario | 4 | A | No | |
| idx_notif_usuario_leida_archivada | BTREE | No | No | leida | 1 | A | No | |
| idx_notif_usuario_leida_archivada | BTREE | No | No | archivada | 1 | A | No | |
| idx_notif_usuario_leida_archivada | BTREE | No | No | fecha | 5 | D | No | |
| uq_notif_entidad | BTREE | Sí | No | id_usuario | 4 | A | No | |
| uq_notif_entidad | BTREE | Sí | No | tipo | 2 | A | No | |
| uq_notif_entidad | BTREE | Sí | No | entidad_tipo | 2 | A | Sí | |
| uq_notif_entidad | BTREE | Sí | No | entidad_id | 5 | A | Sí | |

---

## periodos_presupuesto

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_periodo (Primaria) | int(11) | No | nextval('periodos_presupuesto_id_periodo_seq'::regclass) | |
| id_presupuesto | int(11) | No | | |
| id_usuario | int(11) | No | | |
| fecha_inicio | date | No | | |
| fecha_fin | date | No | | |
| ingreso_estimado | decimal(15,2) | No | 0.00 | |
| ingreso_real | decimal(15,2) | No | 0.00 | |
| saldo_anterior | decimal(15,2) | No | 0.00 | |
| estado | estado_periodo_enum | No | 'abierto'::estado_periodo_enum | |
| monto_gastos | decimal(15,2) | No | | |
| monto_deudas | decimal(15,2) | No | | |
| monto_imprevistos | decimal(15,2) | No | | |
| monto_ahorros | decimal(15,2) | No | | |
| monto_emergencia | decimal(15,2) | No | | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_periodo | | A | No | |
| idx_periodos_fechas | BTREE | No | No | fecha_inicio | | A | No | |
| idx_periodos_fechas | BTREE | No | No | fecha_fin | | A | No | |
| idx_periodos_presupuesto | BTREE | No | No | id_presupuesto | | A | No | |
| idx_periodos_usuario | BTREE | No | No | id_usuario | | A | No | |

---

## preferencias_notificacion

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_usuario (Primaria) | int(11) | No | | |
| tipo (Primaria) | tipo_notificacion_enum | No | | |
| activa | boolean | No | true | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_usuario | | A | No | |
| PRIMARY | BTREE | Sí | No | tipo | | A | No | |

---

## presupuestos

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_presupuesto (Primaria) | int(11) | No | nextval('presupuestos_id_presupuesto_seq'::regclass) | |
| id_usuario | int(11) | No | | |
| nombre | varchar(80) | No | 'Mi presupuesto'::character varying | |
| descripcion | varchar(255) | Sí | NULL | |
| activo | boolean | No | false | |
| dia_corte | smallint | No | 1 | |
| porcentaje_gastos | decimal(5,2) | No | 40.00 | |
| porcentaje_deudas | decimal(5,2) | No | 20.00 | |
| porcentaje_imprevistos | decimal(5,2) | No | 15.00 | |
| porcentaje_ahorros | decimal(5,2) | No | 10.00 | |
| porcentaje_emergencia | decimal(5,2) | No | 15.00 | |
| fecha_actualizacion | timestamp | No | CURRENT_TIMESTAMP | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_presupuesto | 11 | A | No | |
| idx_presupuesto_activo_unico | BTREE | Sí | No | id_usuario | 9 | A | No | |

---

## push_tokens

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id (Primaria) | int(11) | No | nextval('push_tokens_id_seq'::regclass) | |
| id_usuario | int(11) | No | | |
| fcm_token | text | No | | |
| plataforma | text | No | | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id | | A | No | |
| idx_push_tokens_usuario | BTREE | No | No | id_usuario | | A | No | |
| push_tokens_fcm_token_key | BTREE | Sí | No | fcm_token | | A | No | |

---

## rol

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_rol (Primaria) | int(11) | No | nextval('rol_id_rol_seq'::regclass) | |
| cargo | varchar(50) | No | | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_rol | | A | No | |

---

## salida

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_salida (Primaria) | int(11) | No | nextval('salida_id_salida_seq'::regclass) | |
| id_movimiento | int(11) | No | | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_salida | 60 | A | No | |
| salida_id_movimiento_key | BTREE | Sí | No | id_movimiento | 60 | A | No | |

---

## usuarios

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_usuario (Primaria) | int(11) | No | nextval('usuarios_id_usuario_seq'::regclass) | |
| nombre | varchar(100) | No | | |
| apellido | varchar(100) | Sí | NULL | |
| reset_code | varchar(255) | Sí | NULL::character varying | |
| reset_code_expires | timestamp | Sí | NULL | |
| password_hash | varchar(255) | No | | |
| email | varchar(255) | No | | |
| activo | boolean | No | true | |
| fecha_registro | timestamp | Sí | CURRENT_TIMESTAMP | |
| fecha_eliminacion_programada | timestamp | Sí | NULL | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_usuario | | A | No | |
| usuarios_email_key | BTREE | Sí | No | email | | A | No | |

---

## usuarios_roles

### Columnas

| Columna | Tipo | Nulo | Predeterminado | Comentarios |
| --- | --- | --- | --- | --- |
| id_usuario (Primaria) | int(11) | No | | |
| id_rol (Primaria) | int(11) | No | | |

### Índices

| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRIMARY | BTREE | Sí | No | id_usuario | | A | No | |
| PRIMARY | BTREE | Sí | No | id_rol | | A | No | |

<br>
<hr>
<br>

# SCRIPT UTILIZADO
```json
WITH tablas AS (
    SELECT c.oid, c.relname, c.reltuples
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
),
columnas AS (
    SELECT
        t.relname,
        string_agg(
            '| ' || a.attname
            || CASE WHEN EXISTS (
                   SELECT 1 FROM pg_index i
                   WHERE i.indrelid = t.oid
                     AND i.indisprimary
                     AND a.attnum = ANY (i.indkey)
               ) THEN ' (Primaria)' ELSE '' END
            || ' | ' ||
            CASE format_type(a.atttypid, a.atttypmod)
                WHEN 'integer' THEN 'int(11)'
                WHEN 'bigint'  THEN 'bigint(20)'
                ELSE replace(replace(replace(replace(
                        format_type(a.atttypid, a.atttypmod),
                        'character varying', 'varchar'),
                        'timestamp without time zone', 'timestamp'),
                        'numeric', 'decimal'),
                        'character(', 'char(')
            END
            || ' | ' || CASE WHEN a.attnotnull THEN 'No' ELSE 'Sí' END
            || ' | ' ||
            CASE
                WHEN a.attidentity <> ''  THEN '`IDENTITY`'
                WHEN d.adbin IS NOT NULL  THEN '`' || pg_get_expr(d.adbin, d.adrelid) || '`'
                WHEN a.attnotnull         THEN ''
                ELSE 'NULL'
            END
            || ' | ' || COALESCE(replace(col_description(t.oid, a.attnum), '|', '\|'), '')
            || ' |',
            E'\n' ORDER BY a.attnum
        ) AS filas
    FROM tablas t
    JOIN pg_attribute a
      ON a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
    LEFT JOIN pg_attrdef d
      ON d.adrelid = t.oid AND d.adnum = a.attnum
    GROUP BY t.relname
),
indices AS (
    SELECT
        t.relname,
        string_agg(
            '| ' || CASE WHEN ix.indisprimary THEN 'PRIMARY' ELSE i.relname END
            || ' | ' || upper(am.amname)
            || ' | ' || CASE WHEN ix.indisunique THEN 'Sí' ELSE 'No' END
            || ' | No'
            || ' | ' || COALESCE(a.attname, pg_get_indexdef(ix.indexrelid, k.ord::int, true))
            || ' | ' || COALESCE(
                   CASE
                       WHEN s.n_distinct IS NULL THEN ''
                       WHEN s.n_distinct >= 0 THEN round(s.n_distinct)::bigint::text
                       ELSE round(-s.n_distinct * greatest(t.reltuples, 0))::bigint::text
                   END, '')
            || ' | ' || CASE WHEN (ix.indoption[k.ord::int - 1] & 1) = 1 THEN 'D' ELSE 'A' END
            || ' | ' || CASE WHEN a.attnotnull THEN 'No' ELSE 'Sí' END
            || ' | ' || COALESCE(replace(obj_description(i.oid, 'pg_class'), '|', '\|'), '')
            || ' |',
            E'\n' ORDER BY CASE WHEN ix.indisprimary THEN 0 ELSE 1 END, i.relname, k.ord
        ) AS filas
    FROM tablas t
    JOIN pg_index ix ON ix.indrelid = t.oid
    JOIN pg_class i  ON i.oid = ix.indexrelid
    JOIN pg_am am    ON am.oid = i.relam
    CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord)
    LEFT JOIN pg_attribute a
           ON a.attrelid = t.oid AND a.attnum = k.attnum
    LEFT JOIN pg_stats s
           ON s.schemaname = 'public'
          AND s.tablename  = t.relname
          AND s.attname    = a.attname
    WHERE k.ord <= ix.indnkeyatts
    GROUP BY t.relname
)
SELECT
    '# Diccionario de datos: ' || current_database()
    || E'\n\n> Esquema `public` · ' || count(*)::text || E' tablas\n\n'
    || string_agg(bloque, E'\n\n---\n\n' ORDER BY relname) AS markdown
FROM (
    SELECT
        t.relname,
        '## ' || t.relname
        || E'\n\n### Columnas\n\n'
        || E'| Columna | Tipo | Nulo | Predeterminado | Comentarios |\n'
        || E'| --- | --- | --- | --- | --- |\n'
        || c.filas
        || E'\n\n### Índices\n\n'
        || E'| Nombre de la clave | Tipo | Único | Empaquetado | Columna | Cardinalidad | Cotejamiento | Nulo | Comentario |\n'
        || E'| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n'
        || COALESCE(i.filas, '') AS bloque
    FROM tablas t
    JOIN columnas c USING (relname)
    LEFT JOIN indices i USING (relname)
) x;
```