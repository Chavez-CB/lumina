# API de Reconocimiento Facial
 
Microservicio **stateless** de reconocimiento facial construido con FastAPI y `face_recognition`. Diseñado para integrarse con cualquier backend (Spring Boot, Django, Laravel, Express, etc.) sin depender de ninguno en particular.
 
---
 
## Características
 
- **Stateless** — no guarda ningún dato en memoria. Tu backend es el responsable de almacenar los embeddings.
- **Independiente** — funciona con cualquier backend que pueda hacer requests HTTP.
- **Dockerizado** — listo para producción con Nginx como reverse proxy y SSL.
- **3 operaciones principales** — generar embedding, comparar contra una lista, y verificar dos embeddings.
 
---
 
## Endpoints
 
### `POST /generate`
Recibe una imagen y retorna el embedding facial (128 floats).
 
**Request:** `multipart/form-data`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | imagen | Foto del rostro (jpg, png, webp) |
 
**Response:**
```json
{
  "embedding": [0.12, -0.34, 0.56, "...128 valores..."],
  "faces_detected": 1
}
```
 
---
 
### `POST /compare`
Recibe una imagen y una lista de candidatos. Retorna el mejor match si supera el umbral.
 
**Request:** `multipart/form-data`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | imagen | Foto a identificar |
| `candidates` | string JSON | Lista de usuarios con sus embeddings |
| `threshold` | float | Umbral de distancia (default: `0.55`) |
 
**Formato de `candidates`:**
```json
[
  { "id": "usr_123", "embedding": [0.12, -0.34, "..."] },
  { "id": "usr_456", "embedding": [0.78, 0.91, "..."] }
]
```
 
**Response — encontrado:**
```json
{
  "found": true,
  "user_id": "usr_123",
  "distance": 0.312,
  "confidence": 43.27,
  "message": "Usuario identificado correctamente."
}
```
 
**Response — no encontrado:**
```json
{
  "found": false,
  "message": "Ningún candidato superó el umbral (mejor distancia: 0.712, umbral: 0.55)."
}
```
 
---
 
### `POST /verify`
Compara dos embeddings directamente sin necesidad de imagen.
 
**Request:** `application/json`
```json
{
  "embedding_a": [0.12, -0.34, "..."],
  "embedding_b": [0.78, 0.91, "..."],
  "threshold": 0.55
}
```
 
**Response:**
```json
{
  "same_person": true,
  "distance": 0.28,
  "confidence": 49.09
}
```
 
---
 
### `GET /health`
Verifica que el servicio esté corriendo.
 
```json
{ "status": "ok", "version": "2.0.0" }
```
 
---
 
## Flujo de integración con tu backend
 
```
Registro:
  Tu backend → POST /generate (foto) → guarda embedding en tu DB
 
Login / Verificación:
  Tu backend consulta embeddings de su DB
  Tu backend → POST /compare (foto + embeddings) → recibe match
  Tu backend decide qué hacer con el resultado
```
 
---
 
## Configuración del umbral
 
El parámetro `threshold` controla qué tan estricta es la comparación:
 
| Valor | Comportamiento |
|-------|---------------|
| `0.4` | Muy estricto — poca tolerancia a cambios de iluminación o ángulo |
| `0.55` | Balanceado — **valor recomendado** |
| `0.7` | Permisivo — mayor tolerancia pero más falsos positivos |
 
---
 
## Despliegue
 
### Requisitos
- Docker y Docker Compose
- Nginx con SSL configurado (Let's Encrypt)
- Subdominio apuntando al VPS (`face.cabanillas.net.pe`)
 
### Estructura de archivos
```
face-api/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── main.py
```
 
### Levantar el servicio
 
```bash
cd /app/face-api
docker compose up -d --build
```
 
> ⚠️ El primer build tarda entre 10 y 15 minutos porque compila `dlib`.
 
### Verificar que está corriendo
 
```bash
docker ps | grep face_api
curl https://face.cabanillas.net.pe/health
```
