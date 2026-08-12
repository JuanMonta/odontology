package api.dto;

public record ClinicMessageDto(
        String id,
        String subject,
        String body,
        String from,
        String channel,
        String date,
        String time,
        String status,
        String destino,
        String prioridad) {
}
