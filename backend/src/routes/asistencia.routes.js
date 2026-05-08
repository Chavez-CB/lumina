import { Router } from 'express';
import multer from 'multer';
import * as asistenciaCtrl from '../controllers/asistencia.controller.js';
import * as estadisticaCtrl from '../controllers/estadistica.controller.js';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rutas de CRUD y Registro
router.get('/', asistenciaCtrl.listarAsistencias);
router.post('/registrar', asistenciaCtrl.registrarAsistencia);

// POST /api/asistencias/registrar-facial
// Reconocimiento facial + registro de asistencia (mañana o cualquier hora)
router.post('/registrar-facial', upload.single('file'), asistenciaCtrl.registrarAsistenciaFacial);

// Rutas de Estadísticas, Récords y Rankings
router.get('/stats/resumen-mensual', estadisticaCtrl.obtenerResumenMensual);
router.get('/stats/kpi-diario', estadisticaCtrl.obtenerKpiDiario);
router.get('/stats/ranking-asistencia', estadisticaCtrl.obtenerRankingAsistencia);
router.get('/stats/records-empleado/:persona_id', estadisticaCtrl.obtenerRecordsEmpleado);

router.get('/:id', asistenciaCtrl.obtenerAsistencia);

export default router;
