package api.repositories;

import api.entities.UsuarioEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface UsuarioEstadoRepository extends JpaRepository<UsuarioEstado, String> {

    List<UsuarioEstado> findByActivoTrueOrderByNombreAsc();

    Optional<UsuarioEstado> findByNombre(String nombre);
}
