package api.dto;

public record UsuarioDto(
        String id,
        String code,
        String username,
        String name,
        String role,
        String status,
        String lastAccess,
        String phone,
        String odontologoCodigo,
        String email,
        Boolean debeCambiarClave) {
}
