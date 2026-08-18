package api.repositories;

import api.entities.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface CategoriaRepository extends JpaRepository<Categoria, String> {

    List<Categoria> findByActivoTrueOrderByNombreAsc();

    Optional<Categoria> findByNombre(String nombre);
}
