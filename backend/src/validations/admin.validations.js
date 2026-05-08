import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      ok: false,
      message: 'Datos invalidos',
      errors: errors.array().map((e) => ({ campo: e.path, mensaje: e.msg })),
    });
  }

  next();
};

export const listarAdminsRules = [
  query('pagina').optional().isInt({ min: 1 }).withMessage('pagina debe ser entero mayor o igual a 1'),
  query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('limite entre 1 y 100'),
  query('buscar').optional().trim().isLength({ max: 100 }).withMessage('buscar maximo 100 caracteres'),
  query('activo').optional().isIn(['0', '1']).withMessage('activo debe ser 0 o 1'),
];

export const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('ID invalido'),
];

export const crearAdminRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Maximo 100 caracteres'),

  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ max: 100 }).withMessage('Maximo 100 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La password es obligatoria')
    .isLength({ min: 6, max: 100 }).withMessage('La password debe tener entre 6 y 100 caracteres'),
];

export const editarAdminRules = [
  param('id').isInt({ min: 1 }).withMessage('ID invalido'),

  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacio')
    .isLength({ max: 100 }).withMessage('Maximo 100 caracteres'),

  body('apellido')
    .optional()
    .trim()
    .notEmpty().withMessage('El apellido no puede estar vacio')
    .isLength({ max: 100 }).withMessage('Maximo 100 caracteres'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('password')
    .optional()
    .isLength({ min: 6, max: 100 }).withMessage('La password debe tener entre 6 y 100 caracteres'),

  body('activo')
    .optional()
    .isIn([0, 1, '0', '1', true, false]).withMessage('activo debe ser 0 o 1'),
];
