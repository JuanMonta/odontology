package api.dto;

public record MessageDraftDto(
        String subject,
        String body,
        String to,
        String channel) {
}
