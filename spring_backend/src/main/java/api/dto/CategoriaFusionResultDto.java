package api.dto;

public record CategoriaFusionResultDto(
        String code,
        String nombre,
        Boolean activo,
        int tratamientosMovidos) {
}