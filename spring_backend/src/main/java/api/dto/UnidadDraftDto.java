package api.dto;

/**
 * Alta de una unidad/sillón del catálogo {@code unidades}.
 * El tipo solo admite los valores del ENUM: SILLÓN | MÓDULO.
 */
public record UnidadDraftDto(
        String nombre,
        String tipo) {
}