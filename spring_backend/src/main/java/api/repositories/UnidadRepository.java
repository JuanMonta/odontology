package api.repositories;

import api.entities.Unidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface UnidadRepository extends JpaRepository<Unidad, String> {

    List<Unidad> findByActivoTrueOrderByNombreAsc();

    Optional<Unidad> findByNombre(String nombre);
}
