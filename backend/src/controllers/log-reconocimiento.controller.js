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
      admin_id, persona_id, area_id, endpoint, metodo = 'POST',
      exito = false, mensaje, faces_detected, distancia,
      confidence, tiempo_respuesta_ms, ip_address
    } = req.body;

    const { rows: [nuevoLogId] } = await pool.query(
      `INSERT INTO log_reconocimiento 
         (admin_id, persona_id, area_id, endpoint, metodo, exito, mensaje, 
          faces_detected, distancia, confidence, tiempo_respuesta_ms, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        admin_id || null, persona_id || null, area_id || null,
        endpoint || 'unknown', metodo, exito, mensaje || null,
        faces_detected || null, 
        distancia != null ? parseFloat(Number(distancia).toFixed(4)) : null, 
        confidence != null ? parseFloat(Number(confidence).toFixed(4)) : null,
        tiempo_respuesta_ms || null, ip_address || null
      ]
    );

    const { rows: [nuevoLog] } = await pool.query(`
      SELECT l.*, 
             p.nombres || ' ' || p.apellidos AS persona_nombre,
             a.nombre AS area_nombre
      FROM log_reconocimiento l
      LEFT JOIN personas p ON p.id = l.persona_id
      LEFT JOIN areas a ON a.id = l.area_id
      WHERE l.id = $1`, [nuevoLogId.id]);

    res.status(201).json({
      ok: true,
      message: 'Log de reconocimiento registrado correctamente',
      data: nuevoLog
    });
  } catch (err) { next(err); }
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
             p.nombres || ' ' || p.apellidos AS persona_nombre,
             a.nombre AS area_nombre
      FROM log_reconocimiento l
      LEFT JOIN personas p ON p.id = l.persona_id
      LEFT JOIN areas a ON a.id = l.area_id
      WHERE 1=1
    `;
    const params = [];
    let index = 1;

    if (fecha_desde) { query += ` AND DATE(l.created_at) >= $${index}`; params.push(fecha_desde); index++; }
    if (fecha_hasta) { query += ` AND DATE(l.created_at) <= $${index}`; params.push(fecha_hasta); index++; }
    if (exito !== undefined) { query += ` AND l.exito = $${index}`; params.push(exito === 'true' || exito === true); index++; }
    if (persona_id) { query += ` AND l.persona_id = $${index}`; params.push(persona_id); index++; }
    if (area_id) { query += ` AND l.area_id = $${index}`; params.push(area_id); index++; }
    if (endpoint) { query += ` AND l.endpoint = $${index}`; params.push(endpoint); index++; }

    query += ` ORDER BY l.created_at DESC LIMIT $${index} OFFSET $${index + 1}`;
    params.push(limite, offset);

    const { rows: logs } = await pool.query(query, params);

    // Total (simplificado)
    const { rows: [{ total }] } = await pool.query(
      `SELECT COUNT(*) AS total FROM log_reconocimiento WHERE 1=1`
    );

    res.json({
      ok: true,
      data: logs,
      meta: { total: parseInt(total), pagina, limite, paginas: Math.ceil(total / limite) }
    });
  } catch (err) { next(err); }
};

// ====================== GET /api/logs/reconocimiento/:id ======================
export const obtenerLog = async (req, res, next) => {
  try {
    const { rows: [log] } = await pool.query(`
      SELECT l.*, 
             p.nombres || ' ' || p.apellidos AS persona_nombre,
             a.nombre AS area_nombre
      FROM log_reconocimiento l
      LEFT JOIN personas p ON p.id = l.persona_id
      LEFT JOIN areas a ON a.id = l.area_id
      WHERE l.id = $1`, [req.params.id]);

    if (!log) throw httpError(404, 'Log no encontrado');

    res.json({ ok: true, data: log });
  } catch (err) { next(err); }
};

// ====================== GET /api/logs/reconocimiento/persona/:persona_id ======================
export const logsPorPersona = async (req, res, next) => {
  try {
    const { rows: logs } = await pool.query(
      `SELECT * FROM log_reconocimiento 
       WHERE persona_id = $1 
       ORDER BY created_at DESC`,
      [req.params.persona_id]
    );
    res.json({ ok: true, data: logs });
  } catch (err) { next(err); }
};

// ====================== GET /api/logs/reconocimiento/area/:area_id ======================
export const logsPorArea = async (req, res, next) => {
  try {
    const { rows: logs } = await pool.query(
      `SELECT * FROM log_reconocimiento 
       WHERE area_id = $1 
       ORDER BY created_at DESC`,
      [req.params.area_id]
    );
    res.json({ ok: true, data: logs });
  } catch (err) { next(err); }
};