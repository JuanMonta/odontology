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

    Optional<Usuario> findFirstByOrderByCodigoDesc();

    long countByRolAndEstado(String rol, String estado);

    List<Usuario> findByRol(String rol);
}
