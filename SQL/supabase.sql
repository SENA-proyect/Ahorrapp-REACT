-- ========================================================================
-- BLOQUE DE TABLAS PARA LA GESTIÓN DE USUARIOS Y ROLES (usuarios, rol, usuarios_roles)
-- ========================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    reset_code VARCHAR(255) DEFAULT NULL,
    reset_code_expires TIMESTAMP DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    cargo VARCHAR(50) NOT NULL
);

-- Inserción de los roles iniciales
INSERT INTO rol (cargo) VALUES ('user'), ('admin'), ('superuser');


CREATE TABLE IF NOT EXISTS usuarios_roles (
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE CASCADE ON UPDATE CASCADE
);




-- ========================================================================
-- BLOQUE DE TABLAS PARA LA GESTIÓN DE CATEGORÍAS (categorias)
-- ========================================================================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    id_usuario INT DEFAULT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    activa BOOLEAN DEFAULT TRUE,
    sistema BOOLEAN DEFAULT FALSE,
    es_global BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CATEGORIAS PREDETERMINADAS POR EL SISTEMA
INSERT INTO categorias (id_usuario, nombre, descripcion, activa, sistema, es_global) VALUES
(NULL, 'Alimentación',    'Gastos en comida y bebida',          TRUE, TRUE, TRUE),
(NULL, 'Transporte',      'Movilidad y combustible',            TRUE, TRUE, TRUE),
(NULL, 'Salud',           'Médicos, medicamentos y bienestar',  TRUE, TRUE, TRUE),
(NULL, 'Educación',       'Colegiaturas, libros y cursos',      TRUE, TRUE, TRUE),
(NULL, 'Entretenimiento', 'Ocio, streaming y salidas',          TRUE, TRUE, TRUE),
(NULL, 'Servicios',       'Agua, luz, internet y gas',          TRUE, TRUE, TRUE),
(NULL, 'Vivienda',        'Alquiler, hipoteca y mantenimiento', TRUE, TRUE, TRUE),
(NULL, 'Salario',         'Pago mensual o quincenal por parte de alguna entidad',  TRUE, TRUE, TRUE),
(NULL, 'Negocio',         'Ingresos provenientes de un negocio propio',  TRUE, TRUE, TRUE);




-- ========================================================================
-- BLOQUE DE TABLAS PARA LA GESTIÓN DE DEPENDIENTES (dependientes)
-- ========================================================================
CREATE TABLE IF NOT EXISTS dependientes (
    id_dependientes SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    relacion VARCHAR(100),
    ocupacion VARCHAR(150),
    fecha_nacimiento DATE,
    peso_economico SMALLINT NOT NULL DEFAULT 1,
    CONSTRAINT chk_peso_rango CHECK (peso_economico BETWEEN 1 AND 5),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);




-- ========================================================================
-- BLOQUE DE TABLAS PARA LA GESTIÓN DE MOVIMIENTOS (movimientos)
-- ========================================================================
-- Creación de tipos ENUM en PostgreSQL
CREATE TYPE tipo_flujo_enum AS ENUM ('Entrada', 'Salida');
CREATE TYPE subtipo_modulo_enum AS ENUM ('Ahorro', 'Ingreso', 'Gasto', 'Deuda', 'Imprevisto');

CREATE TABLE IF NOT EXISTS movimientos (
    id_movimiento SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo_flujo tipo_flujo_enum NOT NULL,
    subtipo_modulo subtipo_modulo_enum NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);




