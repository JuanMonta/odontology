package api.repositories;

import api.entities.Paciente;
import api.entities.VistaPaciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

/**
 * Lectura de la vista {@code v_pacientes}: pacientes con edad y saldo.
 * Solo lectura (inmutable); la escritura va por PacienteRepository + AccountEntry.
 */
@RepositoryRestResource(exported = false)
public interface VistaPacienteRepository extends JpaRepository<VistaPaciente, String> {

    List<VistaPaciente> findByNombreContainingIgnoreCase(String nombre);

    List<VistaPaciente> findByEstado(Paciente.Estado estado);
}
