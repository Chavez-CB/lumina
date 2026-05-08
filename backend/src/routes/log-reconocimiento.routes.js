import { Router } from 'express';
import {
  registrarLog,
  listarLogs,
  obtenerLog,
  logsPorPersona,
  logsPorArea
} from '../controllers/log-reconocimiento.controller.js';

import { validate } from '../validations/log.validations.js';
import { idParamRule } from '../validations/empleado.validations.js'; // reutilizamos

const router = Router();

// POST   /api/logs/reconocimiento          → Registrar log (principal)
router.post('/', registrarLog);

// GET    /api/logs/reconocimiento          → Listar con filtros y paginación
router.get('/', listarLogs);

// GET    /api/logs/reconocimiento/:id      → Detalle
router.get('/persona/:persona_id', logsPorPersona);

// GET    /api/logs/reconocimiento/area/:area_id
router.get('/area/:area_id', logsPorArea);

router.get('/:id', idParamRule, validate, obtenerLog);

export default router;
