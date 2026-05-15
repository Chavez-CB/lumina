import { pool } from '../config/db.js';

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// GET /api/areas
export const listarAreas = async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM areas ORDER BY nombre ASC");
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/areas/:id
export const obtenerArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM areas WHERE id = $1", [id]);
    
    if (rows.length === 0) throw httpError(404, 'Área no encontrada');
    
    res.json({ ok: true, data: rows[0] });
  } catch (err) { next(err); }
};

// POST /api/areas
export const crearArea = async (req, res, next) => {
  try {
    const { codigo, nombre, tipo, capacidad, piso, descripcion } = req.body;

    const existe = await pool.query("SELECT id FROM areas WHERE codigo = $1", [codigo]);
    if (existe.rows.length > 0) throw httpError(409, `Ya existe un área con el código ${codigo}`);

    const { rows } = await pool.query(
      `INSERT INTO areas (codigo, nombre, tipo, capacidad, piso, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [codigo, nombre, tipo || 'aula', capacidad, piso, descripcion]
    );

    res.status(201).json({
      ok: true,
      message: 'Área creada correctamente',
      data: rows[0]
    });
  } catch (err) { next(err); }
};

// PUT /api/areas/:id
export const actualizarArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, tipo, capacidad, piso, descripcion, activo } = req.body;

    const existe = await pool.query("SELECT id FROM areas WHERE id = $1", [id]);
    if (existe.rows.length === 0) throw httpError(404, 'Área no encontrada');

    if (codigo) {
      const codigoExiste = await pool.query("SELECT id FROM areas WHERE codigo = $1 AND id != $2", [codigo, id]);
      if (codigoExiste.rows.length > 0) throw httpError(409, `El código ${codigo} ya pertenece a otra área`);
    }

    await pool.query(
      `UPDATE areas 
       SET codigo = $1, nombre = $2, tipo = $3, capacidad = $4, 
           piso = $5, descripcion = $6, activo = $7 
       WHERE id = $8`,
      [codigo, nombre, tipo, capacidad, piso, descripcion, activo, id]
    );

    const { rows } = await pool.query("SELECT * FROM areas WHERE id = $1", [id]);

    res.json({
      ok: true,
      message: 'Área actualizada correctamente',
      data: rows[0]
    });
  } catch (err) { next(err); }
};

// DELETE /api/areas/:id
export const eliminarArea = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enUso = await pool.query("SELECT id FROM asistencias WHERE area_id = $1 LIMIT 1", [id]);
    if (enUso.rows.length > 0) throw httpError(409, 'No se puede eliminar el área porque ya tiene asistencias registradas');

    const horariosEnUso = await pool.query("SELECT id FROM horarios WHERE area_id = $1 LIMIT 1", [id]);
    if (horariosEnUso.rows.length > 0) throw httpError(409, 'No se puede eliminar el área porque tiene horarios asociados');

    const result = await pool.query("DELETE FROM areas WHERE id = $1", [id]);
    
    if (result.rowCount === 0) throw httpError(404, 'Área no encontrada');

    res.json({ ok: true, message: 'Área eliminada correctamente' });
  } catch (err) { next(err); }
};