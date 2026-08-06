package api.entities.converter;

import api.entities.PatientAppointment;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Mapea {@link PatientAppointment.Estado} con el valor ENUM real de MariaDB
 * ('no-show' no es un identificador Java válido).
 */
@Converter
public class PatientAppointmentEstadoConverter implements AttributeConverter<PatientAppointment.Estado, String> {

    @Override
    public String convertToDatabaseColumn(PatientAppointment.Estado attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case DONE -> "done";
            case CANCELLED -> "cancelled";
            case SCHEDULED -> "scheduled";
            case NO_SHOW -> "no-show";
        };
    }

    @Override
    public PatientAppointment.Estado convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "done" -> PatientAppointment.Estado.DONE;
            case "cancelled" -> PatientAppointment.Estado.CANCELLED;
            case "scheduled" -> PatientAppointment.Estado.SCHEDULED;
            case "no-show" -> PatientAppointment.Estado.NO_SHOW;
            default -> throw new IllegalArgumentException("Estado de cita de expediente desconocido: " + dbData);
        };
    }
}
