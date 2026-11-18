


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."estado_deuda_enum" AS ENUM (
    'pendiente',
    'pagada'
);


ALTER TYPE "public"."estado_deuda_enum" OWNER TO "postgres";


CREATE TYPE "public"."estado_periodo_enum" AS ENUM (
    'abierto',
    'cerrado'
);


ALTER TYPE "public"."estado_periodo_enum" OWNER TO "postgres";


CREATE TYPE "public"."subtipo_modulo_enum" AS ENUM (
    'Ahorro',
    'Ingreso',
    'Gasto',
    'Deuda',
    'Imprevisto'
);


ALTER TYPE "public"."subtipo_modulo_enum" OWNER TO "postgres";


CREATE TYPE "public"."tipo_flujo_enum" AS ENUM (
    'Entrada',
    'Salida'
);


ALTER TYPE "public"."tipo_flujo_enum" OWNER TO "postgres";


CREATE TYPE "public"."tipo_movimiento_fondo_enum" AS ENUM (
    'aporte',
    'retiro'
);


ALTER TYPE "public"."tipo_movimiento_fondo_enum" OWNER TO "postgres";


CREATE TYPE "public"."tipo_notificacion_enum" AS ENUM (
    'sistema',
    'recordatorio',
    'sugerencia',
    'alerta_presupuesto',
    'ingreso',
    'egreso',
    'limite',
    'meta'
);


ALTER TYPE "public"."tipo_notificacion_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."actualizar_fecha_presupuesto"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

BEGIN

    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


ALTER FUNCTION "public"."actualizar_fecha_presupuesto"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_flujo_entrada"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM movimientos m
        WHERE m.id_movimiento = NEW.id_movimiento
          AND m.tipo_flujo = 'Entrada'
    ) THEN
        RAISE EXCEPTION 'El movimiento % no tiene tipo_flujo = Entrada', NEW.id_movimiento;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validar_flujo_entrada"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_flujo_salida"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM movimientos m
        WHERE m.id_movimiento = NEW.id_movimiento
          AND m.tipo_flujo = 'Salida'
    ) THEN
        RAISE EXCEPTION 'El movimiento % no tiene tipo_flujo = Salida', NEW.id_movimiento;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validar_flujo_salida"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_subtipo_ahorros"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM entrada e
        JOIN movimientos m ON m.id_movimiento = e.id_movimiento
        WHERE e.id_entrada = NEW.id_entrada
          AND m.subtipo_modulo = 'Ahorro'
    ) THEN
        RAISE EXCEPTION 'La entrada % no corresponde a un movimiento subtipo Ahorro', NEW.id_entrada;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validar_subtipo_ahorros"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_subtipo_deudas"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM salida s
        JOIN movimientos m ON m.id_movimiento = s.id_movimiento
        WHERE s.id_salida = NEW.id_salida
          AND m.subtipo_modulo = 'Deuda'
    ) THEN
        RAISE EXCEPTION 'La salida % no corresponde a un movimiento subtipo Deuda', NEW.id_salida;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validar_subtipo_deudas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_subtipo_gastos"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM salida s
        JOIN movimientos m ON m.id_movimiento = s.id_movimiento
        WHERE s.id_salida = NEW.id_salida
          AND m.subtipo_modulo = 'Gasto'
    ) THEN
        RAISE EXCEPTION 'La salida % no corresponde a un movimiento subtipo Gasto', NEW.id_salida;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validar_subtipo_gastos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_subtipo_imprevistos"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM salida s
        JOIN movimientos m ON m.id_movimiento = s.id_movimiento
        WHERE s.id_salida = NEW.id_salida
          AND m.subtipo_modulo = 'Imprevisto'
    ) THEN
        RAISE EXCEPTION 'La salida % no corresponde a un movimiento subtipo Imprevisto', NEW.id_salida;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validar_subtipo_imprevistos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_subtipo_ingresos"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM entrada e
        JOIN movimientos m ON m.id_movimiento = e.id_movimiento
        WHERE e.id_entrada = NEW.id_entrada
          AND m.subtipo_modulo = 'Ingreso'
    ) THEN
        RAISE EXCEPTION 'La entrada % no corresponde a un movimiento subtipo Ingreso', NEW.id_entrada;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validar_subtipo_ingresos"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."abonos_ahorro" (
    "id_abono" integer NOT NULL,
    "id_ahorros" integer NOT NULL,
    "monto" numeric(15,2) NOT NULL,
    "fecha_registro" "date" DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT "chk_abono_monto" CHECK (("monto" > (0)::numeric))
);


ALTER TABLE "public"."abonos_ahorro" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."abonos_ahorro_id_abono_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."abonos_ahorro_id_abono_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."abonos_ahorro_id_abono_seq" OWNED BY "public"."abonos_ahorro"."id_abono";



CREATE TABLE IF NOT EXISTS "public"."abonos_deuda" (
    "id_abono_deuda" integer NOT NULL,
    "id_deudas" integer NOT NULL,
    "cuotas" integer DEFAULT 1 NOT NULL,
    "monto" numeric(15,2) NOT NULL,
    "fecha_registro" "date" DEFAULT CURRENT_DATE NOT NULL,
    "descripcion" character varying(255),
    CONSTRAINT "chk_abono_deuda_cuotas" CHECK (("cuotas" > 0)),
    CONSTRAINT "chk_abono_deuda_monto" CHECK (("monto" > (0)::numeric))
);


ALTER TABLE "public"."abonos_deuda" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."abonos_deuda_id_abono_deuda_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."abonos_deuda_id_abono_deuda_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."abonos_deuda_id_abono_deuda_seq" OWNED BY "public"."abonos_deuda"."id_abono_deuda";



