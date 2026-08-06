package api.repositories;

import api.entities.Tratamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface TratamientoRepository extends JpaRepository<Tratamiento, String> {

    List<Tratamiento> findByCategoria(Tratamiento.Categoria categoria);

    List<Tratamiento> findByActivoTrue();

    List<Tratamiento> findByActivoFalse();

    Optional<Tratamiento> findFirstByOrderByCodigoDesc();
}
