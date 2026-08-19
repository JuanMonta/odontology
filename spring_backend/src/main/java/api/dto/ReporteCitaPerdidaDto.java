package api.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/** Fila de citas perdidas: una cita no atendida (no-show o cancelada) en el rango. */
public record ReporteCitaPerdidaDto(
        String id,
        String pacienteId,
        String paciente,
        LocalDate fecha,
        LocalTime hora,
        String tratamiento,
        String consultorio,
        String odontologo,
        String estado) {
}