CREATE TABLE IF NOT EXISTS "public"."ahorros" (
    "id_ahorros" integer NOT NULL,
    "id_entrada" integer NOT NULL,
    "id_categoria" integer,
    "monto" numeric(15,2) NOT NULL,
    "monto_acumulado" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "descripcion" character varying(255),
    "meta" character varying(100),
    "fecha_registro" "date" DEFAULT CURRENT_DATE NOT NULL,
    "fecha_meta" "date",
    CONSTRAINT "chk_acumulado" CHECK ((("monto_acumulado" >= (0)::numeric) AND ("monto_acumulado" <= "monto"))),
    CONSTRAINT "chk_fechas" CHECK ((("fecha_meta" IS NULL) OR ("fecha_meta" >= "fecha_registro"))),
    CONSTRAINT "chk_monto" CHECK (("monto" > (0)::numeric))
);


ALTER TABLE "public"."ahorros" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ahorros_id_ahorros_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ahorros_id_ahorros_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ahorros_id_ahorros_seq" OWNED BY "public"."ahorros"."id_ahorros";



CREATE TABLE IF NOT EXISTS "public"."categorias" (
    "id_categoria" integer NOT NULL,
    "id_usuario" integer,
    "nombre" character varying(50) NOT NULL,
    "descripcion" character varying(255),
    "activa" boolean DEFAULT true NOT NULL,
    "sistema" boolean DEFAULT false NOT NULL,
    "es_global" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."categorias" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categorias_id_categoria_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."categorias_id_categoria_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categorias_id_categoria_seq" OWNED BY "public"."categorias"."id_categoria";



CREATE TABLE IF NOT EXISTS "public"."dependientes" (
    "id_dependientes" integer NOT NULL,
    "id_usuario" integer NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "relacion" character varying(100),
    "ocupacion" character varying(150),
    "fecha_nacimiento" "date",
    "peso_economico" smallint DEFAULT 1 NOT NULL,
    CONSTRAINT "chk_peso_rango" CHECK ((("peso_economico" >= 1) AND ("peso_economico" <= 5)))
);


ALTER TABLE "public"."dependientes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dependientes_id_dependientes_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dependientes_id_dependientes_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dependientes_id_dependientes_seq" OWNED BY "public"."dependientes"."id_dependientes";



CREATE TABLE IF NOT EXISTS "public"."deudas" (
    "id_deudas" integer NOT NULL,
    "id_salida" integer NOT NULL,
    "id_categoria" integer,
    "monto" numeric(15,2) NOT NULL,
    "fuente" character varying(150) NOT NULL,
    "descripcion" character varying(255),
    "cuotas_total" integer,
    "cuotas_pagadas" integer DEFAULT 0 NOT NULL,
    "fecha_inicio" "date",
    "fecha_fin" "date",
    "estado" "public"."estado_deuda_enum" DEFAULT 'pendiente'::"public"."estado_deuda_enum" NOT NULL,
    CONSTRAINT "chk_cuotas_pagadas" CHECK (("cuotas_pagadas" >= 0)),
    CONSTRAINT "chk_cuotas_total" CHECK ((("cuotas_total" IS NULL) OR ("cuotas_total" > 0))),
    CONSTRAINT "chk_fechas_deuda" CHECK ((("fecha_fin" IS NULL) OR ("fecha_fin" >= "fecha_inicio"))),
    CONSTRAINT "chk_logica_cuotas" CHECK ((("cuotas_total" IS NULL) OR ("cuotas_pagadas" <= "cuotas_total"))),
    CONSTRAINT "chk_monto_deuda" CHECK (("monto" >= (0)::numeric))
);


ALTER TABLE "public"."deudas" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."deudas_id_deudas_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."deudas_id_deudas_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."deudas_id_deudas_seq" OWNED BY "public"."deudas"."id_deudas";



CREATE TABLE IF NOT EXISTS "public"."entrada" (
    "id_entrada" integer NOT NULL,
    "id_movimiento" integer NOT NULL
);


ALTER TABLE "public"."entrada" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."entrada_id_entrada_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."entrada_id_entrada_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."entrada_id_entrada_seq" OWNED BY "public"."entrada"."id_entrada";



CREATE TABLE IF NOT EXISTS "public"."fondos_emergencia" (
    "id_fondo" integer NOT NULL,
    "id_usuario" integer NOT NULL,
    "meta" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "fecha_creacion" "date" DEFAULT CURRENT_DATE NOT NULL,
    "fecha_actualizacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "chk_meta_fondo_emergencia" CHECK (("meta" >= (0)::numeric))
);


ALTER TABLE "public"."fondos_emergencia" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fondos_emergencia_id_fondo_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fondos_emergencia_id_fondo_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fondos_emergencia_id_fondo_seq" OWNED BY "public"."fondos_emergencia"."id_fondo";



CREATE TABLE IF NOT EXISTS "public"."gastos" (
    "id_gastos" integer NOT NULL,
    "id_salida" integer NOT NULL,
    "id_categoria" integer,
    "id_dependientes" integer,
    "monto" numeric(15,2) NOT NULL,
    "descripcion" character varying(255),
    "fecha_registro" "date" DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT "chk_monto_gasto" CHECK (("monto" > (0)::numeric))
);


ALTER TABLE "public"."gastos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."gastos_id_gastos_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."gastos_id_gastos_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."gastos_id_gastos_seq" OWNED BY "public"."gastos"."id_gastos";



CREATE TABLE IF NOT EXISTS "public"."historial" (
    "id_historial" integer NOT NULL,
    "id_usuario" integer NOT NULL,
    "accion" character varying(200) NOT NULL,
    "detalles" "text",
    "fecha" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."historial" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."historial_id_historial_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."historial_id_historial_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."historial_id_historial_seq" OWNED BY "public"."historial"."id_historial";



CREATE TABLE IF NOT EXISTS "public"."imprevistos" (
    "id_imprevistos" integer NOT NULL,
    "id_salida" integer NOT NULL,
    "id_categoria" integer,
    "id_dependientes" integer,
    "monto" numeric(15,2) NOT NULL,
    "causa" character varying(255),
    "fecha_registro" "date" DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT "chk_monto_imprevisto" CHECK (("monto" > (0)::numeric))
);


ALTER TABLE "public"."imprevistos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."imprevistos_id_imprevistos_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."imprevistos_id_imprevistos_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."imprevistos_id_imprevistos_seq" OWNED BY "public"."imprevistos"."id_imprevistos";



CREATE TABLE IF NOT EXISTS "public"."ingresos" (
    "id_ingresos" integer NOT NULL,
    "id_entrada" integer NOT NULL,
    "id_categoria" integer,
    "monto" numeric(15,2) NOT NULL,
    "descripcion" character varying(255),
    "fuente" character varying(150),
    "fecha_registro" "date" DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT "chk_monto_ingreso" CHECK (("monto" > (0)::numeric))
);


ALTER TABLE "public"."ingresos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ingresos_id_ingresos_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ingresos_id_ingresos_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ingresos_id_ingresos_seq" OWNED BY "public"."ingresos"."id_ingresos";



CREATE TABLE IF NOT EXISTS "public"."movimientos" (
    "id_movimiento" integer NOT NULL,
    "id_usuario" integer NOT NULL,
    "tipo_flujo" "public"."tipo_flujo_enum" NOT NULL,
    "subtipo_modulo" "public"."subtipo_modulo_enum" NOT NULL,
    CONSTRAINT "chk_tipo_subtipo_movimiento" CHECK (((("tipo_flujo" = 'Entrada'::"public"."tipo_flujo_enum") AND ("subtipo_modulo" = ANY (ARRAY['Ahorro'::"public"."subtipo_modulo_enum", 'Ingreso'::"public"."subtipo_modulo_enum"]))) OR (("tipo_flujo" = 'Salida'::"public"."tipo_flujo_enum") AND ("subtipo_modulo" = ANY (ARRAY['Gasto'::"public"."subtipo_modulo_enum", 'Deuda'::"public"."subtipo_modulo_enum", 'Imprevisto'::"public"."subtipo_modulo_enum"])))))
);


ALTER TABLE "public"."movimientos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."movimientos_fondo_emergencia" (
    "id_movimiento_fondo" integer NOT NULL,
    "id_fondo" integer NOT NULL,
    "tipo" "public"."tipo_movimiento_fondo_enum" NOT NULL,
    "monto" numeric(15,2) NOT NULL,
    "fecha_registro" "date" DEFAULT CURRENT_DATE NOT NULL,
    "descripcion" character varying(255),
    CONSTRAINT "chk_monto_movimiento_fondo" CHECK (("monto" > (0)::numeric))
);


ALTER TABLE "public"."movimientos_fondo_emergencia" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."movimientos_fondo_emergencia_id_movimiento_fondo_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."movimientos_fondo_emergencia_id_movimiento_fondo_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."movimientos_fondo_emergencia_id_movimiento_fondo_seq" OWNED BY "public"."movimientos_fondo_emergencia"."id_movimiento_fondo";



CREATE SEQUENCE IF NOT EXISTS "public"."movimientos_id_movimiento_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."movimientos_id_movimiento_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."movimientos_id_movimiento_seq" OWNED BY "public"."movimientos"."id_movimiento";



CREATE TABLE IF NOT EXISTS "public"."notificaciones" (
    "id_notificacion" integer NOT NULL,
    "id_usuario" integer NOT NULL,
    "tipo" "text" NOT NULL,
    "entidad_tipo" character varying(50),
    "entidad_id" integer,
    "mensaje" "text" NOT NULL,
    "fecha" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "leida" boolean DEFAULT false NOT NULL,
    "archivada" boolean DEFAULT false NOT NULL,
    CONSTRAINT "tipo_check" CHECK (("tipo" = ANY (ARRAY['sistema'::"text", 'recordatorio'::"text", 'sugerencia'::"text", 'alerta_presupuesto'::"text"])))
);


ALTER TABLE "public"."notificaciones" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notificaciones_id_notificacion_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notificaciones_id_notificacion_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notificaciones_id_notificacion_seq" OWNED BY "public"."notificaciones"."id_notificacion";



CREATE TABLE IF NOT EXISTS "public"."periodos_presupuesto" (
    "id_periodo" integer NOT NULL,
    "id_presupuesto" integer NOT NULL,
    "id_usuario" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "ingreso_estimado" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "ingreso_real" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "saldo_anterior" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "estado" "public"."estado_periodo_enum" DEFAULT 'abierto'::"public"."estado_periodo_enum" NOT NULL,
    "monto_gastos" numeric(15,2) NOT NULL,
    "monto_deudas" numeric(15,2) NOT NULL,
    "monto_imprevistos" numeric(15,2) NOT NULL,
    "monto_ahorros" numeric(15,2) NOT NULL,
    "monto_emergencia" numeric(15,2) NOT NULL,
    CONSTRAINT "chk_ahorros_pos" CHECK (("monto_ahorros" >= (0)::numeric)),
    CONSTRAINT "chk_deudas_pos" CHECK (("monto_deudas" >= (0)::numeric)),
    CONSTRAINT "chk_emergencia_pos" CHECK (("monto_emergencia" >= (0)::numeric)),
    CONSTRAINT "chk_gastos_pos" CHECK (("monto_gastos" >= (0)::numeric)),
    CONSTRAINT "chk_imprevistos_pos" CHECK (("monto_imprevistos" >= (0)::numeric)),
    CONSTRAINT "chk_ingreso_estimado_pos" CHECK (("ingreso_estimado" >= (0)::numeric)),
    CONSTRAINT "chk_ingreso_real_pos" CHECK (("ingreso_real" >= (0)::numeric)),
    CONSTRAINT "chk_periodo_fechas" CHECK (("fecha_fin" > "fecha_inicio")),
    CONSTRAINT "chk_saldo_anterior_pos" CHECK (("saldo_anterior" >= (0)::numeric))
);


ALTER TABLE "public"."periodos_presupuesto" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."periodos_presupuesto_id_periodo_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."periodos_presupuesto_id_periodo_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."periodos_presupuesto_id_periodo_seq" OWNED BY "public"."periodos_presupuesto"."id_periodo";



CREATE TABLE IF NOT EXISTS "public"."preferencias_notificacion" (
    "id_usuario" integer NOT NULL,
    "tipo" "public"."tipo_notificacion_enum" NOT NULL,
    "activa" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."preferencias_notificacion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presupuestos" (
    "id_presupuesto" integer NOT NULL,
    "id_usuario" integer NOT NULL,
    "nombre" character varying(80) DEFAULT 'Mi presupuesto'::character varying NOT NULL,
    "descripcion" character varying(255),
    "activo" boolean DEFAULT false NOT NULL,
    "dia_corte" smallint DEFAULT 1 NOT NULL,
    "porcentaje_gastos" numeric(5,2) DEFAULT 40.00 NOT NULL,
    "porcentaje_deudas" numeric(5,2) DEFAULT 20.00 NOT NULL,
    "porcentaje_imprevistos" numeric(5,2) DEFAULT 15.00 NOT NULL,
    "porcentaje_ahorros" numeric(5,2) DEFAULT 10.00 NOT NULL,
    "porcentaje_emergencia" numeric(5,2) DEFAULT 15.00 NOT NULL,
    "fecha_actualizacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "chk_dia_corte" CHECK ((("dia_corte" >= 1) AND ("dia_corte" <= 31))),
    CONSTRAINT "chk_porcentaje_ahorros" CHECK ((("porcentaje_ahorros" >= (0)::numeric) AND ("porcentaje_ahorros" <= (100)::numeric))),
    CONSTRAINT "chk_porcentaje_deudas" CHECK ((("porcentaje_deudas" >= (0)::numeric) AND ("porcentaje_deudas" <= (100)::numeric))),
    CONSTRAINT "chk_porcentaje_emergencia" CHECK ((("porcentaje_emergencia" >= (0)::numeric) AND ("porcentaje_emergencia" <= (100)::numeric))),
    CONSTRAINT "chk_porcentaje_gastos" CHECK ((("porcentaje_gastos" >= (0)::numeric) AND ("porcentaje_gastos" <= (100)::numeric))),
    CONSTRAINT "chk_porcentaje_imprevistos" CHECK ((("porcentaje_imprevistos" >= (0)::numeric) AND ("porcentaje_imprevistos" <= (100)::numeric))),
    CONSTRAINT "chk_porcentajes_total" CHECK (((((("porcentaje_gastos" + "porcentaje_deudas") + "porcentaje_imprevistos") + "porcentaje_ahorros") + "porcentaje_emergencia") = (100)::numeric))
);


ALTER TABLE "public"."presupuestos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."presupuestos_id_presupuesto_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."presupuestos_id_presupuesto_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."presupuestos_id_presupuesto_seq" OWNED BY "public"."presupuestos"."id_presupuesto";



CREATE TABLE IF NOT EXISTS "public"."push_tokens" (
    "id" integer NOT NULL,
    "id_usuario" integer NOT NULL,
    "fcm_token" "text" NOT NULL,
    "plataforma" "text" NOT NULL
);


ALTER TABLE "public"."push_tokens" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."push_tokens_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."push_tokens_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."push_tokens_id_seq" OWNED BY "public"."push_tokens"."id";



CREATE TABLE IF NOT EXISTS "public"."rol" (
    "id_rol" integer NOT NULL,
    "cargo" character varying(50) NOT NULL
);


ALTER TABLE "public"."rol" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rol_id_rol_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rol_id_rol_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rol_id_rol_seq" OWNED BY "public"."rol"."id_rol";



CREATE TABLE IF NOT EXISTS "public"."salida" (
    "id_salida" integer NOT NULL,
    "id_movimiento" integer NOT NULL
);


ALTER TABLE "public"."salida" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."salida_id_salida_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."salida_id_salida_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."salida_id_salida_seq" OWNED BY "public"."salida"."id_salida";



CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id_usuario" integer NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "apellido" character varying(100),
    "reset_code" character varying(255) DEFAULT NULL::character varying,
    "reset_code_expires" timestamp without time zone,
    "password_hash" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "fecha_registro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "fecha_eliminacion_programada" timestamp without time zone
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."usuarios_id_usuario_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."usuarios_id_usuario_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."usuarios_id_usuario_seq" OWNED BY "public"."usuarios"."id_usuario";



CREATE TABLE IF NOT EXISTS "public"."usuarios_roles" (
    "id_usuario" integer NOT NULL,
    "id_rol" integer NOT NULL
);


ALTER TABLE "public"."usuarios_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."abonos_ahorro" ALTER COLUMN "id_abono" SET DEFAULT "nextval"('"public"."abonos_ahorro_id_abono_seq"'::"regclass");



ALTER TABLE ONLY "public"."abonos_deuda" ALTER COLUMN "id_abono_deuda" SET DEFAULT "nextval"('"public"."abonos_deuda_id_abono_deuda_seq"'::"regclass");



ALTER TABLE ONLY "public"."ahorros" ALTER COLUMN "id_ahorros" SET DEFAULT "nextval"('"public"."ahorros_id_ahorros_seq"'::"regclass");



ALTER TABLE ONLY "public"."categorias" ALTER COLUMN "id_categoria" SET DEFAULT "nextval"('"public"."categorias_id_categoria_seq"'::"regclass");



ALTER TABLE ONLY "public"."dependientes" ALTER COLUMN "id_dependientes" SET DEFAULT "nextval"('"public"."dependientes_id_dependientes_seq"'::"regclass");



ALTER TABLE ONLY "public"."deudas" ALTER COLUMN "id_deudas" SET DEFAULT "nextval"('"public"."deudas_id_deudas_seq"'::"regclass");



ALTER TABLE ONLY "public"."entrada" ALTER COLUMN "id_entrada" SET DEFAULT "nextval"('"public"."entrada_id_entrada_seq"'::"regclass");



ALTER TABLE ONLY "public"."fondos_emergencia" ALTER COLUMN "id_fondo" SET DEFAULT "nextval"('"public"."fondos_emergencia_id_fondo_seq"'::"regclass");



ALTER TABLE ONLY "public"."gastos" ALTER COLUMN "id_gastos" SET DEFAULT "nextval"('"public"."gastos_id_gastos_seq"'::"regclass");



ALTER TABLE ONLY "public"."historial" ALTER COLUMN "id_historial" SET DEFAULT "nextval"('"public"."historial_id_historial_seq"'::"regclass");



ALTER TABLE ONLY "public"."imprevistos" ALTER COLUMN "id_imprevistos" SET DEFAULT "nextval"('"public"."imprevistos_id_imprevistos_seq"'::"regclass");



ALTER TABLE ONLY "public"."ingresos" ALTER COLUMN "id_ingresos" SET DEFAULT "nextval"('"public"."ingresos_id_ingresos_seq"'::"regclass");



ALTER TABLE ONLY "public"."movimientos" ALTER COLUMN "id_movimiento" SET DEFAULT "nextval"('"public"."movimientos_id_movimiento_seq"'::"regclass");



ALTER TABLE ONLY "public"."movimientos_fondo_emergencia" ALTER COLUMN "id_movimiento_fondo" SET DEFAULT "nextval"('"public"."movimientos_fondo_emergencia_id_movimiento_fondo_seq"'::"regclass");



ALTER TABLE ONLY "public"."notificaciones" ALTER COLUMN "id_notificacion" SET DEFAULT "nextval"('"public"."notificaciones_id_notificacion_seq"'::"regclass");



ALTER TABLE ONLY "public"."periodos_presupuesto" ALTER COLUMN "id_periodo" SET DEFAULT "nextval"('"public"."periodos_presupuesto_id_periodo_seq"'::"regclass");



ALTER TABLE ONLY "public"."presupuestos" ALTER COLUMN "id_presupuesto" SET DEFAULT "nextval"('"public"."presupuestos_id_presupuesto_seq"'::"regclass");



ALTER TABLE ONLY "public"."push_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."push_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rol" ALTER COLUMN "id_rol" SET DEFAULT "nextval"('"public"."rol_id_rol_seq"'::"regclass");



ALTER TABLE ONLY "public"."salida" ALTER COLUMN "id_salida" SET DEFAULT "nextval"('"public"."salida_id_salida_seq"'::"regclass");



ALTER TABLE ONLY "public"."usuarios" ALTER COLUMN "id_usuario" SET DEFAULT "nextval"('"public"."usuarios_id_usuario_seq"'::"regclass");



ALTER TABLE ONLY "public"."abonos_ahorro"
    ADD CONSTRAINT "abonos_ahorro_pkey" PRIMARY KEY ("id_abono");



ALTER TABLE ONLY "public"."abonos_deuda"
    ADD CONSTRAINT "abonos_deuda_pkey" PRIMARY KEY ("id_abono_deuda");



ALTER TABLE ONLY "public"."ahorros"
    ADD CONSTRAINT "ahorros_pkey" PRIMARY KEY ("id_ahorros");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria");



ALTER TABLE ONLY "public"."dependientes"
    ADD CONSTRAINT "dependientes_pkey" PRIMARY KEY ("id_dependientes");



ALTER TABLE ONLY "public"."deudas"
    ADD CONSTRAINT "deudas_pkey" PRIMARY KEY ("id_deudas");



ALTER TABLE ONLY "public"."entrada"
    ADD CONSTRAINT "entrada_id_movimiento_key" UNIQUE ("id_movimiento");



ALTER TABLE ONLY "public"."entrada"
    ADD CONSTRAINT "entrada_pkey" PRIMARY KEY ("id_entrada");



ALTER TABLE ONLY "public"."fondos_emergencia"
    ADD CONSTRAINT "fondos_emergencia_id_usuario_key" UNIQUE ("id_usuario");



ALTER TABLE ONLY "public"."fondos_emergencia"
    ADD CONSTRAINT "fondos_emergencia_pkey" PRIMARY KEY ("id_fondo");



ALTER TABLE ONLY "public"."gastos"
    ADD CONSTRAINT "gastos_pkey" PRIMARY KEY ("id_gastos");



ALTER TABLE ONLY "public"."historial"
    ADD CONSTRAINT "historial_pkey" PRIMARY KEY ("id_historial");



ALTER TABLE ONLY "public"."imprevistos"
    ADD CONSTRAINT "imprevistos_pkey" PRIMARY KEY ("id_imprevistos");



ALTER TABLE ONLY "public"."ingresos"
    ADD CONSTRAINT "ingresos_pkey" PRIMARY KEY ("id_ingresos");



ALTER TABLE ONLY "public"."movimientos_fondo_emergencia"
    ADD CONSTRAINT "movimientos_fondo_emergencia_pkey" PRIMARY KEY ("id_movimiento_fondo");



ALTER TABLE ONLY "public"."movimientos"
    ADD CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id_movimiento");



ALTER TABLE ONLY "public"."notificaciones"
    ADD CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id_notificacion");



ALTER TABLE ONLY "public"."periodos_presupuesto"
    ADD CONSTRAINT "periodos_presupuesto_pkey" PRIMARY KEY ("id_periodo");



ALTER TABLE ONLY "public"."preferencias_notificacion"
    ADD CONSTRAINT "preferencias_notificacion_pkey" PRIMARY KEY ("id_usuario", "tipo");



ALTER TABLE ONLY "public"."presupuestos"
    ADD CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id_presupuesto");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_fcm_token_key" UNIQUE ("fcm_token");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rol"
    ADD CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol");



ALTER TABLE ONLY "public"."salida"
    ADD CONSTRAINT "salida_id_movimiento_key" UNIQUE ("id_movimiento");



ALTER TABLE ONLY "public"."salida"
    ADD CONSTRAINT "salida_pkey" PRIMARY KEY ("id_salida");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario");



ALTER TABLE ONLY "public"."usuarios_roles"
    ADD CONSTRAINT "usuarios_roles_pkey" PRIMARY KEY ("id_usuario", "id_rol");



CREATE INDEX "idx_abonos_ahorro" ON "public"."abonos_ahorro" USING "btree" ("id_ahorros");



CREATE INDEX "idx_abonos_deuda_deuda" ON "public"."abonos_deuda" USING "btree" ("id_deudas");



CREATE INDEX "idx_abonos_deuda_fecha" ON "public"."abonos_deuda" USING "btree" ("fecha_registro");



CREATE INDEX "idx_ahorros_categoria" ON "public"."ahorros" USING "btree" ("id_categoria");



CREATE INDEX "idx_ahorros_entrada" ON "public"."ahorros" USING "btree" ("id_entrada");



CREATE UNIQUE INDEX "idx_categorias_globales_nombre" ON "public"."categorias" USING "btree" ("nombre") WHERE ("es_global" = true);



CREATE INDEX "idx_dependientes_usuario" ON "public"."dependientes" USING "btree" ("id_usuario");



CREATE INDEX "idx_deudas_categoria" ON "public"."deudas" USING "btree" ("id_categoria");



CREATE INDEX "idx_deudas_salida" ON "public"."deudas" USING "btree" ("id_salida");



CREATE INDEX "idx_fondos_emergencia_usuario" ON "public"."fondos_emergencia" USING "btree" ("id_usuario");



CREATE INDEX "idx_gastos_categoria" ON "public"."gastos" USING "btree" ("id_categoria");



CREATE INDEX "idx_gastos_dependiente" ON "public"."gastos" USING "btree" ("id_dependientes");



CREATE INDEX "idx_gastos_salida" ON "public"."gastos" USING "btree" ("id_salida");



CREATE INDEX "idx_historial_fecha" ON "public"."historial" USING "btree" ("fecha");



CREATE INDEX "idx_historial_usuario" ON "public"."historial" USING "btree" ("id_usuario");



CREATE INDEX "idx_imprevistos_categoria" ON "public"."imprevistos" USING "btree" ("id_categoria");



CREATE INDEX "idx_imprevistos_dependiente" ON "public"."imprevistos" USING "btree" ("id_dependientes");



CREATE INDEX "idx_imprevistos_salida" ON "public"."imprevistos" USING "btree" ("id_salida");



CREATE INDEX "idx_ingresos_categoria" ON "public"."ingresos" USING "btree" ("id_categoria");



CREATE INDEX "idx_ingresos_entrada" ON "public"."ingresos" USING "btree" ("id_entrada");



CREATE INDEX "idx_movimientos_fondo_fecha" ON "public"."movimientos_fondo_emergencia" USING "btree" ("fecha_registro");



CREATE INDEX "idx_movimientos_fondo_fondo" ON "public"."movimientos_fondo_emergencia" USING "btree" ("id_fondo");



CREATE INDEX "idx_movimientos_fondo_tipo" ON "public"."movimientos_fondo_emergencia" USING "btree" ("tipo");



CREATE INDEX "idx_movimientos_usuario" ON "public"."movimientos" USING "btree" ("id_usuario");



CREATE INDEX "idx_notif_entidad" ON "public"."notificaciones" USING "btree" ("entidad_tipo", "entidad_id", "tipo");



CREATE INDEX "idx_notif_usuario_leida" ON "public"."notificaciones" USING "btree" ("id_usuario", "leida", "archivada");



CREATE INDEX "idx_notif_usuario_leida_archivada" ON "public"."notificaciones" USING "btree" ("id_usuario", "leida", "archivada", "fecha" DESC);



CREATE INDEX "idx_periodos_fechas" ON "public"."periodos_presupuesto" USING "btree" ("fecha_inicio", "fecha_fin");



CREATE INDEX "idx_periodos_presupuesto" ON "public"."periodos_presupuesto" USING "btree" ("id_presupuesto");



CREATE INDEX "idx_periodos_usuario" ON "public"."periodos_presupuesto" USING "btree" ("id_usuario");



CREATE UNIQUE INDEX "idx_presupuesto_activo_unico" ON "public"."presupuestos" USING "btree" ("id_usuario") WHERE ("activo" = true);



CREATE INDEX "idx_push_tokens_usuario" ON "public"."push_tokens" USING "btree" ("id_usuario");



CREATE OR REPLACE TRIGGER "trg_actualizar_fecha_presupuesto" BEFORE UPDATE ON "public"."presupuestos" FOR EACH ROW EXECUTE FUNCTION "public"."actualizar_fecha_presupuesto"();



CREATE OR REPLACE TRIGGER "trg_validar_flujo_entrada" BEFORE INSERT OR UPDATE ON "public"."entrada" FOR EACH ROW EXECUTE FUNCTION "public"."validar_flujo_entrada"();



CREATE OR REPLACE TRIGGER "trg_validar_flujo_salida" BEFORE INSERT OR UPDATE ON "public"."salida" FOR EACH ROW EXECUTE FUNCTION "public"."validar_flujo_salida"();



CREATE OR REPLACE TRIGGER "trg_validar_subtipo_ahorros" BEFORE INSERT OR UPDATE ON "public"."ahorros" FOR EACH ROW EXECUTE FUNCTION "public"."validar_subtipo_ahorros"();



CREATE OR REPLACE TRIGGER "trg_validar_subtipo_deudas" BEFORE INSERT OR UPDATE ON "public"."deudas" FOR EACH ROW EXECUTE FUNCTION "public"."validar_subtipo_deudas"();



CREATE OR REPLACE TRIGGER "trg_validar_subtipo_gastos" BEFORE INSERT OR UPDATE ON "public"."gastos" FOR EACH ROW EXECUTE FUNCTION "public"."validar_subtipo_gastos"();



CREATE OR REPLACE TRIGGER "trg_validar_subtipo_imprevistos" BEFORE INSERT OR UPDATE ON "public"."imprevistos" FOR EACH ROW EXECUTE FUNCTION "public"."validar_subtipo_imprevistos"();



CREATE OR REPLACE TRIGGER "trg_validar_subtipo_ingresos" BEFORE INSERT OR UPDATE ON "public"."ingresos" FOR EACH ROW EXECUTE FUNCTION "public"."validar_subtipo_ingresos"();



ALTER TABLE ONLY "public"."abonos_ahorro"
    ADD CONSTRAINT "abonos_ahorro_id_ahorros_fkey" FOREIGN KEY ("id_ahorros") REFERENCES "public"."ahorros"("id_ahorros") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."abonos_deuda"
    ADD CONSTRAINT "abonos_deuda_id_deudas_fkey" FOREIGN KEY ("id_deudas") REFERENCES "public"."deudas"("id_deudas") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ahorros"
    ADD CONSTRAINT "ahorros_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categorias"("id_categoria") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ahorros"
    ADD CONSTRAINT "ahorros_id_entrada_fkey" FOREIGN KEY ("id_entrada") REFERENCES "public"."entrada"("id_entrada") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dependientes"
    ADD CONSTRAINT "dependientes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deudas"
    ADD CONSTRAINT "deudas_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categorias"("id_categoria") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deudas"
    ADD CONSTRAINT "deudas_id_salida_fkey" FOREIGN KEY ("id_salida") REFERENCES "public"."salida"("id_salida") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entrada"
    ADD CONSTRAINT "entrada_id_movimiento_fkey" FOREIGN KEY ("id_movimiento") REFERENCES "public"."movimientos"("id_movimiento") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fondos_emergencia"
    ADD CONSTRAINT "fondos_emergencia_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gastos"
    ADD CONSTRAINT "gastos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categorias"("id_categoria") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gastos"
    ADD CONSTRAINT "gastos_id_dependientes_fkey" FOREIGN KEY ("id_dependientes") REFERENCES "public"."dependientes"("id_dependientes") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gastos"
    ADD CONSTRAINT "gastos_id_salida_fkey" FOREIGN KEY ("id_salida") REFERENCES "public"."salida"("id_salida") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historial"
    ADD CONSTRAINT "historial_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."imprevistos"
    ADD CONSTRAINT "imprevistos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categorias"("id_categoria") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."imprevistos"
    ADD CONSTRAINT "imprevistos_id_dependientes_fkey" FOREIGN KEY ("id_dependientes") REFERENCES "public"."dependientes"("id_dependientes") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."imprevistos"
    ADD CONSTRAINT "imprevistos_id_salida_fkey" FOREIGN KEY ("id_salida") REFERENCES "public"."salida"("id_salida") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ingresos"
    ADD CONSTRAINT "ingresos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categorias"("id_categoria") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ingresos"
    ADD CONSTRAINT "ingresos_id_entrada_fkey" FOREIGN KEY ("id_entrada") REFERENCES "public"."entrada"("id_entrada") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."movimientos_fondo_emergencia"
    ADD CONSTRAINT "movimientos_fondo_emergencia_id_fondo_fkey" FOREIGN KEY ("id_fondo") REFERENCES "public"."fondos_emergencia"("id_fondo") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."movimientos"
    ADD CONSTRAINT "movimientos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificaciones"
    ADD CONSTRAINT "notificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."periodos_presupuesto"
    ADD CONSTRAINT "periodos_presupuesto_id_presupuesto_fkey" FOREIGN KEY ("id_presupuesto") REFERENCES "public"."presupuestos"("id_presupuesto") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."periodos_presupuesto"
    ADD CONSTRAINT "periodos_presupuesto_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preferencias_notificacion"
    ADD CONSTRAINT "preferencias_notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presupuestos"
    ADD CONSTRAINT "presupuestos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salida"
    ADD CONSTRAINT "salida_id_movimiento_fkey" FOREIGN KEY ("id_movimiento") REFERENCES "public"."movimientos"("id_movimiento") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios_roles"
    ADD CONSTRAINT "usuarios_roles_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "public"."rol"("id_rol") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios_roles"
    ADD CONSTRAINT "usuarios_roles_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."abonos_ahorro" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."abonos_deuda" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ahorros" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categorias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dependientes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deudas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entrada" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fondos_emergencia" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gastos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historial" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."imprevistos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingresos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."movimientos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."movimientos_fondo_emergencia" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notificaciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."periodos_presupuesto" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preferencias_notificacion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presupuestos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rol" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."salida" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuarios_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."actualizar_fecha_presupuesto"() TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_fecha_presupuesto"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_fecha_presupuesto"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_flujo_entrada"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_flujo_entrada"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_flujo_entrada"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_flujo_salida"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_flujo_salida"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_flujo_salida"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_subtipo_ahorros"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_subtipo_ahorros"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_subtipo_ahorros"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_subtipo_deudas"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_subtipo_deudas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_subtipo_deudas"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_subtipo_gastos"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_subtipo_gastos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_subtipo_gastos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_subtipo_imprevistos"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_subtipo_imprevistos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_subtipo_imprevistos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_subtipo_ingresos"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_subtipo_ingresos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_subtipo_ingresos"() TO "service_role";


















GRANT ALL ON TABLE "public"."abonos_ahorro" TO "anon";
GRANT ALL ON TABLE "public"."abonos_ahorro" TO "authenticated";
GRANT ALL ON TABLE "public"."abonos_ahorro" TO "service_role";



GRANT ALL ON SEQUENCE "public"."abonos_ahorro_id_abono_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."abonos_ahorro_id_abono_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."abonos_ahorro_id_abono_seq" TO "service_role";



GRANT ALL ON TABLE "public"."abonos_deuda" TO "anon";
GRANT ALL ON TABLE "public"."abonos_deuda" TO "authenticated";
GRANT ALL ON TABLE "public"."abonos_deuda" TO "service_role";



GRANT ALL ON SEQUENCE "public"."abonos_deuda_id_abono_deuda_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."abonos_deuda_id_abono_deuda_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."abonos_deuda_id_abono_deuda_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ahorros" TO "anon";
GRANT ALL ON TABLE "public"."ahorros" TO "authenticated";
GRANT ALL ON TABLE "public"."ahorros" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ahorros_id_ahorros_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ahorros_id_ahorros_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ahorros_id_ahorros_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categorias" TO "anon";
GRANT ALL ON TABLE "public"."categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."categorias" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categorias_id_categoria_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categorias_id_categoria_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categorias_id_categoria_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dependientes" TO "anon";
GRANT ALL ON TABLE "public"."dependientes" TO "authenticated";
GRANT ALL ON TABLE "public"."dependientes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dependientes_id_dependientes_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dependientes_id_dependientes_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dependientes_id_dependientes_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deudas" TO "anon";
GRANT ALL ON TABLE "public"."deudas" TO "authenticated";
GRANT ALL ON TABLE "public"."deudas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deudas_id_deudas_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deudas_id_deudas_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deudas_id_deudas_seq" TO "service_role";



GRANT ALL ON TABLE "public"."entrada" TO "anon";
GRANT ALL ON TABLE "public"."entrada" TO "authenticated";
GRANT ALL ON TABLE "public"."entrada" TO "service_role";



GRANT ALL ON SEQUENCE "public"."entrada_id_entrada_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."entrada_id_entrada_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."entrada_id_entrada_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fondos_emergencia" TO "anon";
GRANT ALL ON TABLE "public"."fondos_emergencia" TO "authenticated";
GRANT ALL ON TABLE "public"."fondos_emergencia" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fondos_emergencia_id_fondo_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fondos_emergencia_id_fondo_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fondos_emergencia_id_fondo_seq" TO "service_role";



GRANT ALL ON TABLE "public"."gastos" TO "anon";
GRANT ALL ON TABLE "public"."gastos" TO "authenticated";
GRANT ALL ON TABLE "public"."gastos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."gastos_id_gastos_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."gastos_id_gastos_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."gastos_id_gastos_seq" TO "service_role";



GRANT ALL ON TABLE "public"."historial" TO "anon";
GRANT ALL ON TABLE "public"."historial" TO "authenticated";
GRANT ALL ON TABLE "public"."historial" TO "service_role";



GRANT ALL ON SEQUENCE "public"."historial_id_historial_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."historial_id_historial_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."historial_id_historial_seq" TO "service_role";



GRANT ALL ON TABLE "public"."imprevistos" TO "anon";
GRANT ALL ON TABLE "public"."imprevistos" TO "authenticated";
GRANT ALL ON TABLE "public"."imprevistos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."imprevistos_id_imprevistos_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."imprevistos_id_imprevistos_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."imprevistos_id_imprevistos_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ingresos" TO "anon";
GRANT ALL ON TABLE "public"."ingresos" TO "authenticated";
GRANT ALL ON TABLE "public"."ingresos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ingresos_id_ingresos_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ingresos_id_ingresos_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ingresos_id_ingresos_seq" TO "service_role";



GRANT ALL ON TABLE "public"."movimientos" TO "anon";
GRANT ALL ON TABLE "public"."movimientos" TO "authenticated";
GRANT ALL ON TABLE "public"."movimientos" TO "service_role";



GRANT ALL ON TABLE "public"."movimientos_fondo_emergencia" TO "anon";
GRANT ALL ON TABLE "public"."movimientos_fondo_emergencia" TO "authenticated";
GRANT ALL ON TABLE "public"."movimientos_fondo_emergencia" TO "service_role";



GRANT ALL ON SEQUENCE "public"."movimientos_fondo_emergencia_id_movimiento_fondo_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."movimientos_fondo_emergencia_id_movimiento_fondo_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."movimientos_fondo_emergencia_id_movimiento_fondo_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."movimientos_id_movimiento_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."movimientos_id_movimiento_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."movimientos_id_movimiento_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notificaciones" TO "anon";
GRANT ALL ON TABLE "public"."notificaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."notificaciones" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notificaciones_id_notificacion_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notificaciones_id_notificacion_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notificaciones_id_notificacion_seq" TO "service_role";



GRANT ALL ON TABLE "public"."periodos_presupuesto" TO "anon";
GRANT ALL ON TABLE "public"."periodos_presupuesto" TO "authenticated";
GRANT ALL ON TABLE "public"."periodos_presupuesto" TO "service_role";



GRANT ALL ON SEQUENCE "public"."periodos_presupuesto_id_periodo_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."periodos_presupuesto_id_periodo_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."periodos_presupuesto_id_periodo_seq" TO "service_role";



GRANT ALL ON TABLE "public"."preferencias_notificacion" TO "anon";
GRANT ALL ON TABLE "public"."preferencias_notificacion" TO "authenticated";
GRANT ALL ON TABLE "public"."preferencias_notificacion" TO "service_role";



GRANT ALL ON TABLE "public"."presupuestos" TO "anon";
GRANT ALL ON TABLE "public"."presupuestos" TO "authenticated";
GRANT ALL ON TABLE "public"."presupuestos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."presupuestos_id_presupuesto_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."presupuestos_id_presupuesto_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."presupuestos_id_presupuesto_seq" TO "service_role";



GRANT ALL ON TABLE "public"."push_tokens" TO "anon";
GRANT ALL ON TABLE "public"."push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."push_tokens" TO "service_role";



GRANT ALL ON SEQUENCE "public"."push_tokens_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."push_tokens_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."push_tokens_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rol" TO "anon";
GRANT ALL ON TABLE "public"."rol" TO "authenticated";
GRANT ALL ON TABLE "public"."rol" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rol_id_rol_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rol_id_rol_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rol_id_rol_seq" TO "service_role";



GRANT ALL ON TABLE "public"."salida" TO "anon";
GRANT ALL ON TABLE "public"."salida" TO "authenticated";
GRANT ALL ON TABLE "public"."salida" TO "service_role";



GRANT ALL ON SEQUENCE "public"."salida_id_salida_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."salida_id_salida_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."salida_id_salida_seq" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



GRANT ALL ON SEQUENCE "public"."usuarios_id_usuario_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."usuarios_id_usuario_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."usuarios_id_usuario_seq" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios_roles" TO "anon";
GRANT ALL ON TABLE "public"."usuarios_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































