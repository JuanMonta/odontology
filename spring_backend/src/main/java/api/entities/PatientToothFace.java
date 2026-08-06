package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Caries/obturado por cara de una pieza (tabla {@code patient_tooth_faces}).
 */
@Entity
@Table(name = "patient_tooth_faces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientToothFace {

    public enum Cara { oclusal, mesial, distal, vestibular, lingual }

    public enum Condicion { caries, obturado }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "paciente_id", nullable = false, length = 8)
    private String pacienteId;

    @Column(name = "diente", nullable = false)
    private Integer diente;

    @Enumerated(EnumType.STRING)
    @Column(name = "cara", nullable = false)
    private Cara cara;

    @Enumerated(EnumType.STRING)
    @Column(name = "condicion", nullable = false)
    private Condicion condicion;
}
