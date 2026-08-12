package api.dto;

public record UsuarioDraftDto(
        String username,
        String name,
        String role,
        String status,
        String password) {
}
