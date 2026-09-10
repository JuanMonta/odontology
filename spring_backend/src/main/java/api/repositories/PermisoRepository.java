package api.repositories;

import api.entities.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface PermisoRepository extends JpaRepository<Permiso, String> {

    List<Permiso> findAllByOrderByCategoriaAscCodigoAsc();
}
