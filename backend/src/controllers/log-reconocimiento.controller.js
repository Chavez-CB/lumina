import pool from '../config/db.js';

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ====================== POST /api/logs/reconocimiento ======================
export const registrarLog = async (req, res, next) => {
  try {
    const {
      admin_id,
      persona_id,
      area_id,
      endpoint,
      metodo = 'POST',
      exito = 0,
      mensaje,
      faces_detected,
      distancia,
      confidence,
      tiempo_respuesta_ms,
      ip_address
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO log_reconocimiento 
         (admin_id, persona_id, area_id, endpoint, metodo, exito, mensaje, 
          faces_detected, distancia, confidence, tiempo_respuesta_ms, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        admin_id || null,
        persona_id || null,
        area_id || null,
        endpoint || 'unknown',
        metodo,
        exito,
        mensaje || null,
        faces_detected || null,
        distancia || null,
        confidence || null,
        tiempo_respuesta_ms || null,
        ip_address || null
      ]
    );

    const [[nuevoLog]] = await pool.query(
      `SELECT l.*, 
              CONCAT(p.nombres, ' ', p.apellidos) AS persona_nombre,
              a.nombre AS area_nombre
       FROM log_reconocimiento l
       LEFT JOIN personas p ON p.id = l.persona_id
       LEFT JOIN areas a ON a.id = l.area_id
       WHERE l.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      ok: true,
      message: 'Log de reconocimiento registrado correctamente',
      data: nuevoLog
    });
  } catch (err) {
    next(err);
  }
};

// ====================== GET /api/logs/reconocimiento ======================
export const listarLogs = async (req, res, next) => {
  try {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));
    const offset = (pagina - 1) * limite;

    const { fecha_desde, fecha_hasta, exito, persona_id, area_id, endpoint } = req.query;

    let query = `
      SELECT l.*, 
             CONCAT(p.nombres, ' ', p.apellidos) AS persona_nombre,
             a.nombre AS area_nombre
      FROM log_reconocimiento l
      LEFT JOIN personas p ON p.id = l.persona_id
      LEFT JOIN areas a ON a.id = l.area_id
      WHERE 1=1
    `;
    const params = [];

    if (fecha_desde) { query += ' AND DATE(l.created_at) >= ?'; params.push(fecha_desde); }
    if (fecha_hasta) { query += ' AND DATE(l.created_at) <= ?'; params.push(fecha_hasta); }
    if (exito !== undefined) { query += ' AND l.exito = ?'; params.push(exito); }
    if (persona_id) { query += ' AND l.persona_id = ?'; params.push(persona_id); }
    if (area_id) { query += ' AND l.area_id = ?'; params.push(area_id); }
    if (endpoint) { query += ' AND l.endpoint = ?'; params.push(endpoint); }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(limite, offset);

    const [logs] = await pool.query(query, params);

    // Total
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM log_reconocimiento WHERE 1=1 
       ${persona_id ? 'AND persona_id = ?' : ''}
       ${area_id ? 'AND area_id = ?' : ''}`,
      [...(persona_id ? [persona_id] : []), ...(area_id ? [area_id] : [])]
    );

    res.json({
      ok: true,
      data: logs,
      meta: { total, pagina, limite, paginas: Math.ceil(total / limite) }
    });
  } catch (err) { next(err); }
};

// ====================== GET /api/logs/reconocimiento/:id ======================
export const obtenerLog = async (req, res, next) => {
  try {
    const [[log]] = await pool.query(
      `SELECT l.*, 
              CONCAT(p.nombres, ' ', p.apellidos) AS persona_nombre,
              a.nombre AS area_nombre
       FROM log_reconocimiento l
       LEFT JOIN personas p ON p.id = l.persona_id
       LEFT JOIN areas a ON a.id = l.area_id
       WHERE l.id = ?`,
      [req.params.id]
    );

    if (!log) throw httpError(404, 'Log no encontrado');

    res.json({ ok: true, data: log });
  } catch (err) { next(err); }
};

// ====================== GET /api/logs/reconocimiento/persona/:persona_id ======================
export const logsPorPersona = async (req, res, next) => {
  try {
    const [logs] = await pool.query(
      `SELECT * FROM log_reconocimiento 
       WHERE persona_id = ? 
       ORDER BY created_at DESC`,
      [req.params.persona_id]
    );
    res.json({ ok: true, data: logs });
  } catch (err) { next(err); }
};

// ====================== GET /api/logs/reconocimiento/area/:area_id ======================
export const logsPorArea = async (req, res, next) => {
  try {
    const [logs] = await pool.query(
      `SELECT * FROM log_reconocimiento 
       WHERE area_id = ? 
       ORDER BY created_at DESC`,
      [req.params.area_id]
    );
    res.json({ ok: true, data: logs });
  } catch (err) { next(err); }
};