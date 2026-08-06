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

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tratamiento (tabla {@code tratamientos}). Tarifas en USD.
 */
@Entity
@Table(name = "tratamientos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tratamiento {

    public enum Categoria {
        DIAGNÓSTICO,
        PREVENCIÓN,
        RESTAURADORA,
        ENDODONCIA,
        PERIODONCIA,
        ORTODONCIA,
        CIRUGÍA,
        PRÓTESIS,
        ESTÉTICA,
        EMERGENCIA
    }

    @Id
    @Column(name = "codigo", length = 8)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 80)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false)
    private Categoria categoria;

    @Column(name = "duracion_min", nullable = false)
    private Integer duracionMin;

    @Column(name = "precio", nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @Column(name = "descripcion", nullable = false)
    private String descripcion;

    @Column(name = "uso", nullable = false)
    private Integer uso;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
