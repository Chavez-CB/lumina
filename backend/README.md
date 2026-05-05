# Lumina Backend — API de Empleados

## Instalación

```bash
npm install
cp .env.example .env   # edita con tus credenciales MySQL
npm run dev            # arranca con hot-reload
```

## Endpoints `/api/empleados`

| Método | Ruta                          | Descripción                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/api/empleados`              | Listar empleados (paginado)        |
| GET    | `/api/empleados/:id`          | Detalle de un empleado             |
| POST   | `/api/empleados`              | Registrar nuevo empleado           |
| PUT    | `/api/empleados/:id`          | Editar empleado                    |
| PATCH  | `/api/empleados/:id/baja`     | Dar de baja (soft delete)          |
| PATCH  | `/api/empleados/:id/reactivar`| Reactivar empleado dado de baja    |

---

## Ejemplos de uso

### Listar con filtros
```
GET /api/empleados?pagina=1&limite=10&buscar=garcia&activo=1
```

### Registrar empleado
```json
POST /api/empleados
Content-Type: application/json

{
  "nombres":   "Ana",
  "apellidos": "García López",
  "dni":       "71234001",
  "email":     "ana.garcia@lumina.app",
  "telefono":  "987654321",
  "codigo":    "EMP-010",
  "foto_url":  "https://mi-storage.com/fotos/ana.jpg"
}
```

### Editar (solo los campos que cambian)
```json
PUT /api/empleados/1
Content-Type: application/json

{
  "telefono": "999888777",
  "email":    "ana.nuevo@lumina.app"
}
```

### Dar de baja
```
PATCH /api/empleados/1/baja
```

### Reactivar
```
PATCH /api/empleados/1/reactivar
```

---

## Respuesta estándar

```json
{
  "ok": true,
  "message": "...",
  "data": { ... },
  "meta": { "total": 50, "pagina": 1, "limite": 20, "paginas": 3 }
}
```

### Errores
```json
{
  "ok": false,
  "message": "Descripción del error",
  "errors": [{ "campo": "dni", "mensaje": "El DNI es obligatorio" }]
}
```

## Estructura del proyecto

```
lumina-backend/
├── src/
│   ├── app.js                          # Entrada principal
│   ├── config/
│   │   └── db.js                       # Pool MySQL
│   ├── controllers/
│   │   └── empleado.controller.js      # Lógica CRUD
│   ├── routes/
│   │   └── empleado.routes.js          # Definición de rutas
│   ├── middlewares/
│   │   └── errorHandler.js             # Manejo de errores
│   └── validations/
│       └── empleado.validations.js     # Reglas express-validator
├── .env.example
└── package.json
```
