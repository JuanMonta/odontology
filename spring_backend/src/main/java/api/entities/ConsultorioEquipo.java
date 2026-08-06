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

/**
 * Equipo/instrumental de un consultorio (tabla {@code consultorio_equipos}).
 * {@code consultorio_codigo} es FK hacia consultorios (columna plana).
 */
@Entity
@Table(name = "consultorio_equipos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultorioEquipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "consultorio_codigo", nullable = false, length = 8)
    private String consultorioCodigo;

    @Column(name = "item", nullable = false, length = 40)
    private String item;
}
