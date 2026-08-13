package api.repositories;

import api.entities.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface TurnoRepository extends JpaRepository<Turno, String> {

    List<Turno> findByActivoTrueOrderByNombreAsc();

    Optional<Turno> findByNombre(String nombre);
}
