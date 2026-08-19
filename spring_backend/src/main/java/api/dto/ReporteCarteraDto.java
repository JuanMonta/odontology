package api.dto;

import java.math.BigDecimal;
import java.util.List;

/** Cartera vigente: deudores (saldo > 0) ordenados por saldo descendente + total. */
public record ReporteCarteraDto(
        List<ReporteCarteraItemDto> deudores,
        int totalDeudores,
        BigDecimal totalCartera) {
}