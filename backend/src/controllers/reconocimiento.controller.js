import pool from '../config/db.js';
import faceService from '../services/faceRecognition.service.js';
import { registrarLog } from './log-reconocimiento.controller.js';

// ====================== POST /api/reconocimiento/generate ======================
export const generarEmbedding = async (req, res, next) => {
  try {
    if (!req.file) throw new Error('No se envió imagen');

    const result = await faceService.generateEmbedding(req.file.buffer, req.file.originalname);

    res.json({
      ok: true,
      message: "Embedding generado correctamente",
      data: result
    });
  } catch (err) { next(err); }
};

// ====================== POST /api/reconocimiento/compare ======================
export const compararRostro = async (req, res, next) => {
  const startTime = Date.now();
  let logData = { endpoint: '/compare', metodo: 'POST', exito: false };

  try {
    if (!req.file) throw new Error('No se envió imagen');

    const { area_id, threshold = 0.45 } = req.body;

    // Obtener candidatos
    const { rows: personas } = await pool.query(`
      SELECT id, nombres || ' ' || apellidos as nombre, descriptor_facial 
      FROM personas 
      WHERE descriptor_facial IS NOT NULL AND activo = TRUE
    `);

    const candidates = personas.map(p => ({
      id: p.id,
      embedding: p.descriptor_facial
    }));

    if (candidates.length === 0) {
      throw new Error('No hay personas registradas con embedding facial');
    }

    const faceResult = await faceService.compareFace(req.file.buffer, candidates, parseFloat(threshold));

    const tiempo_respuesta_ms = Date.now() - startTime;

    logData = {
      ...logData,
      area_id: area_id || null,
      faces_detected: faceResult.faces_detected || 1,
      distancia: faceResult.distance != null ? parseFloat(Number(faceResult.distance).toFixed(4)) : null,
      confidence: faceResult.confidence != null ? parseFloat(Number(faceResult.confidence).toFixed(4)) : null,
      tiempo_respuesta_ms,
      exito: !!faceResult.found,
      mensaje: faceResult.message,
      persona_id: faceResult.found ? parseInt(faceResult.user_id) : null
    };

    await registrarLog({ body: logData }, { status: () => {}, json: () => {} }, () => {});

    res.json({
      ok: true,
      ...faceResult,
      tiempo_respuesta_ms
    });

  } catch (err) {
    logData.mensaje = err.message;
    await registrarLog({ body: logData }, { status: () => {}, json: () => {} }, () => {});
    next(err);
  }
};

// ====================== POST /api/reconocimiento/verify ======================
export const verificarEmbeddings = async (req, res, next) => {
  try {
    const { embedding_a, embedding_b, threshold = 0.45 } = req.body;

    const result = await faceService.verifyFaces(embedding_a, embedding_b, parseFloat(threshold));

    res.json({
      ok: true,
      data: result
    });
  } catch (err) { next(err); }
};

export const healthFaceApi = async (req, res, next) => {
  try {
    const status = await faceService.checkFaceApiHealth();
    res.json({ ok: true, face_api: status });
  } catch (err) {
    res.status(503).json({ ok: false, message: "API Facial no disponible", error: err.message });
  }
};