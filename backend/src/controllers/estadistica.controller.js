import { pool } from '../config/db.js';

// GET /api/asistencias/stats/resumen-mensual
export const obtenerResumenMensual = async (req, res, next) => {
  try {
    const { mes, persona_id } = req.query;
    let query = "SELECT * FROM v_resumen_asistencia WHERE 1=1";
    const params = [];

    if (mes) { query += " AND mes = ?"; params.push(mes); }
    if (persona_id) { query += " AND persona_id = ?"; params.push(persona_id); }

    const [rows] = await pool.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/asistencias/stats/kpi-diario
export const obtenerKpiDiario = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    let query = "SELECT * FROM v_kpi_diario WHERE 1=1";
    const params = [];

    if (fecha_inicio && fecha_fin) {
      query += " AND fecha BETWEEN ? AND ?";
      params.push(fecha_inicio, fecha_fin);
    }

    const [rows] = await pool.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/asistencias/stats/ranking-asistencia
export const obtenerRankingAsistencia = async (req, res, next) => {
  try {
    const { criterio = 'pct_asistencia', orden = 'DESC', limite = 10 } = req.query;
    
    const criteriosValidos = ['pct_asistencia', 'presentes', 'tardanzas', 'ausentes'];
    if (!criteriosValidos.includes(criterio)) {
      return res.status(400).json({ ok: false, message: 'Criterio de ranking no válido' });
    }

    const query = `
      SELECT persona_id, persona, SUM(presentes) as total_presentes, 
             SUM(tardanzas) as total_tardanzas, SUM(ausentes) as total_ausentes,
             ROUND(AVG(pct_asistencia), 1) as promedio_pct
      FROM v_resumen_asistencia
      GROUP BY persona_id, persona
      ORDER BY ${criterio === 'pct_asistencia' ? 'promedio_pct' : criterio} ${orden}
      LIMIT ?
    `;
    
    const [rows] = await pool.query(query, [parseInt(limite)]);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/asistencias/stats/records-empleado/:persona_id
export const obtenerRecordsEmpleado = async (req, res, next) => {
  try {
    const { persona_id } = req.params;

    const [[totales]] = await pool.query(`
      SELECT COUNT(*) as total_registros, SUM(estado = 'presente') as total_presentes,
             SUM(estado = 'tardanza') as total_tardanzas, SUM(estado = 'ausente') as total_ausentes,
             SUM(estado = 'justificado') as total_justificados
      FROM asistencias WHERE persona_id = ?
    `, [persona_id]);

    const [asistencias] = await pool.query(`
      SELECT fecha, estado FROM asistencias WHERE persona_id = ? ORDER BY fecha DESC
    `, [persona_id]);

    let rachaActual = 0, mejorRacha = 0;
    for (const a of asistencias) {
      if (a.estado === 'presente') {
        rachaActual++;
        if (rachaActual > mejorRacha) mejorRacha = rachaActual;
      } else { rachaActual = 0; }
    }

    const [[promedioEntrada]] = await pool.query(`
      SELECT DATE_FORMAT(AVG(hora_entrada), '%H:%i:%s') as hora_promedio
      FROM asistencias WHERE persona_id = ? AND hora_entrada IS NOT NULL
    `, [persona_id]);

    res.json({
      ok: true,
      data: {
        historico: totales,
        records: { mejor_racha_puntualidad: mejorRacha, hora_entrada_promedio: promedioEntrada.hora_promedio }
      }
    });
  } catch (err) { next(err); }
};