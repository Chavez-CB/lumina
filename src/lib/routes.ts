// Tipos de rutas compartidos para toda la aplicación
export type Route =
  | "/"
  | "/empleados"
  | "/descuentos"
  | "/impuestos"
  | "/estadisticas"
  | "/historial"
  | "/configuracion"
  | "/login";

// Lista de rutas protegidas (requieren autenticación)
export const protectedRoutes: Route[] = [
  "/",
  "/empleados",
  "/descuentos",
  "/impuestos",
  "/estadisticas",
  "/historial",
  "/configuracion",
];

// Verifica si una ruta está protegida
export const isProtectedRoute = (route: string): route is Route => {
  return protectedRoutes.some((r) => r === route);
};
