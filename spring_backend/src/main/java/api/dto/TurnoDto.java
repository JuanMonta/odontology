package api.dto;

import java.time.LocalTime;

/**
 * Turno laboral del catálogo (tabla {@code turnos}).
 * La UI envía las horas como "HH:MM"; el backend las expone como LocalTime.
 */
public record TurnoDto(
        String code,
        String id,
        String nombre,
        LocalTime horaInicio,
        LocalTime horaFin,
        LocalTime descansoInicio,
        LocalTime descansoFin,
        boolean activo) {
}
