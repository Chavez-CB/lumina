import { pool } from '../config/db.js';

const httpError = (status, message ) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// GET /api/areas
export const listarAreas = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM areas ORDER BY nombre ASC");
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/areas/:id
export const obtenerArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[area]] = await pool.query("SELECT * FROM areas WHERE id = ?", [id]);
    if (!area) throw httpError(404, 'Área no encontrada' );
    res.json({ ok: true, data: area });
  } catch (err) { next(err); }
};

// POST /api/areas
export const crearArea = async (req, res, next) => {
  try {
    const { codigo, nombre } = req.body;

    // Verificar si el código ya existe
    const [[existe]] = await pool.query("SELECT id FROM areas WHERE codigo = ?", [codigo]);
    if (existe) throw httpError(409, `Ya existe un área con el código ${codigo}` );

    const [result] = await pool.query(
      `INSERT INTO areas (codigo, nombre) VALUES (?, ?)`,
      [codigo, nombre]
    );

    const [[nuevaArea]] = await pool.query("SELECT * FROM areas WHERE id = ?", [result.insertId]);

    res.status(201).json({
      ok: true,
      message: 'Área creada correctamente',
      data: nuevaArea
    });
  } catch (err) { next(err); }
};

// PUT /api/areas/:id
export const actualizarArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codigo, nombre } = req.body;

    // Verificar existencia
    const [[area]] = await pool.query("SELECT id FROM areas WHERE id = ?", [id]);
    if (!area) throw httpError(404, 'Área no encontrada' );

    // Verificar si el nuevo código ya pertenece a otra área
    if (codigo) {
      const [[codigoExiste]] = await pool.query("SELECT id FROM areas WHERE codigo = ? AND id != ?", [codigo, id]);
      if (codigoExiste) throw httpError(409, `El código ${codigo} ya pertenece a otra área` );
    }

    await pool.query(
      `UPDATE areas SET codigo = ?, nombre = ? WHERE id = ?`,
      [codigo, nombre, id]
    );

    const [[actualizada]] = await pool.query("SELECT * FROM areas WHERE id = ?", [id]);

    res.json({
      ok: true,
      message: 'Área actualizada correctamente',
      data: actualizada
    });
  } catch (err) { next(err); }
};

// DELETE /api/areas/:id
export const eliminarArea = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si el área está siendo usada en asistencias
    const [[enUso]] = await pool.query("SELECT id FROM asistencias WHERE area_id = ? LIMIT 1", [id]);
    if (enUso) throw httpError(409, 'No se puede eliminar el área porque ya tiene asistencias registradas' );

    const [result] = await pool.query("DELETE FROM areas WHERE id = ?", [id]);
    if (result.affectedRows === 0) throw httpError(404, 'Área no encontrada' );

    res.json({
      ok: true,
      message: 'Área eliminada correctamente'
    });
  } catch (err) { next(err); }
};