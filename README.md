# Lumina — Asistencia Facial (Astro + React)

Sistema de control de asistencia con reconocimiento facial, migrado a **Astro 4 + React 18**.

## Estructura del proyecto

```
lumina-astro/
├── astro.config.mjs          # Configuración de Astro (integra React + Tailwind)
├── tailwind.config.mjs       # Configuración de Tailwind CSS
├── tsconfig.json
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── layouts/
    │   └── Layout.astro      # Layout HTML base
    ├── pages/
    │   └── index.astro       # Punto de entrada (monta la SPA con client:only)
    ├── components/
    │   ├── App.tsx           # Root React: Router + Auth + Theme contexts
    │   ├── KpiCard.tsx
    │   ├── EstadoBadge.tsx
    │   ├── layout/
    │   │   └── AppLayout.tsx # Sidebar + navbar
    │   └── ui/               # Componentes shadcn/ui
    ├── views/                # Páginas React (Dashboard, Login, etc.)
    ├── lib/
    │   ├── utils.ts
    │   └── mockData.ts
    ├── hooks/
    │   └── use-toast.ts
    └── styles/
        └── global.css
```

## Diferencias con la versión Vite original

| Vite (original) | Astro + React (este proyecto) |
|---|---|
| `react-router-dom` | Router hash propio (sin dependencia extra) |
| `BrowserRouter` + `<Route>` | Hash-based routing en `App.tsx` |
| Contextos en archivos separados | Contextos exportados desde `App.tsx` |
| Vite entry `main.tsx` | Astro page `index.astro` con `client:only="react"` |
| `src/pages/` (React) | `src/views/` (React) — `src/pages/` es para Astro |

## Inicio rápido

```bash
npm install
npm run dev
```

Luego abre: http://localhost:4321

## Credenciales demo

- **Usuario:** `admin`
- **Contraseña:** `admin123`
