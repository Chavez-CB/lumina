import pool from '../config/db.js';

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// GET /api/asignaciones
export const listarAsignaciones = async (req, res, next) => {
  try {
    const { persona_id, activo } = req.query;
    let query = `
      SELECT asig.*, 
             p.nombres || ' ' || p.apellidos as persona_nombre,
             h.nombre as horario_nombre,
             h.hora_inicio, h.hora_fin
      FROM asignaciones asig
      JOIN personas p ON asig.persona_id = p.id
      JOIN horarios h ON asig.horario_id = h.id
      WHERE 1=1
    `;
    const params = [];
    let index = 1;

    if (persona_id) { query += ` AND asig.persona_id = $${index}`; params.push(persona_id); index++; }
    if (activo !== undefined) { 
      query += ` AND asig.activo = $${index}`; 
      params.push(activo === 'true' || activo === true); 
      index++; 
    }

    query += " ORDER BY asig.created_at DESC";

    const { rows } = await pool.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// POST /api/asignaciones
export const crearAsignacion = async (req, res, next) => {
  try {
    const { persona_id, horario_id, fecha_desde, fecha_hasta } = req.body;

    const { rows: [existe] } = await pool.query(
      "SELECT id FROM asignaciones WHERE persona_id = $1 AND horario_id = $2",
      [persona_id, horario_id]
    );
    if (existe) throw httpError(409, 'Esta persona ya tiene asignado este horario');

    const { rows: [nuevaAsig] } = await pool.query(
      `INSERT INTO asignaciones (persona_id, horario_id, fecha_desde, fecha_hasta, activo)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [persona_id, horario_id, fecha_desde || null, fecha_hasta || null]
    );

    res.status(201).json({
      ok: true,
      message: 'Asignación creada correctamente',
      data: nuevaAsig
    });
  } catch (err) { next(err); }
};

// PATCH /api/asignaciones/:id/estado
export const cambiarEstadoAsignacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const { rowCount } = await pool.query(
      "UPDATE asignaciones SET activo = $1 WHERE id = $2", 
      [activo === true || activo === 'true', id]
    );

    if (rowCount === 0) throw httpError(404, 'Asignación no encontrada');

    res.json({ 
      ok: true, 
      message: `Asignación ${activo ? 'activada' : 'desactivada'} correctamente` 
    });
  } catch (err) { next(err); }
};

// DELETE /api/asignaciones/:id
export const eliminarAsignacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM asignaciones WHERE id = $1", [id]);

    if (rowCount === 0) throw httpError(404, 'Asignación no encontrada');

    res.json({ ok: true, message: 'Asignación eliminada correctamente' });
  } catch (err) { next(err); }
};