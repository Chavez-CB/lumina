import { Router } from 'express';
import * as horarioCtrl from '../controllers/horario.controller.js';

const router = Router();

router.get('/', horarioCtrl.listarHorarios);
router.get('/:id', horarioCtrl.obtenerHorario);
router.post('/', horarioCtrl.crearHorario);
router.put('/:id', horarioCtrl.actualizarHorario);
router.delete('/:id', horarioCtrl.eliminarHorario);

export default router;