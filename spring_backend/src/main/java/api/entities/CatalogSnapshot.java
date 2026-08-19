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

/**
 * Entrada de histórico de un catálogo editable (tabla {@code catalog_snapshots}).
 * Registra qué cambió, de qué valor a cuál y cuándo; permite a los reportes
 * reconstruir el nombre que tenía un registro en un instante del tiempo.
 */
@Entity
@Table(name = "catalog_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "entidad", nullable = false, length = 16)
    private String entidad;

    @Column(name = "codigo", nullable = false, length = 12)
    private String codigo;

    @Column(name = "accion", nullable = false, length = 16)
    private String accion;

    @Column(name = "nombre_anterior", length = 80)
    private String nombreAnterior;

    @Column(name = "nombre_nuevo", length = 80)
    private String nombreNuevo;

    @Column(name = "detalle", length = 255)
    private String detalle;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}