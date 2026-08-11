package api.repositories;

import api.entities.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface EquipoRepository extends JpaRepository<Equipo, String> {

    List<Equipo> findByActivoTrueOrderByNombreAsc();

    Optional<Equipo> findByNombre(String nombre);
}
