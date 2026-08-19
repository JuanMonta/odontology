package api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Flujo de caja del rango: serie por día + totales (cargos, pagos y desglose por método). */
public record ReporteFlujoDto(
        List<ReporteFlujoItemDto> porDia,
        BigDecimal totalCargos,
        BigDecimal totalPagos,
        BigDecimal totalNeto,
        BigDecimal pagosEfectivo,
        BigDecimal pagosTarjeta,
        LocalDate desde,
        LocalDate hasta) {
}