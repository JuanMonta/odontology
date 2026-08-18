package api.dto;

/**
 * Unidad/sillón del catálogo {@code unidades} con su estado activo/inactivo.
 * El formulario de consultorios elige el sillón o módulo de este catálogo;
 * los consultorios guardan la unidad como texto (nombre · tipo).
 */
public record UnidadDto(
        String id,
        String code,
        String nombre,
        String tipo,
        Boolean activo) {
}