package api.dto;

public record ChatMensajeDto(
        Long id,
        Long conversacionId,
        String remitente,
        String remitenteNombre,
        String cuerpo,
        String fechaHora) {
}
