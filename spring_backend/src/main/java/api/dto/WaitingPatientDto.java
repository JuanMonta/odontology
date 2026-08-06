package api.dto;

public record WaitingPatientDto(
        Long id,
        String ticket,
        String patient,
        String arrivedAt,
        String reason) {
}
