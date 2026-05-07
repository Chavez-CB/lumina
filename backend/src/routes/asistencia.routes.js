import { Router } from 'express';
import * as asistenciaCtrl from '../controllers/asistencia.controller.js';
import * as estadisticaCtrl from '../controllers/estadistica.controller.js';

const router = Router();

// Rutas de CRUD y Registro
router.get('/', asistenciaCtrl.listarAsistencias);
router.post('/registrar', asistenciaCtrl.registrarAsistencia);
router.get('/:id', asistenciaCtrl.obtenerAsistencia);

// Rutas de Estadísticas, Récords y Rankings
router.get('/stats/resumen-mensual', estadisticaCtrl.obtenerResumenMensual);
router.get('/stats/kpi-diario', estadisticaCtrl.obtenerKpiDiario);
router.get('/stats/ranking-asistencia', estadisticaCtrl.obtenerRankingAsistencia);
router.get('/stats/records-empleado/:persona_id', estadisticaCtrl.obtenerRecordsEmpleado);

export default router;