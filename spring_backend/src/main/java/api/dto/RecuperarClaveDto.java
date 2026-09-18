package api.dto;

/**
 * Restablecimiento self-service (Opción 2): el usuario entrega el código de un
 * solo uso emitido por el administrador y define su nueva contraseña.
 */
public record RecuperarClaveDto(String username, String codigo, String nuevaClave) {
}