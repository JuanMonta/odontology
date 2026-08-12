package api.dto;

public record MessageDraftDto(
        String subject,
        String body,
        String remitente,
        String destino,
        String channel,
        String prioridad) {
}
