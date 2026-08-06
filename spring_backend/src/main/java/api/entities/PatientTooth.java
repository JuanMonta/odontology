package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Pieza dental del odontograma (tabla {@code patient_teeth}).
 * Clave compuesta (paciente_id, diente FDI). Ausencia de fila = pieza sana.
 */
@Entity
@Table(name = "patient_teeth")
@IdClass(PatientToothId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientTooth {

    @Id
    @Column(name = "paciente_id", length = 8)
    private String pacienteId;

    @Id
    @Column(name = "diente")
    private Integer diente;

    @Column(name = "movilidad", length = 1)
    private String movilidad;

    @Column(name = "recesion", length = 1)
    private String recesion;
}
