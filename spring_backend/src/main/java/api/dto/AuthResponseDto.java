package api.dto;

public record AuthResponseDto(
        String token,
        String code,
        String username,
        String name,
        String role) {
}
