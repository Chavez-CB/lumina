import 'dotenv/config';
import express  from 'express';
import cors     from 'cors';
import morgan   from 'morgan';

import empleadoRoutes         from './routes/empleado.routes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ───────────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ─────────────────────────────────────────────────────────────────
app.get('/', (_, res) => res.json({ ok: true, mensaje: 'Lumina API funcionando 🌟' }));

app.use('/api/empleados', empleadoRoutes);

// ── Manejo de errores ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Inicio ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
