/**
 * Almacenamiento por sesión: aísla los borradores de formulario por usuario y
 * permite limpiar TODA la huella de la estación (token, usuario y borradores)
 * al cerrar sesión, para que el siguiente operador de la misma estación nunca
 * vea datos que no le corresponden.
 */

const CLAVES_SESION = ['sas_odonto_jwt', 'sas_odonto_usuario'];

/** Prefijos de los borradores de formulario. */
const PREFIJOS_BORRADOR = [
  'saas.clinica.patient-form.draft',
  'saas.clinica.treatment-form.draft',
  'saas.clinica.appointment-form.draft'
];

/** Código del usuario activo desde localStorage (sin depender de DI). */
export function usuarioActivoCode(): string {
  try {
    const raw = localStorage.getItem('sas_odonto_usuario');
    if (!raw) {
      return 'anon';
    }
    const u = JSON.parse(raw);
    const code = u && (u.code || u.username);
    return typeof code === 'string' && code ? code : 'anon';
  } catch {
    return 'anon';
  }
}

/**
 * Clave de borrador aislada por usuario: el prefijo base se acompaña del código
 * del operador para que un usuario nunca restaure el borrador de otro.
 */
export function borradorKey(base: string): string {
  return `${base}.${usuarioActivoCode()}`;
}

/**
 * Limpia toda la huella de la estación: sesión (token + usuario) y borradores
 * de cualquier usuario. Se ejecuta al cerrar sesión para que la próxima sesión
 * arranque en blanco.
 */
export function limpiarDatosDeSesion(): void {
  try {
    const claves: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k) {
        claves.push(k);
      }
    }
    claves
      .filter(k => CLAVES_SESION.includes(k) || PREFIJOS_BORRADOR.some(p => k.startsWith(p)))
      .forEach(k => localStorage.removeItem(k));
  } catch {
    // almacenamiento no disponible: la sesión ya se da por cerrada en memoria
  }
}