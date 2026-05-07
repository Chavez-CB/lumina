-- ============================================================
--  LUMINA — Base de Datos
--  Sistema de Control de Asistencia con Reconocimiento Facial
--  Motor: MySQL 8+ / MariaDB 10.6+
--  Generado para el proyecto: github.com/Chavez-CB/lumina
-- ============================================================

CREATE DATABASE IF NOT EXISTS lumina_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lumina_db;

-- ============================================================
-- 1. ROLES (perfiles de acceso)
-- ============================================================
CREATE TABLE roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50)  NOT NULL UNIQUE,   -- 'superadmin', 'admin', 'docente', 'alumno'
  descripcion VARCHAR(200),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO roles (nombre, descripcion) VALUES
  ('superadmin', 'Acceso total al sistema'),
  ('admin',      'Gestión de personas, horarios y reportes'),
  ('docente',    'Visualiza asistencia de sus grupos'),
  ('alumno',     'Consulta su propio registro de asistencia');

-- ============================================================
-- 2. ADMINISTRADORES / USUARIOS DEL SISTEMA
-- ============================================================
CREATE TABLE usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rol_id         INT UNSIGNED NOT NULL,
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,            -- bcrypt / argon2
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acceso  DATETIME,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- Usuario demo (contraseña: admin123 — solo para desarrollo)
INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash) VALUES
  (1, 'Super', 'Admin',    'superadmin@lumina.app', '$2b$10$PLACEHOLDER_HASH_SUPERADMIN'),
  (2, 'Carlos', 'Chávez',  'admin@lumina.app',      '$2b$10$PLACEHOLDER_HASH_ADMIN');

-- ============================================================
-- 3. ÁREAS / AULAS
-- ============================================================
CREATE TABLE areas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20)  NOT NULL UNIQUE,   -- 'AULA-101', 'LAB-A'
  nombre      VARCHAR(100) NOT NULL,
  tipo        ENUM('aula','laboratorio','auditorio','sala','otro') NOT NULL DEFAULT 'aula',
  capacidad   SMALLINT UNSIGNED,
  piso        TINYINT,
  descripcion VARCHAR(300),
  activo      TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO areas (codigo, nombre, tipo, capacidad, piso) VALUES
  ('AULA-101', 'Aula 101',        'aula',        35, 1),
  ('AULA-102', 'Aula 102',        'aula',        35, 1),
  ('LAB-A',    'Laboratorio A',   'laboratorio', 25, 2),
  ('AUD-1',    'Auditorio Ppal.', 'auditorio',  200, 1);

