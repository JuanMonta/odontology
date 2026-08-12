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
 * Equipo/instrumental del catálogo (tabla {@code equipos}).
 * Registro único de verdad para el selector de equipos del formulario.
 */
@Entity
@Table(name = "equipos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipo {

    @Id
    @Column(name = "codigo", length = 8)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 40)
    private String nombre;

    @Column(name = "categoria", nullable = false, length = 40)
    private String categoria;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
