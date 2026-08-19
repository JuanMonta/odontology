package api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Fila del flujo de caja: movimiento agregado por día. */
public record ReporteFlujoItemDto(
        LocalDate fecha,
        BigDecimal cargos,
        BigDecimal pagos,
        BigDecimal neto) {
}