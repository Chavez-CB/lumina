import pool from '../config/db.js';

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// POST /api/justificaciones
export const crearJustificacion = async (req, res, next) => {
  try {
    const { asistencia_id, persona_id, motivo, documento_url } = req.body;

    const { rows: [asistencia] } = await pool.query(
      "SELECT id, estado FROM asistencias WHERE id = $1", 
      [asistencia_id]
    );
    if (!asistencia) throw httpError(404, 'La asistencia no existe');

    const { rows: [existe] } = await pool.query(
      "SELECT id FROM justificaciones WHERE asistencia_id = $1", 
      [asistencia_id]
    );
    if (existe) throw httpError(409, 'Esta asistencia ya tiene una justificación registrada');

    const { rows: [nuevaJustif] } = await pool.query(
      `INSERT INTO justificaciones (asistencia_id, persona_id, motivo, documento_url, estado)
       VALUES ($1, $2, $3, $4, 'pendiente')
       RETURNING *`,
      [asistencia_id, persona_id, motivo, documento_url || null]
    );

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
    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    let query = `
      SELECT j.*, 
             p.nombres || ' ' || p.apellidos as persona_nombre,
             a.fecha as asistencia_fecha,
             a.estado as asistencia_estado_original
      FROM justificaciones j
      JOIN personas p ON j.persona_id = p.id
      JOIN asistencias a ON j.asistencia_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let index = 1;

    if (estado) { query += ` AND j.estado = $${index}`; params.push(estado); index++; }
    if (persona_id) { query += ` AND j.persona_id = $${index}`; params.push(persona_id); index++; }

    query += ` ORDER BY j.created_at DESC LIMIT $${index} OFFSET $${index + 1}`;
    params.push(parseInt(limite), offset);

    const { rows } = await pool.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// PATCH /api/justificaciones/:id/revisar
export const revisarJustificacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, revisado_por } = req.body;

    if (!['aprobado', 'rechazado'].includes(estado)) {
      throw httpError(400, 'Estado de revisión no válido');
    }

    const { rows: [justif] } = await pool.query(
      "SELECT * FROM justificaciones WHERE id = $1", [id]
    );
    if (!justif) throw httpError(404, 'Justificación no encontrada');

    await pool.query(
      `UPDATE justificaciones 
       SET estado = $1, revisado_por = $2, revisado_en = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [estado, revisado_por, id]
    );

    if (estado === 'aprobado') {
      await pool.query(
        "UPDATE asistencias SET estado = 'justificado' WHERE id = $1",
        [justif.asistencia_id]
      );
    }

    res.json({ ok: true, message: `Justificación ${estado} correctamente` });
  } catch (err) { next(err); }
};