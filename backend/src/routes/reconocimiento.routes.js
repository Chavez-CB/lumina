import { Router } from 'express';
import multer from 'multer';
import {
  generarEmbedding,
  compararRostro,
  verificarEmbeddings,
  healthFaceApi
} from '../controllers/reconocimiento.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Generar embedding (para registro)
router.post('/generate', upload.single('file'), generarEmbedding);

// Comparar rostro (principal para asistencia)
router.post('/compare', upload.single('file'), compararRostro);

// Verificar dos embeddings
router.post('/verify', verificarEmbeddings);

// Health de la API facial
router.get('/health', healthFaceApi);

export default router;