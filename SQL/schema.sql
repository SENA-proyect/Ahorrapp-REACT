-- 1. Creamos la base de datos definiendo el idioma de una vez
CREATE DATABASE IF NOT EXISTS `SEproyectoNA`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- NOTA: poner "  ) ENGINE=InnoDB;  " al final de cada tabla. 

-- 2. Creacion de usuario y asignacion de contraseña
CREATE USER IF NOT EXISTS 'AhorrApp'@'localhost' IDENTIFIED BY 'Ah0rrApp_2026!';

-- 3. Asignacions de permisos al usuario creado para la base de datos
GRANT ALL PRIVILEGES ON `SEproyectoNA`.* TO 'AhorrApp'@'localhost';

-- 4. Entramos a la base de datos para empezar a crear tablas
USE `SEproyectoNA`;

-- 5. Aplicamos los privilegios
FLUSH PRIVILEGES;

-- NOTA: En caso de error usar el siguiente comando en el editor de MySQL 
-- SET GLOBAL log_bin_trust_function_creators = 1;
-- ELIMINAR EN PRODUCCION, solo es seguro durante el desarrollo.

-- ========================================================================
--     TABLA: usuarios
-- =========================================================================
CREATE TABLE IF NOT EXISTS USUARIOS (
    ID_usuario  INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del usuario',
    Nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del usuario',
    Apellido VARCHAR(100) COMMENT 'Apellido del usuario',
    Rol ENUM('Administrador','Usuario') NOT NULL DEFAULT 'Usuario' COMMENT 'Rol del usuario dentro del sistema',
    Password_hash VARCHAR(255) NOT NULL COMMENT 'Hash de la contraseña del usuario',
    Email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Correo electrónico principal',
    Activo BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indica si el usuario está activo o inactivo',
    Fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de registro del usuario'
) ENGINE=InnoDB;

-- 22222222222222222222222222
    
-- 22222222222222222222222222

