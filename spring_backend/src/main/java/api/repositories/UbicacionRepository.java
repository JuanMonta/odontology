package api.repositories;

import api.entities.Ubicacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface UbicacionRepository extends JpaRepository<Ubicacion, String> {

    List<Ubicacion> findByActivoTrueOrderByNombreAsc();

    Optional<Ubicacion> findByNombre(String nombre);
}
