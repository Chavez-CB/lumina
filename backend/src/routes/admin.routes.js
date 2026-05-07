import { Router } from 'express';
import {
  listarAdmins,
  obtenerAdmin,
  crearAdmin,
  editarAdmin,
  darDeBajaAdmin,
  reactivarAdmin,
  // loginAdmin (recomendado)
} from '../controllers/admin.controller.js';

import {
  listarAdminsRules,
  crearAdminRules,
  editarAdminRules,
  idParamRule,
  validate,
} from '../validations/admin.validations.js';

const router = Router();

// GET    /api/admin
router.get('/', listarAdminsRules, validate, listarAdmins);

// GET    /api/admin/:id
router.get('/:id', idParamRule, validate, obtenerAdmin);

// POST   /api/admin
router.post('/', crearAdminRules, validate, crearAdmin);

// PUT    /api/admin/:id
router.put('/:id', editarAdminRules, validate, editarAdmin);

// PATCH  /api/admin/:id/baja
router.patch('/:id/baja', idParamRule, validate, darDeBajaAdmin);

// PATCH  /api/admin/:id/reactivar
router.patch('/:id/reactivar', idParamRule, validate, reactivarAdmin);

export default router;