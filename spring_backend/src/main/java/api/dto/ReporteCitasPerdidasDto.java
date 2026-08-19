package api.dto;

import java.time.LocalDate;
import java.util.List;

/** Reporte de citas perdidas: detalle de no-shows y cancelaciones + totales. */
public record ReporteCitasPerdidasDto(
        List<ReporteCitaPerdidaDto> items,
        long totalNoShow,
        long totalCanceladas,
        long totalPerdidas,
        LocalDate desde,
        LocalDate hasta) {
}