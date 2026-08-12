package api.dto;

/**
 * Ítem del catálogo de equipos/instrumental: identidad de catálogo y
 * categoría para agrupar el selector de equipos del formulario.
 */
public record EquipoCatalogoDto(
        String codigo,
        String nombre,
        String categoria) {
}