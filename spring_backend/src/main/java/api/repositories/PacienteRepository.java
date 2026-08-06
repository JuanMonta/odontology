package api.repositories;

import api.entities.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface PacienteRepository extends JpaRepository<Paciente, String> {

    List<Paciente> findByNombreContainingIgnoreCase(String nombre);

    List<Paciente> findByEstado(Paciente.Estado estado);

    Optional<Paciente> findByEmail(String email);

    Optional<Paciente> findFirstByOrderByIdDesc();
}
