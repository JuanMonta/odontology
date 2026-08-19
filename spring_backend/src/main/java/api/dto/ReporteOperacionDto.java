package api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Reporte de operación clínica: citas por consultorio u odontólogo + totales del rango. */
public record ReporteOperacionDto(
        List<ReporteOperacionItemDto> items,
        long totalProgramadas,
        long totalAtendidas,
        long totalNoShow,
        long totalCanceladas,
        long totalEnProceso,
        BigDecimal ocupacionGlobal,
        LocalDate desde,
        LocalDate hasta) {
}