package api.entities;

import api.entities.converter.PatientAppointmentEstadoConverter;
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
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Cita del expediente del paciente (tabla {@code patient_appointments}).
 * tratamiento / odontologo son snapshots de texto que la UI muestra tal cual.
 */
@Entity
@Table(name = "patient_appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientAppointment {

    public enum Estado { DONE, CANCELLED, SCHEDULED, NO_SHOW }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "appointment_id", length = 12)
    private String appointmentId;

    @Column(name = "paciente_id", nullable = false, length = 8)
    private String pacienteId;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora", nullable = false)
    private LocalTime hora;

    @Column(name = "tratamiento", nullable = false, length = 60)
    private String tratamiento;

    @Column(name = "odontologo", nullable = false, length = 60)
    private String odontologo;

    @Column(name = "odontologo_codigo", length = 12)
    private String odontologoCodigo;

    @Convert(converter = PatientAppointmentEstadoConverter.class)
    @Column(name = "estado", nullable = false)
    private Estado estado;

    @Column(name = "nota", columnDefinition = "TEXT")
    private String nota;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
