package api.entities.converter;

import api.entities.Appointment;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Mapea {@link Appointment.Estado} con el valor ENUM real de MariaDB
 * (los valores llevan guion y no son identificadores Java válidos).
 */
@Converter
public class AppointmentEstadoConverter implements AttributeConverter<Appointment.Estado, String> {

    @Override
    public String convertToDatabaseColumn(Appointment.Estado attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case ON_TIME -> "on-time";
            case BOARDING -> "boarding";
            case DELAYED -> "delayed";
            case CANCELLED -> "cancelled";
            case DONE -> "done";
        };
    }

    @Override
    public Appointment.Estado convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "on-time" -> Appointment.Estado.ON_TIME;
            case "boarding" -> Appointment.Estado.BOARDING;
            case "delayed" -> Appointment.Estado.DELAYED;
            case "cancelled" -> Appointment.Estado.CANCELLED;
            case "done" -> Appointment.Estado.DONE;
            default -> throw new IllegalArgumentException("Estado de cita de tablero desconocido: " + dbData);
        };
    }
}