-- ============================================================
-- 4. PERSONAS (empleados / alumnos registrados)
-- ============================================================
CREATE TABLE personas (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo                ENUM('empleado','alumno','visitante') NOT NULL DEFAULT 'alumno',
  codigo              VARCHAR(30)  UNIQUE,           -- código de empleado o matrícula
  nombres             VARCHAR(100) NOT NULL,
  apellidos           VARCHAR(100) NOT NULL,
  dni                 VARCHAR(20)  UNIQUE,
  email               VARCHAR(150) UNIQUE,
  telefono            VARCHAR(20),
  foto_url            VARCHAR(500),                  -- ruta de imagen de perfil
  descriptor_facial   JSON,                          -- embedding del reconocimiento facial (array float)
  activo              TINYINT(1)   NOT NULL DEFAULT 1,
  usuario_id          INT UNSIGNED,                  -- si tiene cuenta en el sistema
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_persona_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO personas (tipo, codigo, nombres, apellidos, dni, email) VALUES
  ('empleado', 'EMP-001', 'Ana',     'García López',    '71234001', 'ana.garcia@lumina.app'),
  ('empleado', 'EMP-002', 'Luis',    'Pérez Salas',     '71234002', 'luis.perez@lumina.app'),
  ('alumno',   'ALU-001', 'María',   'Torres Quispe',   '72000101', 'maria.torres@lumina.app'),
  ('alumno',   'ALU-002', 'José',    'Ruiz Mendoza',    '72000102', 'jose.ruiz@lumina.app'),
  ('alumno',   'ALU-003', 'Lucía',   'Vargas Castro',   '72000103', 'lucia.vargas@lumina.app');

-- ============================================================
-- 5. HORARIOS / TURNOS
-- ============================================================
CREATE TABLE horarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,             -- 'Turno Mañana', 'Clase Lunes 7am'
  area_id         INT UNSIGNED NOT NULL,
  responsable_id  INT UNSIGNED,                      -- persona (docente/empleado)
  dia_semana      SET('lun','mar','mie','jue','vie','sab','dom') NOT NULL,
  hora_inicio     TIME NOT NULL,
  hora_fin        TIME NOT NULL,
  tolerancia_min  TINYINT UNSIGNED NOT NULL DEFAULT 10,  -- minutos de gracia
  fecha_desde     DATE,
  fecha_hasta     DATE,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_horario_area        FOREIGN KEY (area_id)        REFERENCES areas(id),
  CONSTRAINT fk_horario_responsable FOREIGN KEY (responsable_id) REFERENCES personas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO horarios (nombre, area_id, responsable_id, dia_semana, hora_inicio, hora_fin, tolerancia_min, fecha_desde) VALUES
  ('Turno Mañana - Aula 101',  1, 1, 'lun,mar,mie,jue,vie', '07:00:00', '13:00:00', 10, '2025-03-01'),
  ('Turno Tarde - Aula 102',   2, 2, 'lun,mar,mie,jue,vie', '13:00:00', '19:00:00', 10, '2025-03-01'),
  ('Lab Cómputo - Mañana',     3, 1, 'mar,jue',             '09:00:00', '11:00:00',  5, '2025-03-01');

-- ============================================================
-- 6. ASIGNACIONES — qué personas pertenecen a qué horario
-- ============================================================
CREATE TABLE asignaciones (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  horario_id  INT UNSIGNED NOT NULL,
  persona_id  INT UNSIGNED NOT NULL,
  fecha_desde DATE,
  fecha_hasta DATE,
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asignacion (horario_id, persona_id),
  CONSTRAINT fk_asign_horario FOREIGN KEY (horario_id) REFERENCES horarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_asign_persona FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO asignaciones (horario_id, persona_id) VALUES
  (1, 3), (1, 4),   -- ALU-001, ALU-002 → Turno Mañana
  (2, 5),           -- ALU-003 → Turno Tarde
  (3, 3), (3, 5);   -- ALU-001, ALU-003 → Lab Cómputo

-- ============================================================
-- 7. REGISTROS DE ASISTENCIA
-- ============================================================
CREATE TABLE asistencias (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  persona_id        INT UNSIGNED  NOT NULL,
  horario_id        INT UNSIGNED  NOT NULL,
  area_id           INT UNSIGNED  NOT NULL,
  fecha             DATE          NOT NULL,
  hora_entrada      DATETIME,
  hora_salida       DATETIME,
  estado            ENUM('presente','tardanza','ausente','justificado') NOT NULL DEFAULT 'ausente',
  metodo_registro   ENUM('facial','manual','qr','rfid') NOT NULL DEFAULT 'facial',
  confianza_facial  DECIMAL(5,4),                    -- score del reconocimiento (0.0000 – 1.0000)
  observacion       VARCHAR(500),
  registrado_por    INT UNSIGNED,                    -- usuario que hizo el registro manual
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asistencia_dia (persona_id, horario_id, fecha),
  CONSTRAINT fk_asist_persona   FOREIGN KEY (persona_id)     REFERENCES personas(id),
  CONSTRAINT fk_asist_horario   FOREIGN KEY (horario_id)     REFERENCES horarios(id),
  CONSTRAINT fk_asist_area      FOREIGN KEY (area_id)        REFERENCES areas(id),
  CONSTRAINT fk_asist_registra  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO asistencias (persona_id, horario_id, area_id, fecha, hora_entrada, estado, metodo_registro, confianza_facial) VALUES
  (3, 1, 1, '2025-05-01', '2025-05-01 07:05:00', 'presente',  'facial', 0.9821),
  (4, 1, 1, '2025-05-01', '2025-05-01 07:18:00', 'tardanza',  'facial', 0.9654),
  (5, 2, 2, '2025-05-01', '2025-05-01 13:02:00', 'presente',  'facial', 0.9901),
  (3, 1, 1, '2025-05-02', NULL,                  'ausente',   'facial', NULL),
  (4, 1, 1, '2025-05-02', '2025-05-02 07:03:00', 'presente',  'facial', 0.9789);

-- ============================================================
-- 8. JUSTIFICACIONES DE INASISTENCIA
-- ============================================================
CREATE TABLE justificaciones (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asistencia_id  INT UNSIGNED  NOT NULL UNIQUE,
  persona_id     INT UNSIGNED  NOT NULL,
  motivo         VARCHAR(500)  NOT NULL,
  documento_url  VARCHAR(500),                       -- ruta del documento adjunto
  estado         ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  revisado_por   INT UNSIGNED,
  revisado_en    DATETIME,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_justif_asist    FOREIGN KEY (asistencia_id) REFERENCES asistencias(id) ON DELETE CASCADE,
  CONSTRAINT fk_justif_persona  FOREIGN KEY (persona_id)    REFERENCES personas(id),
  CONSTRAINT fk_justif_revisor  FOREIGN KEY (revisado_por)  REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 9. LOG DE RECONOCIMIENTO FACIAL (auditoría de intentos)
-- ============================================================
CREATE TABLE log_reconocimiento (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  area_id          INT UNSIGNED,
  persona_id       INT UNSIGNED,                     -- NULL si no fue identificado
  fecha_hora       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confianza        DECIMAL(5,4),
  resultado        ENUM('identificado','desconocido','error') NOT NULL,
  snapshot_url     VARCHAR(500),                     -- foto tomada en el momento
  ip_dispositivo   VARCHAR(45),
  CONSTRAINT fk_log_area    FOREIGN KEY (area_id)    REFERENCES areas(id) ON DELETE SET NULL,
  CONSTRAINT fk_log_persona FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 10. ÍNDICES ADICIONALES (rendimiento)
-- ============================================================
CREATE INDEX idx_asist_fecha        ON asistencias (fecha);
CREATE INDEX idx_asist_persona_mes  ON asistencias (persona_id, fecha);
CREATE INDEX idx_asist_estado       ON asistencias (estado);
CREATE INDEX idx_log_fecha          ON log_reconocimiento (fecha_hora);
CREATE INDEX idx_log_persona        ON log_reconocimiento (persona_id);
CREATE INDEX idx_personas_tipo      ON personas (tipo, activo);

-- ============================================================
-- 11. VISTA: RESUMEN DE ASISTENCIA POR PERSONA Y MES
-- ============================================================
CREATE OR REPLACE VIEW v_resumen_asistencia AS
SELECT
  p.id                            AS persona_id,
  CONCAT(p.nombres, ' ', p.apellidos) AS persona,
  p.tipo,
  DATE_FORMAT(a.fecha, '%Y-%m')   AS mes,
  COUNT(*)                        AS total_dias,
  SUM(a.estado = 'presente')      AS presentes,
  SUM(a.estado = 'tardanza')      AS tardanzas,
  SUM(a.estado = 'ausente')       AS ausentes,
  SUM(a.estado = 'justificado')   AS justificados,
  ROUND(SUM(a.estado IN ('presente','tardanza','justificado')) / COUNT(*) * 100, 1) AS pct_asistencia
FROM asistencias a
JOIN personas    p ON p.id = a.persona_id
GROUP BY p.id, mes;

-- ============================================================
-- 12. VISTA: KPIs DIARIOS (para el Dashboard)
-- ============================================================
CREATE OR REPLACE VIEW v_kpi_diario AS
SELECT
  a.fecha,
  COUNT(DISTINCT a.persona_id)                            AS total_registros,
  SUM(a.estado = 'presente')                              AS presentes,
  SUM(a.estado = 'tardanza')                              AS tardanzas,
  SUM(a.estado = 'ausente')                               AS ausentes,
  ROUND(AVG(a.confianza_facial) * 100, 1)                AS promedio_confianza_pct
FROM asistencias a
GROUP BY a.fecha
ORDER BY a.fecha DESC;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================