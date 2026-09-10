package api.dto;

/**
 * Permiso del catálogo RBAC con su categoría para agrupar toggles por segmento.
 */
public record PermisoDto(
        String codigo,
        String categoria,
        String accion,
        String descripcion) {
}
