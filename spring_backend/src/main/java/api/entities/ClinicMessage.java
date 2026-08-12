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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Mensaje de la bandeja (tabla {@code clinic_messages}).
 */
@Entity
@Table(name = "clinic_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicMessage {

    public enum Canal { consulta, paciente, equipo }

    public enum Destino { todos, equipo, recepcion, odontologos }

    public enum Prioridad { urgente, importante, informacion }

    public enum Estado { unread, read }

    @Id
    @Column(name = "codigo", length = 8)
    private String codigo;

    @Column(name = "asunto", nullable = false, length = 120)
    private String asunto;

    @Column(name = "cuerpo", nullable = false, columnDefinition = "TEXT")
    private String cuerpo;

    @Column(name = "remitente", nullable = false, length = 60)
    private String remitente;

    @Enumerated(EnumType.STRING)
    @Column(name = "canal", nullable = false)
    private Canal canal;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora", nullable = false)
    private LocalTime hora;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado;

    @Enumerated(EnumType.STRING)
    @Column(name = "destino", nullable = false)
    private Destino destino;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridad", nullable = false)
    private Prioridad prioridad;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
