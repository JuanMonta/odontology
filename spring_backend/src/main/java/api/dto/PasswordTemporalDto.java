package api.dto;

/**
 * Resultado del reset por administrador (Opción 1): se entrega una contraseña
 * temporal que el usuario deberá reemplazar sí o sí en el próximo ingreso.
 */
public record PasswordTemporalDto(String password, String message) {
}