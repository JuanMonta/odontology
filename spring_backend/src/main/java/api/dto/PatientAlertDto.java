package api.dto;

public record PatientAlertDto(
        String id,
        String type,
        String patientId,
        String label,
        boolean handled) {
}
