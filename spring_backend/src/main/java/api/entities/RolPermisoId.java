package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/**
 * Clave compuesta de la matriz rol → permiso.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RolPermisoId implements Serializable {

    @Column(name = "rol_codigo", length = 12)
    private String rolCodigo;

    @Column(name = "permiso_codigo", length = 32)
    private String permisoCodigo;
}
