package api.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Formatea fechas/horas al mismo formato de visualización que usa el frontend
 * (p. ej. {@code 06 AGO 2026 · 14:32}, {@code 28 JUL 2026}, {@code 09:12}).
 */
public final class FormatoUtil {

    private static final String[] MESES = {
            "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
            "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
    };

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private FormatoUtil() {
    }

    public static String fecha(LocalDate fecha) {
        if (fecha == null) {
            return "—";
        }
        return String.format("%02d %s %d", fecha.getDayOfMonth(),
                MESES[fecha.getMonthValue() - 1], fecha.getYear());
    }

    public static String hora(LocalTime hora) {
        return hora == null ? "—" : hora.format(HH_MM);
    }

    public static String fechaHora(LocalDateTime fechaHora) {
        if (fechaHora == null) {
            return "—";
        }
        return fecha(fechaHora.toLocalDate()) + " · " + hora(fechaHora.toLocalTime());
    }

    public static String cumpleanios(LocalDate fechaNacimiento) {
        if (fechaNacimiento == null) {
            return "—";
        }
        return String.format("%02d/%02d", fechaNacimiento.getDayOfMonth(),
                fechaNacimiento.getMonthValue());
    }
}
