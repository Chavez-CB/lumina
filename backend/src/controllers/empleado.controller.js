import pool from '../config/db.js';

// ── Helper: lanza error con status HTTP ────────────────────────────────────
const httpError = (status, message) => {
  const err  = new Error(message);
  err.status = status;
  return err;
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/empleados
// Query params: pagina, limite, buscar, activo
// ═══════════════════════════════════════════════════════════════════════════
export const listarEmpleados = async (req, res, next) => {
  try {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));
    const offset = (pagina - 1) * limite;
    const buscar = req.query.buscar?.trim() || null;
    const activo = req.query.activo !== undefined ? req.query.activo : null;

    // Filtros dinámicos
    const filtros = ["p.tipo = 'empleado'"];
    const params  = [];

    if (buscar) {
      filtros.push(`(
        p.nombres  LIKE ? OR
        p.apellidos LIKE ? OR
        p.dni       LIKE ? OR
        p.codigo    LIKE ? OR
        p.email     LIKE ?
      )`);
      const like = `%${buscar}%`;
      params.push(like, like, like, like, like);
    }

    if (activo !== null) {
      filtros.push('p.activo = ?');
      params.push(activo);
    }

    const where = `WHERE ${filtros.join(' AND ')}`;

    // Total para paginación
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM personas p ${where}`,
      params
    );

    // Datos paginados
    const [empleados] = await pool.query(
      `SELECT
         p.id, p.codigo, p.nombres, p.apellidos,
         p.dni, p.email, p.telefono, p.foto_url,
         p.activo,
         p.created_at, p.updated_at
       FROM personas p
       ${where}
       ORDER BY p.apellidos ASC, p.nombres ASC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    res.json({
      ok:   true,
      data: empleados,
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
    const [rows] = await pool.query(
      `SELECT
         p.id, p.codigo, p.nombres, p.apellidos,
         p.dni, p.email, p.telefono, p.foto_url,
         p.activo, p.created_at, p.updated_at
       FROM personas p
       WHERE p.id = ? AND p.tipo = 'empleado'`,
      [req.params.id]
    );

    if (!rows.length) throw httpError(404, 'Empleado no encontrado');

    res.json({ ok: true, data: rows[0] });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/empleados
// ═══════════════════════════════════════════════════════════════════════════
export const crearEmpleado = async (req, res, next) => {
  try {
    const { nombres, apellidos, dni, email, telefono, codigo, foto_url } = req.body;

    // Verificar DNI duplicado
    const [[dniExiste]] = await pool.query(
      'SELECT id FROM personas WHERE dni = ?', [dni]
    );
    if (dniExiste) throw httpError(409, `Ya existe una persona con el DNI ${dni}`);

    // Verificar email duplicado
    if (email) {
      const [[emailExiste]] = await pool.query(
        'SELECT id FROM personas WHERE email = ?', [email]
      );
      if (emailExiste) throw httpError(409, `Ya existe una persona con el email ${email}`);
    }

    // Verificar código duplicado
    if (codigo) {
      const [[codigoExiste]] = await pool.query(
        'SELECT id FROM personas WHERE codigo = ?', [codigo]
      );
      if (codigoExiste) throw httpError(409, `Ya existe una persona con el código ${codigo}`);
    }

    const [result] = await pool.query(
      `INSERT INTO personas
         (tipo, codigo, nombres, apellidos, dni, email, telefono, foto_url)
       VALUES
         ('empleado', ?, ?, ?, ?, ?, ?, ?)`,
      [codigo || null, nombres, apellidos, dni, email || null, telefono || null, foto_url || null]
    );

    const [[nuevoEmpleado]] = await pool.query(
      'SELECT id, codigo, nombres, apellidos, dni, email, telefono, foto_url, activo, created_at FROM personas WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      ok:      true,
      message: 'Empleado registrado correctamente',
      data:    nuevoEmpleado,
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/empleados/:id
// ═══════════════════════════════════════════════════════════════════════════
export const editarEmpleado = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const [[empleado]] = await pool.query(
      "SELECT id FROM personas WHERE id = ? AND tipo = 'empleado'", [id]
    );
    if (!empleado) throw httpError(404, 'Empleado no encontrado');

    const { nombres, apellidos, dni, email, telefono, codigo, foto_url } = req.body;

    // Verificar duplicados excluyendo el propio registro
    if (dni) {
      const [[dniExiste]] = await pool.query(
        'SELECT id FROM personas WHERE dni = ? AND id != ?', [dni, id]
      );
      if (dniExiste) throw httpError(409, `El DNI ${dni} ya pertenece a otra persona`);
    }

    if (email) {
      const [[emailExiste]] = await pool.query(
        'SELECT id FROM personas WHERE email = ? AND id != ?', [email, id]
      );
      if (emailExiste) throw httpError(409, `El email ${email} ya pertenece a otra persona`);
    }

    if (codigo) {
      const [[codigoExiste]] = await pool.query(
        'SELECT id FROM personas WHERE codigo = ? AND id != ?', [codigo, id]
      );
      if (codigoExiste) throw httpError(409, `El código ${codigo} ya pertenece a otra persona`);
    }

    // Construir SET dinámico (solo campos enviados)
    const campos = { nombres, apellidos, dni, email, telefono, codigo, foto_url };
    const setClauses = [];
    const values     = [];

    for (const [campo, valor] of Object.entries(campos)) {
      if (valor !== undefined) {
        setClauses.push(`${campo} = ?`);
        values.push(valor ?? null);
      }
    }

    if (!setClauses.length) {
      return res.status(422).json({ ok: false, message: 'No se enviaron campos para actualizar' });
    }

    values.push(id);
    await pool.query(
      `UPDATE personas SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    const [[actualizado]] = await pool.query(
      'SELECT id, codigo, nombres, apellidos, dni, email, telefono, foto_url, activo, updated_at FROM personas WHERE id = ?',
      [id]
    );

    res.json({
      ok:      true,
      message: 'Empleado actualizado correctamente',
      data:    actualizado,
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/empleados/:id/baja
// Baja lógica (activo = 0)
// ═══════════════════════════════════════════════════════════════════════════
export const darDeBaja = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[empleado]] = await pool.query(
      "SELECT id, activo FROM personas WHERE id = ? AND tipo = 'empleado'", [id]
    );
    if (!empleado) throw httpError(404, 'Empleado no encontrado');
    if (!empleado.activo) throw httpError(409, 'El empleado ya está dado de baja');

    await pool.query(
      "UPDATE personas SET activo = 0 WHERE id = ?", [id]
    );

    res.json({ ok: true, message: 'Empleado dado de baja correctamente' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/empleados/:id/reactivar
// Reactiva un empleado dado de baja
// ═══════════════════════════════════════════════════════════════════════════
export const reactivarEmpleado = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[empleado]] = await pool.query(
      "SELECT id, activo FROM personas WHERE id = ? AND tipo = 'empleado'", [id]
    );
    if (!empleado) throw httpError(404, 'Empleado no encontrado');
    if (empleado.activo) throw httpError(409, 'El empleado ya está activo');

    await pool.query(
      "UPDATE personas SET activo = 1 WHERE id = ?", [id]
    );

    res.json({ ok: true, message: 'Empleado reactivado correctamente' });
  } catch (err) { next(err); }
};
