import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ── GET /api/admin ─────────────────────────────────────────────────────────
export const listarAdmins = async (req, res, next) => {
  try {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));
    const offset = (pagina - 1) * limite;
    const buscar = req.query.buscar?.trim() || null;
    const activo = req.query.activo !== undefined
      ? (req.query.activo === 'true' || req.query.activo === '1')
      : null;

    const conditions = ['1=1'];
    const params = [];
    let idx = 1;

    if (buscar) {
      conditions.push(`(nombre ILIKE $${idx} OR apellido ILIKE $${idx + 1} OR email ILIKE $${idx + 2})`);
      const like = `%${buscar}%`;
      params.push(like, like, like);
      idx += 3;
    }
    if (activo !== null) {
      conditions.push(`activo = $${idx}`);
      params.push(activo);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows: [{ total }] } = await pool.query(
      `SELECT COUNT(*) AS total FROM admin ${where}`,
      params
    );

    const { rows: admins } = await pool.query(
      `SELECT id, nombre, apellido, email, activo, ultimo_acceso, created_at, updated_at 
       FROM admin ${where} 
       ORDER BY apellido ASC, nombre ASC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limite, offset]
    );

    res.json({
      ok: true,
      data: admins,
      meta: { total: parseInt(total), pagina, limite, paginas: Math.ceil(total / limite) }
    });
  } catch (err) { next(err); }
};

// ── GET /api/admin/:id ─────────────────────────────────────────────────────
export const obtenerAdmin = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, apellido, email, activo, ultimo_acceso, created_at, updated_at 
       FROM admin WHERE id = $1`,
      [req.params.id]
    );

    if (!rows.length) throw httpError(404, 'Admin no encontrado');
    res.json({ ok: true, data: rows[0] });
  } catch (err) { next(err); }
};

// ── POST /api/admin ────────────────────────────────────────────────────────
export const crearAdmin = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    const { rows: [existe] } = await pool.query(
      'SELECT id FROM admin WHERE email = $1',
      [email]
    );
    if (existe) throw httpError(409, 'Ya existe un administrador con ese email');

    const password_hash = await bcrypt.hash(password, 10);

    const { rows: [nuevo] } = await pool.query(
      `INSERT INTO admin (nombre, apellido, email, password_hash) 
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, apellido, email, activo, created_at`,
      [nombre, apellido, email, password_hash]
    );

    res.status(201).json({
      ok: true,
      message: 'Administrador creado correctamente',
      data: nuevo
    });
  } catch (err) { next(err); }
};

// ── PUT /api/admin/:id ─────────────────────────────────────────────────────
export const editarAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, password, activo } = req.body;

    const { rows: [existe] } = await pool.query(
      'SELECT id FROM admin WHERE id = $1',
      [id]
    );
    if (!existe) throw httpError(404, 'Admin no encontrado');

    if (email) {
      const { rows: [dup] } = await pool.query(
        'SELECT id FROM admin WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (dup) throw httpError(409, 'El email ya está en uso');
    }

    const setClauses = [];
    const values = [];
    let idx = 1;

    if (nombre !== undefined)   { setClauses.push(`nombre = $${idx}`);   values.push(nombre);   idx++; }
    if (apellido !== undefined) { setClauses.push(`apellido = $${idx}`); values.push(apellido); idx++; }
    if (email !== undefined)    { setClauses.push(`email = $${idx}`);    values.push(email);    idx++; }
    if (activo !== undefined)   { setClauses.push(`activo = $${idx}`);   values.push(activo === true || activo === 'true' || activo === 1); idx++; }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      setClauses.push(`password_hash = $${idx}`);
      values.push(hash);
      idx++;
    }

    if (!setClauses.length) {
      return res.status(422).json({ ok: false, message: 'No hay campos para actualizar' });
    }

    values.push(id);
    const { rows: [actualizado] } = await pool.query(
      `UPDATE admin SET ${setClauses.join(', ')} WHERE id = $${idx}
       RETURNING id, nombre, apellido, email, activo, ultimo_acceso, updated_at`,
      values
    );

    res.json({ ok: true, message: 'Admin actualizado', data: actualizado });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/:id/baja ──────────────────────────────────────────────
export const darDeBajaAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [admin] } = await pool.query(
      'SELECT activo FROM admin WHERE id = $1',
      [id]
    );
    if (!admin) throw httpError(404, 'Admin no encontrado');
    if (!admin.activo) throw httpError(409, 'Ya está dado de baja');

    await pool.query('UPDATE admin SET activo = FALSE WHERE id = $1', [id]);
    res.json({ ok: true, message: 'Administrador dado de baja' });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/:id/reactivar ────────────────────────────────────────
export const reactivarAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [admin] } = await pool.query(
      'SELECT activo FROM admin WHERE id = $1',
      [id]
    );
    if (!admin) throw httpError(404, 'Admin no encontrado');
    if (admin.activo) throw httpError(409, 'Ya está activo');

    await pool.query('UPDATE admin SET activo = TRUE WHERE id = $1', [id]);
    res.json({ ok: true, message: 'Administrador reactivado' });
  } catch (err) { next(err); }
};
