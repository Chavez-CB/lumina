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

### Asistencias (`/api/asistencias`)
| Método | Ruta                         | Descripción                                     |
|--------|------------------------------| ------------------------------------------------|
| GET    | `/api/asistencias`           | Listar todas las asistencias registradas        |
| POST   | `/api/asistencias/registrar` | Registrar una nueva asistencia (entrada/salida) |
| GET    | `/api/asistencias/:id`       | Obtener el detalle de una asistencia específica |

### Estadísticas y KPIs (`/api/stats`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| GET | `/api/stats/resumen-mensual` | Obtener resumen métrico del mes actual |
| GET | `/api/stats/kpi-diario` | Consultar indicadores clave de desempeño del día |
| GET | `/api/stats/ranking-asistencia` | Listado de empleados con mejor puntualidad |
| GET | `/api/stats/records-empleado/:persona_id` | Historial de récords y logros de un empleado |

### Justificaciones (`/api/justificaciones`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| POST | `/api/justificaciones` | Enviar una nueva justificación (Empleado) |
| GET | `/api/justificaciones` | Listar todas las justificaciones (Admin) |
| PATCH | `/api/justificaciones/:id/revisar` | Aprobar o rechazar una justificación |

### Horarios (`/api/horarios`)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| GET | `/api/horarios` | Listar todos los horarios configurados |
| GET | `/api/horarios/:id` | Obtener el detalle de un horario específico |
| POST | `/api/horarios` | Crear un nuevo esquema de horario |
| PUT | `/api/horarios/:id` | Actualizar la configuración de un horario existente |
| DELETE | `/api/horarios/:id` | Eliminar un horario del sistema |


###  Áreas (`/api/areas`)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| GET | `/api/areas` | Listar todas las áreas de la empresa |
| GET | `/api/areas/:id` | Obtener el detalle de un área específica |
| POST | `/api/areas` | Registrar una nueva área |
| PUT | `/api/areas/:id` | Actualizar la información de un área existente |
| DELETE | `/api/areas/:id` | Eliminar un área del sistema |

### Asignaciones (`/api/asignaciones`)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| GET | `/api/asignaciones` | Listar todas las asignaciones (empleados a horarios/áreas) |
| POST | `/api/asignaciones` | Crear una nueva asignación |
| PATCH | `/api/asignaciones/:id/estado` | Cambiar el estado de una asignación (activar/desactivar) |
| DELETE | `/api/asignaciones/:id` | Eliminar una asignación del sistema |