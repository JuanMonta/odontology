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

/**
 * Permiso del catálogo RBAC (tabla {@code permiso}).
 * Código estable {@code CATEGORIA_ACCION} (ej. {@code HC_EDITAR});
 * la matriz rol → permiso vive en {@code rol_permiso}.
 */
@Entity
@Table(name = "permiso")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permiso {

    @Id
    @Column(name = "codigo", length = 32)
    private String codigo;

    @Column(name = "categoria", nullable = false, length = 32)
    private String categoria;

    @Column(name = "accion", nullable = false, length = 32)
    private String accion;

    @Column(name = "descripcion", nullable = false, length = 120)
    private String descripcion;
}
