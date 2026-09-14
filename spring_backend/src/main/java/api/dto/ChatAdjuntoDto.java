package api.dto;

public record ChatAdjuntoDto(
        Long id,
        Long conversacionId,
        String subidoPor,
        String nombre,
        String categoria,
        String tipo,
        Long tamano,
        String fechaHora,
        String url) {
}