import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Listar (paginado + filtros)
export const listarAdmins = async (req, res, next) => {
  try {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));
    const offset = (pagina - 1) * limite;
    const buscar = req.query.buscar?.trim() || null;
    const activo = req.query.activo !== undefined ? parseInt(req.query.activo) : null;

    let where = 'WHERE 1=1';
    const params = [];

    if (buscar) {
      where += ` AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)`;
      const like = `%${buscar}%`;
      params.push(like, like, like);
    }
    if (activo !== null) {
      where += ' AND activo = ?';
      params.push(activo);
    }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM admin ${where}`, params);

    const [admins] = await pool.query(
      `SELECT id, nombre, apellido, email, activo, ultimo_acceso, created_at, updated_at 
       FROM admin ${where} 
       ORDER BY apellido ASC, nombre ASC 
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    res.json({
      ok: true,
      data: admins,
      meta: { total, pagina, limite, paginas: Math.ceil(total / limite) }
    });
  } catch (err) { next(err); }
};

// Obtener uno
export const obtenerAdmin = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, apellido, email, activo, ultimo_acceso, created_at, updated_at 
       FROM admin WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) throw httpError(404, 'Admin no encontrado');
    res.json({ ok: true, data: rows[0] });
  } catch (err) { next(err); }
};

// Crear
export const crearAdmin = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    // Verificar duplicados
    const [[existe]] = await pool.query('SELECT id FROM admin WHERE email = ?', [email]);
    if (existe) throw httpError(409, 'Ya existe un administrador con ese email');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO admin (nombre, apellido, email, password_hash) 
       VALUES (?, ?, ?, ?)`,
      [nombre, apellido, email, password_hash]
    );

    const [[nuevo]] = await pool.query(
      'SELECT id, nombre, apellido, email, activo, created_at FROM admin WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      ok: true,
      message: 'Administrador creado correctamente',
      data: nuevo
    });
  } catch (err) { next(err); }
};

// Editar
export const editarAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, password, activo } = req.body;

    const [[existe]] = await pool.query('SELECT id FROM admin WHERE id = ?', [id]);
    if (!existe) throw httpError(404, 'Admin no encontrado');

    // Verificar email duplicado (excluyendo él mismo)
    if (email) {
      const [[dup]] = await pool.query('SELECT id FROM admin WHERE email = ? AND id != ?', [email, id]);
      if (dup) throw httpError(409, 'El email ya está en uso');
    }

    let query = 'UPDATE admin SET ';
    const updates = [];
    const values = [];

    if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre); }
    if (apellido !== undefined) { updates.push('apellido = ?'); values.push(apellido); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (activo !== undefined) { updates.push('activo = ?'); values.push(activo); }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      updates.push('password_hash = ?');
      values.push(hash);
    }

    if (!updates.length) return res.status(422).json({ ok: false, message: 'No hay campos para actualizar' });

    values.push(id);
    await pool.query(query + updates.join(', ') + ' WHERE id = ?', values);

    const [[actualizado]] = await pool.query(
      'SELECT id, nombre, apellido, email, activo, ultimo_acceso, updated_at FROM admin WHERE id = ?',
      [id]
    );

    res.json({ ok: true, message: 'Admin actualizado', data: actualizado });
  } catch (err) { next(err); }
};

// Baja lógica
export const darDeBajaAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[admin]] = await pool.query('SELECT activo FROM admin WHERE id = ?', [id]);
    if (!admin) throw httpError(404, 'Admin no encontrado');
    if (!admin.activo) throw httpError(409, 'Ya está dado de baja');

    await pool.query('UPDATE admin SET activo = 0 WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Administrador dado de baja' });
  } catch (err) { next(err); }
};

// Reactivar
export const reactivarAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[admin]] = await pool.query('SELECT activo FROM admin WHERE id = ?', [id]);
    if (!admin) throw httpError(404, 'Admin no encontrado');
    if (admin.activo) throw httpError(409, 'Ya está activo');

    await pool.query('UPDATE admin SET activo = 1 WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Administrador reactivado' });
  } catch (err) { next(err); }
};
