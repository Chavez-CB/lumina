import { pool } from '../config/db.js';

const httpError = (status, message ) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// GET /api/horarios
export const listarHorarios = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM horarios ORDER BY created_at DESC");
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/horarios/:id
export const obtenerHorario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[horario]] = await pool.query("SELECT * FROM horarios WHERE id = ?", [id]);
    if (!horario) throw httpError(404, 'Horario no encontrado' );
    res.json({ ok: true, data: horario });
  } catch (err) { next(err); }
};

// POST /api/horarios
export const crearHorario = async (req, res, next) => {
  try {
    const { nombre, hora_inicio, hora_fin, tolerancia } = req.body;

    const [result] = await pool.query(
      `INSERT INTO horarios (nombre, hora_inicio, hora_fin, tolerancia)
       VALUES (?, ?, ?, ?)`,
      [nombre, hora_inicio, hora_fin, tolerancia || 10]
    );

    const [[nuevoHorario]] = await pool.query("SELECT * FROM horarios WHERE id = ?", [result.insertId]);

    res.status(201).json({
      ok: true,
      message: 'Horario creado correctamente',
      data: nuevoHorario
    });
  } catch (err) { next(err); }
};

// PUT /api/horarios/:id
export const actualizarHorario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, hora_inicio, hora_fin, tolerancia } = req.body;

    const [[horario]] = await pool.query("SELECT id FROM horarios WHERE id = ?", [id]);
    if (!horario) throw httpError(404, 'Horario no encontrado' );

    await pool.query(
      `UPDATE horarios SET nombre = ?, hora_inicio = ?, hora_fin = ?, tolerancia = ? WHERE id = ?`,
      [nombre, hora_inicio, hora_fin, tolerancia, id]
    );

    const [[actualizado]] = await pool.query("SELECT * FROM horarios WHERE id = ?", [id]);

    res.json({
      ok: true,
      message: 'Horario actualizado correctamente',
      data: actualizado
    });
  } catch (err) { next(err); }
};

// DELETE /api/horarios/:id
export const eliminarHorario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[enUso]] = await pool.query("SELECT id FROM asistencias WHERE horario_id = ? LIMIT 1", [id]);
    if (enUso) throw httpError(409, 'No se puede eliminar el horario porque ya tiene asistencias registradas' );

    const [result] = await pool.query("DELETE FROM horarios WHERE id = ?", [id]);
    if (result.affectedRows === 0) throw httpError(404, 'Horario no encontrado' );

    res.json({ ok: true, message: 'Horario eliminado correctamente' });
  } catch (err) { next(err); }
};