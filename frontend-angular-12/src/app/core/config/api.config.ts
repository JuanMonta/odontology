/**
 * Base URL del backend REST de la clínica (Spring Boot).
 * Descubrimiento 4 canales: 1) memoria (localStorage saas_api_base) ->
 * 2) matriz 8001-8010 + 8100-8900 step 100 en 192.68.1.2 (+ localhost para simular) ->
 * 3) QR (GET /api/v1/server/qr) -> 4) manual (diálogo IP:puerto).
 * El valor se resuelve en runtime; API_BASE es solo el default para build.
 */
const STORAGE_KEY = 'saas_api_base';

/**
 * Puertos que sondea el descubrimiento (canal 2 de ServerDiscoveryService) y
 * que ademas consume el selector de conexion manual. Unica fuente de verdad:
 * no debe repetirse en otros archivos ni salirse de esta lista.
 */
export const MATRIZ_PUERTOS = [
  8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009, 8010,
  8100, 8200, 8300, 8400, 8500, 8600, 8700, 8800, 8900
];

/**
 * Fallback del build: solo se usa cuando el descubrimiento aun no corrio y no
 * hay `saas_api_base` persistida. Se deriva del primer puerto de la matriz para
 * que no pueda divergir de lo que la app realmente sondea.
 */
const DEFAULT_BASE = `http://localhost:${MATRIZ_PUERTOS[0]}/api/v1`;

function readStored(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

// `let` (no `const`): los imports son live bindings, asi que al reasignarlo
// durante el arranque (APP_INITIALIZER) todos los servicios que lo usan en sus
// metodos pasan a apuntar al puerto real del servidor.
export let API_BASE: string = (() => {
  try {
    const qp = new URLSearchParams(window.location.search).get('apiBase');
    if (qp) { localStorage.setItem(STORAGE_KEY, qp); return qp; }
  } catch {}
  return readStored() || DEFAULT_BASE;
})();

/** Re-lee la base persistida y actualiza el live binding. */
export function refrescarApiBase(): string {
  const v = readStored();
  if (v) { API_BASE = v; }
  return API_BASE;
}

export function getApiBase(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v || API_BASE;
  } catch { return API_BASE; }
}
export function setApiBase(base: string): void {
  try { localStorage.setItem(STORAGE_KEY, base); } catch {}
}
export const IP_SIMULADA = '192.68.1.2';
