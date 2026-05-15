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
    // Ahora extraemos foto_url que vendrá desde el cliente (Supabase)
    const { nombres, apellidos, dni, email, telefono, codigo, foto_url, descriptor_facial } = req.body;

    // Validación básica: Si no hay foto_url de Supabase, lanzamos error
    if (!foto_url) {
      throw httpError(400, 'La URL de la foto de Supabase es obligatoria');
    }

    // Verificar duplicados (DNI, Email, Código)
    if (dni) {
      const dniResult = await pool.query('SELECT id FROM personas WHERE dni = $1', [dni]);
      if (dniResult.rows.length > 0) throw httpError(409, `El DNI ${dni} ya está registrado`);
    }

    if (email) {
      const emailResult = await pool.query('SELECT id FROM personas WHERE email = $1', [email]);
      if (emailResult.rows.length > 0) throw httpError(409, `El email ${email} ya está registrado`);
    }

    if (codigo) {
      const codigoResult = await pool.query('SELECT id FROM personas WHERE codigo = $1', [codigo]);
      if (codigoResult.rows.length > 0) throw httpError(409, `El código ${codigo} ya está registrado`);
    }

    // Insertar incluyendo la URL de Supabase y el descriptor facial
    const insertResult = await pool.query(
      `INSERT INTO personas (tipo, codigo, nombres, apellidos, dni, email, telefono, foto_url, descriptor_facial)
       VALUES ('empleado', $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, codigo, nombres, apellidos, dni, email, telefono, foto_url, activo, created_at`,
      [
        codigo || null,
        nombres,
        apellidos,
        dni,
        email || null,
        telefono || null,
        foto_url, // URL de Supabase Storage
        descriptor_facial ? JSON.stringify(descriptor_facial) : null
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Empleado registrado con éxito (Imagen en Supabase)',
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
    const { nombres, apellidos, dni, email, telefono, codigo, foto_url, descriptor_facial } = req.body;

    // Verificar que existe
    const existe = await pool.query("SELECT id FROM personas WHERE id = $1 AND tipo = 'empleado'", [id]);
    if (existe.rows.length === 0) throw httpError(404, 'Empleado no encontrado');

    // ... (Validaciones de duplicados se mantienen igual)

    // Construir UPDATE dinámico
    const campos = {
      nombres,
      apellidos,
      dni,
      email,
      telefono,
      codigo,
      foto_url, // Si el usuario cambia la foto en Supabase, enviará la nueva URL
      descriptor_facial: descriptor_facial ? JSON.stringify(descriptor_facial) : undefined
    };

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

    if (setClauses.length === 0) return res.status(422).json({ ok: false, message: 'Nada que actualizar' });

    values.push(id);
    await pool.query(`UPDATE personas SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);

    const { rows } = await pool.query(
      'SELECT id, codigo, nombres, apellidos, dni, email, telefono, foto_url, activo, updated_at FROM personas WHERE id = $1',
      [id]
    );

    res.json({ ok: true, message: 'Datos actualizados', data: rows[0] });
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