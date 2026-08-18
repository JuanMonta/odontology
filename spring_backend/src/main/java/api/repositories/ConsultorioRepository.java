package api.repositories;

import api.entities.Consultorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface ConsultorioRepository extends JpaRepository<Consultorio, String> {

    List<Consultorio> findByEstado(Consultorio.Estado estado);

    long countByEstado(Consultorio.Estado estado);

    Optional<Consultorio> findFirstByOrderByCodigoDesc();

    /** Consultorios que usan un texto de unidad (sillón/módulo) dado. */
    List<Consultorio> findByUnidadIn(List<String> unidades);

    /** Consultorios no inactivos que usan un texto de unidad dado. */
    long countByUnidadInAndEstadoNot(List<String> unidades, Consultorio.Estado estado);

    /** Consultorios que usan un texto de ubicación dado. */
    List<Consultorio> findByUbicacion(String ubicacion);

    /** Consultorios no inactivos que usan un texto de ubicación dado. */
    long countByUbicacionAndEstadoNot(String ubicacion, Consultorio.Estado estado);
}
