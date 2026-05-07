-- ============================================================
--  LUMINA — Base de Datos (corregida)
--  Sistema de Control de Asistencia con Reconocimiento Facial
--  Motor: MySQL 8+ / MariaDB 10.6+
-- ============================================================

CREATE DATABASE IF NOT EXISTS lumina_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lumina_db;

-- ============================================================
-- 1. ADMIN
-- ============================================================
CREATE TABLE admin (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acceso  DATETIME,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO admin (nombre, apellido, email, password_hash) VALUES
  ('Carlos', 'Chávez', 'admin@lumina.app', '$2b$10$PLACEHOLDER_HASH_ADMIN');

-- ============================================================
-- 2. ÁREAS / AULAS
-- ============================================================
CREATE TABLE areas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20)  NOT NULL UNIQUE,
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
-- 3. PERSONAS
-- ============================================================
CREATE TABLE personas (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo                ENUM('empleado','alumno','visitante') NOT NULL DEFAULT 'alumno',
  codigo              VARCHAR(30) UNIQUE,
  nombres             VARCHAR(100) NOT NULL,
  apellidos           VARCHAR(100) NOT NULL,
  dni                 VARCHAR(20) UNIQUE,
  email               VARCHAR(150) UNIQUE,
  telefono            VARCHAR(20),
  foto_url            VARCHAR(500),
  descriptor_facial   JSON,
  activo              TINYINT(1) NOT NULL DEFAULT 1,
  admin_id            INT UNSIGNED,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_persona_admin FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO personas (tipo, codigo, nombres, apellidos, dni, email, admin_id) VALUES
  ('empleado', 'EMP-001', 'Ana',     'García López',    '71234001', 'ana.garcia@lumina.app', 1),
  ('empleado', 'EMP-002', 'Luis',    'Pérez Salas',     '71234002', 'luis.perez@lumina.app', 1),
  ('alumno',   'ALU-001', 'María',   'Torres Quispe',   '72000101', 'maria.torres@lumina.app', 1),
  ('alumno',   'ALU-002', 'José',    'Ruiz Mendoza',    '72000102', 'jose.ruiz@lumina.app', 1),
  ('alumno',   'ALU-003', 'Lucía',   'Vargas Castro',   '72000103', 'lucia.vargas@lumina.app', 1);

-- ============================================================
-- 4. HORARIOS / TURNOS
-- ============================================================
CREATE TABLE horarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  area_id         INT UNSIGNED NOT NULL,
  responsable_id  INT UNSIGNED,
  dia_semana      SET('lun','mar','mie','jue','vie','sab','dom') NOT NULL,
  hora_inicio     TIME NOT NULL,
  hora_fin        TIME NOT NULL,
  tolerancia_min  TINYINT UNSIGNED NOT NULL DEFAULT 10,
  fecha_desde     DATE,
  fecha_hasta     DATE,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_horario_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT fk_horario_responsable FOREIGN KEY (responsable_id) REFERENCES personas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO horarios (nombre, area_id, responsable_id, dia_semana, hora_inicio, hora_fin, tolerancia_min, fecha_desde) VALUES
  ('Turno Mañana - Aula 101',  1, 1, 'lun,mar,mie,jue,vie', '07:00:00', '13:00:00', 10, '2025-03-01'),
  ('Turno Tarde - Aula 102',   2, 2, 'lun,mar,mie,jue,vie', '13:00:00', '19:00:00', 10, '2025-03-01'),
  ('Lab Cómputo - Mañana',     3, 1, 'mar,jue',             '09:00:00', '11:00:00',  5, '2025-03-01');

-- ============================================================
-- 5. ASIGNACIONES
-- ============================================================
CREATE TABLE asignaciones (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  horario_id  INT UNSIGNED NOT NULL,
  persona_id  INT UNSIGNED NOT NULL,
  fecha_desde DATE,
  fecha_hasta DATE,
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asignacion (horario_id, persona_id),
  CONSTRAINT fk_asign_horario FOREIGN KEY (horario_id) REFERENCES horarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_asign_persona FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO asignaciones (horario_id, persona_id) VALUES
  (1, 3), (1, 4),
  (2, 5),
  (3, 3), (3, 5);

-- ============================================================
-- 6. ASISTENCIAS
-- ============================================================
CREATE TABLE asistencias (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  persona_id        INT UNSIGNED NOT NULL,
  horario_id        INT UNSIGNED NOT NULL,
  area_id           INT UNSIGNED NOT NULL,
  fecha             DATE NOT NULL,
  hora_entrada      DATETIME,
  hora_salida       DATETIME,
  estado            ENUM('presente','tardanza','ausente','justificado') NOT NULL DEFAULT 'ausente',
  metodo_registro   ENUM('facial','manual','qr','rfid') NOT NULL DEFAULT 'facial',
  confianza_facial  DECIMAL(5,4),
  observacion       VARCHAR(500),
  registrado_por    INT UNSIGNED,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asistencia_dia (persona_id, horario_id, fecha),
  CONSTRAINT fk_asist_persona FOREIGN KEY (persona_id) REFERENCES personas(id),
  CONSTRAINT fk_asist_horario FOREIGN KEY (horario_id) REFERENCES horarios(id),
  CONSTRAINT fk_asist_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT fk_asist_registra FOREIGN KEY (registrado_por) REFERENCES admin(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO asistencias (persona_id, horario_id, area_id, fecha, hora_entrada, estado, metodo_registro, confianza_facial, registrado_por) VALUES
  (3, 1, 1, '2025-05-01', '2025-05-01 07:05:00', 'presente',  'facial', 0.9821, 1),
  (4, 1, 1, '2025-05-01', '2025-05-01 07:18:00', 'tardanza',  'facial', 0.9654, 1),
  (5, 2, 2, '2025-05-01', '2025-05-01 13:02:00', 'presente',  'facial', 0.9901, 1),
  (3, 1, 1, '2025-05-02', NULL,                  'ausente',   'facial', NULL, 1),
  (4, 1, 1, '2025-05-02', '2025-05-02 07:03:00', 'presente',  'facial', 0.9789, 1);

-- ============================================================
-- 7. JUSTIFICACIONES
-- ============================================================
CREATE TABLE justificaciones (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asistencia_id  INT UNSIGNED NOT NULL UNIQUE,
  persona_id     INT UNSIGNED NOT NULL,
  motivo         VARCHAR(500) NOT NULL,
  documento_url  VARCHAR(500),
  estado         ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  revisado_por   INT UNSIGNED,
  revisado_en    DATETIME,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_justif_asist FOREIGN KEY (asistencia_id) REFERENCES asistencias(id) ON DELETE CASCADE,
  CONSTRAINT fk_justif_persona FOREIGN KEY (persona_id) REFERENCES personas(id),
  CONSTRAINT fk_justif_revisor FOREIGN KEY (revisado_por) REFERENCES admin(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE log_reconocimiento (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id            INT UNSIGNED NULL,
    persona_id          INT UNSIGNED NULL, -- Más genérico que empleado_id
    area_id             INT UNSIGNED NULL, -- Para saber en qué aula ocurrió
    endpoint            VARCHAR(20)  NOT NULL,
    metodo              VARCHAR(10)  NOT NULL DEFAULT 'POST',
    exito               TINYINT(1)   NOT NULL DEFAULT 0,
    mensaje             TEXT         NULL,
    faces_detected      INT          NULL,
    distancia           DECIMAL(5,4) NULL,
    confidence          DECIMAL(5,2) NULL,
    tiempo_respuesta_ms INT          NULL,
    ip_address          VARCHAR(45)  NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Mantener la integridad referencial
    CONSTRAINT fk_log_admin FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_persona_new FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_area_new FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,

    INDEX idx_fecha (created_at),
    INDEX idx_endpoint (endpoint)
) ENGINE=InnoDB;

-- ============================================================
-- 9. ÍNDICES ADICIONALES
-- ============================================================
CREATE INDEX idx_asist_fecha       ON asistencias (fecha);
CREATE INDEX idx_asist_persona_mes ON asistencias (persona_id, fecha);
CREATE INDEX idx_asist_estado      ON asistencias (estado);
CREATE INDEX idx_log_fecha         ON log_reconocimiento (fecha_hora);
CREATE INDEX idx_log_persona       ON log_reconocimiento (persona_id);
CREATE INDEX idx_personas_tipo     ON personas (tipo, activo);

-- ============================================================
-- 10. VISTA: RESUMEN DE ASISTENCIA POR PERSONA Y MES
-- ============================================================
CREATE OR REPLACE VIEW v_resumen_asistencia AS
SELECT
  p.id AS persona_id,
  CONCAT(p.nombres, ' ', p.apellidos) AS persona,
  p.tipo,
  DATE_FORMAT(a.fecha, '%Y-%m') AS mes,
  COUNT(*) AS total_dias,
  SUM(a.estado = 'presente') AS presentes,
  SUM(a.estado = 'tardanza') AS tardanzas,
  SUM(a.estado = 'ausente') AS ausentes,
  SUM(a.estado = 'justificado') AS justificados,
  ROUND(SUM(a.estado IN ('presente','tardanza','justificado')) / COUNT(*) * 100, 1) AS pct_asistencia
FROM asistencias a
JOIN personas p ON p.id = a.persona_id
GROUP BY p.id, mes;

-- ============================================================
-- 11. VISTA: KPIs DIARIOS
-- ============================================================
CREATE OR REPLACE VIEW v_kpi_diario AS
SELECT
  a.fecha,
  COUNT(DISTINCT a.persona_id) AS total_registros,
  SUM(a.estado = 'presente') AS presentes,
  SUM(a.estado = 'tardanza') AS tardanzas,
  SUM(a.estado = 'ausente') AS ausentes,
  ROUND(AVG(a.confianza_facial) * 100, 1) AS promedio_confianza_pct
FROM asistencias a
GROUP BY a.fecha
ORDER BY a.fecha DESC;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
