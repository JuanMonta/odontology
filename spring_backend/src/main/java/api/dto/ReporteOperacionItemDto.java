package api.dto;

import java.math.BigDecimal;

/**
 * Fila de un reporte de operación clínica (citas por consultorio u odontólogo):
 * desglose por estado terminal + ocupación (atendidas / programadas).
 */
public record ReporteOperacionItemDto(
        String codigo,
        String nombre,
        String grupo,
        long programadas,
        long atendidas,
        long noShow,
        long canceladas,
        long enProceso,
        BigDecimal ocupacion) {
}