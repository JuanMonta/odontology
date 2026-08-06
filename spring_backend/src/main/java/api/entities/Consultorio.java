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

/**
 * Consultorio (tabla {@code consultorios}).
 * {@code odontologo} es el nombre visible (snapshot); la relación real vive en
 * odontologos.consultorio_codigo.
 */
@Entity
@Table(name = "consultorios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consultorio {

    public enum Estado { operativo, mantenimiento, inactivo }

    @Id
    @Column(name = "codigo", length = 8)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 60)
    private String nombre;

    @Column(name = "unidad", nullable = false, length = 40)
    private String unidad;

    @Column(name = "odontologo", nullable = false, length = 60)
    private String odontologo;

    @Column(name = "ubicacion", nullable = false, length = 60)
    private String ubicacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado;

    @Column(name = "ultimo_uso")
    private LocalDate ultimoUso;

    @Column(name = "procedimientos", nullable = false)
    private Integer procedimientos;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
