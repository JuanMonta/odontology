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
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Cola de pacientes en espera con ticket (tabla {@code waiting_queue}).
 */
@Entity
@Table(name = "waiting_queue")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitingQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "ticket", nullable = false, unique = true, length = 8)
    private String ticket;

    @Column(name = "paciente_id", length = 8)
    private String pacienteId;

    @Column(name = "paciente_nombre", nullable = false, length = 80)
    private String pacienteNombre;

    @Column(name = "llegada", nullable = false)
    private LocalTime llegada;

    @Column(name = "motivo", nullable = false, length = 80)
    private String motivo;

    @Column(name = "atendido", nullable = false)
    private Boolean atendido;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
