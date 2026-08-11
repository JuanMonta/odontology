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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Unidad/sillón del catálogo de salas (tabla {@code unidades}).
 */
@Entity
@Table(name = "unidades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Unidad {

    @Id
    @Column(name = "codigo", length = 8)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 40)
    private String nombre;

    @Column(name = "tipo", nullable = false, length = 12)
    private String tipo;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
