package api.dto;

import java.time.LocalTime;
import java.util.List;

public record ClinicaSettingsDto(
        String nombre,
        String ruc,
        String direccion,
        String telefono,
        String email,
        LocalTime horarioInicio,
        LocalTime horarioFin,
        int duracionCita,
        int toleranciaRetraso,
        List<String> diasAtencion,
        String moneda,
        String formatoFecha,
        boolean recordatorioCitas,
        boolean notificacionUrgente,
        boolean avisoVencimiento) {
}
