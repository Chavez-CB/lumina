import { pool } from '../config/db.js';

const httpError = (status, message ) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// POST /api/justificaciones
export const crearJustificacion = async (req, res, next) => {
  try {
    const { asistencia_id, persona_id, motivo, documento_url } = req.body;

    // 1. Verificar que la asistencia existe
    const [[asistencia]] = await pool.query("SELECT id, estado FROM asistencias WHERE id = ?", [asistencia_id]);
    if (!asistencia) throw httpError(404, 'La asistencia no existe' );

    // 2. Verificar que no tenga ya una justificación
    const [[existe]] = await pool.query("SELECT id FROM justificaciones WHERE asistencia_id = ?", [asistencia_id]);
    if (existe) throw httpError(409, 'Esta asistencia ya tiene una justificación registrada' );

    // 3. Insertar justificación
    const [result] = await pool.query(
      `INSERT INTO justificaciones (asistencia_id, persona_id, motivo, documento_url, estado)
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [asistencia_id, persona_id, motivo, documento_url || null]
    );

    const [[nuevaJustif]] = await pool.query("SELECT * FROM justificaciones WHERE id = ?", [result.insertId]);

    res.status(201).json({
      ok: true,
      message: 'Justificación enviada correctamente',
      data: nuevaJustif
    });
  } catch (err) { next(err); }
};

// GET /api/justificaciones
export const listarJustificaciones = async (req, res, next) => {
  try {
    const { estado, persona_id, pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT j.*, 
             CONCAT(p.nombres, ' ', p.apellidos) as persona_nombre,
             a.fecha as asistencia_fecha,
             a.estado as asistencia_estado_original
      FROM justificaciones j
      JOIN personas p ON j.persona_id = p.id
      JOIN asistencias a ON j.asistencia_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) { query += " AND j.estado = ?"; params.push(estado); }
    if (persona_id) { query += " AND j.persona_id = ?"; params.push(persona_id); }

    query += " ORDER BY j.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limite), parseInt(offset));

    const [rows] = await pool.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// PATCH /api/justificaciones/:id/revisar
export const revisarJustificacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, revisado_por } = req.body; // estado: 'aprobado' o 'rechazado'

    if (!['aprobado', 'rechazado'].includes(estado)) {
      throw httpError(400, 'Estado de revisión no válido' );
    }

    // 1. Verificar existencia
    const [[justif]] = await pool.query("SELECT * FROM justificaciones WHERE id = ?", [id]);
    if (!justif) throw httpError(404, 'Justificación no encontrada' );

    // 2. Actualizar justificación
    await pool.query(
      `UPDATE justificaciones 
       SET estado = ?, revisado_por = ?, revisado_en = NOW() 
       WHERE id = ?`,
      [estado, revisado_por, id]
    );

    // 3. Si se aprueba, actualizar el estado en la tabla de asistencias a 'justificado'
    if (estado === 'aprobado') {
      await pool.query(
        "UPDATE asistencias SET estado = 'justificado' WHERE id = ?",
        [justif.asistencia_id]
      );
    }

    res.json({
      ok: true,
      message: `Justificación ${estado} correctamente`
    });
  } catch (err) { next(err); }
};