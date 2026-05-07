import { Router } from 'express';
import * as areaCtrl from '../controllers/area.controller.js';

const router = Router();

router.get('/', areaCtrl.listarAreas);
router.get('/:id', areaCtrl.obtenerArea);
router.post('/', areaCtrl.crearArea);
router.put('/:id', areaCtrl.actualizarArea);
router.delete('/:id', areaCtrl.eliminarArea);

export default router;