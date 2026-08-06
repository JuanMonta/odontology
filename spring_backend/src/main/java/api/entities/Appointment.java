package api.entities;

import api.entities.converter.AppointmentEstadoConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Cita del tablero de embarque del día (tabla {@code appointments}).
 * Los textos de paciente/tratamiento/consultorio/odontólogo son snapshots que
 * la UI muestra tal cual; {@code pacienteId} es FK cuando el paciente existe.
 */
@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    public enum Estado { ON_TIME, BOARDING, DELAYED, CANCELLED, DONE }

    @Id
    @Column(name = "id", length = 8)
    private String id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora", nullable = false)
    private LocalTime hora;

    @Column(name = "paciente_id", length = 8)
    private String pacienteId;

    @Column(name = "paciente_nombre", nullable = false, length = 80)
    private String pacienteNombre;

    @Column(name = "tratamiento", nullable = false, length = 60)
    private String tratamiento;

    @Column(name = "consultorio", nullable = false, length = 16)
    private String consultorio;

    @Column(name = "odontologo", nullable = false, length = 60)
    private String odontologo;

    @Convert(converter = AppointmentEstadoConverter.class)
    @Column(name = "estado", nullable = false)
    private Estado estado;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
