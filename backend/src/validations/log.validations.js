import { validationResult } from 'express-validator';

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
