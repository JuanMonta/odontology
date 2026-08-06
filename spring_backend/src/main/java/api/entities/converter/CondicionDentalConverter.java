package api.entities.converter;

import api.entities.PatientToothCondition;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Mapea {@link PatientToothCondition.Condicion} con los valores ENUM reales de
 * MariaDB (llevan guion, no son identificadores Java válidos).
 */
@Converter
public class CondicionDentalConverter
        implements AttributeConverter<PatientToothCondition.Condicion, String> {

    @Override
    public String convertToDatabaseColumn(PatientToothCondition.Condicion attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case CARIES -> "caries";
            case OBTURADO -> "obturado";
            case ENDODONCIA -> "endodoncia";
            case CORONA -> "corona";
            case EXTRACCION -> "extraccion";
            case SELLANTE_NECESARIO -> "sellante-necesario";
            case SELLANTE_REALIZADO -> "sellante-realizado";
            case PROTESIS_FIJA -> "protesis-fija";
            case PROTESIS_REMOVIBLE -> "protesis-removible";
            case PROTESIS_TOTAL -> "protesis-total";
            case PERDIDA_POR_CARIES -> "perdida-por-caries";
            case PERDIDA_OTRA_CAUSA -> "perdida-otra-causa";
        };
    }

    @Override
    public PatientToothCondition.Condicion convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "caries" -> PatientToothCondition.Condicion.CARIES;
            case "obturado" -> PatientToothCondition.Condicion.OBTURADO;
            case "endodoncia" -> PatientToothCondition.Condicion.ENDODONCIA;
            case "corona" -> PatientToothCondition.Condicion.CORONA;
            case "extraccion" -> PatientToothCondition.Condicion.EXTRACCION;
            case "sellante-necesario" -> PatientToothCondition.Condicion.SELLANTE_NECESARIO;
            case "sellante-realizado" -> PatientToothCondition.Condicion.SELLANTE_REALIZADO;
            case "protesis-fija" -> PatientToothCondition.Condicion.PROTESIS_FIJA;
            case "protesis-removible" -> PatientToothCondition.Condicion.PROTESIS_REMOVIBLE;
            case "protesis-total" -> PatientToothCondition.Condicion.PROTESIS_TOTAL;
            case "perdida-por-caries" -> PatientToothCondition.Condicion.PERDIDA_POR_CARIES;
            case "perdida-otra-causa" -> PatientToothCondition.Condicion.PERDIDA_OTRA_CAUSA;
            default -> throw new IllegalArgumentException("Condición dental desconocida: " + dbData);
        };
    }
}
