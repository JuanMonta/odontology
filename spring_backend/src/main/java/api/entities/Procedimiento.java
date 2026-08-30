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
 * Catálogo de procedimientos odontológicos (CDT) del Anexo 2 del Manual del
 * Formulario 033 (MSP Ecuador). La descripción corta se usa al imprimir la
 * sección 12 como «D1110 · profilaxis».
 */
@Entity
@Table(name = "procedimientos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Procedimiento {

    @Id
    @Column(name = "codigo", length = 10)
    private String codigo;

    @Column(name = "descripcion", length = 220)
    private String descripcion;
}
