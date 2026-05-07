import { body, param, query } from 'express-validator';
import { validationResult }    from 'express-validator';

// ── Middleware: detiene la petición si hay errores ──────────────────────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      ok:     false,
      message: 'Datos inválidos',
      errors: errors.array().map(e => ({ campo: e.path, mensaje: e.msg })),
    });
  }
  next();
};

// ── Reglas para crear empleado ──────────────────────────────────────────────
export const crearEmpleadoRules = [
  body('nombres')
    .trim().notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),

  body('apellidos')
    .trim().notEmpty().withMessage('Los apellidos son obligatorios')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),

  body('dni')
    .trim().notEmpty().withMessage('El DNI es obligatorio')
    .isLength({ min: 8, max: 20 }).withMessage('DNI entre 8 y 20 caracteres'),

  body('email')
    .optional({ nullable: true })
    .trim().isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('telefono')
    .optional({ nullable: true })
    .trim().isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),

  body('codigo')
    .optional({ nullable: true })
    .trim().isLength({ max: 30 }).withMessage('Máximo 30 caracteres'),

  body('foto_url')
    .optional({ nullable: true })
    .trim().isURL().withMessage('foto_url debe ser una URL válida'),
];

// ── Reglas para editar empleado (todos opcionales) ──────────────────────────
export const editarEmpleadoRules = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),

  body('nombres')
    .optional().trim().notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 }),

  body('apellidos')
    .optional().trim().notEmpty().withMessage('Los apellidos no pueden estar vacíos')
    .isLength({ max: 100 }),

  body('dni')
    .optional().trim()
    .isLength({ min: 8, max: 20 }).withMessage('DNI entre 8 y 20 caracteres'),

  body('email')
    .optional({ nullable: true })
    .trim().isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('telefono')
    .optional({ nullable: true })
    .trim().isLength({ max: 20 }),

  body('codigo')
    .optional({ nullable: true })
    .trim().isLength({ max: 30 }),

  body('foto_url')
    .optional({ nullable: true })
    .trim().isURL().withMessage('foto_url debe ser una URL válida'),
];

// ── Reglas para parámetro :id ───────────────────────────────────────────────
export const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
];

// ── Reglas para paginación / búsqueda ──────────────────────────────────────
export const listarEmpleadosRules = [
  query('pagina').optional().isInt({ min: 1 }).withMessage('pagina debe ser entero ≥ 1'),
  query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('limite entre 1 y 100'),
  query('buscar').optional().trim().isLength({ max: 100 }),
  query('activo').optional().isIn(['0', '1']).withMessage('activo debe ser 0 o 1'),
];
