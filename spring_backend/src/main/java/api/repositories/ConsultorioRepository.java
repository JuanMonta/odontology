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
}
