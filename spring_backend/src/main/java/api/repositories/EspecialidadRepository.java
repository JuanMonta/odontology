package api.repositories;

import api.entities.Especialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface EspecialidadRepository extends JpaRepository<Especialidad, String> {

    List<Especialidad> findByActivoTrueOrderByNombreAsc();

    Optional<Especialidad> findByNombre(String nombre);
}
