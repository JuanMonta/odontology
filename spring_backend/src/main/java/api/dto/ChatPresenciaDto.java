package api.dto;

public record ChatPresenciaDto(
        String codigo,
        String nombre,
        String rol,
        boolean online) {
}
