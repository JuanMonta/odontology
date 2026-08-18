package api.dto;

/**
 * Rol del catálogo {@code usuario_roles} con su estado activo/inactivo.
 * La gestión (alta, renombrado, baja) la hace el administrador desde
 * CONFIGURACIÓN; el select del form de usuarios solo muestra activos.
 */
public record RolDto(
        String id,
        String code,
        String nombre,
        Boolean activo) {
}