package api.dto;

import java.time.LocalTime;

/**
 * Alta o edición de un turno laboral del catálogo.
 * El nombre se normaliza a minúsculas; las horas llegan como "HH:MM".
 * {@code descansoInicio}/{@code descansoFin} son opcionales (pueden ir vacíos).
 */
public record TurnoDraftDto(
        String nombre,
        LocalTime horaInicio,
        LocalTime horaFin,
        LocalTime descansoInicio,
        LocalTime descansoFin) {
}
