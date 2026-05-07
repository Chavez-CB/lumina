import { Router } from 'express';
import * as justifCtrl from '../controllers/justificacion.controller.js';

const router = Router();

// Ruta para que el empleado envíe su justificación
router.post('/', justifCtrl.crearJustificacion);

// Ruta para que el admin liste todas las justificaciones
router.get('/', justifCtrl.listarJustificaciones);

// Ruta para que el admin apruebe o rechace
router.patch('/:id/revisar', justifCtrl.revisarJustificacion);

export default router;