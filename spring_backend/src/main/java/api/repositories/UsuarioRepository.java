package api.repositories;

import api.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface UsuarioRepository extends JpaRepository<Usuario, String> {

    Optional<Usuario> findByUsername(String username);

    boolean existsByUsername(String username);

    List<Usuario> findByRol(Usuario.Rol rol);

    List<Usuario> findByEstado(Usuario.Estado estado);

    long countByEstado(Usuario.Estado estado);

    Optional<Usuario> findFirstByOrderByCodigoDesc();
}
