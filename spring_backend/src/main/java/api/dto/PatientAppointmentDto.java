package api.dto;

public record PatientAppointmentDto(
        Long id,
        String date,
        String time,
        String treatment,
        String dentist,
        String dentistCode,
        String status,
        String note) {
}
