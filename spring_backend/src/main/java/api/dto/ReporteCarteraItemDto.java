package api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Fila de cartera: paciente con saldo pendiente y fecha de su último movimiento. */
public record ReporteCarteraItemDto(
        String pacienteId,
        String paciente,
        BigDecimal saldo,
        LocalDate ultimoMovimiento) {
}