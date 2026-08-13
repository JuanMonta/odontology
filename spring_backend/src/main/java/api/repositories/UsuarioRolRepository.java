package api.repositories;

import api.entities.UsuarioRol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface UsuarioRolRepository extends JpaRepository<UsuarioRol, String> {

    List<UsuarioRol> findByActivoTrueOrderByNombreAsc();

    Optional<UsuarioRol> findByNombre(String nombre);
}
