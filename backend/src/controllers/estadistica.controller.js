import pool from '../config/db.js';

// GET /api/asistencias/stats/resumen-mensual
export const obtenerResumenMensual = async (req, res, next) => {
  try {
    const { mes, persona_id } = req.query;
    let query = "SELECT * FROM v_resumen_asistencia WHERE 1=1";
    const params = [];
    let index = 1;

    if (mes) { 
      query += ` AND mes = $${index}`; 
      params.push(mes); 
      index++;
    }
    if (persona_id) { 
      query += ` AND persona_id = $${index}`; 
      params.push(persona_id); 
      index++;
    }

    const { rows } = await pool.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/asistencias/stats/kpi-diario
export const obtenerKpiDiario = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    let query = "SELECT * FROM v_kpi_diario WHERE 1=1";
    const params = [];
    let index = 1;

    if (fecha_inicio && fecha_fin) {
      query += ` AND fecha BETWEEN $${index} AND $${index + 1}`;
      params.push(fecha_inicio, fecha_fin);
    }

    const { rows } = await pool.query(query, params);
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
      LIMIT $1
    `;
    
    const { rows } = await pool.query(query, [parseInt(limite)]);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/asistencias/stats/records-empleado/:persona_id
export const obtenerRecordsEmpleado = async (req, res, next) => {
  try {
    const { persona_id } = req.params;

    const { rows: [totales] } = await pool.query(`
      SELECT COUNT(*) as total_registros, 
             COUNT(CASE WHEN estado = 'presente' THEN 1 END) as total_presentes,
             COUNT(CASE WHEN estado = 'tardanza' THEN 1 END) as total_tardanzas,
             COUNT(CASE WHEN estado = 'ausente' THEN 1 END) as total_ausentes,
             COUNT(CASE WHEN estado = 'justificado' THEN 1 END) as total_justificados
      FROM asistencias WHERE persona_id = $1
    `, [persona_id]);

    // Resto de la lógica (racha, etc.) se mantiene igual
    res.json({ ok: true, data: { historico: totales /* ... */ } });
  } catch (err) { next(err); }
};