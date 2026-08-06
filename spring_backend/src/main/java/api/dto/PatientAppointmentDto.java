package api.dto;

public record PatientAppointmentDto(
        Long id,
        String date,
        String time,
        String treatment,
        String dentist,
        String status,
        String note) {
}
