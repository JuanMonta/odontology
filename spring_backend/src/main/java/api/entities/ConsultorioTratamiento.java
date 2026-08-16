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
 * Capacidad de tratamiento por consultorio (tabla {@code consultorio_tratamientos}).
 * {@code consultorio_codigo} FK → consultorios, {@code tratamiento_codigo} FK → tratamientos.
 */
@Entity
@Table(name = "consultorio_tratamientos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultorioTratamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "consultorio_codigo", nullable = false, length = 8)
    private String consultorioCodigo;

    @Column(name = "tratamiento_codigo", nullable = false, length = 8)
    private String tratamientoCodigo;

    @Column(name = "observaciones", length = 200)
    private String observaciones;
}