-- ========================================================================
-- BLOQUE DE TABLAS PARA MOVIMIENTOS DE TIPO ENTRADA (entrada, ahorros, abonos_ahorro, ingresos)
-- ========================================================================
-- 1. Tabla ENTRADA
CREATE TABLE IF NOT EXISTS entrada (
    id_entrada SERIAL PRIMARY KEY,
    id_movimiento INT NOT NULL,
    FOREIGN KEY (id_movimiento) REFERENCES movimientos(id_movimiento) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2. Tabla AHORROS
CREATE TABLE IF NOT EXISTS ahorros (
    id_ahorros SERIAL PRIMARY KEY,
    id_entrada INT DEFAULT NULL,
    id_categoria INT,
    monto DECIMAL(15,2) NOT NULL,
    monto_acumulado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descripcion VARCHAR(255),
    meta VARCHAR(100),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    fecha_meta DATE DEFAULT NULL,
    CONSTRAINT chk_monto CHECK (monto >= 0),
    CONSTRAINT chk_acumulado CHECK (monto_acumulado >= 0),
    CONSTRAINT chk_fechas CHECK (fecha_meta IS NULL OR fecha_meta >= fecha_registro),
    FOREIGN KEY (id_entrada) REFERENCES entrada(id_entrada) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Tabla ABONOS_AHORRO
CREATE TABLE IF NOT EXISTS abonos_ahorro (
    id_abono SERIAL PRIMARY KEY,
    id_ahorros INT NOT NULL,
    id_usuario INT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT chk_abono_monto CHECK (monto > 0),
    FOREIGN KEY (id_ahorros) REFERENCES ahorros(id_ahorros) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Tabla INGRESOS
CREATE TABLE IF NOT EXISTS ingresos (
    id_ingresos SERIAL PRIMARY KEY,
    id_entrada INT NOT NULL,
    id_categoria INT DEFAULT NULL,
    monto DECIMAL(15,2) NOT NULL,
    descripcion VARCHAR(255),
    fuente VARCHAR(150),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    CONSTRAINT chk_monto_ingreso CHECK (monto >= 0),
    FOREIGN KEY (id_entrada) REFERENCES entrada(id_entrada) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL ON UPDATE CASCADE
);




-- ========================================================================
-- BLOQUE DE TABLAS PARA MOVIMIENTOS DE TIPO SALIDA (salida, gastos, deudas, imprevistos)
-- ========================================================================
-- 1. Creación del tipo ENUM para deudas en PostgreSQL
CREATE TYPE estado_deuda_enum AS ENUM ('pendiente', 'pagada');

-- 2. Tabla SALIDA
CREATE TABLE IF NOT EXISTS salida (
    id_salida SERIAL PRIMARY KEY,
    id_movimiento INT NOT NULL,
    FOREIGN KEY (id_movimiento) REFERENCES movimientos(id_movimiento) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Tabla GASTOS
CREATE TABLE IF NOT EXISTS gastos (
    id_gastos SERIAL PRIMARY KEY,
    id_salida INT NOT NULL,
    id_categoria INT DEFAULT NULL,
    id_dependientes INT DEFAULT NULL,
    monto DECIMAL(15,2) NOT NULL,
    descripcion VARCHAR(255),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    CONSTRAINT chk_monto_gasto CHECK (monto >= 0),
    FOREIGN KEY (id_salida) REFERENCES salida(id_salida) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_dependientes) REFERENCES dependientes(id_dependientes) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 4. Tabla IMPREVISTOS
CREATE TABLE IF NOT EXISTS imprevistos (
    id_imprevistos SERIAL PRIMARY KEY,
    id_salida INT NOT NULL,
    id_categoria INT DEFAULT NULL,
    id_dependientes INT DEFAULT NULL,
    monto DECIMAL(15,2) NOT NULL,
    causa VARCHAR(255),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    CONSTRAINT chk_monto_imprevisto CHECK (monto >= 0),
    FOREIGN KEY (id_salida) REFERENCES salida(id_salida) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_dependientes) REFERENCES dependientes(id_dependientes) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Tabla DEUDAS
CREATE TABLE IF NOT EXISTS deudas (
    id_deudas SERIAL PRIMARY KEY,
    id_salida INT NOT NULL,
    id_categoria INT DEFAULT NULL,
    monto DECIMAL(15,2) NOT NULL,
    fuente VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255),
    cuotas_total INT DEFAULT NULL,
    cuotas_pagadas INT NOT NULL DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado estado_deuda_enum NOT NULL DEFAULT 'pendiente',
    CONSTRAINT chk_monto_deuda CHECK (monto >= 0),
    CONSTRAINT chk_cuotas_total CHECK (cuotas_total IS NULL OR cuotas_total > 0),
    CONSTRAINT chk_cuotas_pagadas CHECK (cuotas_pagadas >= 0),
    CONSTRAINT chk_fechas_deuda CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT chk_logica_cuotas CHECK (cuotas_total IS NULL OR cuotas_pagadas <= cuotas_total),
    FOREIGN KEY (id_salida) REFERENCES salida(id_salida) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL ON UPDATE CASCADE
);




-- ========================================================================
-- BLOQUE DE TABLAS PARA LA GESTION DE PRESUPUESTOS FINANCIEROS (presupuestos, periodos_presupuesto)
-- ========================================================================
-- 1. Creación del tipo ENUM para periodos en PostgreSQL
CREATE TYPE estado_periodo_enum AS ENUM ('abierto', 'cerrado');

-- 2. Tabla PRESUPUESTOS
CREATE TABLE IF NOT EXISTS presupuestos (
    id_presupuesto SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre VARCHAR(80) NOT NULL DEFAULT 'Mi presupuesto',
    descripcion VARCHAR(255) DEFAULT NULL,
    activo BOOLEAN NOT NULL DEFAULT FALSE,
    dia_corte SMALLINT NOT NULL DEFAULT 1,
    porcentaje_gastos DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    porcentaje_deudas DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    porcentaje_imprevistos DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    porcentaje_ahorros DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    porcentaje_emergencia DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dia_corte CHECK (dia_corte BETWEEN 1 AND 31),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Función y Trigger para simular el ON UPDATE CURRENT_TIMESTAMP de MySQL
CREATE OR REPLACE FUNCTION actualizar_fecha_presupuesto()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_fecha_presupuesto
BEFORE UPDATE ON presupuestos
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_presupuesto();

-- 4. Tabla PERIODOS_PRESUPUESTO
CREATE TABLE IF NOT EXISTS periodos_presupuesto (
    id_periodo SERIAL PRIMARY KEY,
    id_presupuesto INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    ingreso_estimado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ingreso_real DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    saldo_anterior DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    estado estado_periodo_enum NOT NULL DEFAULT 'abierto',
    monto_gastos DECIMAL(15,2) NOT NULL,
    monto_deudas DECIMAL(15,2) NOT NULL,
    monto_imprevistos DECIMAL(15,2) NOT NULL,
    monto_ahorros DECIMAL(15,2) NOT NULL,
    monto_emergencia DECIMAL(15,2) NOT NULL,
    CONSTRAINT chk_periodo_fechas CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT chk_ingreso_estimado_pos CHECK (ingreso_estimado >= 0),
    CONSTRAINT chk_ingreso_real_pos CHECK (ingreso_real >= 0),
    CONSTRAINT chk_saldo_anterior_pos CHECK (saldo_anterior >= 0),
    CONSTRAINT chk_gastos_pos CHECK (monto_gastos >= 0),
    CONSTRAINT chk_deudas_pos CHECK (monto_deudas >= 0),
    CONSTRAINT chk_imprevistos_pos CHECK (monto_imprevistos >= 0),
    CONSTRAINT chk_ahorros_pos CHECK (monto_ahorros >= 0),
    CONSTRAINT chk_emergencia_pos CHECK (monto_emergencia >= 0),
    FOREIGN KEY (id_presupuesto) REFERENCES presupuestos(id_presupuesto) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);




-- ========================================================================
-- BLOQUE DE TABLAS PARA LA GGESTION DE HISTORIAL DE ACCIONES (historial)
-- ========================================================================
CREATE TABLE IF NOT EXISTS historial (
    id_historial SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    accion VARCHAR(200) NOT NULL,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);




-- ========================================================================
-- BLOQUE DE TABLAS PARA LA GGESTION DE NOTIFICACIONES (notificaciones, preferencias_notificacion)
-- ========================================================================
-- 1. Creación del tipo ENUM para notificaciones en PostgreSQL
CREATE TYPE tipo_notificacion_enum AS ENUM ('sistema', 'recordatorio', 'sugerencia', 'alerta_presupuesto');

-- 2. Tabla NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo tipo_notificacion_enum NOT NULL,
    entidad_tipo VARCHAR(50) DEFAULT NULL,
    entidad_id INT DEFAULT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE,
    archivada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Tabla PREFERENCIAS_NOTIFICACION
CREATE TABLE IF NOT EXISTS preferencias_notificacion (
    id_usuario INT NOT NULL,
    tipo tipo_notificacion_enum NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_usuario, tipo),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_notif_usuario_leida
    ON notificaciones (id_usuario, leida, archivada);

CREATE INDEX IF NOT EXISTS idx_notif_entidad
    ON notificaciones (entidad_tipo, entidad_id, tipo);
