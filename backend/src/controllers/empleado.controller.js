import pool from '../config/db.js';

// ── Helper: lanza error con status HTTP ────────────────────────────────────
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/empleados
// ═══════════════════════════════════════════════════════════════════════════
export const listarEmpleados = async (req, res, next) => {
  try {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));
    const offset = (pagina - 1) * limite;
    const buscar = req.query.buscar?.trim() || null;
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : null;

    let filtros = ["p.tipo = 'empleado'"];
    let params = [];
    let paramIndex = 1;

    if (buscar) {
      filtros.push(`(
        p.nombres ILIKE $${paramIndex} OR 
        p.apellidos ILIKE $${paramIndex + 1} OR 
        p.dni ILIKE $${paramIndex + 2} OR 
        p.codigo ILIKE $${paramIndex + 3} OR 
        p.email ILIKE $${paramIndex + 4}
      )`);
      const like = `%${buscar}%`;
      params.push(like, like, like, like, like);
      paramIndex += 5;
    }

    if (activo !== null) {
      filtros.push(`p.activo = $${paramIndex}`);
      params.push(activo);
      paramIndex++;
    }

    const where = `WHERE ${filtros.join(' AND ')}`;

    // Total para paginación
    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total FROM personas p ${where}`,
      params
    );
    const total = parseInt(totalResult.rows[0].total);

    // Datos paginados
    const empleadosResult = await pool.query(
      `SELECT
         p.id, p.codigo, p.nombres, p.apellidos,
         p.dni, p.email, p.telefono, p.foto_url,
         p.activo, p.created_at, p.updated_at
       FROM personas p
       ${where}
       ORDER BY p.apellidos ASC, p.nombres ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limite, offset]
    );

    res.json({
      ok: true,
      data: empleadosResult.rows,
      meta: {
        total,
        pagina,
        limite,
        paginas: Math.ceil(total / limite),
      },
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/empleados/:id
// ═══════════════════════════════════════════════════════════════════════════
export const obtenerEmpleado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, codigo, nombres, apellidos, dni, email, telefono, 
              foto_url, activo, created_at, updated_at
       FROM personas 
       WHERE id = $1 AND tipo = 'empleado'`,
      [id]
    );

    if (result.rows.length === 0) throw httpError(404, 'Empleado no encontrado');

    res.json({ ok: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/empleados
// ═══════════════════════════════════════════════════════════════════════════
export const crearEmpleado = async (req, res, next) => {
  try {
    const { nombres, apellidos, dni, email, telefono, codigo, foto_url } = req.body;

    // Verificar duplicados
    if (dni) {
      const dniResult = await pool.query('SELECT id FROM personas WHERE dni = $1', [dni]);
      if (dniResult.rows.length > 0) throw httpError(409, `Ya existe una persona con el DNI ${dni}`);
    }

    if (email) {
      const emailResult = await pool.query('SELECT id FROM personas WHERE email = $1', [email]);
      if (emailResult.rows.length > 0) throw httpError(409, `Ya existe una persona con el email ${email}`);
    }

    if (codigo) {
      const codigoResult = await pool.query('SELECT id FROM personas WHERE codigo = $1', [codigo]);
      if (codigoResult.rows.length > 0) throw httpError(409, `Ya existe una persona con el código ${codigo}`);
    }

    const insertResult = await pool.query(
      `INSERT INTO personas (tipo, codigo, nombres, apellidos, dni, email, telefono, foto_url)
       VALUES ('empleado', $1, $2, $3, $4, $5, $6, $7)
       RETURNING id, codigo, nombres, apellidos, dni, email, telefono, foto_url, activo, created_at`,
      [codigo || null, nombres, apellidos, dni, email || null, telefono || null, foto_url || null]
    );

    res.status(201).json({
      ok: true,
      message: 'Empleado registrado correctamente',
      data: insertResult.rows[0]
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/empleados/:id
// ═══════════════════════════════════════════════════════════════════════════
export const editarEmpleado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, dni, email, telefono, codigo, foto_url } = req.body;

    // Verificar que existe
    const existe = await pool.query("SELECT id FROM personas WHERE id = $1 AND tipo = 'empleado'", [id]);
    if (existe.rows.length === 0) throw httpError(404, 'Empleado no encontrado');

    // Verificar duplicados excluyendo el propio registro
    if (dni) {
      const dniExiste = await pool.query('SELECT id FROM personas WHERE dni = $1 AND id != $2', [dni, id]);
      if (dniExiste.rows.length > 0) throw httpError(409, `El DNI ${dni} ya pertenece a otra persona`);
    }

    if (email) {
      const emailExiste = await pool.query('SELECT id FROM personas WHERE email = $1 AND id != $2', [email, id]);
      if (emailExiste.rows.length > 0) throw httpError(409, `El email ${email} ya pertenece a otra persona`);
    }

    if (codigo) {
      const codigoExiste = await pool.query('SELECT id FROM personas WHERE codigo = $1 AND id != $2', [codigo, id]);
      if (codigoExiste.rows.length > 0) throw httpError(409, `El código ${codigo} ya pertenece a otra persona`);
    }

    // Construir UPDATE dinámico
    const campos = { nombres, apellidos, dni, email, telefono, codigo, foto_url };
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [campo, valor] of Object.entries(campos)) {
      if (valor !== undefined) {
        setClauses.push(`${campo} = $${paramIndex}`);
        values.push(valor ?? null);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(422).json({ ok: false, message: 'No se enviaron campos para actualizar' });
    }

    values.push(id); // Para el WHERE

    await pool.query(
      `UPDATE personas SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    const { rows } = await pool.query(
      'SELECT id, codigo, nombres, apellidos, dni, email, telefono, foto_url, activo, updated_at FROM personas WHERE id = $1',
      [id]
    );

    res.json({
      ok: true,
      message: 'Empleado actualizado correctamente',
      data: rows[0]
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/empleados/:id/baja
// ═══════════════════════════════════════════════════════════════════════════
export const darDeBaja = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      "SELECT id, activo FROM personas WHERE id = $1 AND tipo = 'empleado'", 
      [id]
    );

    if (rows.length === 0) throw httpError(404, 'Empleado no encontrado');
    if (!rows[0].activo) throw httpError(409, 'El empleado ya está dado de baja');

    await pool.query("UPDATE personas SET activo = false WHERE id = $1", [id]);

    res.json({ ok: true, message: 'Empleado dado de baja correctamente' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/empleados/:id/reactivar
// ═══════════════════════════════════════════════════════════════════════════
export const reactivarEmpleado = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      "SELECT id, activo FROM personas WHERE id = $1 AND tipo = 'empleado'", 
      [id]
    );

    if (rows.length === 0) throw httpError(404, 'Empleado no encontrado');
    if (rows[0].activo) throw httpError(409, 'El empleado ya está activo');

    await pool.query("UPDATE personas SET activo = true WHERE id = $1", [id]);

    res.json({ ok: true, message: 'Empleado reactivado correctamente' });
  } catch (err) { next(err); }
};