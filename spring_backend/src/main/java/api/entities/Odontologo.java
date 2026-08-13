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

import java.time.LocalDateTime;

/**
 * Odontólogo (tabla {@code odontologos}).
 * {@code consultorioCodigo} es FK hacia consultorios (columna plana) y
 * {@code turno} referencia el catálogo {@code turnos} por nombre (columna
 * plana, validada en el servicio), igual que usuarios.rol → usuario_roles.
 */
@Entity
@Table(name = "odontologos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Odontologo {

    public enum Estado { activo, ausente, inactivo }

    @Id
    @Column(name = "codigo", length = 8)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 60)
    private String nombre;

    @Column(name = "especialidad", nullable = false, length = 40)
    private String especialidad;

    @Column(name = "licencia", nullable = false, length = 20)
    private String licencia;

    @Column(name = "consultorio_codigo", length = 8)
    private String consultorioCodigo;

    @Column(name = "turno", nullable = false)
    private String turno;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado;

    @Column(name = "experiencia", nullable = false)
    private Integer experiencia;

    @Column(name = "procedimientos", nullable = false)
    private Integer procedimientos;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
