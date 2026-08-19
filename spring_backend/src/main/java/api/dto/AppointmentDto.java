package api.dto;

public record AppointmentDto(
        String id,
        String time,
        String patient,
        String treatment,
        String tratamientoCodigo,
        String consultorio,
        String dentist,
        String status,
        String horaFin) {
}