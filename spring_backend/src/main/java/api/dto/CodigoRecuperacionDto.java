package api.dto;

/**
 * Respuesta de "generar código de recuperación": el admin lee el código en
 * voz alta o lo comparte de forma segura por el canal interno (sin correo).
 */
public record CodigoRecuperacionDto(String codigo, int expiraEnMinutos) {
}