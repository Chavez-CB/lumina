-- ============================================================
-- LUMINA — Base de Datos para Supabase (PostgreSQL)
-- Versión limpia y básica - Mayo 2026
-- ============================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipos ENUM
CREATE TYPE tipo_area AS ENUM ('aula', 'laboratorio', 'auditorio', 'sala', 'otro');
CREATE TYPE tipo_persona AS ENUM ('empleado', 'alumno', 'visitante');
CREATE TYPE estado_asistencia AS ENUM ('presente', 'tardanza', 'ausente', 'justificado');
CREATE TYPE metodo_registro AS ENUM ('facial', 'manual', 'qr', 'rfid');
CREATE TYPE estado_justificacion AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- --------------------------------------------------------
-- 3. Tablas
-- --------------------------------------------------------

CREATE TABLE admin (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  tipo tipo_area NOT NULL DEFAULT 'aula',
  capacidad SMALLINT,
  piso SMALLINT,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE personas (
  id SERIAL PRIMARY KEY,
  tipo tipo_persona NOT NULL DEFAULT 'alumno',
  codigo VARCHAR(30) UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  dni VARCHAR(20) UNIQUE,
  email VARCHAR(150) UNIQUE,
  telefono VARCHAR(20),
  foto_url VARCHAR(500),
  descriptor_facial JSONB,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  admin_id INT REFERENCES admin(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE horarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  area_id INT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  responsable_id INT REFERENCES personas(id) ON DELETE SET NULL,
  dia_semana TEXT[] NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  tolerancia_min SMALLINT NOT NULL DEFAULT 10,
  fecha_desde DATE,
  fecha_hasta DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asignaciones (
  id SERIAL PRIMARY KEY,
  horario_id INT NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
  persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  fecha_desde DATE,
  fecha_hasta DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(horario_id, persona_id)
);

CREATE TABLE asistencias (
  id SERIAL PRIMARY KEY,
  persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  horario_id INT NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
  area_id INT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_entrada TIMESTAMP WITH TIME ZONE,
  hora_salida TIMESTAMP WITH TIME ZONE,
  estado estado_asistencia NOT NULL DEFAULT 'ausente',
  metodo_registro metodo_registro NOT NULL DEFAULT 'facial',
  confianza_facial DECIMAL(5,4),
  observacion TEXT,
  registrado_por INT REFERENCES admin(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(persona_id, horario_id, fecha)
);

CREATE TABLE justificaciones (
  id SERIAL PRIMARY KEY,
  asistencia_id INT NOT NULL UNIQUE REFERENCES asistencias(id) ON DELETE CASCADE,
  persona_id INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  documento_url VARCHAR(500),
  estado estado_justificacion NOT NULL DEFAULT 'pendiente',
  revisado_por INT REFERENCES admin(id) ON DELETE SET NULL,
  revisado_en TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE log_reconocimiento (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES admin(id) ON DELETE SET NULL,
  persona_id INT REFERENCES personas(id) ON DELETE SET NULL,
  area_id INT REFERENCES areas(id) ON DELETE SET NULL,
  endpoint VARCHAR(20) NOT NULL,
  metodo VARCHAR(10) NOT NULL DEFAULT 'POST',
  exito BOOLEAN NOT NULL DEFAULT FALSE,
  mensaje TEXT,
  faces_detected INT,
  distancia DECIMAL(5,4),
  confidence DECIMAL(5,2),
  tiempo_respuesta_ms INT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 4. Triggers para updated_at (Importante en PostgreSQL)
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asistencias_updated_at
    BEFORE UPDATE ON asistencias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------
-- 5. Índices
-- --------------------------------------------------------

CREATE INDEX idx_asist_fecha ON asistencias (fecha);
CREATE INDEX idx_asist_persona_mes ON asistencias (persona_id, fecha);
CREATE INDEX idx_log_created_at ON log_reconocimiento (created_at);
CREATE INDEX idx_personas_tipo_activo ON personas (tipo, activo);
CREATE INDEX idx_horarios_area ON horarios (area_id);
CREATE INDEX idx_asignaciones_persona ON asignaciones (persona_id);

-- --------------------------------------------------------
-- 6. Vistas
-- --------------------------------------------------------

CREATE OR REPLACE VIEW v_resumen_asistencia AS
SELECT
  p.id AS persona_id,
  p.nombres || ' ' || p.apellidos AS persona,
  p.tipo,
  TO_CHAR(a.fecha, 'YYYY-MM') AS mes,
  COUNT(*) AS total_dias,
  SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
  SUM(CASE WHEN a.estado = 'tardanza' THEN 1 ELSE 0 END) AS tardanzas,
  SUM(CASE WHEN a.estado = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
  SUM(CASE WHEN a.estado = 'justificado' THEN 1 ELSE 0 END) AS justificados,
  ROUND(
    SUM(CASE WHEN a.estado IN ('presente','tardanza','justificado') 
        THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 1
  ) AS pct_asistencia
FROM asistencias a
JOIN personas p ON p.id = a.persona_id
GROUP BY p.id, p.nombres, p.apellidos, p.tipo, mes;

CREATE OR REPLACE VIEW v_kpi_diario AS
SELECT
  a.fecha,
  COUNT(DISTINCT a.persona_id) AS total_registros,
  SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
  SUM(CASE WHEN a.estado = 'tardanza' THEN 1 ELSE 0 END) AS tardanzas,
  SUM(CASE WHEN a.estado = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
  ROUND(AVG(a.confianza_facial) * 100, 1) AS promedio_confianza_pct
FROM asistencias a
GROUP BY a.fecha
ORDER BY a.fecha DESC;

-- --------------------------------------------------------
-- 7. Datos de ejemplo
-- --------------------------------------------------------

INSERT INTO admin (nombre, apellido, email, password_hash, activo)
VALUES ('Carlos', 'Chávez', 'admin@lumina.app', '$2b$10$PLACEHOLDER_HASH_ADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO areas (codigo, nombre, tipo, capacidad, piso) VALUES
('AULA-101', 'Aula 101', 'aula', 35, 1),
('AULA-102', 'Aula 102', 'aula', 35, 1),
('LAB-A', 'Laboratorio A', 'laboratorio', 25, 2)
ON CONFLICT (codigo) DO NOTHING;

-- --------------------------------------------------------
-- 8. RLS Básico (Muy mínimo como pediste)
-- --------------------------------------------------------

-- Desactivamos RLS por defecto en todas las tablas (puedes activarlo después)
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE personas DISABLE ROW LEVEL SECURITY;
ALTER TABLE horarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE justificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_reconocimiento DISABLE ROW LEVEL SECURITY;

COMMENT ON DATABASE postgres IS 'Base de datos Lumina - Lista para backend';