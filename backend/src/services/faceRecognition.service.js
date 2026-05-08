const FACE_API_URL = process.env.FACE_API_URL || 'http://localhost:8000';
const FACE_API_TIMEOUT_MS = 15000;

const buildUrl = (path) => new URL(path, FACE_API_URL).toString();

const readJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    ...options,
    signal: AbortSignal.timeout(FACE_API_TIMEOUT_MS),
  });
  const data = await readJson(response);

  if (!response.ok) {
    const message = data?.message || data?.detail || `Face API respondio con estado ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const imageBlob = (imageBuffer) => new Blob([imageBuffer], { type: 'image/jpeg' });

// ====================== POST /generate ======================
export const generateEmbedding = async (imageBuffer, filename = 'photo.jpg') => {
  const form = new FormData();
  form.append('file', imageBlob(imageBuffer), filename);

  return requestJson('/generate', {
    method: 'POST',
    body: form,
  });
};

// ====================== POST /compare ======================
export const compareFace = async (imageBuffer, candidates, threshold = 0.55, filename = 'photo.jpg') => {
  const form = new FormData();
  form.append('file', imageBlob(imageBuffer), filename);
  form.append('candidates', JSON.stringify(candidates));
  form.append('threshold', threshold.toString());

  return requestJson('/compare', {
    method: 'POST',
    body: form,
  });
};

// ====================== POST /verify ======================
export const verifyFaces = async (embeddingA, embeddingB, threshold = 0.55) => {
  return requestJson('/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embedding_a: embeddingA,
      embedding_b: embeddingB,
      threshold,
    }),
  });
};

// Health check
export const checkFaceApiHealth = async () => {
  return requestJson('/health');
};

export default {
  generateEmbedding,
  compareFace,
  verifyFaces,
  checkFaceApiHealth
};
