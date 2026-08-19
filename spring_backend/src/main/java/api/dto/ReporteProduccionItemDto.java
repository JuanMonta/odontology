package api.dto;

import java.math.BigDecimal;

/** Fila de un reporte de producción: agregación por una dimensión (tratamiento, odontólogo o consultorio). */
public record ReporteProduccionItemDto(
        String codigo,
        String nombre,
        String grupo,
        long cantidad,
        BigDecimal total,
        BigDecimal porcentaje) {
}