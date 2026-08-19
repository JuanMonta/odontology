package api.dto;

import java.time.LocalDate;

/** Fila de pacientes atendidos: paciente único con su total de atenciones en el rango. */
public record ReportePacienteAtendidoDto(
        String pacienteId,
        String paciente,
        long atenciones,
        LocalDate ultimaFecha) {
}