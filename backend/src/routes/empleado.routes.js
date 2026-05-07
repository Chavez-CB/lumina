import { Router } from 'express';
import {
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  editarEmpleado,
  darDeBaja,
  reactivarEmpleado,
} from '../controllers/empleado.controller.js';

import {
  listarEmpleadosRules,
  crearEmpleadoRules,
  editarEmpleadoRules,
  idParamRule,
  validate,
} from '../validations/empleado.validations.js';

const router = Router();

// GET    /api/empleados            → listar (paginado, filtrado)
router.get('/',    listarEmpleadosRules, validate, listarEmpleados);

// GET    /api/empleados/:id        → detalle de un empleado
router.get('/:id', idParamRule, validate, obtenerEmpleado);

// POST   /api/empleados            → registrar empleado
router.post('/',   crearEmpleadoRules, validate, crearEmpleado);

// PUT    /api/empleados/:id        → editar empleado
router.put('/:id', editarEmpleadoRules, validate, editarEmpleado);

// PATCH  /api/empleados/:id/baja   → dar de baja (soft delete)
router.patch('/:id/baja',      idParamRule, validate, darDeBaja);

// PATCH  /api/empleados/:id/reactivar → reactivar empleado
router.patch('/:id/reactivar', idParamRule, validate, reactivarEmpleado);

export default router;
