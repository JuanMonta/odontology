package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Subselect;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Vista de solo lectura {@code v_pacientes}: paciente con edad calculada y
 * saldo derivado (MAX(0, cargos - pagos)). El DDL lo posee database/schema.sql.
 */
@Entity
@Immutable
@Subselect("SELECT * FROM v_pacientes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VistaPaciente {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "cedula")
    private String cedula;

    @Enumerated(EnumType.STRING)
    @Column(name = "sexo")
    private Paciente.Sexo sexo;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "cumpleanios")
    private String cumpleanios;

    @Column(name = "edad")
    private Integer edad;

    @Column(name = "telefono")
    private String telefono;

    @Column(name = "email")
    private String email;

    @Column(name = "direccion")
    private String direccion;

    @Column(name = "alergias")
    private String alergias;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private Paciente.Estado estado;

    @Column(name = "tratamiento")
    private String tratamiento;

    @Column(name = "ultima_visita")
    private LocalDate ultimaVisita;

    @Column(name = "saldo")
    private BigDecimal saldo;
}
