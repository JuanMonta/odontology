package api.repositories;

import api.entities.UsuarioSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

/**
 * Sesión activa por usuario (PK = {@code usuario_codigo}). Guardar con la misma
 * PK reemplaza la sesión anterior (una sola estación activa por cuenta).
 */
@RepositoryRestResource(exported = false)
public interface UsuarioSesionRepository extends JpaRepository<UsuarioSesion, String> {
}