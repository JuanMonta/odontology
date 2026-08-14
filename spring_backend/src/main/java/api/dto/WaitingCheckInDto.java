package api.dto;

/**
 * Alta de un paciente en la sala de espera (check-in).
 * {@code appointmentId} opcional: si llega, el backend deriva nombre/motivo
 * de la cita confirmada; si no, se usan {@code pacienteNombre} y {@code motivo}
 * (walk-in sin cita).
 */
public record WaitingCheckInDto(String appointmentId, String pacienteNombre, String motivo) {
}
