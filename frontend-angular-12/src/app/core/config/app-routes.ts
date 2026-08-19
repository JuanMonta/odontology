/**
 * Diccionario central de rutas de la aplicación. Única fuente de verdad para
 * rutas y segmentos: los routing modules, el menú lateral, los guards y los
 * interceptores consumen estas constantes en lugar de literales dispersos.
 *
 * `APP_ROUTE_SEGMENTS` → segmentos usados por RouterModule (sin `/`).
 * `APP_ROUTES` → rutas completas para `navigate`, `routerLink` y `assign`.
 */
export const APP_ROUTE_SEGMENTS = {
  login: 'login',
  dashboard: '',
  pacientes: 'pacientes',
  tratamientos: 'tratamientos',
  mensajes: 'mensajes',
  chat: 'chat',
  consultorios: 'consultorios',
  odontologos: 'odontologos',
  usuarios: 'usuarios',
  turnos: 'turnos',
  especialidades: 'especialidades',
  reportes: 'reportes',
  configuracion: 'configuracion',
  wildcard: '**'
} as const;

export const APP_ROUTES = {
  login: '/' + APP_ROUTE_SEGMENTS.login,
  dashboard: '/' + APP_ROUTE_SEGMENTS.dashboard,
  pacientes: '/' + APP_ROUTE_SEGMENTS.pacientes,
  tratamientos: '/' + APP_ROUTE_SEGMENTS.tratamientos,
  mensajes: '/' + APP_ROUTE_SEGMENTS.mensajes,
  chat: '/' + APP_ROUTE_SEGMENTS.chat,
  consultorios: '/' + APP_ROUTE_SEGMENTS.consultorios,
  odontologos: '/' + APP_ROUTE_SEGMENTS.odontologos,
  usuarios: '/' + APP_ROUTE_SEGMENTS.usuarios,
  turnos: '/' + APP_ROUTE_SEGMENTS.turnos,
  especialidades: '/' + APP_ROUTE_SEGMENTS.especialidades,
  reportes: '/' + APP_ROUTE_SEGMENTS.reportes,
  configuracion: '/' + APP_ROUTE_SEGMENTS.configuracion
} as const;

export type AppRouteSegment = (typeof APP_ROUTE_SEGMENTS)[keyof typeof APP_ROUTE_SEGMENTS];
export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];