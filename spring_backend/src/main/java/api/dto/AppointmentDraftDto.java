package api.dto;

public record AppointmentDraftDto(
        String time,
        String patient,
        String treatment,
        String consultorio,
        String dentist) {
}
