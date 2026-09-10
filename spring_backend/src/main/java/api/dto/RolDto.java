package api.dto;

/**
 * Rol del catálogo {@code usuario_roles} con su estado activo/inactivo.
 * La gestión (alta, renombrado, baja, matriz de permisos) la hace el
 * administrador desde CONFIGURACIÓN; el select del form de usuarios solo
 * muestra activos. {@code sistema} marca roles protegidos (super-admin).
 */
public record RolDto(
        String id,
        String code,
        String nombre,
        Boolean activo,
        Boolean sistema) {
}
