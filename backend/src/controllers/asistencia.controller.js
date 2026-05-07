import { pool } from '../config/db.js';

// Helper para errores HTTP
const httpError = (status, message ) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// GET /api/asistencias
export const listarAsistencias = async (req, res, next) => {
  try {
    const { fecha, persona_id, estado, pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT a.*, 
             CONCAT(p.nombres, ' ', p.apellidos) as persona_nombre,
             h.nombre as horario_nombre,
             ar.nombre as area_nombre
      FROM asistencias a
      JOIN personas p ON a.persona_id = p.id
      JOIN horarios h ON a.horario_id = h.id
      LEFT JOIN areas ar ON a.area_id = ar.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha) { query += " AND a.fecha = ?"; params.push(fecha); }
    if (persona_id) { query += " AND a.persona_id = ?"; params.push(persona_id); }
    if (estado) { query += " AND a.estado = ?"; params.push(estado); }

    query += " ORDER BY a.fecha DESC, a.hora_entrada DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limite), parseInt(offset));

    const [rows] = await pool.query(query, params);
    
    let countQuery = "SELECT COUNT(*) as total FROM asistencias WHERE 1=1";
    const countParams = [];
    if (fecha) { countQuery += " AND fecha = ?"; countParams.push(fecha); }
    if (persona_id) { countQuery += " AND persona_id = ?"; countParams.push(persona_id); }
    if (estado) { countQuery += " AND estado = ?"; countParams.push(estado); }
    
    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      ok: true,
      data: rows,
      meta: { total, pagina: parseInt(pagina), limite: parseInt(limite), paginas: Math.ceil(total / limite) }
    });
  } catch (err) { next(err); }
};

// POST /api/asistencias/registrar
export const registrarAsistencia = async (req, res, next) => {
  try {
    const { persona_id, horario_id, area_id, metodo_registro, confianza_facial, observacion, registrado_por } = req.body;
    const fecha = new Date().toISOString().split('T')[0];
    const hora_entrada = new Date();

    const [[existe]] = await pool.query(
      "SELECT id FROM asistencias WHERE persona_id = ? AND horario_id = ? AND fecha = ?",
      [persona_id, horario_id, fecha]
    );
    if (existe) throw httpError(409, 'Ya existe un registro de asistencia para este horario el día de hoy' );

    const [[horario]] = await pool.query("SELECT hora_inicio, tolerancia FROM horarios WHERE id = ?", [horario_id]);
    if (!horario) throw httpError(404, 'Horario no encontrado' );

    const [h, m, s] = horario.hora_inicio.split(':');
    const limiteEntrada = new Date();
    limiteEntrada.setHours(h, parseInt(m) + horario.tolerancia, s || 0);

    const estado = hora_entrada > limiteEntrada ? 'tardanza' : 'presente';

    const [result] = await pool.query(
      `INSERT INTO asistencias 
        (persona_id, horario_id, area_id, fecha, hora_entrada, estado, metodo_registro, confianza_facial, observacion, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [persona_id, horario_id, area_id, fecha, hora_entrada, estado, metodo_registro || 'facial', confianza_facial, observacion, registrado_por]
    );

    const [[nuevaAsistencia]] = await pool.query("SELECT * FROM asistencias WHERE id = ?", [result.insertId]);

    res.status(201).json({ ok: true, message: 'Asistencia registrada correctamente', data: nuevaAsistencia });
  } catch (err) { next(err); }
};

// GET /api/asistencias/:id
export const obtenerAsistencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[asistencia]] = await pool.query(
      `SELECT a.*, CONCAT(p.nombres, ' ', p.apellidos) as persona_nombre, h.nombre as horario_nombre, ar.nombre as area_nombre
       FROM asistencias a JOIN personas p ON a.persona_id = p.id JOIN horarios h ON a.horario_id = h.id LEFT JOIN areas ar ON a.area_id = ar.id
       WHERE a.id = ?`, [id]
    );
    if (!asistencia) throw httpError(404, 'Asistencia no encontrada' );
    res.json({ ok: true, data: asistencia });
  } catch (err) { next(err); }
};