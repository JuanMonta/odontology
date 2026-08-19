package api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Reporte de producción: items ordenados por total descendente + totales globales del rango. */
public record ReporteProduccionDto(
        List<ReporteProduccionItemDto> items,
        long totalCantidad,
        BigDecimal total,
        LocalDate desde,
        LocalDate hasta) {
}