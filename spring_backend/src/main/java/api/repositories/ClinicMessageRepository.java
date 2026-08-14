package api.repositories;

import api.entities.ClinicMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface ClinicMessageRepository extends JpaRepository<ClinicMessage, String> {

    List<ClinicMessage> findByEstado(ClinicMessage.Estado estado);

    List<ClinicMessage> findByPrioridad(ClinicMessage.Prioridad prioridad);

    long countByEstado(ClinicMessage.Estado estado);

    Optional<ClinicMessage> findFirstByOrderByCodigoDesc();
}
