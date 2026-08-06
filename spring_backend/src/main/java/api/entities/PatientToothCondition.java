package api.entities;

import api.entities.converter.CondicionDentalConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Condición de diente completo (tabla {@code patient_tooth_conditions}).
 */
@Entity
@Table(name = "patient_tooth_conditions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientToothCondition {

    public enum Condicion {
        CARIES,
        OBTURADO,
        ENDODONCIA,
        CORONA,
        EXTRACCION,
        SELLANTE_NECESARIO,
        SELLANTE_REALIZADO,
        PROTESIS_FIJA,
        PROTESIS_REMOVIBLE,
        PROTESIS_TOTAL,
        PERDIDA_POR_CARIES,
        PERDIDA_OTRA_CAUSA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "paciente_id", nullable = false, length = 8)
    private String pacienteId;

    @Column(name = "diente", nullable = false)
    private Integer diente;

    @Convert(converter = CondicionDentalConverter.class)
    @Column(name = "condicion", nullable = false)
    private Condicion condicion;
}
