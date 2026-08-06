package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Configuración de la clínica (tabla {@code clinica_settings}).
 * Fila única: id SIEMPRE es 1.
 * Espejo 1:1 de core/models/clinica-settings.model.ts del frontend.
 */
@Entity
@Table(name = "clinica_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicaSetting {

    @Id
    @Column(name = "id")
    private Integer id = 1;

    @Column(name = "nombre", nullable = false, length = 120)
    private String nombre;

    @Column(name = "ruc", nullable = false, length = 11)
    private String ruc;

    @Column(name = "direccion", nullable = false, length = 160)
    private String direccion;

    @Column(name = "telefono", nullable = false, length = 24)
    private String telefono;

    @Column(name = "email", nullable = false, length = 120)
    private String email;

    @Column(name = "horario_inicio", nullable = false)
    private LocalTime horarioInicio;

    @Column(name = "horario_fin", nullable = false)
    private LocalTime horarioFin;

    @Column(name = "duracion_cita", nullable = false)
    private Integer duracionCita;

    @Column(name = "tolerancia_retraso", nullable = false)
    private Integer toleranciaRetraso;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dias_atencion", nullable = false)
    private List<String> diasAtencion;

    @Column(name = "moneda", nullable = false, length = 3)
    private String moneda;

    @Column(name = "formato_fecha", nullable = false, length = 16)
    private String formatoFecha;

    @Column(name = "recordatorio_citas", nullable = false)
    private Boolean recordatorioCitas;

    @Column(name = "notificacion_urgente", nullable = false)
    private Boolean notificacionUrgente;

    @Column(name = "aviso_vencimiento", nullable = false)
    private Boolean avisoVencimiento;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
