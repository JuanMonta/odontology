package api.dto;

/**
 * Cambio de contraseña con verificación de la actual. Cubre el cambio forzado
 * (clave temporal del reset por admin) y un futuro "cambiar mi clave" desde
 * configuración. No requiere sesión: autentica con la clave actual.
 */
public record CambiarClaveDto(String username, String claveActual, String nuevaClave) {
}