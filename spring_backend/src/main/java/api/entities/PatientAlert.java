package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Alerta de paciente (tabla {@code patient_alerts}): cumpleaños, deuda o
 * seguimiento.
 */
@Entity
@Table(name = "patient_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientAlert {

    public enum Tipo { birthday, debt, followup }

    @Id
    @Column(name = "id", length = 8)
    private String id;

    @Column(name = "paciente_id", nullable = false, length = 8)
    private String pacienteId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private Tipo tipo;

    @Column(name = "etiqueta", nullable = false, length = 120)
    private String etiqueta;

    @Column(name = "atendida", nullable = false)
    private Boolean atendida;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
