package api.entities;

import jakarta.persistence.Column;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Hoja de evolución clínica: registro cronológico append-only fuera del
 * Formulario 033 (controles, observaciones entre sesiones, plan inmediato).
 * Solo se crea y se lee: no se edita ni elimina para preservar el historial
 * clínico del paciente.
 */
@Entity
@Table(name = "hoja_evolucion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvolucionClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "paciente_id", length = 12)
    private String pacienteId;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "hora")
    private LocalTime hora;

    @Column(name = "odontologo", length = 120)
    private String odontologo;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "evolucion", columnDefinition = "TEXT")
    private String evolucion;

    @Column(name = "plan", columnDefinition = "TEXT")
    private String plan;

    @Column(name = "proxima_cita")
    private LocalDate proximaCita;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
