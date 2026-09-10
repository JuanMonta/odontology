package api.dto;

import java.util.List;

/**
 * Matriz de un rol: códigos de permiso concedidos (toggles del editor).
 */
public record RolPermisosDto(
        String rolCode,
        List<String> permisos) {
}
