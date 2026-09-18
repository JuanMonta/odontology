package api.dto;

/** Cuerpo de error JSON consistente con el resto de respuestas de la API. */
public record ApiErrorDto(int status, String error, String message) {
}