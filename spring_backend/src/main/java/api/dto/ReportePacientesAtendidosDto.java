package api.dto;

import java.time.LocalDate;
import java.util.List;

/** Reporte de pacientes atendidos en el rango + totales globales. */
public record ReportePacientesAtendidosDto(
        List<ReportePacienteAtendidoDto> items,
        long pacientesUnicos,
        long totalAtenciones,
        LocalDate desde,
        LocalDate hasta) {
}