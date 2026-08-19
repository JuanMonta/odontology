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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Paciente (tabla {@code pacientes}). La columna generada {@code cumpleanios}
 * y la edad/saldo derivados NO se mapean aquí: viven en la vista
 * {@link VistaPaciente} (v_pacientes).
 */
@Entity
@Table(name = "pacientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paciente {

    public enum Estado { active, inactive }

    public enum Sexo { M, F }

    @Id
    @Column(name = "id", length = 8)
    private String id;

    @Column(name = "cedula", length = 13)
    private String cedula;

    @Enumerated(EnumType.STRING)
    @Column(name = "sexo")
    private Sexo sexo;

    @Column(name = "nombre", nullable = false, length = 80)
    private String nombre;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "telefono", length = 24)
    private String telefono;

    @Column(name = "email", length = 120)
    private String email;

    @Column(name = "direccion", length = 160)
    private String direccion;

    @Column(name = "alergias", nullable = false)
    private String alergias;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado;

    @Column(name = "tratamiento", length = 60)
    private String tratamiento;

    @Column(name = "ultima_visita")
    private LocalDate ultimaVisita;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
