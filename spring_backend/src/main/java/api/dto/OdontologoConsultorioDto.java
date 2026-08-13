package api.dto;

/**
 * Cuerpo del PATCH de asignación de un odontólogo a un consultorio.
 * {@code consultorio} es el código de la sala (o {@code null} para desasignar).
 */
public record OdontologoConsultorioDto(String consultorio) {
}
