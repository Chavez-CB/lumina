import axios from 'axios';
import FormData from 'form-data';

const FACE_API_URL = process.env.FACE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: FACE_API_URL,
  timeout: 15000,
});

// ====================== POST /generate ======================
export const generateEmbedding = async (imageBuffer, filename = 'photo.jpg') => {
  const form = new FormData();
  form.append('file', imageBuffer, filename);

  const { data } = await api.post('/generate', form, {
    headers: form.getHeaders(),
  });
  return data;
};

// ====================== POST /compare ======================
export const compareFace = async (imageBuffer, candidates, threshold = 0.55, filename = 'photo.jpg') => {
  const form = new FormData();
  form.append('file', imageBuffer, filename);
  form.append('candidates', JSON.stringify(candidates));
  form.append('threshold', threshold.toString());

  const { data } = await api.post('/compare', form, {
    headers: form.getHeaders(),
  });
  return data;
};

// ====================== POST /verify ======================
export const verifyFaces = async (embeddingA, embeddingB, threshold = 0.55) => {
  const { data } = await api.post('/verify', {
    embedding_a: embeddingA,
    embedding_b: embeddingB,
    threshold
  });
  return data;
};

// Health check
export const checkFaceApiHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export default {
  generateEmbedding,
  compareFace,
  verifyFaces,
  checkFaceApiHealth
};