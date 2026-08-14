package api.dto;

/**
 * Renombrado de un canal por el administrador: único campo {@code nombre}.
 */
public record ChatRenameCanalDto(
        String nombre) {
}