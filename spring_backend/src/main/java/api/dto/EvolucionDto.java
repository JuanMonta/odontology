package api.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Hoja de evolución clínica. Registro cronológico append-only: se crea y se
 * lee, nunca se edita ni elimina. {@code createdAt} es el timestamp de alta
 * (server-side).
 */
public record EvolucionDto(
        Long id,
        String pacienteId,
        LocalDate fecha,
        LocalTime hora,
        String odontologo,
        String odontologoCodigo,
        String registradoPor,
        String registradoPorNombre,
        String motivo,
        String evolucion,
        String plan,
        LocalDate proximaCita,
        String createdAt
) {

    /** Borrador para el alta: sin id ni timestamp (los asigna el servidor). */
    public record EvolucionDraftDto(
            LocalDate fecha,
            LocalTime hora,
            String odontologoCodigo,
            String motivo,
            String evolucion,
            String plan,
            LocalDate proximaCita
    ) {
    }
}
