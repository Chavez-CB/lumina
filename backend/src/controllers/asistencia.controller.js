import pool from '../config/db.js';
import faceService from '../services/faceRecognition.service.js';
import { registrarLog } from './log-reconocimiento.controller.js';

// Helper para errores HTTP
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// =============================================
// GET /api/asistencias
// =============================================
export const listarAsistencias = async (req, res, next) => {
  try {
    const { fecha, persona_id, estado, pagina = 1, limite = 20 } = req.query;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    let query = `
      SELECT a.*, 
             p.nombres || ' ' || p.apellidos as persona_nombre,
             h.nombre as horario_nombre,
             ar.nombre as area_nombre
      FROM asistencias a
      JOIN personas p ON a.persona_id = p.id
      JOIN horarios h ON a.horario_id = h.id
      LEFT JOIN areas ar ON a.area_id = ar.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (fecha) {
      query += ` AND a.fecha = $${paramIndex}`;
      params.push(fecha);
      paramIndex++;
    }
    if (persona_id) {
      query += ` AND a.persona_id = $${paramIndex}`;
      params.push(persona_id);
      paramIndex++;
    }
    if (estado) {
      query += ` AND a.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    query += ` ORDER BY a.fecha DESC, a.hora_entrada DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limite), offset);

    const { rows } = await pool.query(query, params);

    // Conteo total
    let countQuery = "SELECT COUNT(*) as total FROM asistencias WHERE 1=1";
    const countParams = [];
    let countIndex = 1;

    if (fecha) { countQuery += ` AND fecha = $${countIndex}`; countParams.push(fecha); countIndex++; }
    if (persona_id) { countQuery += ` AND persona_id = $${countIndex}`; countParams.push(persona_id); countIndex++; }
    if (estado) { countQuery += ` AND estado = $${countIndex}`; countParams.push(estado); countIndex++; }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      ok: true,
      data: rows,
      meta: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        paginas: Math.ceil(total / limite)
      }
    });
  } catch (err) { next(err); }
};

// =============================================
// POST /api/asistencias/registrar (Manual)
// =============================================
export const registrarAsistencia = async (req, res, next) => {
  try {
    const {
      persona_id, horario_id, area_id, fecha,
      hora_entrada, hora_salida, estado = 'presente',
      observacion, registrado_por
    } = req.body;

    if (!persona_id || !horario_id || !area_id || !fecha) {
      throw httpError(400, 'persona_id, horario_id, area_id y fecha son obligatorios');
    }

    const { rows } = await pool.query(
      `INSERT INTO asistencias
        (persona_id, horario_id, area_id, fecha, hora_entrada, hora_salida,
         estado, metodo_registro, observacion, registrado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual', $8, $9)
       RETURNING *`,
      [
        persona_id, horario_id, area_id, fecha,
        hora_entrada || null, hora_salida || null, estado,
        observacion || null, registrado_por || null
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Asistencia registrada correctamente',
      data: rows[0]
    });
  } catch (err) { next(err); }
};

// =============================================
// POST /api/asistencias/registrar-facial  ← COMPLETA
// =============================================
export const registrarAsistenciaFacial = async (req, res, next) => {
  const startTime = Date.now();
  let logData = {
    endpoint: '/asistencias/registrar-facial',
    metodo: 'POST',
    exito: false,
    ip_address: req.ip || req.socket.remoteAddress
  };

  try {
    if (!req.file) throw httpError(400, 'No se recibió imagen');
    const { area_id, threshold = 0.55 } = req.body;
    if (!area_id) throw httpError(400, 'El área (area_id) es obligatoria');

    // 1. Obtener personas con descriptor facial
    const { rows: personas } = await pool.query(`
      SELECT id, nombres, apellidos, descriptor_facial, codigo
      FROM personas 
      WHERE descriptor_facial IS NOT NULL AND activo = TRUE
    `);

    if (personas.length === 0) {
      throw httpError(400, 'No hay personas registradas con reconocimiento facial');
    }

    const candidates = personas.map(p => ({
      id: p.id.toString(),
      embedding: p.descriptor_facial
    }));

    // 2. Reconocimiento facial
    const faceResult = await faceService.compareFace(
      req.file.buffer,
      candidates,
      parseFloat(threshold)
    );

    const tiempo_respuesta_ms = Date.now() - startTime;

    logData = {
      ...logData,
      area_id: parseInt(area_id),
      faces_detected: faceResult.faces_detected || 0,
      distancia: faceResult.distance || null,
      confidence: faceResult.confidence || null,
      tiempo_respuesta_ms,
      persona_id: faceResult.found ? parseInt(faceResult.user_id) : null,
      exito: faceResult.found,
      mensaje: faceResult.message
    };

    // Registrar log
    await registrarLog({ body: logData }, { status: () => { }, json: () => { } }, () => { });

    if (!faceResult.found) {
      return res.status(200).json({
        ok: true,
        found: false,
        message: faceResult.message || "No se identificó ninguna persona",
        mejor_distancia: faceResult.distance
      });
    }

    const persona_id = parseInt(faceResult.user_id);

    // 3. Verificar si ya tiene asistencia hoy
    const hoy = new Date().toISOString().split('T')[0];
    const { rows: asistenciaExistente } = await pool.query(`
      SELECT id, estado, hora_entrada 
      FROM asistencias 
      WHERE persona_id = $1 AND fecha = $2`,
      [persona_id, hoy]
    );

    let asistencia;

    if (asistenciaExistente.length > 0) {
      // Registrar salida
      const { rows: [asistenciaActualizada] } = await pool.query(`
        UPDATE asistencias 
        SET hora_salida = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *`,
        [asistenciaExistente[0].id]
      );
      asistencia = asistenciaActualizada;
    } else {
      // Registrar entrada
      const { rows: [nuevaAsistencia] } = await pool.query(`
        INSERT INTO asistencias 
          (persona_id, horario_id, area_id, fecha, hora_entrada, estado, metodo_registro)
        VALUES ($1, 
                (SELECT horario_id FROM asignaciones 
                 WHERE persona_id = $1 AND activo = TRUE LIMIT 1),
                $2, $3, CURRENT_TIMESTAMP, 'presente', 'facial')
        RETURNING *`,
        [persona_id, area_id, hoy]
      );
      asistencia = nuevaAsistencia;
    }

    res.json({
      ok: true,
      found: true,
      message: asistenciaExistente.length > 0
        ? "Salida registrada correctamente"
        : "Entrada registrada correctamente",
      data: asistencia,
      persona: faceResult.name || `${personas.find(p => p.id === persona_id)?.nombres} ${personas.find(p => p.id === persona_id)?.apellidos}`
    });

  } catch (err) {
    logData.mensaje = err.message;
    await registrarLog({ body: logData }, { status: () => { }, json: () => { } }, () => { });
    next(err);
  }
};

// =============================================
// GET /api/asistencias/:id
// =============================================
export const obtenerAsistencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT a.*, 
             p.nombres || ' ' || p.apellidos as persona_nombre,
             h.nombre as horario_nombre,
             ar.nombre as area_nombre
      FROM asistencias a 
      JOIN personas p ON a.persona_id = p.id 
      JOIN horarios h ON a.horario_id = h.id 
      LEFT JOIN areas ar ON a.area_id = ar.id
      WHERE a.id = $1`, [id]);

    if (rows.length === 0) throw httpError(404, 'Asistencia no encontrada');

    res.json({ ok: true, data: rows[0] });
  } catch (err) { next(err); }
};