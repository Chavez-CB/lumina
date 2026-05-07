import { Router } from 'express';
import * as asigCtrl from '../controllers/asignacion.controller.js';

const router = Router();

router.get('/', asigCtrl.listarAsignaciones);
router.post('/', asigCtrl.crearAsignacion);
router.patch('/:id/estado', asigCtrl.cambiarEstadoAsignacion);
router.delete('/:id', asigCtrl.eliminarAsignacion);

export default router;