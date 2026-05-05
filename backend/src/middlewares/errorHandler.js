// Respuesta de error uniforme
export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  const status  = err.status  || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    ok:      false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// Rutas no encontradas
export const notFound = (req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.path}` });
};
