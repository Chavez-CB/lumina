import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import adminRoutes from './routes/admin.routes.js';
import empleadoRoutes from './routes/empleado.routes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import justificacionRoutes from './routes/justificacion.routes.js';
import asistenciaRoutes from './routes/asistencia.routes.js';
import horarioRoutes from './routes/horario.routes.js';
import areaRoutes from './routes/area.routes.js';
import asignacionRoutes from './routes/asignacion.routes.js';
import logReconocimientoRoutes from './routes/log-reconocimiento.routes.js';
import reconocimientoRoutes from './routes/reconocimiento.routes.js';


const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──────────────────────────────────────────────────────────────────
// Orígenes permitidos: desarrollo local en cualquier puerto típico de Vite/CRA
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:4321',
  'http://localhost:3001',
  'http://localhost:4000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200, // Safari compat (algunos browsers no aceptan 204)
};

// Responder los preflight OPTIONS antes de cualquier otra ruta o middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ─────────────────────────────────────────────────────────────────
app.get('/', (_, res) => res.json({ ok: true, mensaje: 'Lumina API funcionando 🌟' }));

app.use('/api/admin', adminRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/justificaciones', justificacionRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/reconocimiento', reconocimientoRoutes);
app.use('/api/logs/reconocimiento', logReconocimientoRoutes);



// ── Manejo de errores ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Inicio ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


