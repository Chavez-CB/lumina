import pool from '../config/db.js';

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ========== Función auxiliar para verificar si un embedding ya existe ==========
/**
 * Verifica si un descriptor facial ya está asociado a otra persona.
 * @param {Array|Object} descriptorFacial - El embedding a verificar.
 * @param {number|null} excludeId - ID de persona a excluir (para edición).
 * @returns {Promise<Object|null>} - Retorna la persona que ya tiene ese embedding o null.
 */
const verificarEmbeddingUnico = async (descriptorFacial, excludeId = null) => {
  if (!descriptorFacial) return null;

  // Normalizar: si es objeto con propiedad 'embedding' (como devuelve face service) extraemos
  let embeddingToCheck = descriptorFacial;
  if (descriptorFacial.embedding && Array.isArray(descriptorFacial.embedding)) {
    embeddingToCheck = descriptorFacial.embedding;
  }
  const embeddingArray = Array.isArray(embeddingToCheck) ? embeddingToCheck : null;
  if (!embeddingArray) return null;

  const embeddingStr = JSON.stringify(embeddingArray);

  let query = `
    SELECT id, nombres, apellidos, dni
    FROM personas
    WHERE descriptor_facial IS NOT NULL
      AND descriptor_facial::text = $1
  `;
  const params = [embeddingStr];
  if (excludeId) {
    query += ` AND id != $2`;
    params.push(excludeId);
  }
  query += ` LIMIT 1`;

  const { rows } = await pool.query(query, params);
  return rows.length ? rows[0] : null;
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

    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total FROM personas p ${where}`,
      params
    );
    const total = parseInt(totalResult.rows[0].total);

    const empleadosResult = await pool.query(
      `SELECT
         p.id, p.codigo, p.nombres, p.apellidos,
         p.dni, p.email, p.telefono, p.foto_url,
         p.sueldo,
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
              foto_url, sueldo, activo, created_at, updated_at
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
    const {
      nombres, apellidos, dni, email, telefono, codigo,
      foto_url, descriptor_facial, sueldo
    } = req.body;

    if (!foto_url) {
      throw httpError(400, 'La URL de la foto de Supabase es obligatoria');
    }

    // ✅ Validar que el embedding (si se envía) no pertenezca a otra persona
    if (descriptor_facial) {
      const existente = await verificarEmbeddingUnico(descriptor_facial);
      if (existente) {
        throw httpError(409, `El rostro ya está registrado para la persona ${existente.nombres} ${existente.apellidos} (DNI: ${existente.dni || 'N/A'}). No se puede duplicar.`);
      }
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

    const insertResult = await pool.query(
      `INSERT INTO personas 
        (tipo, codigo, nombres, apellidos, dni, email, telefono, foto_url, descriptor_facial, sueldo)
       VALUES ('empleado', $1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, codigo, nombres, apellidos, dni, email, telefono, foto_url, sueldo, activo, created_at`,
      [
        codigo || null,
        nombres,
        apellidos,
        dni,
        email || null,
        telefono || null,
        foto_url,
        descriptor_facial ? JSON.stringify(descriptor_facial) : null,
        sueldo !== undefined && sueldo !== null ? parseFloat(sueldo) : null
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Empleado registrado con éxito',
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
    const {
      nombres, apellidos, dni, email, telefono, codigo,
      foto_url, descriptor_facial, sueldo
    } = req.body;

    // Verificar que existe
    const existe = await pool.query("SELECT id FROM personas WHERE id = $1 AND tipo = 'empleado'", [id]);
    if (existe.rows.length === 0) throw httpError(404, 'Empleado no encontrado');

    // ✅ Validar unicidad del embedding (excluyendo el propio ID)
    if (descriptor_facial !== undefined) {
      if (descriptor_facial !== null) {
        const existente = await verificarEmbeddingUnico(descriptor_facial, parseInt(id));
        if (existente) {
          throw httpError(409, `El rostro ya está registrado para otra persona (ID ${existente.id}: ${existente.nombres} ${existente.apellidos}). No se puede asignar.`);
        }
      }
    }

    // Validar duplicados de DNI, email, código (excluyendo el propio registro)
    if (dni) {
      const dniResult = await pool.query('SELECT id FROM personas WHERE dni = $1 AND id != $2', [dni, id]);
      if (dniResult.rows.length > 0) throw httpError(409, `El DNI ${dni} ya está registrado por otra persona`);
    }
    if (email) {
      const emailResult = await pool.query('SELECT id FROM personas WHERE email = $1 AND id != $2', [email, id]);
      if (emailResult.rows.length > 0) throw httpError(409, `El email ${email} ya está registrado por otra persona`);
    }
    if (codigo) {
      const codigoResult = await pool.query('SELECT id FROM personas WHERE codigo = $1 AND id != $2', [codigo, id]);
      if (codigoResult.rows.length > 0) throw httpError(409, `El código ${codigo} ya está registrado por otra persona`);
    }

    // Construir UPDATE dinámico
    const campos = {
      nombres,
      apellidos,
      dni,
      email,
      telefono,
      codigo,
      foto_url,
      sueldo: sueldo !== undefined ? (sueldo !== null ? parseFloat(sueldo) : null) : undefined,
      descriptor_facial: descriptor_facial !== undefined ? (descriptor_facial ? JSON.stringify(descriptor_facial) : null) : undefined
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

    if (setClauses.length === 0) {
      return res.status(422).json({ ok: false, message: 'Nada que actualizar' });
    }

    values.push(id);
    await pool.query(`UPDATE personas SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);

    const { rows } = await pool.query(
      `SELECT id, codigo, nombres, apellidos, dni, email, telefono, 
              foto_url, sueldo, activo, updated_at 
       FROM personas WHERE id = $1`,
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