-- NOTA: Validar formato de Email desde el backend.
--   CHECK (Email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')

-- ========================================================================
--     TABLA: categorias
-- =========================================================================
-- CREATE TABLE IF NOT EXISTS CATEGORIAS (
--     ID_categoria INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la categoría',
--     ID_usuario INT DEFAULT NULL COMMENT 'Usuario al que pertenece la categoría (NULL si es global)',
--     Nombre VARCHAR(50) NOT NULL COMMENT 'Nombre de la categoría financiera',
--     Color VARCHAR(7) DEFAULT '#000000' COMMENT 'Color representativo de la categoría (formato HEX)',
--     Icono VARCHAR(255) COMMENT 'Ruta o URL del icono de la categoría',
--     ES_global BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si la categoría es global (visible para todos los usuarios) o personalizada (visible solo para el usuario propietario)',
--     FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE ON UPDATE CASCADE
-- )ENGINE=InnoDB;

--categorias
CREATE TABLE categorias (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  activa      BOOLEAN DEFAULT true,
  sistema     BOOLEAN DEFAULT false,
  id_usuario  INT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- NOTA: Si ID_usuario es NULL y Es_global = TRUE, la categoría pertenece al sistema (visible para todos).
--       Si ID_usuario tiene valor, es una categoría personalizada del usuario.
-- NOTA: Validar formato HEX del Color desde el backend.
--       CHECK (Color REGEXP '^#[0-9A-Fa-f]{6}$')
 
 -- ALTER TABLE CATEGORIAS
    -- ADD COLUMN Descripcion VARCHAR(255) DEFAULT NULL AFTER Nombre,
    -- ADD COLUMN Activo BOOLEAN NOT NULL DEFAULT TRUE AFTER ES_global;

 -- ========================================================================
--     TABLA: dependientes
-- ========================================================================
-- CREATE TABLE IF NOT EXISTS DEPENDIENTES (
--     ID_dependientes  INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del dependiente',
--     ID_usuario INT NOT NULL COMMENT 'Usuario al que pertenece el dependiente',
--     Nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del dependiente',
--     Relacion VARCHAR(100) COMMENT 'Relación con el usuario',
--     Ocupacion VARCHAR(150) COMMENT 'Ocupación del dependiente',
--     Fecha_nacimiento DATE COMMENT 'Fecha de nacimiento del dependiente',
--     Peso_economico TINYINT NOT NULL DEFAULT 1 CHECK (Peso_economico BETWEEN 1 AND 5) COMMENT 'Valor relativo del peso económico del dependiente (1-5)',
--     FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE ON UPDATE CASCADE
-- )ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DEPENDIENTES (
    ID_dependientes INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del dependiente',
    ID_usuario INT NOT NULL COMMENT 'Usuario al que pertenece el dependiente',
    Nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del dependiente',
    Relacion VARCHAR(100) COMMENT 'Relación con el usuario',
    Ocupacion VARCHAR(150) COMMENT 'Ocupación del dependiente',
    Fecha_nacimiento DATE COMMENT 'Fecha de nacimiento del dependiente',
    
    -- Definición limpia del campo
    Peso_economico TINYINT NOT NULL DEFAULT 1 COMMENT 'Valor relativo del peso económico del dependiente (1-5)',
    
    -- Validación al final
    CONSTRAINT chk_peso_rango CHECK (Peso_economico BETWEEN 1 AND 5),
    
    -- Relación
    FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

 
-- NOTA: Peso_economico es un valor relativo del 1 al 5 que indica cuánto "pesa"
--       este dependiente en el cálculo de distribución del ingreso.
--       Ejemplo: usuario principal = 5, pareja = 3, hijo = 1.
--       El backend calcula: porcentaje = peso_dependiente / suma_total_pesos * 100
--       Esto permite distribución proporcional sin hardcodear porcentajes en la BD.


-- ========================================================================
-- Movimientos financieros
-- ========================================================================
CREATE TABLE IF NOT EXISTS MOVIMIENTOS (
    ID_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    ID_usuario INT NOT NULL,
    Tipo_Flujo ENUM('Entrada', 'Salida') NOT NULL COMMENT '1=Ingreso/Entrada, 2=Egreso/Salida',    
    Subtipo_Modulo ENUM('Ahorro', 'Ingreso', 'Gasto', 'Deuda', 'Imprevisto') NOT NULL,
    FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- NOTA: Lógica de filtro en el backend:
--   Entrada  → Subtipo: Ahorro | Ingreso
--   Salida   → Subtipo: Gasto  | Deuda  | Imprevisto
-- NOTA: Tipo_Flujo y Subtipo_Modulo son consistentes entre sí.
--       El backend debe validar esta coherencia antes de insertar.

-- ========================================================================
--     ENTRADA: Ahorros & Ingresos
-- ========================================================================
CREATE TABLE IF NOT EXISTS ENTRADA (
    ID_entrada INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la entrada',
    ID_movimiento INT NOT NULL COMMENT 'Movimiento asociado a la entrada',
    FOREIGN KEY (ID_movimiento) REFERENCES MOVIMIENTOS(ID_movimiento) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;

-- CREATE TABLE IF NOT EXISTS AHORROS (
--     ID_ahorros INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del ahorro',
--     ID_entrada INT DEFAULT NULL COMMENT 'Tabla de entrada financiera asociada al ahorro',
--     ID_categoria INT COMMENT 'Categoría asociada al ahorro',
--     Monto DECIMAL(15,2) NOT NULL CHECK (Monto >= 0) COMMENT 'Monto del ahorro',
--     Monto_acumulado DECIMAL(15,2) NOT NULL DEFAULT 0.00  COMMENT 'Monto acumulado hasta el momento, actualizado desde el backend',
--     Descripcion VARCHAR(255) COMMENT 'Descripción del ahorro',
--     Meta VARCHAR(100) COMMENT 'Meta u objetivo del ahorro',
--     Fecha_registro DATE DEFAULT (CURRENT_DATE) COMMENT 'Fecha de registro del ahorro',
--     Fecha_meta DATE CHECK (Fecha_meta IS NULL OR Fecha_meta >= Fecha_registro) COMMENT 'Fecha objetivo para cumplir la meta',
--     CHECK (Monto_acumulado >= 0),
--     FOREIGN KEY (ID_entrada) REFERENCES ENTRADA(ID_entrada) ON DELETE CASCADE ON UPDATE CASCADE,
--     FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE
-- )ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AHORROS (
    ID_ahorros INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del ahorro',
    ID_entrada INT DEFAULT NULL COMMENT 'Tabla de entrada financiera asociada al ahorro',
    ID_categoria INT COMMENT 'Categoría asociada al ahorro',
    Monto DECIMAL(15,2) NOT NULL COMMENT 'Monto del ahorro',
    Monto_acumulado DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Monto acumulado hasta el momento, actualizado desde el backend',
    Descripcion VARCHAR(255) COMMENT 'Descripción del ahorro',
    Meta VARCHAR(100) COMMENT 'Meta u objetivo del ahorro',
    Fecha_registro DATE DEFAULT (CURRENT_DATE) COMMENT 'Fecha de registro del ahorro',
    Fecha_meta DATE DEFAULT NULL COMMENT 'Fecha objetivo para cumplir la meta',
    
    -- Validaciones (CHECKs) movidas al final para evitar el error 1064
    CONSTRAINT chk_monto CHECK (Monto >= 0),
    CONSTRAINT chk_acumulado CHECK (Monto_acumulado >= 0),
    CONSTRAINT chk_fechas CHECK (Fecha_meta IS NULL OR Fecha_meta >= Fecha_registro),
    
    -- Relaciones
    FOREIGN KEY (ID_entrada) REFERENCES ENTRADA(ID_entrada) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;


-- NOTA: Monto_acumulado se actualiza desde el backend cada vez que se hace un abono al ahorro.
--       Progreso = (Monto_acumulado / Monto) * 100

-- CREATE TABLE IF NOT EXISTS INGRESOS (
--     ID_ingresos INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del ingreso',
--     ID_entrada INT NOT NULL COMMENT 'Tabla de entrada financiera asociada al ingreso',
--     ID_categoria INT DEFAULT NULL COMMENT 'Categoría asociada al ingreso',
--     Monto DECIMAL(15,2) NOT NULL CHECK (Monto >= 0) COMMENT 'Monto del ingreso',
--     Descripcion VARCHAR(255) COMMENT 'Descripción del ingreso',
--     Fuente VARCHAR(150) COMMENT 'Fuente del ingreso',
--     Fecha_registro DATE DEFAULT (CURRENT_DATE) COMMENT 'Fecha de registro del ingreso',
--     FOREIGN KEY (ID_entrada) REFERENCES ENTRADA(ID_entrada) ON DELETE CASCADE ON UPDATE CASCADE,
--     FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE
-- )ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS INGRESOS (
    ID_ingresos INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del ingreso',
    ID_entrada INT NOT NULL COMMENT 'Tabla de entrada financiera asociada al ingreso',
    ID_categoria INT DEFAULT NULL COMMENT 'Categoría asociada al ingreso',
    Monto DECIMAL(15,2) NOT NULL COMMENT 'Monto del ingreso',
    Descripcion VARCHAR(255) COMMENT 'Descripción del ingreso',
    Fuente VARCHAR(150) COMMENT 'Fuente del ingreso',
    Fecha_registro DATE DEFAULT (CURRENT_DATE) COMMENT 'Fecha de registro del ingreso',
    
    -- Restricción de validación movida al final
    CONSTRAINT chk_monto_ingreso CHECK (Monto >= 0),
    
    -- Relaciones
    FOREIGN KEY (ID_entrada) REFERENCES ENTRADA(ID_entrada) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ========================================================================
--    SALIDA: Gastos, Imprevistos & Deudas
-- ========================================================================
CREATE TABLE IF NOT EXISTS SALIDA (
    ID_salida INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la salida',
    ID_movimiento INT NOT NULL COMMENT 'Movimiento asociado a la tabla de salida',
    FOREIGN KEY (ID_movimiento) REFERENCES MOVIMIENTOS(ID_movimiento) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;

-- CREATE TABLE IF NOT EXISTS GASTOS (
--     ID_gastos INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del gasto',
--     ID_salida INT NOT NULL COMMENT 'Tabla de salida financiera asociada al gasto',
--     ID_categoria INT DEFAULT NULL COMMENT 'Categoría asociada al gasto',
--     ID_dependiente INT DEFAULT NULL COMMENT 'Dependiente asociado al gasto (si aplica)',
--     Monto DECIMAL(15,2) NOT NULL CHECK (Monto >= 0) COMMENT 'Monto del gasto',
--     Descripcion VARCHAR(255) COMMENT 'Descripción del gasto',
--     Fecha_registro DATE DEFAULT (CURRENT_DATE) COMMENT 'Fecha de registro del gasto',
--     FOREIGN KEY (ID_salida) REFERENCES SALIDA(ID_salida) ON DELETE CASCADE ON UPDATE CASCADE,
--     FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE,
--     FOREIGN KEY (ID_dependiente) REFERENCES DEPENDIENTES(ID_dependientes) ON DELETE SET NULL ON UPDATE CASCADE
-- )ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS GASTOS (
    ID_gastos INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del gasto',
    ID_salida INT NOT NULL COMMENT 'Tabla de salida financiera asociada al gasto',
    ID_categoria INT DEFAULT NULL COMMENT 'Categoría asociada al gasto',
    ID_dependiente INT DEFAULT NULL COMMENT 'Dependiente asociado al gasto (si aplica)',
    Monto DECIMAL(15,2) NOT NULL COMMENT 'Monto del gasto',
    Descripcion VARCHAR(255) COMMENT 'Descripción del gasto',
    Fecha_registro DATE DEFAULT (CURRENT_DATE) COMMENT 'Fecha de registro del gasto',
    
    -- Validación movida al final
    CONSTRAINT chk_monto_gasto CHECK (Monto >= 0),
    
    -- Relaciones
    FOREIGN KEY (ID_salida) REFERENCES SALIDA(ID_salida) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (ID_dependiente) REFERENCES DEPENDIENTES(ID_dependientes) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;


-- CREATE TABLE IF NOT EXISTS IMPREVISTOS (
--     ID_imprevistos INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del imprevisto',
--     ID_salida INT NOT NULL COMMENT 'Tabla de salida financiera asociada al imprevisto',
--     ID_categoria INT DEFAULT NULL COMMENT 'Categoría asociada al imprevisto',
--     ID_dependiente INT DEFAULT NULL COMMENT 'Dependiente asociado al imprevisto (si aplica)',
--     Monto DECIMAL(15,2) NOT NULL CHECK (Monto >= 0) COMMENT 'Monto del imprevisto',
--     Causa VARCHAR(255) COMMENT 'Causa del gasto imprevisto',
--     Fecha_registro DATE DEFAULT (CURRENT_DATE) COMMENT 'Fecha de registro del imprevisto',
--     FOREIGN KEY (ID_salida) REFERENCES SALIDA(ID_salida) ON DELETE CASCADE ON UPDATE CASCADE,
--     FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE,
--     FOREIGN KEY (ID_dependiente) REFERENCES DEPENDIENTES(ID_dependientes) ON DELETE SET NULL ON UPDATE CASCADE
-- )ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS IMPREVISTOS (
    ID_imprevistos INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del imprevisto',
    ID_salida INT NOT NULL COMMENT 'Tabla de salida financiera asociada al imprevisto',
    ID_categoria INT DEFAULT NULL COMMENT 'Categoría asociada al imprevisto',
    ID_dependiente INT DEFAULT NULL COMMENT 'Dependiente asociado al imprevisto (si aplica)',
    Monto DECIMAL(15,2) NOT NULL COMMENT 'Monto del imprevisto',
    Causa VARCHAR(255) COMMENT 'Causa del gasto imprevisto',
    Fecha_registro DATE DEFAULT (CURRENT_DATE) COMMENT 'Fecha de registro del imprevisto',
    
    -- Validación movida al final
    CONSTRAINT chk_monto_imprevisto CHECK (Monto >= 0),
    
    -- Relaciones
    FOREIGN KEY (ID_salida) REFERENCES SALIDA(ID_salida) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (ID_dependiente) REFERENCES DEPENDIENTES(ID_dependientes) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;


-- CREATE TABLE IF NOT EXISTS DEUDAS (
--     ID_deudas INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la deuda',
--     ID_salida INT NOT NULL COMMENT 'Tabla de salida financiera asociada a la deuda',
--     ID_categoria INT DEFAULT NULL COMMENT 'Categoría asociada a la deuda',
--     Monto DECIMAL(15,2) NOT NULL CHECK (Monto >= 0) COMMENT 'Monto de la deuda',
--     Fuente VARCHAR(150) NOT NULL COMMENT 'Fuente de la deuda',
--     Descripcion VARCHAR(255) COMMENT 'Descripción de la deuda',
--     Cuotas_total INT DEFAULT NULL CHECK (Cuotas_total IS NULL OR Cuotas_total > 0),
--     Cuotas_pagadas INT NOT NULL DEFAULT 0 CHECK (Cuotas_pagadas >= 0),
--     Fecha_inicio DATE COMMENT 'Fecha de inicio de la deuda',
--     Fecha_fin DATE CHECK (Fecha_fin IS NULL OR Fecha_fin >= Fecha_inicio) COMMENT 'Fecha de finalización de la deuda',
--     Estado ENUM('pendiente', 'pagada') NOT NULL DEFAULT 'pendiente'COMMENT 'Estado actual de la deuda',
--     CHECK (Cuotas_pagadas IS NULL OR Cuotas_total IS NULL OR Cuotas_pagadas <= Cuotas_total),
--     FOREIGN KEY (ID_salida) REFERENCES SALIDA(ID_salida) ON DELETE CASCADE ON UPDATE CASCADE,
--     FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE
-- )ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DEUDAS (
    ID_deudas INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la deuda',
    ID_salida INT NOT NULL COMMENT 'Tabla de salida financiera asociada a la deuda',
    ID_categoria INT DEFAULT NULL COMMENT 'Categoría asociada a la deuda',
    Monto DECIMAL(15,2) NOT NULL COMMENT 'Monto de la deuda',
    Fuente VARCHAR(150) NOT NULL COMMENT 'Fuente de la deuda',
    Descripcion VARCHAR(255) COMMENT 'Descripción de la deuda',
    Cuotas_total INT DEFAULT NULL COMMENT 'Total de cuotas',
    Cuotas_pagadas INT NOT NULL DEFAULT 0 COMMENT 'Cuotas ya pagadas',
    Fecha_inicio DATE COMMENT 'Fecha de inicio de la deuda',
    Fecha_fin DATE COMMENT 'Fecha de finalización de la deuda',
    Estado ENUM('pendiente', 'pagada') NOT NULL DEFAULT 'pendiente' COMMENT 'Estado actual de la deuda',
    
    -- Validaciones (CHECKs) consolidadas al final
    CONSTRAINT chk_monto_deuda CHECK (Monto >= 0),
    CONSTRAINT chk_cuotas_total CHECK (Cuotas_total IS NULL OR Cuotas_total > 0),
    CONSTRAINT chk_cuotas_pagadas CHECK (Cuotas_pagadas >= 0),
    CONSTRAINT chk_fechas_deuda CHECK (Fecha_fin IS NULL OR Fecha_fin >= Fecha_inicio),
    CONSTRAINT chk_logica_cuotas CHECK (Cuotas_total IS NULL OR Cuotas_pagadas <= Cuotas_total),
    
    -- Relaciones
    FOREIGN KEY (ID_salida) REFERENCES SALIDA(ID_salida) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ID_categoria) REFERENCES CATEGORIAS(ID_categoria) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;


-- NOTA: Si Cuotas_total IS NULL, la deuda no es en cuotas (pago único).
--       Progreso = (Cuotas_pagadas / Cuotas_total) * 100




-- ========================================================================
--  TABLA: presupuestos  
-- ========================================================================
-- CREATE TABLE IF NOT EXISTS PRESUPUESTOS (
--     ID_presupuesto INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del presupuesto',
--     ID_usuario INT NOT NULL UNIQUE COMMENT 'Usuario al que pertenece el presupuesto',
--     Dia_corte TINYINT NOT NULL DEFAULT 1 CHECK (Dia_corte BETWEEN 1 AND 28) COMMENT 'Día de corte para el presupuesto, limitado al 28 para evitar problemas con febrero',
--     Porcentaje_gastos DECIMAL(5,2) NOT NULL DEFAULT 40.00 COMMENT 'Porcentaje del presupuesto destinado a gastos',
--     Porcentaje_deudas DECIMAL(5,2) NOT NULL DEFAULT 20.00 COMMENT 'Porcentaje del presupuesto destinado a deudas',
--     Porcentaje_imprevistos DECIMAL(5,2) NOT NULL DEFAULT 15.00 COMMENT 'Porcentaje del presupuesto destinado a imprevistos',
--     Porcentaje_ahorros DECIMAL(5,2) NOT NULL DEFAULT 10.00 COMMENT 'Porcentaje del presupuesto destinado a ahorros',
--     Porcentaje_emergencia DECIMAL(5,2) NOT NULL DEFAULT 15.00 COMMENT 'Porcentaje del presupuesto destinado a emergencia',
--     Fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CHECK ( ROUND(Porcentaje_gastos + Porcentaje_deudas + Porcentaje_imprevistos + Porcentaje_ahorros + Porcentaje_emergencia, 2) = 100.00),
--     FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE ON UPDATE CASCADE
-- ) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS PRESUPUESTOS (
    ID_presupuesto INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del presupuesto',
    ID_usuario INT NOT NULL UNIQUE COMMENT 'Usuario al que pertenece el presupuesto',
    Dia_corte TINYINT NOT NULL DEFAULT 1 COMMENT 'Día de corte (1-28)',
    
    Porcentaje_gastos DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    Porcentaje_deudas DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    Porcentaje_imprevistos DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    Porcentaje_ahorros DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    Porcentaje_emergencia DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    
    Fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Validaciones compatibles
    CONSTRAINT chk_dia_corte CHECK (Dia_corte BETWEEN 1 AND 28),
    
    -- Relación
    FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- NOTA: El CHECK de suma = 100 lo valida la BD, pero también validar desde el backend
--       antes de insertar para dar un mensaje de error claro al usuario.
-- NOTA: Los defaults suman 100: 40 + 20 + 15 + 10 + 15 = 100.


-- ========================================================================
--  TABLA: periodos_presupuesto
-- ========================================================================
-- CREATE TABLE IF NOT EXISTS PERIODOS_PRESUPUESTO (
--     ID_periodo INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del período de presupuesto' ,
--     ID_presupuesto INT NOT NULL COMMENT 'Presupuesto al que corresponde este período',
--     ID_usuario INT NOT NULL COMMENT 'Usuario al que corresponde este período',
--     Fecha_inicio DATE NOT NULL COMMENT 'Fecha de inicio del período',
--     Fecha_fin DATE NOT NULL CHECK (Fecha_fin > Fecha_inicio) COMMENT 'Fecha de fin del período',
--     Ingreso_total DECIMAL(15,2) NOT NULL CHECK (Ingreso_total >= 0) COMMENT 'Ingreso total del período, calculado al inicio según los ingresos registrados y dependientes activos',
--     Monto_gastos DECIMAL(15,2) NOT NULL CHECK (Monto_gastos >= 0) COMMENT 'Monto destinado a gastos',
--     Monto_deudas DECIMAL(15,2) NOT NULL CHECK (Monto_deudas >= 0) COMMENT 'Monto destinado a deudas',
--     Monto_imprevistos DECIMAL(15,2) NOT NULL CHECK (Monto_imprevistos >= 0) COMMENT 'Monto destinado a imprevistos',
--     Monto_ahorros DECIMAL(15,2) NOT NULL CHECK (Monto_ahorros >= 0) COMMENT 'Monto destinado a ahorros',
--     Monto_emergencia DECIMAL(15,2) NOT NULL CHECK (Monto_emergencia >= 0) COMMENT 'Monto destinado a emergencia',
--     FOREIGN KEY (ID_presupuesto) REFERENCES PRESUPUESTOS(ID_presupuesto) ON DELETE RESTRICT ON UPDATE CASCADE,
--     FOREIGN KEY (ID_usuario)     REFERENCES USUARIOS(ID_usuario)         ON DELETE CASCADE ON UPDATE CASCADE
-- ) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS PERIODOS_PRESUPUESTO (
    ID_periodo INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del período',
    ID_presupuesto INT NOT NULL COMMENT 'Presupuesto al que corresponde',
    ID_usuario INT NOT NULL COMMENT 'Usuario al que corresponde',
    Fecha_inicio DATE NOT NULL COMMENT 'Fecha de inicio del período',
    Fecha_fin DATE NOT NULL COMMENT 'Fecha de fin del período',
    Ingreso_total DECIMAL(15,2) NOT NULL COMMENT 'Ingreso total calculado',
    Monto_gastos DECIMAL(15,2) NOT NULL COMMENT 'Destinado a gastos',
    Monto_deudas DECIMAL(15,2) NOT NULL COMMENT 'Destinado a deudas',
    Monto_imprevistos DECIMAL(15,2) NOT NULL COMMENT 'Destinado a imprevistos',
    Monto_ahorros DECIMAL(15,2) NOT NULL COMMENT 'Destinado a ahorros',
    Monto_emergencia DECIMAL(15,2) NOT NULL COMMENT 'Destinado a emergencia',
    
    -- Validaciones (CHECKs) al final para evitar error 1064
    CONSTRAINT chk_periodo_fechas CHECK (Fecha_fin > Fecha_inicio),
    CONSTRAINT chk_ingreso_pos CHECK (Ingreso_total >= 0),
    CONSTRAINT chk_gastos_pos CHECK (Monto_gastos >= 0),
    CONSTRAINT chk_deudas_pos CHECK (Monto_deudas >= 0),
    CONSTRAINT chk_imprevistos_pos CHECK (Monto_imprevistos >= 0),
    CONSTRAINT chk_ahorros_pos CHECK (Monto_ahorros >= 0),
    CONSTRAINT chk_emergencia_pos CHECK (Monto_emergencia >= 0),
    
    -- Relaciones
    FOREIGN KEY (ID_presupuesto) REFERENCES PRESUPUESTOS(ID_presupuesto) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- NOTA: Los montos son el resultado de aplicar los porcentajes sobre Ingreso_total
--       en el momento en que se genera el período. Se guardan como valores absolutos
--       para que si el usuario cambia los porcentajes después, el historial no se altere.
-- NOTA: ON DELETE RESTRICT en ID_presupuesto evita borrar una configuración
--       que ya tiene períodos calculados asociados.
-- NOTA: El backend genera un registro aquí cada vez que inicia un nuevo período
--       (según Dia_corte) y registra la acción en HISTORIAL.


-- ========================================================================
--     TABLA: historial
-- ========================================================================
CREATE TABLE IF NOT EXISTS HISTORIAL (
    ID_historial INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del historial',
    ID_usuario INT NOT NULL COMMENT 'Usuario que realizó la acción',
    accion VARCHAR(200) NOT NULL COMMENT 'Acción realizada por el usuario',
    detalles TEXT COMMENT 'Detalles adicionales de la acción',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del registro',
    FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;

-- ========================================================================
--     TABLA: notificaciones
-- ========================================================================
CREATE TABLE IF NOT EXISTS NOTIFICACIONES (
    ID_notificacion INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la notificación',
    ID_usuario INT NOT NULL COMMENT 'Usuario destinatario de la notificación',
    ID_historial INT DEFAULT NULL COMMENT 'Historial relacionado con la notificación',
    Tipo ENUM('sistema','recordatorio','sugerencia','alerta_presupuesto') NOT NULL COMMENT 'Tipo de notificación',
    Entidad_tipo VARCHAR(50) DEFAULT NULL,
    Entidad_id INT DEFAULT NULL,
    Mensaje TEXT NOT NULL COMMENT 'Contenido de la notificación',
    Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la notificación',
    Leida BOOLEAN DEFAULT FALSE COMMENT 'Indica si la notificación fue leída',
    FOREIGN KEY (ID_usuario) REFERENCES USUARIOS(ID_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ID_historial) REFERENCES HISTORIAL(ID_historial) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;

--categorias
CREATE TABLE categorias (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  activa      BOOLEAN DEFAULT true,
  sistema     BOOLEAN DEFAULT false,
  id_usuario  INT, NULL
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
)


 
-- NOTA: ID_historial ahora es opcional (NULL) para permitir notificaciones del sistema o de bienvenida que no están asociadas a ninguna acción del usuario.
-- NOTA: Se agregó el tipo 'alerta_presupuesto' para notificaciones disparadas por PRESUPUESTOS.

-- NOTA: Entidad_tipo y Entidad_id forman una referencia polimórfica.
--       No tienen FK — la integridad la maneja el backend.
--       Valores esperados para Entidad_tipo:
--         'presupuesto' → Entidad_id = ID_presupuesto
--         'deuda'       → Entidad_id = ID_deudas
--         'ahorro'      → Entidad_id = ID_ahorros
--       Si la notificación no está ligada a ningún registro específico, ambos campos quedan en NULL.