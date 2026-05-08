import { pool } from '../config/db.js';
import faceService from '../services/faceRecognition.service.js';
import { registrarLog } from './log-reconocimiento.controller.js';

// Helper para errores HTTP
const httpError = (status, message ) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// GET /api/asistencias
export const listarAsistencias = async (req, res, next) => {
  try {
    const { fecha, persona_id, estado, pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT a.*, 
             CONCAT(p.nombres, ' ', p.apellidos) as persona_nombre,
             h.nombre as horario_nombre,
             ar.nombre as area_nombre
      FROM asistencias a
      JOIN personas p ON a.persona_id = p.id
      JOIN horarios h ON a.horario_id = h.id
      LEFT JOIN areas ar ON a.area_id = ar.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha) { query += " AND a.fecha = ?"; params.push(fecha); }
    if (persona_id) { query += " AND a.persona_id = ?"; params.push(persona_id); }
    if (estado) { query += " AND a.estado = ?"; params.push(estado); }

    query += " ORDER BY a.fecha DESC, a.hora_entrada DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limite), parseInt(offset));

    const [rows] = await pool.query(query, params);
    
    let countQuery = "SELECT COUNT(*) as total FROM asistencias WHERE 1=1";
    const countParams = [];
    if (fecha) { countQuery += " AND fecha = ?"; countParams.push(fecha); }
    if (persona_id) { countQuery += " AND persona_id = ?"; countParams.push(persona_id); }
    if (estado) { countQuery += " AND estado = ?"; countParams.push(estado); }
    
    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      ok: true,
      data: rows,
      meta: { total, pagina: parseInt(pagina), limite: parseInt(limite), paginas: Math.ceil(total / limite) }
    });
  } catch (err) { next(err); }
};

// ====================== POST /api/asistencias/registrar-facial ======================
export const registrarAsistenciaFacial = async (req, res, next) => {
  const startTime = Date.now();
  let logData = {
    endpoint: '/compare',
    metodo: 'POST',
    exito: 0,
    ip_address: req.ip || req.socket.remoteAddress
  };

  try {
    if (!req.file) {
      throw new Error('No se recibió imagen');
    }

    const { area_id, threshold = 0.55 } = req.body;

    if (!area_id) {
      throw new Error('El área es obligatoria');
    }

    // 1. Obtener todas las personas activas con embedding
    const [personas] = await pool.query(`
      SELECT id, nombres, apellidos, descriptor_facial, codigo
      FROM personas 
      WHERE descriptor_facial IS NOT NULL 
        AND activo = 1
    `);

    if (personas.length === 0) {
      throw new Error('No hay personas registradas con reconocimiento facial');
    }

    const candidates = personas.map(p => ({
      id: p.id.toString(),
      embedding: p.descriptor_facial
    }));

    // 2. Llamar a la API Facial (/compare)
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
      exito: faceResult.found ? 1 : 0,
      mensaje: faceResult.message
    };

    // 3. Registrar Log de Reconocimiento
    await registrarLog({ body: logData }, { status: () => {}, json: () => {} }, () => {});

    if (!faceResult.found) {
      return res.status(200).json({
        ok: true,
        found: false,
        message: faceResult.message || "No se identificó ninguna persona",
        mejor_distancia: faceResult.distance
      });
    }

    const persona_id = parseInt(faceResult.user_id);

    // 4. Buscar horario actual (mañana) para la persona
    const [asignacion] = await pool.query(`
      SELECT a.horario_id, h.area_id, h.hora_inicio, h.tolerancia_min
      FROM asignaciones a
      JOIN horarios h ON h.id = a.horario_id
      WHERE a.persona_id = ? 
        AND a.activo = 1
        AND h.activo = 1
        AND h.dia_semana LIKE CONCAT('%', LOWER(DAYNAME(CURDATE())), '%')
      LIMIT 1
    `, [persona_id]);

    if (!asignacion || asignacion.length === 0) {
      throw new Error('La persona no tiene asignación de horario para hoy');
    }

    const horario = asignacion[0];
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];

    // 5. Verificar si ya tiene registro hoy
    const [existente] = await pool.query(
      `SELECT id, hora_entrada FROM asistencias 
       WHERE persona_id = ? AND horario_id = ? AND fecha = ?`,
      [persona_id, horario.horario_id, fecha]
    );

    let asistencia;

    if (existente.length > 0) {
      // Ya tiene entrada → registrar salida
      await pool.query(
        `UPDATE asistencias 
         SET hora_salida = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [existente[0].id]
      );
      asistencia = { ...existente[0], hora_salida: ahora };
    } else {
      // Registrar entrada
      const [result] = await pool.query(`
        INSERT INTO asistencias 
          (persona_id, horario_id, area_id, fecha, hora_entrada, 
           estado, metodo_registro, confianza_facial)
        VALUES (?, ?, ?, ?, NOW(), 'presente', 'facial', ?)
      `, [
        persona_id,
        horario.horario_id,
        area_id,
        fecha,
        faceResult.confidence || null
      ]);

      const [[nueva]] = await pool.query(
        'SELECT * FROM asistencias WHERE id = ?', 
        [result.insertId]
      );
      asistencia = nueva;
    }

    res.json({
      ok: true,
      found: true,
      persona_id,
      nombre: personas.find(p => p.id === persona_id)?.nombres + ' ' + 
              personas.find(p => p.id === persona_id)?.apellidos,
      mensaje: "Asistencia registrada correctamente",
      tipo: existente.length > 0 ? "salida" : "entrada",
      asistencia,
      face: {
        distance: faceResult.distance,
        confidence: faceResult.confidence
      }
    });

  } catch (err) {
    logData.mensaje = err.message;
    await registrarLog({ body: logData }, { status: () => {}, json: () => {} }, () => {});
    next(err);
  }
};

// GET /api/asistencias/:id
export const obtenerAsistencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[asistencia]] = await pool.query(
      `SELECT a.*, CONCAT(p.nombres, ' ', p.apellidos) as persona_nombre, h.nombre as horario_nombre, ar.nombre as area_nombre
       FROM asistencias a JOIN personas p ON a.persona_id = p.id JOIN horarios h ON a.horario_id = h.id LEFT JOIN areas ar ON a.area_id = ar.id
       WHERE a.id = ?`, [id]
    );
    if (!asistencia) throw httpError(404, 'Asistencia no encontrada' );
    res.json({ ok: true, data: asistencia });
  } catch (err) { next(err); }
};