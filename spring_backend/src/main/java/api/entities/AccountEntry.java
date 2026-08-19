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
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Movimiento de cuenta por cobrar (tabla {@code account_entries}).
 * El saldo del paciente se deriva de la suma de cargos menos pagos (vista).
 */
@Entity
@Table(name = "account_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountEntry {

    public enum Tipo { charge, payment }

    public enum Metodo { EFECTIVO, TARJETA }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "paciente_id", nullable = false, length = 8)
    private String pacienteId;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "concepto", nullable = false, length = 120)
    private String concepto;

    @Column(name = "monto", nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private Tipo tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo")
    private Metodo metodo;

    @Column(name = "appointment_id", length = 12)
    private String appointmentId;

    @Column(name = "tratamiento_codigo", length = 12)
    private String tratamientoCodigo;

    @Column(name = "odontologo_codigo", length = 12)
    private String odontologoCodigo;

    @Column(name = "consultorio_codigo", length = 12)
    private String consultorioCodigo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
