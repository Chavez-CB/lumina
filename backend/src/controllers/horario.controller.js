import { pool } from '../config/db.js';

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// GET /api/horarios
export const listarHorarios = async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM horarios ORDER BY created_at DESC");
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/horarios/:id
export const obtenerHorario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM horarios WHERE id = $1", [id]);
    
    if (rows.length === 0) throw httpError(404, 'Horario no encontrado');
    
    res.json({ ok: true, data: rows[0] });
  } catch (err) { next(err); }
};

// POST /api/horarios
export const crearHorario = async (req, res, next) => {
  try {
    const { nombre, area_id, responsable_id, dia_semana, hora_inicio, hora_fin, tolerancia_min, fecha_desde, fecha_hasta } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO horarios (nombre, area_id, responsable_id, dia_semana, hora_inicio, hora_fin, tolerancia_min, fecha_desde, fecha_hasta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nombre, area_id, responsable_id, dia_semana, hora_inicio, hora_fin, tolerancia_min || 10, fecha_desde, fecha_hasta]
    );

    res.status(201).json({
      ok: true,
      message: 'Horario creado correctamente',
      data: rows[0]
    });
  } catch (err) { next(err); }
};

// PUT /api/horarios/:id
export const actualizarHorario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, area_id, responsable_id, dia_semana, hora_inicio, hora_fin, tolerancia_min, fecha_desde, fecha_hasta, activo } = req.body;

    const existe = await pool.query("SELECT id FROM horarios WHERE id = $1", [id]);
    if (existe.rows.length === 0) throw httpError(404, 'Horario no encontrado');

    await pool.query(
      `UPDATE horarios 
       SET nombre = $1, area_id = $2, responsable_id = $3, dia_semana = $4,
           hora_inicio = $5, hora_fin = $6, tolerancia_min = $7,
           fecha_desde = $8, fecha_hasta = $9, activo = $10
       WHERE id = $11`,
      [nombre, area_id, responsable_id, dia_semana, hora_inicio, hora_fin, 
       tolerancia_min, fecha_desde, fecha_hasta, activo, id]
    );

    const { rows } = await pool.query("SELECT * FROM horarios WHERE id = $1", [id]);

    res.json({
      ok: true,
      message: 'Horario actualizado correctamente',
      data: rows[0]
    });
  } catch (err) { next(err); }
};

// DELETE /api/horarios/:id
export const eliminarHorario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enUso = await pool.query("SELECT id FROM asistencias WHERE horario_id = $1 LIMIT 1", [id]);
    if (enUso.rows.length > 0) throw httpError(409, 'No se puede eliminar el horario porque ya tiene asistencias registradas');

    const result = await pool.query("DELETE FROM horarios WHERE id = $1", [id]);
    
    if (result.rowCount === 0) throw httpError(404, 'Horario no encontrado');

    res.json({ ok: true, message: 'Horario eliminado correctamente' });
  } catch (err) { next(err); }
};