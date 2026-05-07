import { pool } from '../config/db.js';

const httpError = (status, message ) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/asignaciones
// Listar todas las asignaciones con detalles de persona y horario
// ═══════════════════════════════════════════════════════════════════════════
export const listarAsignaciones = async (req, res, next) => {
  try {
    const { persona_id, activo } = req.query;
    let query = `
      SELECT asig.*, 
             CONCAT(p.nombres, ' ', p.apellidos) as persona_nombre,
             h.nombre as horario_nombre,
             h.hora_inicio, h.hora_fin
      FROM asignaciones asig
      JOIN personas p ON asig.persona_id = p.id
      JOIN horarios h ON asig.horario_id = h.id
      WHERE 1=1
    `;
    const params = [];

    if (persona_id) { query += " AND asig.persona_id = ?"; params.push(persona_id); }
    if (activo !== undefined) { query += " AND asig.activo = ?"; params.push(activo); }

    query += " ORDER BY asig.created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/asignaciones
// Crear una nueva asignación
// ═══════════════════════════════════════════════════════════════════════════
export const crearAsignacion = async (req, res, next) => {
  try {
    const { persona_id, horario_id, fecha_desde, fecha_hasta } = req.body;

    // 1. Verificar si ya existe la asignación (UNIQUE KEY uq_asignacion)
    const [[existe]] = await pool.query(
      "SELECT id FROM asignaciones WHERE persona_id = ? AND horario_id = ?",
      [persona_id, horario_id]
    );
    if (existe) throw httpError(409, 'Esta persona ya tiene asignado este horario' );

    // 2. Insertar asignación
    const [result] = await pool.query(
      `INSERT INTO asignaciones (persona_id, horario_id, fecha_desde, fecha_hasta, activo)
       VALUES (?, ?, ?, ?, 1)`,
      [persona_id, horario_id, fecha_desde || null, fecha_hasta || null]
    );

    const [[nuevaAsig]] = await pool.query("SELECT * FROM asignaciones WHERE id = ?", [result.insertId]);

    res.status(201).json({
      ok: true,
      message: 'Asignación creada correctamente',
      data: nuevaAsig
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/asignaciones/:id/estado
// Activar o desactivar una asignación
// ═══════════════════════════════════════════════════════════════════════════
export const cambiarEstadoAsignacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body; // 1 o 0

    const [result] = await pool.query("UPDATE asignaciones SET activo = ? WHERE id = ?", [activo, id]);
    if (result.affectedRows === 0) throw httpError(404, 'Asignación no encontrada' );

    res.json({ ok: true, message: `Asignación ${activo ? 'activada' : 'desactivada'} correctamente` });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/asignaciones/:id
// Eliminar una asignación
// ═══════════════════════════════════════════════════════════════════════════
export const eliminarAsignacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM asignaciones WHERE id = ?", [id]);
    if (result.affectedRows === 0) throw httpError(404, 'Asignación no encontrada' );

    res.json({ ok: true, message: 'Asignación eliminada correctamente' });
  } catch (err) { next(err); }
};