package api.dto;

/**
 * Ubicación del catálogo {@code ubicaciones} con su estado activo/inactivo.
 * El formulario de consultorios elige la ubicación de este catálogo;
 * los consultorios guardan la ubicación como texto.
 */
public record UbicacionDto(
        String id,
        String code,
        String nombre,
        Boolean activo) {
}